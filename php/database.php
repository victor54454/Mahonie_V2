<?php
// ========================================
// Gestion de la base de données SQLite
// ========================================

class Database {
    private $db;
    
    public function __construct() {
        // Créer/ouvrir la base de données
        $this->db = new SQLite3(__DIR__ . '/planckeel.db');
        $this->db->busyTimeout(5000);
        $this->initDatabase();
    }
    
    private function initDatabase() {
        // Table des utilisateurs (admins et clients)
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nom TEXT NOT NULL,
                prenom TEXT NOT NULL,
                telephone TEXT,
                role TEXT DEFAULT 'client',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Table des réservations
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                service TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                duration TEXT NOT NULL,
                price TEXT NOT NULL,
                status TEXT DEFAULT 'confirmee',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
        
        // Table des disponibilités
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS disponibilites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                time_slot TEXT,
                is_closed INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Table des notes sur les participants
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS notes_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                reservation_id INTEGER,
                note_html TEXT NOT NULL,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (reservation_id) REFERENCES reservations(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        ");
        
        // Table des tokens de réinitialisation de mot de passe
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
        
        // Table des tokens de réinitialisation de mot de passe
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
        
        // Créer un admin par défaut si n'existe pas
        $this->createDefaultAdmin();
    }
    
    private function createDefaultAdmin() {
        require_once __DIR__ . '/admin_config.php';
        
        $email = ADMIN_EMAIL;
        
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = :email');
        $stmt->bindValue(':email', $email, SQLITE3_TEXT);
        $result = $stmt->execute();
        
        if (!$result->fetchArray()) {
            $password = password_hash(ADMIN_PASSWORD, PASSWORD_BCRYPT);
            
            $stmt = $this->db->prepare('
                INSERT INTO users (email, password, nom, prenom, role)
                VALUES (:email, :password, :nom, :prenom, :role)
            ');
            $stmt->bindValue(':email', $email, SQLITE3_TEXT);
            $stmt->bindValue(':password', $password, SQLITE3_TEXT);
            $stmt->bindValue(':nom', 'Planckeel', SQLITE3_TEXT);
            $stmt->bindValue(':prenom', 'Admin', SQLITE3_TEXT);
            $stmt->bindValue(':role', 'admin', SQLITE3_TEXT);
            $stmt->execute();
        }
    }
    
    public function getConnection() {
        return $this->db;
    }
}
?>