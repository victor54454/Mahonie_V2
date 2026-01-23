// ========================================
// Menu intelligent - OPTION 1: Deux liens pour admins
// ========================================

console.log('🎯 Menu intelligent - Option 1 (deux liens admin)');

// Fonction pour vérifier si l'utilisateur est connecté
function isUserConnected() {
    const userData = localStorage.getItem('admin_user') || localStorage.getItem('user');
    if (!userData) {
        console.log('❌ Aucune donnée utilisateur trouvée');
        return null;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('✅ Utilisateur trouvé:', user.prenom, user.email, 'Role:', user.role);
        return user;
    } catch (error) {
        console.error('❌ Erreur parsing user data:', error);
        return null;
    }
}

// Fonction pour adapter le menu selon la connexion
function updateNavigationMenu() {
    const user = isUserConnected();
    
    // Chercher les éléments du menu
    const loginLink = document.querySelector('a[href*="login"]');
    const inscriptionLink = document.querySelector('a[href*="register"], a[href*="inscription"]');
    
    console.log('🔍 Éléments menu trouvés:', {
        login: loginLink ? 'OUI' : 'NON',
        inscription: inscriptionLink ? 'OUI' : 'NON'
    });
    
    if (user && user.email) {
        // UTILISATEUR CONNECTÉ - Transformer le menu
        console.log('👤 Utilisateur connecté - Transformation du menu');
        
        if (loginLink && user.role === 'admin') {
            // ADMIN - Créer deux liens séparés
            const userName = user.prenom || 'Admin';
            
            // 1. Transformer Login en Panel Admin
            loginLink.innerHTML = '📊 Panel Admin';
            loginLink.href = 'admin.html';
            loginLink.title = `Interface d'administration`;
            
            // 2. Créer le lien Compte après
            const compteLink = document.createElement('a');
            compteLink.href = 'account.html';
            compteLink.innerHTML = '👑 Compte';
            compteLink.title = `Profil personnel - ${userName}`;
            
            // Copier les styles du lien original
            compteLink.className = loginLink.className;
            compteLink.style.cssText = loginLink.style.cssText;
            compteLink.style.marginLeft = '20px';
            
            // Insérer après le lien Panel Admin
            loginLink.parentNode.insertBefore(compteLink, loginLink.nextSibling);
            
            console.log(`✅ Menu admin configuré: Panel Admin + Compte pour ${userName}`);
            
        } else if (loginLink && user.role === 'client') {
            // CLIENT - Un seul lien Compte
            const userName = user.prenom || 'Utilisateur';
            
            loginLink.innerHTML = '👤 Compte';
            loginLink.href = 'account.html';
            loginLink.title = `Connecté en tant que ${userName} (Client)`;
            
            console.log(`✅ Menu client configuré: Compte pour ${userName}`);
        }
        
        // Cacher inscription
        if (inscriptionLink) {
            inscriptionLink.style.display = 'none';
            console.log('✅ Inscription masquée');
        }
        
        // Ajouter indicateur discret
        addUserIndicator(user);
        
    } else {
        // UTILISATEUR NON CONNECTÉ - Menu normal
        console.log('❌ Utilisateur non connecté - Menu standard conservé');
        
        // Nettoyer les liens ajoutés précédemment
        const existingCompteLink = document.querySelector('a[href="account.html"]');
        if (existingCompteLink && existingCompteLink.innerHTML === '👑 Compte') {
            existingCompteLink.remove();
        }
        
        // Supprimer l'indicateur si présent
        const existingIndicator = document.getElementById('user-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Réafficher inscription
        if (inscriptionLink) {
            inscriptionLink.style.display = '';
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
    
    const indicator = document.createElement('div');
    indicator.id = 'user-indicator';
    
    const roleIcon = user.role === 'admin' ? '👑' : '✅';
    const userName = user.prenom || 'Connecté';
    
    indicator.innerHTML = `
        <div style="
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.2);
        ">
            ${roleIcon} ${userName}
        </div>
    `;
    
    document.body.appendChild(indicator);
    console.log(`✅ Indicateur affiché pour ${userName} (${user.role})`);
}

// Fonction de déconnexion
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        
        console.log('🚪 Déconnexion effectuée');
        window.location.href = 'index.html';
    }
}

// Démarrage sécurisé
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page chargée - Initialisation menu intelligent...');
    
    // Attendre que le DOM soit complètement chargé
    setTimeout(() => {
        updateNavigationMenu();
        
        // Vérifier périodiquement les changements de connexion
        setInterval(() => {
            updateNavigationMenu();
        }, 5000);
        
    }, 300);
});

// Fonctions globales
window.updateMenu = updateNavigationMenu;
window.logout = logout;

console.log('🎯 Menu intelligent Option 1 initialisé !');