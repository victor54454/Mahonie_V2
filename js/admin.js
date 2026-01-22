// ========================================
// Admin Panel JavaScript - Version complète avec réservations
// ========================================

const API_URL = 'php/admin_api.php';
let currentMonth = new Date();
let allReservations = [];
let quillEditor;

// ==================== INITIALISATION ====================

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    setupEventListeners();
    loadUserInfo();
    loadReservations(); // Charger les réservations par défaut
    setupQuillEditor();
});

// Vérifier l'authentification
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || 'null');
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (user.role !== 'admin') {
        alert('Accès refusé : Vous devez être administrateur');
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Charger les informations utilisateur
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('admin_user'));
    document.getElementById('adminName').textContent = user.prenom || 'Admin';
}

// ==================== GESTION DES RÉSERVATIONS ====================

// Charger toutes les réservations
async function loadReservations() {
    try {
        const response = await fetchWithAuth(`${API_URL}?action=reservations`);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        allReservations = await response.json();
        displayReservations(allReservations);
        
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('reservationsList').innerHTML = `
            <div style="text-align: center; color: var(--danger); padding: 40px;">
                ❌ Erreur lors du chargement des réservations
            </div>
        `;
    }
}

// Afficher les réservations
function displayReservations(reservations) {
    const container = document.getElementById('reservationsList');
    
    if (reservations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--gray); padding: 40px;">
                📋 Aucune réservation trouvée
            </div>
        `;
        return;
    }
    
    container.innerHTML = reservations.map(reservation => `
        <div class="reservation-card" data-id="${reservation.id}">
            <div class="reservation-header">
                <div class="reservation-info">
                    <h3>${reservation.service}</h3>
                    <div class="reservation-client">
                        👤 ${reservation.prenom || 'Inconnu'} ${reservation.nom || ''}
                        <span class="reservation-contact">
                            📧 ${reservation.email || 'N/A'} 
                            ${reservation.telephone ? `📱 ${reservation.telephone}` : ''}
                        </span>
                    </div>
                </div>
                <div class="reservation-status">
                    <span class="status-badge status-${reservation.status}">
                        ${getStatusText(reservation.status)}
                    </span>
                </div>
            </div>
            
            <div class="reservation-details">
                <div class="detail-row">
                    <span class="detail-label">📅 Date et heure :</span>
                    <span class="detail-value">${formatDate(reservation.date)} à ${reservation.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏱️ Durée :</span>
                    <span class="detail-value">${reservation.duration}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">💰 Prix :</span>
                    <span class="detail-value">${reservation.price}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📝 Créée le :</span>
                    <span class="detail-value">${formatDateTime(reservation.created_at)}</span>
                </div>
            </div>
            
            <div class="reservation-actions">
                <button class="btn btn-secondary btn-sm" onclick="viewReservationDetails(${reservation.id})">
                    👁️ Voir détails
                </button>
                ${reservation.status === 'en_attente' ? `
                    <button class="btn btn-success btn-sm" onclick="confirmReservation(${reservation.id})">
                        ✅ Confirmer
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="cancelReservation(${reservation.id})">
                        ❌ Annuler
                    </button>
                ` : reservation.status === 'confirmee' ? `
                    <button class="btn btn-danger btn-sm" onclick="cancelReservation(${reservation.id})">
                        ❌ Annuler
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Obtenir le texte du statut
function getStatusText(status) {
    const statusMap = {
        'confirmee': '✅ Confirmée',
        'en_attente': '⏳ En attente',
        'annulee': '❌ Annulée'
    };
    return statusMap[status] || status;
}

// Confirmer une réservation
async function confirmReservation(id) {
    if (!confirm('Êtes-vous sûr de vouloir confirmer cette réservation ?')) return;
    
    try {
        const response = await fetchWithAuth(`${API_URL}?action=reservations/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        if (!response.ok) throw new Error('Erreur lors de la confirmation');
        
        alert('✅ Réservation confirmée avec succès');
        loadReservations(); // Recharger
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la confirmation');
    }
}

// Annuler une réservation
async function cancelReservation(id) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    
    try {
        const response = await fetchWithAuth(`${API_URL}?action=reservations/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'annulation');
        
        alert('❌ Réservation annulée avec succès');
        loadReservations(); // Recharger
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de l\'annulation');
    }
}

// Voir les détails d'une réservation
function viewReservationDetails(id) {
    const reservation = allReservations.find(r => r.id == id);
    if (!reservation) return;
    
    document.getElementById('reservationModalContent').innerHTML = `
        <div class="participant-details">
            <div class="detail-card">
                <h3>🏷️ Informations de la réservation</h3>
                <div class="info-row">
                    <span class="info-label">Service :</span>
                    <span class="info-value">${reservation.service}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date :</span>
                    <span class="info-value">${formatDate(reservation.date)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Heure :</span>
                    <span class="info-value">${reservation.time}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Durée :</span>
                    <span class="info-value">${reservation.duration}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prix :</span>
                    <span class="info-value">${reservation.price}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Statut :</span>
                    <span class="info-value">
                        <span class="status-badge status-${reservation.status}">${getStatusText(reservation.status)}</span>
                    </span>
                </div>
            </div>
            
            <div class="detail-card">
                <h3>👤 Informations client</h3>
                <div class="info-row">
                    <span class="info-label">Nom :</span>
                    <span class="info-value">${reservation.prenom || ''} ${reservation.nom || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email :</span>
                    <span class="info-value">${reservation.email || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Téléphone :</span>
                    <span class="info-value">${reservation.telephone || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Réservation créée :</span>
                    <span class="info-value">${formatDateTime(reservation.created_at)}</span>
                </div>
            </div>
        </div>
    `;
    
    // Gérer les boutons d'action
    const confirmBtn = document.getElementById('confirmReservationBtn');
    const cancelBtn = document.getElementById('cancelReservationBtn');
    
    if (reservation.status === 'en_attente') {
        confirmBtn.style.display = 'inline-block';
        confirmBtn.onclick = () => {
            closeModal('reservationModal');
            confirmReservation(reservation.id);
        };
    } else {
        confirmBtn.style.display = 'none';
    }
    
    if (reservation.status !== 'annulee') {
        cancelBtn.style.display = 'inline-block';
        cancelBtn.onclick = () => {
            closeModal('reservationModal');
            cancelReservation(reservation.id);
        };
    } else {
        cancelBtn.style.display = 'none';
    }
    
    openModal('reservationModal');
}

// Filtrer les réservations
function filterReservations() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filtered = allReservations;
    
    if (statusFilter) {
        filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(r => r.date === dateFilter);
    }
    
    displayReservations(filtered);
}

// ==================== UTILITAIRES ====================

// Fetch avec authentification
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('admin_token');
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

// Formater une date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    });
}

// Formater date et heure
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
    
    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Filtres réservations
    document.getElementById('statusFilter').addEventListener('change', filterReservations);
    document.getElementById('dateFilter').addEventListener('change', filterReservations);
    document.getElementById('refreshReservations').addEventListener('click', loadReservations);
    
    // Navigation planning
    if (document.getElementById('prevMonth')) {
        document.getElementById('prevMonth').addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            loadPlanning();
        });
    }
    
    if (document.getElementById('nextMonth')) {
        document.getElementById('nextMonth').addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            loadPlanning();
        });
    }
    
    // Autres événements...
    if (document.getElementById('searchParticipants')) {
        document.getElementById('searchParticipants').addEventListener('input', searchParticipants);
    }
}

// Switcher entre les sections
function switchSection(section) {
    // Changer l'item actif du menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Changer la section affichée
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Changer le titre
    const titles = {
        'reservations': 'Réservations',
        'planning': 'Planning',
        'participants': 'Gestion des participants'
    };
    document.getElementById('pageTitle').textContent = titles[section] || section;
    
    // Charger les données de la section
    if (section === 'reservations') {
        loadReservations();
    } else if (section === 'planning') {
        loadPlanning();
    } else if (section === 'participants') {
        loadParticipants();
    }
}

// ==================== AUTRES FONCTIONS (Planning, Participants, etc.) ====================

// Placeholder pour les autres fonctions existantes
function loadPlanning() {
    // Code existant du planning
    console.log('Chargement du planning...');
}

function loadParticipants() {
    // Code existant des participants
    console.log('Chargement des participants...');
}

function searchParticipants() {
    // Code existant de recherche
    console.log('Recherche participants...');
}

function setupQuillEditor() {
    // Setup de l'éditeur Quill pour les notes
    console.log('Setup Quill Editor...');
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'index.html';
}