<?php
// ========================================
// API Admin - Backend PHP
// ========================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'database.php';
require_once 'config.php';
require_once 'PHPMailer-7.0.2/src/Exception.php';
require_once 'PHPMailer-7.0.2/src/PHPMailer.php';
require_once 'PHPMailer-7.0.2/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Initialiser la base de données
$database = new Database();
$db = $database->getConnection();

// Récupérer la méthode et le path
$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['action']) ? $_GET['action'] : '';

// ==================== AUTHENTIFICATION ====================

// Générer un token JWT simplifié
function generateToken($userId, $email, $role) {
    $payload = [
        'id' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + (24 * 60 * 60) // 24h
    ];
    return base64_encode(json_encode($payload));
}

// Vérifier le token
function verifyToken() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authHeader)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token manquant']);
        exit;
    }
    
    $token = str_replace('Bearer ', '', $authHeader);
    $payload = json_decode(base64_decode($token), true);
    
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        http_response_code(403);
        echo json_encode(['error' => 'Token invalide ou expiré']);
        exit;
    }
    
    return $payload;
}

// Vérifier si l'utilisateur est admin
function isAdmin($user) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
}

// ==================== ROUTES ====================

// MOT DE PASSE OUBLIÉ (PUBLIC)
if ($path === 'forgot-password' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email invalide']);
        exit;
    }
    
    // Vérifier si l'email existe
    $stmt = $db->prepare('SELECT id, nom, prenom FROM users WHERE email = :email');
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $result = $stmt->execute();
    $user = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$user) {
        // Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
        echo json_encode(['success' => true, 'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé']);
        exit;
    }
    
    // Générer un token unique
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Supprimer les anciens tokens de cet utilisateur
    $stmt = $db->prepare('DELETE FROM password_resets WHERE user_id = :user_id');
    $stmt->bindValue(':user_id', $user['id'], SQLITE3_INTEGER);
    $stmt->execute();
    
    // Insérer le nouveau token
    $stmt = $db->prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)');
    $stmt->bindValue(':user_id', $user['id'], SQLITE3_INTEGER);
    $stmt->bindValue(':token', $token, SQLITE3_TEXT);
    $stmt->bindValue(':expires_at', $expiresAt, SQLITE3_TEXT);
    $stmt->execute();
    
    // Envoyer l'email
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port = SMTP_PORT;
        $mail->CharSet = 'UTF-8';
        
        $mail->setFrom(SMTP_USER, 'Planckeel Bike');
        $mail->addAddress($email);
        
        $resetLink = "http://" . $_SERVER['HTTP_HOST'] . "/reset-password.html?token=" . $token;
        
        $mail->isHTML(true);
        $mail->Subject = 'Réinitialisation de votre mot de passe - Planckeel Bike';
        $mail->Body = "
            <h2>Réinitialisation de mot de passe</h2>
            <p>Bonjour {$user['prenom']} {$user['nom']},</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
            <p><a href='{$resetLink}' style='background: #FF6B2C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>Réinitialiser mon mot de passe</a></p>
            <p>Ce lien est valable pendant 1 heure.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <br>
            <p>Cordialement,<br>L'équipe Planckeel Bike</p>
        ";
        
        $mail->send();
        echo json_encode(['success' => true, 'message' => 'Email de réinitialisation envoyé']);
    } catch (Exception $e) {
        error_log("Erreur envoi email: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'envoi de l\'email']);
    }
    exit;
}

