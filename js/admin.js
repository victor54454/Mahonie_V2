// ========================================
// Admin Panel JavaScript - Version COMPLÈTE avec correction modals
// ========================================

const API_URL = 'php/admin_api.php';
let currentMonth = new Date();
let allReservations = [];
let allParticipants = [];
let quillEditor;

// ==================== INITIALISATION ====================

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    setupEventListeners();
    loadUserInfo();
    
    // Démarrer sur les réservations par défaut
    switchSection('reservations');
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
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter'); 
    const refreshBtn = document.getElementById('refreshReservations');
    
    if (statusFilter) statusFilter.addEventListener('change', filterReservations);
    if (dateFilter) dateFilter.addEventListener('change', filterReservations);
    if (refreshBtn) refreshBtn.addEventListener('click', loadReservations);
    
    // Navigation planning
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    
    if (prevMonth) {
        prevMonth.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            loadPlanning();
        });
    }
    
    if (nextMonth) {
        nextMonth.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            loadPlanning();
        });
    }
    
    // Boutons planning - UTILISE LA CLASSE .show AU LIEU DE .style.display
    const closeDayBtn = document.getElementById('closeDayBtn');
    const closeSlotBtn = document.getElementById('closeSlotBtn');
    
    if (closeDayBtn) closeDayBtn.addEventListener('click', () => openModal('closeDayModal'));
    if (closeSlotBtn) closeSlotBtn.addEventListener('click', () => openModal('closeSlotModal'));
    
    // Recherche participants
    const searchInput = document.getElementById('searchParticipants');
    if (searchInput) searchInput.addEventListener('input', searchParticipants);
    
    // Modals - Configuration événements
    setupModalEvents();
}

