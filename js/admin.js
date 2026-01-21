const API_URL = 'php/admin_api.php';
let currentMonth = new Date();
let quillEditor = null;
let currentParticipantId = null;
let closedDays = [];

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Vérifier la validité du token
    verifyToken(token);
    
    // Afficher le nom de l'admin
    document.getElementById('adminName').textContent = `${user.prenom} ${user.nom}`;
    
    // Initialiser l'éditeur Quill
    initQuillEditor();
    
    // Charger la section planning par défaut
    loadPlanning();
    
    // Event listeners
    setupEventListeners();
});

// Vérifier le token
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_URL}?action=verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Erreur vérification token:', error);
        window.location.href = 'login.html';
    }
}

// Initialiser Quill Editor
function initQuillEditor() {
    quillEditor = new Quill('#noteEditor', {
        theme: 'snow',
        placeholder: 'Écrivez vos observations sur le participant...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
            ]
        }
    });
}

// Setup Event Listeners
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
    
    // Navigation planning
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        loadPlanning();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        loadPlanning();
    });
    
    // Boutons fermer jour/créneau
    document.getElementById('closeDayBtn').addEventListener('click', () => openModal('closeDayModal'));
    document.getElementById('closeSlotBtn').addEventListener('click', () => openModal('closeSlotModal'));
    
    // Recherche participants
    document.getElementById('searchParticipants').addEventListener('input', searchParticipants);
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
        'planning': 'Planning',
        'participants': 'Gestion des participants'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    // Charger les données
    if (section === 'planning') {
        loadPlanning();
    } else if (section === 'participants') {
        loadParticipants();
    }
}

// Déconnexion
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'login.html';
}

// ==================== PLANNING ====================

async function loadPlanning() {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    
    // Charger les disponibilités fermées
    await loadClosedDays();
    
    // Générer le calendrier
    generateCalendar();
    
    // Afficher la liste des jours fermés
    displayClosedList();
}

async function loadClosedDays() {
    const token = localStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${API_URL}?action=disponibilites`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            closedDays = await response.json();
        }
    } catch (error) {
        console.error('Erreur chargement disponibilités:', error);
    }
}

function generateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Headers des jours
    const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Premier et dernier jour du mois
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Ajuster pour commencer le lundi
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;
    
    // Jours du mois précédent
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendar.appendChild(emptyDay);
    }
    
    // Jours du mois actuel
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Créer la date sans problème de timezone
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        
        const currentDate = new Date(year, currentMonth.getMonth(), day);
        
        // Vérifier si c'est aujourd'hui
        if (today.toDateString() === currentDate.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Vérifier si le jour est fermé
        const isClosed = closedDays.some(closed => 
            closed.date === dateStr && closed.time_slot === null
        );
        
        if (isClosed) {
            dayElement.classList.add('closed');
        }
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-status">${isClosed ? '🚫 Fermé' : '✅ Ouvert'}</div>
        `;
        
        calendar.appendChild(dayElement);
    }
}

function displayClosedList() {
    const list = document.getElementById('closedList');
    
    if (closedDays.length === 0) {
        list.innerHTML = '<p style="color: var(--gray); text-align: center;">Aucun jour ou créneau fermé</p>';
        return;
    }
    
    list.innerHTML = closedDays.map(closed => `
        <div class="closed-item">
            <div class="closed-item-info">
                <span class="closed-item-date">${formatDate(closed.date)}</span>
                <span class="closed-item-time">
                    ${closed.time_slot ? `Créneau: ${closed.time_slot}` : 'Toute la journée'}
                </span>
            </div>
            <button class="btn-reopen" onclick="reopenDay(${closed.id})">
                ✅ Rouvrir
            </button>
        </div>
    `).join('');
}

async function confirmCloseDay() {
    const date = document.getElementById('closeDayDate').value;
    
    if (!date) {
        alert('Veuillez sélectionner une date');
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${API_URL}?action=disponibilites/close-day`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ date })
        });
        
        if (response.ok) {
            closeModal('closeDayModal');
            loadPlanning();
            alert('✅ Jour fermé avec succès');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la fermeture du jour');
    }
}

async function confirmCloseSlot() {
    const date = document.getElementById('closeSlotDate').value;
    const time_slot = document.getElementById('closeSlotTime').value;
    
    if (!date) {
        alert('Veuillez sélectionner une date');
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${API_URL}?action=disponibilites/close-slot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ date, time_slot })
        });
        
        if (response.ok) {
            closeModal('closeSlotModal');
            loadPlanning();
            alert('✅ Créneau fermé avec succès');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la fermeture du créneau');
    }
}

async function reopenDay(id) {
    if (!confirm('Voulez-vous vraiment rouvrir ce jour/créneau ?')) {
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${API_URL}?action=disponibilites/delete&id=${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadPlanning();
            alert('✅ Rouvert avec succès');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la réouverture');
    }
}

// ==================== PARTICIPANTS ====================

async function loadParticipants() {
    const token = localStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${API_URL}?action=participants`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const participants = await response.json();
            displayParticipants(participants);
        }
    } catch (error) {
        console.error('Erreur chargement participants:', error);
    }
}