// RÉINITIALISER LE MOT DE PASSE (PUBLIC)
if ($path === 'reset-password' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $token = $data['token'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($token) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Token et mot de passe requis']);
        exit;
    }
    
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Le mot de passe doit contenir au moins 8 caractères']);
        exit;
    }
    
    // Vérifier le token
    $stmt = $db->prepare('
        SELECT user_id, expires_at 
        FROM password_resets 
        WHERE token = :token
    ');
    $stmt->bindValue(':token', $token, SQLITE3_TEXT);
    $result = $stmt->execute();
    $reset = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$reset) {
        http_response_code(400);
        echo json_encode(['error' => 'Token invalide']);
        exit;
    }
    
    // Vérifier l'expiration
    if (strtotime($reset['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['error' => 'Token expiré']);
        exit;
    }
    
    // Mettre à jour le mot de passe
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $db->prepare('UPDATE users SET password = :password WHERE id = :id');
    $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
    $stmt->bindValue(':id', $reset['user_id'], SQLITE3_INTEGER);
    $stmt->execute();
    
    // Supprimer le token utilisé
    $stmt = $db->prepare('DELETE FROM password_resets WHERE token = :token');
    $stmt->bindValue(':token', $token, SQLITE3_TEXT);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Mot de passe réinitialisé avec succès']);
    exit;
}

// INSCRIPTION UTILISATEUR (PUBLIC)
if ($path === 'register' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $data['password'] ?? '';
    $nom = htmlspecialchars($data['nom'] ?? '');
    $prenom = htmlspecialchars($data['prenom'] ?? '');
    $telephone = htmlspecialchars($data['telephone'] ?? '');
    
    // Validation
    if (empty($email) || empty($password) || empty($nom) || empty($prenom)) {
        http_response_code(400);
        echo json_encode(['error' => 'Tous les champs obligatoires doivent être remplis']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email invalide']);
        exit;
    }
    
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Le mot de passe doit contenir au moins 8 caractères']);
        exit;
    }
    
    // Vérifier si l'email existe déjà
    $stmt = $db->prepare('SELECT id FROM users WHERE email = :email');
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $result = $stmt->execute();
    
    if ($result->fetchArray()) {
        http_response_code(400);
        echo json_encode(['error' => 'Cet email est déjà utilisé']);
        exit;
    }
    
    // Hasher le mot de passe
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Créer l'utilisateur
    $stmt = $db->prepare('
        INSERT INTO users (email, password, nom, prenom, telephone, role)
        VALUES (:email, :password, :nom, :prenom, :telephone, "client")
    ');
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
    $stmt->bindValue(':nom', $nom, SQLITE3_TEXT);
    $stmt->bindValue(':prenom', $prenom, SQLITE3_TEXT);
    $stmt->bindValue(':telephone', $telephone, SQLITE3_TEXT);
    $stmt->execute();
    
    $userId = $db->lastInsertRowID();
    
    echo json_encode([
        'success' => true,
        'message' => 'Compte créé avec succès',
        'user_id' => $userId
    ]);
    exit;
}

// VÉRIFIER DISPONIBILITÉ (PUBLIC)
if ($path === 'check-availability' && $method === 'GET') {
    $date = $_GET['date'] ?? '';
    $time = $_GET['time'] ?? '';
    
    // Vérifier si le jour complet est fermé
    $stmt = $db->prepare('SELECT * FROM disponibilites WHERE date = :date AND time_slot IS NULL');
    $stmt->bindValue(':date', $date, SQLITE3_TEXT);
    $result = $stmt->execute();
    $dayClosedRow = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($dayClosedRow) {
        echo json_encode(['available' => false, 'reason' => 'Jour fermé']);
        exit;
    }
    
    // Vérifier si le créneau spécifique est fermé
    if (!empty($time)) {
        $stmt = $db->prepare('SELECT * FROM disponibilites WHERE date = :date AND time_slot = :time');
        $stmt->bindValue(':date', $date, SQLITE3_TEXT);
        $stmt->bindValue(':time', $time, SQLITE3_TEXT);
        $result = $stmt->execute();
        $slotClosedRow = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($slotClosedRow) {
            echo json_encode(['available' => false, 'reason' => 'Créneau fermé']);
            exit;
        }
    }
    
    echo json_encode(['available' => true]);
    exit;
}

// LOGIN
if ($path === 'login' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    $stmt = $db->prepare('SELECT * FROM users WHERE email = :email');
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $result = $stmt->execute();
    $user = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Email ou mot de passe incorrect']);
        exit;
    }
    
    $token = generateToken($user['id'], $user['email'], $user['role']);
    
    echo json_encode([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'nom' => $user['nom'],
            'prenom' => $user['prenom'],
            'role' => $user['role']
        ]
    ]);
    exit;
}

// VERIFY TOKEN
if ($path === 'verify' && $method === 'GET') {
    $user = verifyToken();
    echo json_encode(['valid' => true, 'user' => $user]);
    exit;
}

