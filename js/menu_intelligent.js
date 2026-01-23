// ========================================
// Menu intelligent - Affichage selon la connexion
// ========================================

console.log('🎯 Chargement du menu intelligent...');

// Fonction pour vérifier si l'utilisateur est connecté
function isUserConnected() {
    const userData = localStorage.getItem('admin_user') || localStorage.getItem('user');
    if (!userData) return null;
    
    try {
        return JSON.parse(userData);
    } catch (error) {
        return null;
    }
}

// Fonction pour adapter le menu selon la connexion
function updateNavigationMenu() {
    const user = isUserConnected();
    
    // Chercher les éléments du menu
    const loginLink = document.querySelector('a[href*="login"], a[href*="Login"]');
    const inscriptionLink = document.querySelector('a[href*="inscription"], a[href*="Inscription"]');
    
    if (user) {
        console.log('✅ Utilisateur connecté - Adaptation du menu');
        
        // UTILISATEUR CONNECTÉ → Remplacer par "Compte"
        if (loginLink) {
            loginLink.innerHTML = '👤 Compte';
            loginLink.href = 'compte.html'; // Page de profil
            loginLink.title = `Connecté en tant que ${user.prenom || 'Utilisateur'}`;
        }
        
        // Cacher l'inscription
        if (inscriptionLink) {
            inscriptionLink.style.display = 'none';
        }
        
        // Ajouter une indication discrète dans le menu
        addUserIndicator(user);
        
    } else {
        console.log('❌ Utilisateur non connecté - Menu standard');
        
        // UTILISATEUR NON CONNECTÉ → Menu standard
        if (loginLink) {
            loginLink.innerHTML = 'Login';
            loginLink.href = 'login.html';
        }
        
        if (inscriptionLink) {
            inscriptionLink.style.display = 'inline-block';
        }
    }
}

// Ajouter un petit indicateur visuel discret
function addUserIndicator(user) {
    // Éviter les doublons
    const existingIndicator = document.getElementById('user-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Chercher la nav ou le header
    const nav = document.querySelector('nav, .navbar, header');
    if (nav) {
        const indicator = document.createElement('div');
        indicator.id = 'user-indicator';
        indicator.innerHTML = `
            <div style="
                position: absolute;
                top: 10px;
                right: 20px;
                background: rgba(76, 175, 80, 0.9);
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
                ✓ ${user.prenom || 'Connecté'}
            </div>
        `;
        nav.appendChild(indicator);
    }
}

// Fonction pour déconnexion (à appeler depuis le menu Compte)
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    
    // Recharger la page pour réinitialiser le menu
    window.location.reload();
}

// Démarrage automatique
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page chargée - Mise à jour du menu...');
    
    // Attendre un peu que le menu soit chargé
    setTimeout(updateNavigationMenu, 100);
    
    // Vérifier périodiquement (au cas où l'utilisateur se connecte/déconnecte)
    setInterval(updateNavigationMenu, 5000);
});

// Fonction utilitaire pour autres pages
window.updateMenu = updateNavigationMenu;
window.logout = logout;

console.log('🎯 Menu intelligent initialisé !');