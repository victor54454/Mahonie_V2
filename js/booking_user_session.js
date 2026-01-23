// ========================================
// booking_user_session.js - TEXTE VISIBLE DANS LES CHAMPS
// ========================================

console.log('🔧 Chargement du système de pré-remplissage...');

// Fonction pour récupérer les données utilisateur (admin ou client)
function getUserData() {
    // Essayer les deux emplacements
    let userData = localStorage.getItem('admin_user') || localStorage.getItem('user');
    
    if (!userData) {
        return null;
    }
    
    try {
        const user = JSON.parse(userData);
        
        // LE VRAI TYPE EST DANS user.role, PAS dans la clé localStorage !
        user._type = user.role || 'client'; // 'admin' ou 'client' basé sur les vraies données
        
        return user;
    } catch (error) {
        console.error('❌ Erreur parsing données utilisateur:', error);
        return null;
    }
}

// Fonction pour détecter et pré-remplir les données utilisateur
function checkAndFillUserData() {
    console.log('👤 Vérification de la session utilisateur...');
    
    const user = getUserData();
    console.log('📦 Utilisateur trouvé:', user);
    
    if (!user || !user.email) {
        console.log('❌ Aucun utilisateur connecté trouvé');
        return;
    }
    
    console.log(`✅ Utilisateur ${user._type} connecté:`, user.prenom, user.nom, user.email);
    console.log(`👤 Role réel: ${user.role}`); // Debug du vrai rôle
    
    // Chercher les champs dans le formulaire
    const nameField = document.querySelector('input[name="name"], #name');
    const emailField = document.querySelector('input[name="email"], input[type="email"]');
    const phoneField = document.querySelector('input[name="phone"], #phone');
    
    console.log('🔍 Champs trouvés:', {
        name: nameField ? '✅ OUI' : '❌ NON',
        email: emailField ? '✅ OUI' : '❌ NON', 
        phone: phoneField ? '✅ OUI' : '❌ NON'
    });
    
    // Pré-remplir le nom
    if (nameField) {
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
        if (fullName && fullName !== '') {
            nameField.value = fullName;
            nameField.style.backgroundColor = '#e8f5e8';
            nameField.style.borderLeft = '4px solid #4CAF50';
            nameField.style.color = '#000000';        // ← AJOUT : Texte noir visible
            nameField.style.fontWeight = 'bold';      // ← AJOUT : Texte gras
            console.log('✅ Nom pré-rempli:', fullName);
        }
    }
    
    // Pré-remplir l'email  
    if (emailField && user.email) {
        emailField.value = user.email;
        emailField.style.backgroundColor = '#e8f5e8';
        emailField.style.borderLeft = '4px solid #4CAF50';
        emailField.style.color = '#000000';          // ← AJOUT : Texte noir visible
        emailField.style.fontWeight = 'bold';        // ← AJOUT : Texte gras
        emailField.readOnly = true;
        console.log('✅ Email pré-rempli:', user.email);
    }
    
    // Pré-remplir le téléphone
    if (phoneField && user.telephone) {
        phoneField.value = user.telephone;
        phoneField.style.backgroundColor = '#e8f5e8';
        phoneField.style.borderLeft = '4px solid #4CAF50';
        phoneField.style.color = '#000000';          // ← AJOUT : Texte noir visible
        phoneField.style.fontWeight = 'bold';        // ← AJOUT : Texte gras
        console.log('✅ Téléphone pré-rempli:', user.telephone);
    }
    
    // Ajouter un message de confirmation
    addUserConnectedMessage(user);
}

// Ajouter un message pour indiquer que l'utilisateur est connecté
function addUserConnectedMessage(user) {
    // Éviter les doublons
    const existingMessage = document.getElementById('user-connected-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const form = document.querySelector('form, .booking-form, .container');
    if (form) {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'user-connected-message';
        
        const userName = user.prenom || 'Utilisateur';
        
        // CORRECTION : Utiliser le VRAI role, pas la supposition
        const userRole = user.role === 'admin' ? '👑 Administrateur' : '👤 Client';
        
        messageDiv.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <span style="font-size: 20px;">✅</span>
                <div>
                    <strong>Connecté en tant que ${userName} (${userRole})</strong><br>
                    <small>Vos informations ont été automatiquement remplies</small>
                </div>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                ">×</button>
            </div>
        `;
        
        form.insertBefore(messageDiv, form.firstChild);
        console.log(`✅ Message affiché pour ${userRole} (role: ${user.role})`);
    }
}

// Fonction pour vérifier les champs périodiquement
function periodicCheck() {
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkInterval = setInterval(() => {
        attempts++;
        console.log(`🔄 Tentative ${attempts}/${maxAttempts} de pré-remplissage...`);
        
        const hasForm = document.querySelector('form, input[name="name"], input[name="email"]');
        
        if (hasForm) {
            checkAndFillUserData();
            clearInterval(checkInterval);
            console.log('✅ Formulaire trouvé et traité');
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.log('⚠️ Formulaire non trouvé après 5 tentatives');
        }
    }, 300);
}

// Fonction de test manuel
window.testUserFill = function() {
    console.log('🧪 Test manuel du pré-remplissage...');
    const user = getUserData();
    console.log('🔍 Debug utilisateur:', user);
    console.log('🎭 Role détecté:', user ? user.role : 'AUCUN');
    checkAndFillUserData();
};

// Démarrage automatique
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page chargée, démarrage du pré-remplissage...');
    
    // Attendre un peu que les champs se chargent
    setTimeout(function() {
        checkAndFillUserData();
        periodicCheck();
    }, 100);
});

// Démarrage alternatif si la page est déjà chargée
if (document.readyState === 'complete') {
    setTimeout(function() {
        checkAndFillUserData();
        periodicCheck();
    }, 100);
}

console.log('🚀 Système de pré-remplissage initialisé !');
console.log('💡 Pour tester manuellement: testUserFill()');