const API_URL = 'php/admin_api.php';

// Récupérer le token depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    document.getElementById('errorMessage').textContent = 'Token de réinitialisation manquant';
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('resetPasswordForm').style.display = 'none';
} else {
    document.getElementById('token').value = token;
}

document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    // Validation
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
    
    // Désactiver le bouton
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = '⏳ Réinitialisation...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}?action=reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                token,
                password 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Une erreur est survenue');
        }
        
        // Succès
        successMessage.textContent = '✅ Mot de passe réinitialisé avec succès ! Redirection vers la connexion...';
        successMessage.style.display = 'block';
        
        // Masquer le formulaire
        e.target.style.display = 'none';
        
        // Rediriger après 3 secondes
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
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