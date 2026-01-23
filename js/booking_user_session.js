// CORRECTION POUR booking.html - Ajouter ce JavaScript

// Fonction pour détecter et pré-remplir les données utilisateur
function checkUserSession() {
    // Vérifier si l'utilisateur est connecté
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (user && user.email) {
        console.log('👤 Utilisateur connecté détecté:', user.email);
        
        // Pré-remplir les champs
        const nameField = document.getElementById('name');
        const emailField = document.getElementById('email');
        const phoneField = document.getElementById('phone');
        
        if (nameField && emailField) {
            // Remplir le nom complet
            const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
            if (fullName) {
                nameField.value = fullName;
                nameField.style.backgroundColor = '#e8f5e8'; // Vert léger
            }
            
            // Remplir l'email
            emailField.value = user.email;
            emailField.style.backgroundColor = '#e8f5e8'; // Vert léger
            emailField.setAttribute('readonly', true); // Empêcher la modification
            
            // Remplir le téléphone si disponible
            if (phoneField && user.telephone) {
                phoneField.value = user.telephone;
                phoneField.style.backgroundColor = '#e8f5e8'; // Vert léger
            }
            
            // Ajouter un message informatif
            addUserConnectedMessage(user);
        }
    }
}

// Ajouter un message pour indiquer que l'utilisateur est connecté
function addUserConnectedMessage(user) {
    const form = document.querySelector('.booking-form');
    if (form) {
        // Créer le message s'il n'existe pas déjà
        if (!document.getElementById('user-connected-message')) {
            const messageDiv = document.createElement('div');
            messageDiv.id = 'user-connected-message';
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
                        <strong>Connecté en tant que ${user.prenom || 'Utilisateur'}</strong><br>
                        <small>Vos informations ont été automatiquement remplies</small>
                    </div>
                </div>
            `;
            
            // Insérer au début du formulaire
            form.insertBefore(messageDiv, form.firstChild);
        }
    }
}

// Modifier la fonction de soumission pour inclure l'état de connexion
function submitBookingWithUserCheck(formData) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Ajouter des informations sur l'état de connexion
    if (user && user.email) {
        formData.append('logged_user_id', user.id || '');
        formData.append('is_logged_in', 'true');
    } else {
        formData.append('is_logged_in', 'false');
    }
    
    return formData;
}

// Démarrage automatique quand la page se charge
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier la session utilisateur
    checkUserSession();
    
    // Modifier la soumission du formulaire s'il existe
    const bookingForm = document.querySelector('.booking-form form, #bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            // Intercepter la soumission pour ajouter les infos utilisateur
            const formData = new FormData(this);
            const modifiedFormData = submitBookingWithUserCheck(formData);
            
            // Continuer avec la soumission normale
            // (le reste de votre code de soumission existant)
        });
    }
});

// Fonction utilitaire pour vérifier si un utilisateur est connecté
function isUserLoggedIn() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user && user.email;
}

// Fonction pour obtenir les informations de l'utilisateur connecté
function getLoggedUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

console.log('🔧 Système de détection utilisateur connecté chargé');