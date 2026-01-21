const API_URL = 'php/admin_api.php';

document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    // Désactiver le bouton
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = '⏳ Envoi en cours...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}?action=forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Une erreur est survenue');
        }
        
        // Succès
        successMessage.textContent = '✅ Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.';
        successMessage.style.display = 'block';
        
        // Masquer le formulaire
        e.target.style.display = 'none';
        
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});