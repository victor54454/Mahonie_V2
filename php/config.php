<?php
// ========================================
// Configuration Email SMTP
// ========================================

// SMTP Gmail configuration
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_USER', 'merciervictor4@gmail.com');  // TON email Gmail
define('SMTP_PASS', 'hpvtnmpcfjenjbqh');   // Le mdp d'app que tu as créé
define('SMTP_PORT', 587);
define('SMTP_SECURE', 'tls');

// Email où tu reçois les notifications
define('ADMIN_EMAIL', 'merciervictor4@gmail.com');

// Timezone²
date_default_timezone_set('Europe/Paris');
?>