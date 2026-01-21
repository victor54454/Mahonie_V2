const API_URL = 'php/admin_api.php';

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    if (!token || !user.id) {
        // Pas connecté, rediriger vers login
        window.location.href = 'login.html';
        return;
    }
    
    // Charger les informations
    loadUserInfo(user);
    loadUserReservations(user.id, token);
    
    // Bouton déconnexion
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

function loadUserInfo(user) {
    const userInfoDiv = document.getElementById('userInfo');
    
    userInfoDiv.innerHTML = `
        <div class="info-row" style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            <span style="color: var(--gray);">Nom</span>
            <span style="color: var(--white); font-weight: 500;">${user.prenom} ${user.nom}</span>
        </div>
        <div class="info-row" style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            <span style="color: var(--gray);">Email</span>
            <span style="color: var(--white); font-weight: 500;">${user.email}</span>
        </div>
        <div class="info-row" style="padding: 12px 0;">
            <span style="color: var(--gray);">Téléphone</span>
            <span style="color: var(--white); font-weight: 500;">${user.telephone || 'Non renseigné'}</span>
        </div>
    `;
}

async function loadUserReservations(userId, token) {
    const reservationsDiv = document.getElementById('reservationsList');
    
    try {
        const response = await fetch(`${API_URL}?action=user-reservations&user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erreur chargement réservations');
        }
        
        const reservations = await response.json();
        
        if (reservations.length === 0) {
            reservationsDiv.innerHTML = `
                <p style="color: var(--gray); text-align: center;">Vous n'avez pas encore de réservation</p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="booking.html" class="btn btn-primary">Réserver une session</a>
                </div>
            `;
            return;
        }
        
        reservationsDiv.innerHTML = reservations.map(r => `
            <div class="reservation-card" style="background: var(--dark-tertiary); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <h3 style="font-size: 18px; margin-bottom: 4px; color: var(--white);">${r.service}</h3>
                        <span class="reservation-status status-${r.status}" style="display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600;">
                            ${r.status === 'confirmee' ? '✅ Confirmée' : '❌ Annulée'}
                        </span>
                    </div>
                    <span style="color: var(--primary); font-size: 20px; font-weight: 700;">${r.price}</span>
                </div>
                <div style="color: var(--gray); font-size: 14px;">
                    📅 ${formatDate(r.date)} à ${r.time}<br>
                    ⏱️ Durée : ${r.duration}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erreur:', error);
        reservationsDiv.innerHTML = '<p style="color: var(--danger);">Erreur lors du chargement des réservations</p>';
    }
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'index.html';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    });
}