// ==================== DISPONIBILITES ====================

// GET DISPONIBILITES
if ($path === 'disponibilites' && $method === 'GET') {
    $user = verifyToken();
    isAdmin($user);
    
    $result = $db->query('SELECT * FROM disponibilites ORDER BY date, time_slot');
    $disponibilites = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $disponibilites[] = $row;
    }
    
    echo json_encode($disponibilites);
    exit;
}

// FERMER UN JOUR
if ($path === 'disponibilites/close-day' && $method === 'POST') {
    $user = verifyToken();
    isAdmin($user);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $date = $data['date'] ?? '';
    
    $stmt = $db->prepare('INSERT INTO disponibilites (date, time_slot, is_closed) VALUES (:date, NULL, 1)');
    $stmt->bindValue(':date', $date, SQLITE3_TEXT);
    $stmt->execute();
    
    echo json_encode(['id' => $db->lastInsertRowID(), 'message' => 'Jour fermé avec succès']);
    exit;
}

// FERMER UN CRÉNEAU
if ($path === 'disponibilites/close-slot' && $method === 'POST') {
    $user = verifyToken();
    isAdmin($user);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $date = $data['date'] ?? '';
    $time_slot = $data['time_slot'] ?? '';
    
    $stmt = $db->prepare('INSERT INTO disponibilites (date, time_slot, is_closed) VALUES (:date, :time_slot, 1)');
    $stmt->bindValue(':date', $date, SQLITE3_TEXT);
    $stmt->bindValue(':time_slot', $time_slot, SQLITE3_TEXT);
    $stmt->execute();
    
    echo json_encode(['id' => $db->lastInsertRowID(), 'message' => 'Créneau fermé avec succès']);
    exit;
}

// ROUVRIR
if ($path === 'disponibilites/delete' && $method === 'DELETE') {
    $user = verifyToken();
    isAdmin($user);
    
    $id = $_GET['id'] ?? 0;
    
    $stmt = $db->prepare('DELETE FROM disponibilites WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $stmt->execute();
    
    echo json_encode(['message' => 'Disponibilité supprimée']);
    exit;
}

// ==================== PARTICIPANTS ====================

// GET PARTICIPANTS
if ($path === 'participants' && $method === 'GET') {
    $user = verifyToken();
    isAdmin($user);
    
    $query = "
        SELECT u.*, 
               COUNT(r.id) as total_reservations,
               MAX(r.date) as derniere_reservation
        FROM users u
        LEFT JOIN reservations r ON u.id = r.user_id
        WHERE u.role = 'client'
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ";
    
    $result = $db->query($query);
    $participants = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $participants[] = $row;
    }
    
    echo json_encode($participants);
    exit;
}

// GET PARTICIPANT DETAILS
if ($path === 'participants/details' && $method === 'GET') {
    $user = verifyToken();
    isAdmin($user);
    
    $id = $_GET['id'] ?? 0;
    
    // Récupérer l'utilisateur
    $stmt = $db->prepare('SELECT * FROM users WHERE id = :id AND role = "client"');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $participant = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$participant) {
        http_response_code(404);
        echo json_encode(['error' => 'Participant non trouvé']);
        exit;
    }
    
    // Récupérer les réservations
    $stmt = $db->prepare('SELECT * FROM reservations WHERE user_id = :id ORDER BY date DESC');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $reservations = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $reservations[] = $row;
    }
    
    // Récupérer les notes
    $query = "
        SELECT n.*, u.nom, u.prenom 
        FROM notes_participants n
        JOIN users u ON n.created_by = u.id
        WHERE n.user_id = :id
        ORDER BY n.created_at DESC
    ";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $notes = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $notes[] = $row;
    }
    
    $participant['reservations'] = $reservations;
    $participant['notes'] = $notes;
    
    echo json_encode($participant);
    exit;
}