function displayParticipants(participants) {
    const grid = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        grid.innerHTML = '<p style="color: var(--gray); text-align: center; grid-column: 1/-1;">Aucun participant pour le moment</p>';
        return;
    }
    
    grid.innerHTML = participants.map(p => `
        <div class="participant-card" onclick="showParticipantDetails(${p.id})">
            <div class="participant-header">
                <div class="participant-avatar">
                    ${p.prenom.charAt(0)}${p.nom.charAt(0)}
                </div>
                <div>
                    <div class="participant-name">${p.prenom} ${p.nom}</div>
                    <div class="participant-email">${p.email}</div>
                </div>
            </div>
            <div class="participant-stats">
                <div class="stat-item">
                    <div class="stat-value">${p.total_reservations}</div>
                    <div class="stat-label">Réservations</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${p.derniere_reservation ? formatDate(p.derniere_reservation) : 'N/A'}</div>
                    <div class="stat-label">Dernière</div>
                </div>
            </div>
        </div>
    `).join('');
}

function searchParticipants(e) {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.participant-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

async function showParticipantDetails(id) {
    currentParticipantId = id;
    const token = localStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${API_URL}?action=participants/details&id=${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const participant = await response.json();
            displayParticipantModal(participant);
        }
    } catch (error) {
        console.error('Erreur chargement participant:', error);
    }
}

function displayParticipantModal(participant) {
    document.getElementById('modalParticipantName').textContent = 
        `${participant.prenom} ${participant.nom}`;
    
    // Informations
    document.getElementById('participantInfo').innerHTML = `
        <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${participant.email}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Téléphone</span>
            <span class="info-value">${participant.telephone || 'Non renseigné'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Membre depuis</span>
            <span class="info-value">${formatDate(participant.created_at)}</span>
        </div>
    `;
    
    // Réservations
    const reservationsHtml = participant.reservations.length > 0
        ? participant.reservations.map(r => `
            <div class="reservation-item">
                <div class="reservation-header">
                    <span class="reservation-service">${r.service}</span>
                    <span class="reservation-status status-${r.status}">${r.status}</span>
                </div>
                <div class="reservation-details">
                    📅 ${formatDate(r.date)} à ${r.time} • ${r.duration} • ${r.price}
                </div>
            </div>
        `).join('')
        : '<p style="color: var(--gray);">Aucune réservation</p>';
    
    document.getElementById('participantReservations').innerHTML = reservationsHtml;
    
    // Notes
    displayParticipantNotes(participant.notes);
    
    // Afficher le modal
    document.getElementById('participantModal').style.display = 'flex';
}

function displayParticipantNotes(notes) {
    const notesHtml = notes.length > 0
        ? notes.map(note => `
            <div class="note-item">
                <div class="note-header">
                    <span class="note-author">
                        Par ${note.prenom} ${note.nom} • ${formatDate(note.created_at)}
                    </span>
                    <div class="note-actions">
                        <button onclick="deleteNote(${note.id})" title="Supprimer">🗑️</button>
                    </div>
                </div>
                <div class="note-content">${note.note_html}</div>
            </div>
        `).join('')
        : '<p style="color: var(--gray);">Aucune note pour le moment</p>';
    
    document.getElementById('participantNotes').innerHTML = notesHtml;
}

function showAddNoteForm() {
    document.getElementById('addNoteForm').style.display = 'block';
    quillEditor.setText('');
}

function hideAddNoteForm() {
    document.getElementById('addNoteForm').style.display = 'none';
}

async function saveNote() {
    const noteHtml = quillEditor.root.innerHTML;
    
    if (quillEditor.getText().trim().length === 0) {
        alert('Veuillez écrire une note');
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${API_URL}?action=participants/notes/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                user_id: currentParticipantId,
                note_html: noteHtml 
            })
        });
        
        if (response.ok) {
            hideAddNoteForm();
            showParticipantDetails(currentParticipantId); // Recharger
            alert('✅ Note ajoutée avec succès');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de l\'ajout de la note');
    }
}

async function deleteNote(noteId) {
    if (!confirm('Voulez-vous vraiment supprimer cette note ?')) {
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    
    try {
        const response = await fetch(`${API_URL}?action=notes/delete&id=${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showParticipantDetails(currentParticipantId); // Recharger
            alert('✅ Note supprimée');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la suppression');
    }
}

function closeParticipantModal() {
    document.getElementById('participantModal').style.display = 'none';
    currentParticipantId = null;
}

// ==================== UTILS ====================

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}