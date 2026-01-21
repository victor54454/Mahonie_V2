<?php
// ========================================
// Configuration
// ========================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Email configuration
require_once 'config.php';

// Import PHPMailer classes
require_once 'PHPMailer-7.0.2/src/Exception.php';
require_once 'PHPMailer-7.0.2/src/PHPMailer.php';
require_once 'PHPMailer-7.0.2/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// ========================================
// Process Booking Form
// ========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $service = htmlspecialchars($_POST['service'] ?? '');
    $date = htmlspecialchars($_POST['date'] ?? '');
    $time = htmlspecialchars($_POST['time'] ?? '');
    $name = htmlspecialchars($_POST['name'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $phone = htmlspecialchars($_POST['phone'] ?? '');
    $message = htmlspecialchars($_POST['message'] ?? '');

    // Validate required fields
    if (empty($service) || empty($date) || empty($time) || empty($name) || empty($email) || empty($phone)) {
        echo json_encode([
            'success' => false,
            'message' => 'Tous les champs requis doivent être remplis.'
        ]);
        exit;
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Adresse email invalide.'
        ]);
        exit;
    }

    // Format date
    $dateObj = DateTime::createFromFormat('Y-m-d', $date);
    $formattedDate = $dateObj ? $dateObj->format('d/m/Y') : $date;
    $dayName = $dateObj ? strftime('%A', $dateObj->getTimestamp()) : '';

    // ========================================
    // Email HTML Templates
    // ========================================
    
    // Email to Client
    $clientSubject = "Confirmation de réservation - $service";
    $clientMessage = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B2C 0%, #E54D0F 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B2C; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #FF6B2C; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
            .logo { font-size: 28px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <div class='logo'>🚵 PLANCKEEL BIKE</div>
                <h2>Réservation confirmée !</h2>
            </div>
            <div class='content'>
                <p>Bonjour $name,</p>
                <p>Votre réservation a bien été enregistrée. Voici les détails :</p>
                
                <div class='details'>
                    <div class='detail-row'>
                        <span class='label'>Service :</span>
                        <span>$service</span>
                    </div>
                    <div class='detail-row'>
                        <span class='label'>Date :</span>
                        <span>$dayName $formattedDate</span>
                    </div>
                    <div class='detail-row'>
                        <span class='label'>Heure :</span>
                        <span>$time</span>
                    </div>
                </div>

                " . (!empty($message) ? "<p><strong>Votre message :</strong><br/>$message</p>" : "") . "
                
                <p>Nous vous contacterons sous peu pour confirmer définitivement votre rendez-vous.</p>
                <p>À très bientôt sur les trails ! 🚵‍♂️</p>
                
                <div class='footer'>
                    <p><strong>Planckeel Bike</strong><br/>
                    Coach VTT & Préparation Physique<br/>
                    Mécanique Cycles | Programme Performance<br/>
                    DEJEPS VTT & BPJEPS APT</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    ";

    // Email to Admin
    $adminSubject = "🔔 Nouvelle réservation - $service";
    $adminMessage = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0A0A0A; color: #FF6B2C; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #FF6B2C; display: inline-block; width: 150px; }
            .urgent { background: #FFE5E5; border-left: 4px solid #FF0000; padding: 15px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>🔔 Nouvelle Réservation</h2>
            </div>
            <div class='content'>
                <div class='urgent'>
                    <strong>📞 ACTION REQUISE :</strong> Contactez le client pour confirmer la réservation !
                </div>
                
                <h3>Détails de la réservation</h3>
                
                <div class='details'>
                    <div class='detail-row'>
                        <span class='label'>Service :</span>
                        <span><strong>$service</strong></span>
                    </div>
                    <div class='detail-row'>
                        <span class='label'>Client :</span>
                        <span><strong>$name</strong></span>
                    </div>
                    <div class='detail-row'>
                        <span class='label'>Email :</span>
                        <span><a href='mailto:$email'>$email</a></span>
                    </div>
                    <div class='detail-row'>
                        <span class='label'>Téléphone :</span>
                        <span><strong><a href='tel:$phone'>$phone</a></strong></span>
                    </div>
                    <div class='detail-row'>
                        <span class='label'>Date :</span>
                        <span><strong>$dayName $formattedDate</strong></span>
                    </div>
                    <div class='detail-row'>
                        <span class='label'>Heure :</span>
                        <span><strong>$time</strong></span>
                    </div>
                    " . (!empty($message) ? "
                    <div class='detail-row'>
                        <span class='label'>Message :</span>
                        <span style='font-style: italic;'>$message</span>
                    </div>
                    " : "") . "
                </div>
            </div>
        </div>
    </body>
    </html>
    ";

    // ========================================
    // Send Emails with PHPMailer
    // ========================================
    $clientSent = false;
    $adminSent = false;
    $emailError = '';

    try {
        // ========================================
        // Email to Client
        // ========================================
        $mailClient = new PHPMailer(true);
        
        // Server settings
        $mailClient->isSMTP();
        $mailClient->Host       = SMTP_HOST;
        $mailClient->SMTPAuth   = true;
        $mailClient->Username   = SMTP_USER;
        $mailClient->Password   = SMTP_PASS;
        $mailClient->SMTPSecure = SMTP_SECURE;
        $mailClient->Port       = SMTP_PORT;
        
        // Recipients
        $mailClient->setFrom(SMTP_USER, 'Planckeel Bike');
        $mailClient->addAddress($email, $name);
        $mailClient->addReplyTo(SMTP_USER, 'Planckeel Bike');
        
        // Content
        $mailClient->isHTML(true);
        $mailClient->Subject = $clientSubject;
        $mailClient->Body    = $clientMessage;
        $mailClient->CharSet = 'UTF-8';
        
        $mailClient->send();
        $clientSent = true;
        
    } catch (Exception $e) {
        $emailError .= "Client email error: " . $e->getMessage() . " ";
    }

    try {
        // ========================================
        // Email to Admin
        // ========================================
        $mailAdmin = new PHPMailer(true);
        
        // Server settings
        $mailAdmin->isSMTP();
        $mailAdmin->Host       = SMTP_HOST;
        $mailAdmin->SMTPAuth   = true;
        $mailAdmin->Username   = SMTP_USER;
        $mailAdmin->Password   = SMTP_PASS;
        $mailAdmin->SMTPSecure = SMTP_SECURE;
        $mailAdmin->Port       = SMTP_PORT;
        
        // Recipients
        $mailAdmin->setFrom(SMTP_USER, 'Planckeel Bike - Réservation');
        $mailAdmin->addAddress(ADMIN_EMAIL, 'Admin Planckeel');
        $mailAdmin->addReplyTo($email, $name);
        
        // Content
        $mailAdmin->isHTML(true);
        $mailAdmin->Subject = $adminSubject;
        $mailAdmin->Body    = $adminMessage;
        $mailAdmin->CharSet = 'UTF-8';
        
        $mailAdmin->send();
        $adminSent = true;
        
    } catch (Exception $e) {
        $emailError .= "Admin email error: " . $e->getMessage() . " ";
    }

    // ========================================
    // Save to file (backup)
    // ========================================
    $bookingData = [
        'date_submission' => date('Y-m-d H:i:s'),
        'service' => $service,
        'date' => $formattedDate,
        'time' => $time,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'message' => $message,
        'client_email_sent' => $clientSent,
        'admin_email_sent' => $adminSent
    ];

    // Create bookings directory if it doesn't exist
    if (!file_exists('../bookings')) {
        mkdir('../bookings', 0755, true);
    }

    // Save to JSON file
    $filename = '../bookings/booking_' . date('Ymd_His') . '.json';
    file_put_contents($filename, json_encode($bookingData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    // ========================================
    // Response
    // ========================================
    echo json_encode([
        'success' => true,
        'message' => 'Réservation enregistrée avec succès !',
        'client_email_sent' => $clientSent,
        'admin_email_sent' => $adminSent,
        'debug_info' => [
            'smtp_host' => SMTP_HOST,
            'smtp_user' => SMTP_USER,
            'admin_email' => ADMIN_EMAIL,
            'error' => $emailError
        ]
    ]);
    
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ]);
}
?>