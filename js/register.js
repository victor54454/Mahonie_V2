const API_URL = 'php/admin_api.php';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prenom = document.getElementById('prenom').value.trim();
    const nom = document.getElementById('nom').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    // Validation côté client
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Les mots de passe ne correspondent pas';
        errorMessage.style.display = 'block';
        return;
    }
    
    if (password.length < 8) {
        errorMessage.textContent = 'Le mot de passe doit contenir au moins 8 caractères';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Désactiver le bouton pendant l'envoi
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = '⏳ Création en cours...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}?action=register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prenom,
                nom,
                email,
                telephone,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'inscription');
        }
        
        // Succès
        successMessage.textContent = '✅ Compte créé avec succès ! Redirection vers la connexion...';
        successMessage.style.display = 'block';
        
        // Rediriger vers la page de login après 2 secondes
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Vérifier que les mots de passe correspondent en temps réel
document.getElementById('confirmPassword').addEventListener('input', function() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = 'var(--danger)';
    } else {
        this.style.borderColor = '';
    }
});