function setupModalEvents() {
    // Confirmation fermeture jour
    const confirmCloseDay = document.getElementById('confirmCloseDay');
    if (confirmCloseDay) {
        confirmCloseDay.addEventListener('click', async () => {
            const date = document.getElementById('closeDayDate').value;
            if (!date) {
                alert('Veuillez sélectionner une date');
                return;
            }
            
            try {
                const response = await fetchWithAuth(`${API_URL}?action=disponibilites/close-day`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date })
                });
                
                if (response.ok) {
                    alert('✅ Jour fermé avec succès');
                    closeModal('closeDayModal');
                    loadPlanning();
                }
            } catch (error) {
                alert('❌ Erreur lors de la fermeture');
            }
        });
    }
    
    // Confirmation fermeture créneau
    const confirmCloseSlot = document.getElementById('confirmCloseSlot');
    if (confirmCloseSlot) {
        confirmCloseSlot.addEventListener('click', async () => {
            const date = document.getElementById('closeSlotDate').value;
            const time = document.getElementById('closeSlotTime').value;
            
            if (!date || !time) {
                alert('Veuillez sélectionner une date et une heure');
                return;
            }
            
            try {
                const response = await fetchWithAuth(`${API_URL}?action=disponibilites/close-slot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, time_slot: time })
                });
                
                if (response.ok) {
                    alert('✅ Créneau fermé avec succès');
                    closeModal('closeSlotModal');
                    loadPlanning();
                }
            } catch (error) {
                alert('❌ Erreur lors de la fermeture');
            }
        });
    }
}

// Switcher entre les sections
function switchSection(section) {
    // Changer l'item actif du menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const menuItem = document.querySelector(`[data-section="${section}"]`);
    if (menuItem) menuItem.classList.add('active');
    
    // Changer la section affichée
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) sectionElement.classList.add('active');
    
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

// ==================== RÉSERVATIONS ====================

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

function getStatusText(status) {
    const statusMap = {
        'confirmee': '✅ Confirmée',
        'en_attente': '⏳ En attente',
        'annulee': '❌ Annulée'
    };
    return statusMap[status] || status;
}

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
        loadReservations();
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la confirmation');
    }
}

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
        loadReservations();
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de l\'annulation');
    }
}

function viewReservationDetails(id) {
    const reservation = allReservations.find(r => r.id == id);
    if (!reservation) return;
    
    alert(`Détails de la réservation #${id}:
    
Service: ${reservation.service}
Client: ${reservation.prenom} ${reservation.nom}
Email: ${reservation.email}
Date: ${formatDate(reservation.date)} à ${reservation.time}
Statut: ${getStatusText(reservation.status)}`);
}

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

// ==================== PLANNING ====================

async function loadPlanning() {
    try {
        // Mettre à jour l'affichage du mois
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        document.getElementById('currentMonth').textContent = 
            `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
        
        // Charger les disponibilités
        const response = await fetchWithAuth(`${API_URL}?action=disponibilites`);
        const disponibilites = response.ok ? await response.json() : [];
        
        // Générer le calendrier
        generateCalendar(disponibilites);
        
        // Afficher la liste des jours fermés
        displayClosedDays(disponibilites);
        
    } catch (error) {
        console.error('Erreur chargement planning:', error);
    }
}

function generateCalendar(disponibilites) {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Effacer le calendrier
    calendar.innerHTML = '';
    
    // En-têtes des jours
    const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Premier jour du mois et nombre de jours
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Ajuster le premier jour (0 = dimanche, on veut 1 = lundi)
    const startDay = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    
    // Ajouter les jours du mois précédent
    for (let i = 1; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendar.appendChild(emptyDay);
    }
    
    // Ajouter les jours du mois
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Vérifier si c'est aujourd'hui
        const currentDate = new Date(year, month, day);
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Vérifier si le jour est fermé
        const dateStr = currentDate.toISOString().split('T')[0];
        const isClosed = disponibilites.some(d => d.date === dateStr && !d.time_slot);
        
        if (isClosed) {
            dayElement.classList.add('closed');
            const status = document.createElement('div');
            status.className = 'day-status';
            status.textContent = 'Fermé';
            dayElement.appendChild(status);
        }
        
        calendar.appendChild(dayElement);
    }
}

function displayClosedDays(disponibilites) {
    const closedList = document.getElementById('closedList');
    if (!closedList) return;
    
    if (disponibilites.length === 0) {
        closedList.innerHTML = '<p style="color: var(--gray);">Aucun jour ou créneau fermé</p>';
        return;
    }
    
    closedList.innerHTML = disponibilites.map(item => `
        <div class="closed-item">
            <div>
                <strong>${formatDate(item.date)}</strong>
                ${item.time_slot ? ` - ${item.time_slot}` : ' (Jour complet)'}
            </div>
            <button class="btn btn-secondary btn-sm" onclick="reopenSlot(${item.id})">
                🔄 Rouvrir
            </button>
        </div>
    `).join('');
}

async function reopenSlot(id) {
    if (!confirm('Êtes-vous sûr de vouloir rouvrir ce créneau ?')) return;
    
    try {
        const response = await fetchWithAuth(`${API_URL}?action=disponibilites/delete`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('✅ Créneau rouvert avec succès');
            loadPlanning();
        }
    } catch (error) {
        alert('❌ Erreur lors de la réouverture');
    }
}

// ==================== PARTICIPANTS - COMPLET ! ====================

async function loadParticipants() {
    try {
        const response = await fetchWithAuth(`${API_URL}?action=participants`);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        allParticipants = await response.json();
        displayParticipants(allParticipants);
        
        // Mettre à jour le compteur
        const counter = document.getElementById('participantCount');
        if (counter) {
            counter.textContent = `${allParticipants.length} participant(s)`;
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        const participantsList = document.getElementById('participantsList');
        if (participantsList) {
            participantsList.innerHTML = `
                <div style="text-align: center; color: var(--danger); padding: 40px;">
                    ❌ Erreur lors du chargement des participants
                </div>
            `;
        }
    }
}

function displayParticipants(participants) {
    const container = document.getElementById('participantsList');
    if (!container) return;
    
    if (participants.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--gray); padding: 40px;">
                👥 Aucun participant trouvé
            </div>
        `;
        return;
    }
    
    container.innerHTML = participants.map(participant => `
        <div class="participant-card" onclick="viewParticipantDetails(${participant.id})" style="cursor: pointer;">
            <div class="participant-avatar">${participant.prenom.charAt(0).toUpperCase()}${participant.nom.charAt(0).toUpperCase()}</div>
            <div class="participant-info">
                <h3>${participant.prenom} ${participant.nom}</h3>
                <div class="participant-contact">
                    <span>📧 ${participant.email}</span>
                    ${participant.telephone ? `<span>📱 ${participant.telephone}</span>` : ''}
                </div>
                <div class="participant-stats">
                    <span class="stat-item">📋 ${participant.total_reservations || 0} réservation${(participant.total_reservations || 0) > 1 ? 's' : ''}</span>
                    ${participant.derniere_reservation ? `<span class="stat-item">📅 Dernière : ${formatDateShort(participant.derniere_reservation)}</span>` : ''}
                </div>
                <div class="participant-meta">
                    <span class="join-date">Membre depuis ${formatDateShort(participant.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function viewParticipantDetails(id) {
    try {
        const response = await fetchWithAuth(`${API_URL}?action=participants/details&id=${id}`);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const participant = await response.json();
        
        // Créer le contenu de la modal
        const modalContent = `
            <div class="participant-details">
                <div class="detail-card">
                    <h3>👤 Informations personnelles</h3>
                    <div class="info-row">
                        <span class="info-label">Nom complet :</span>
                        <span class="info-value">${participant.prenom} ${participant.nom}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email :</span>
                        <span class="info-value"><a href="mailto:${participant.email}">${participant.email}</a></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Téléphone :</span>
                        <span class="info-value">${participant.telephone ? `<a href="tel:${participant.telephone}">${participant.telephone}</a>` : 'Non renseigné'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Membre depuis :</span>
                        <span class="info-value">${formatDate(participant.created_at)}</span>
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3>📋 Historique des réservations</h3>
                    ${participant.reservations.length > 0 ? 
                        participant.reservations.map(res => `
                            <div class="reservation-item">
                                <div class="reservation-header">
                                    <strong>${res.service}</strong>
                                    <span class="status-badge status-${res.status}">${getStatusText(res.status)}</span>
                                </div>
                                <div class="reservation-details">
                                    📅 ${formatDate(res.date)} à ${res.time}<br>
                                    💰 ${res.price} - ⏱️ ${res.duration}
                                </div>
                            </div>
                        `).join('') :
                        '<p style="color: var(--gray);">Aucune réservation</p>'
                    }
                </div>
                
                <div class="detail-card">
                    <h3>📝 Notes et observations</h3>
                    ${participant.notes.length > 0 ?
                        participant.notes.map(note => `
                            <div class="note-item">
                                <div class="note-header">
                                    <span class="note-author">Par ${note.prenom} ${note.nom}</span>
                                    <span class="note-date">${formatDateTime(note.created_at)}</span>
                                    <div class="note-actions">
                                        <button onclick="deleteNote(${note.id})" style="background:none;border:none;color:var(--danger);cursor:pointer;">🗑️</button>
                                    </div>
                                </div>
                                <div class="note-content">${note.note_html}</div>
                            </div>
                        `).join('') :
                        '<p style="color: var(--gray);">Aucune note pour le moment</p>'
                    }
                    <div class="add-note-section" style="margin-top: 20px;">
                        <h4>Ajouter une note :</h4>
                        <div id="noteEditor" style="height: 200px; border: 1px solid #ccc; border-radius: 8px;"></div>
                        <button class="btn btn-primary" onclick="saveNote(${participant.id})" style="margin-top: 10px;">💾 Enregistrer la note</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remplir la modal
        document.getElementById('participantModalContent').innerHTML = modalContent;
        
        // Initialiser l'éditeur Quill pour les notes
        setTimeout(() => {
            if (typeof Quill !== 'undefined') {
                quillEditor = new Quill('#noteEditor', {
                    theme: 'snow',
                    placeholder: 'Écrivez votre note ici...',
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline'],
                            ['link', 'blockquote'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['clean']
                        ]
                    }
                });
            }
        }, 100);
        
        // Ouvrir la modal
        openModal('participantModal');
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors du chargement des détails du participant');
    }
}

async function saveNote(participantId) {
    if (!quillEditor) {
        alert('❌ Erreur : éditeur de notes non initialisé');
        return;
    }
    
    const noteContent = quillEditor.getHTML();
    if (!noteContent || noteContent.trim() === '<p><br></p>') {
        alert('⚠️ Veuillez saisir une note avant d\'enregistrer');
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}?action=participants/notes/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: participantId,
                note_html: noteContent
            })
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');
        
        alert('✅ Note enregistrée avec succès');
        quillEditor.setHTML(''); // Vider l'éditeur
        
        // Recharger les détails du participant
        viewParticipantDetails(participantId);
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de l\'enregistrement de la note');
    }
}

async function deleteNote(noteId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
    
    try {
        const response = await fetchWithAuth(`${API_URL}?action=notes/delete&id=${noteId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        alert('✅ Note supprimée avec succès');
        
        // Recharger la modal
        const participantId = getCurrentParticipantId(); // Fonction à implémenter si nécessaire
        if (participantId) {
            viewParticipantDetails(participantId);
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la suppression de la note');
    }
}

function searchParticipants() {
    const query = document.getElementById('searchParticipants').value.toLowerCase();
    
    if (!query) {
        displayParticipants(allParticipants);
        return;
    }
    
    const filtered = allParticipants.filter(p => 
        p.nom.toLowerCase().includes(query) ||
        p.prenom.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        (p.telephone && p.telephone.includes(query))
    );
    
    displayParticipants(filtered);
    
    // Mettre à jour le compteur
    const counter = document.getElementById('participantCount');
    if (counter) {
        counter.textContent = `${filtered.length} participant(s) trouvé(s)`;
    }
}

// ==================== UTILITAIRES ====================

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

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    });
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
}

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

// MODIFICATION IMPORTANTE : Utilise les classes CSS au lieu de .style.display
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'index.html';
}