// AJOUTER UNE NOTE
if ($path === 'participants/notes/add' && $method === 'POST') {
    $user = verifyToken();
    isAdmin($user);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $data['user_id'] ?? 0;
    $note_html = $data['note_html'] ?? '';
    $reservation_id = $data['reservation_id'] ?? null;
    
    $stmt = $db->prepare('
        INSERT INTO notes_participants (user_id, reservation_id, note_html, created_by)
        VALUES (:user_id, :reservation_id, :note_html, :created_by)
    ');
    $stmt->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
    $stmt->bindValue(':reservation_id', $reservation_id, SQLITE3_INTEGER);
    $stmt->bindValue(':note_html', $note_html, SQLITE3_TEXT);
    $stmt->bindValue(':created_by', $user['id'], SQLITE3_INTEGER);
    $stmt->execute();
    
    echo json_encode(['id' => $db->lastInsertRowID(), 'message' => 'Note ajoutée avec succès']);
    exit;
}

// SUPPRIMER UNE NOTE
if ($path === 'notes/delete' && $method === 'DELETE') {
    $user = verifyToken();
    isAdmin($user);
    
    $id = $_GET['id'] ?? 0;
    
    $stmt = $db->prepare('DELETE FROM notes_participants WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $stmt->execute();
    
    echo json_encode(['message' => 'Note supprimée']);
    exit;
}

// ==================== RESERVATIONS ====================

// GET RESERVATIONS
if ($path === 'reservations' && $method === 'GET') {
    $user = verifyToken();
    
    $query = "
        SELECT r.*, u.nom, u.prenom, u.email, u.telephone
        FROM reservations r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.date DESC, r.time DESC
    ";
    
    $result = $db->query($query);
    $reservations = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $reservations[] = $row;
    }
    
    echo json_encode($reservations);
    exit;
}

// GET RÉSERVATIONS D'UN UTILISATEUR (USER)
if ($path === 'user-reservations' && $method === 'GET') {
    $user = verifyToken();
    $userId = $_GET['user_id'] ?? 0;
    
    // Un utilisateur peut voir ses propres réservations, un admin peut voir toutes
    if ($user['role'] !== 'admin' && $user['id'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    $stmt = $db->prepare('
        SELECT * FROM reservations 
        WHERE user_id = :user_id 
        ORDER BY date DESC, time DESC
    ');
    $stmt->bindValue(':user_id', $userId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    
    $reservations = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $reservations[] = $row;
    }
    
    echo json_encode($reservations);
    exit;
}

// ANNULER UNE RÉSERVATION
if ($path === 'reservations/cancel' && $method === 'POST') {
    $user = verifyToken();
    isAdmin($user);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? 0;
    
    // Récupérer la réservation
    $query = "
        SELECT r.*, u.email, u.nom, u.prenom
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = :id
    ";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $reservation = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$reservation) {
        http_response_code(404);
        echo json_encode(['error' => 'Réservation non trouvée']);
        exit;
    }
    
    // Annuler
    $stmt = $db->prepare('UPDATE reservations SET status = "annulee" WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
    $stmt->execute();
    
    // Envoyer l'email
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port = SMTP_PORT;
        $mail->CharSet = 'UTF-8';
        
        $mail->setFrom(SMTP_USER, 'Planckeel Bike');
        $mail->addAddress($reservation['email']);
        
        $mail->isHTML(true);
        $mail->Subject = 'Annulation de votre réservation - Planckeel Bike';
        $mail->Body = "
            <h2>Annulation de réservation</h2>
            <p>Bonjour {$reservation['prenom']} {$reservation['nom']},</p>
            <p>Nous sommes désolés de vous informer que votre réservation du <strong>{$reservation['date']}</strong> à <strong>{$reservation['time']}</strong> a été annulée.</p>
            <p><strong>Service :</strong> {$reservation['service']}</p>
            <p>Nous vous invitons à reprendre rendez-vous à une autre date.</p>
            <p><a href='http://localhost:8000/booking.html'>Reprendre rendez-vous</a></p>
            <br>
            <p>Cordialement,<br>L'équipe Planckeel Bike</p>
        ";
        
        $mail->send();
    } catch (Exception $e) {
        // Log l'erreur mais ne bloque pas
        error_log("Erreur envoi email: " . $e->getMessage());
    }
    
    echo json_encode(['message' => 'Réservation annulée et email envoyé']);
    exit;
}

// Route par défaut
http_response_code(404);
echo json_encode(['error' => 'Route non trouvée']);
?>