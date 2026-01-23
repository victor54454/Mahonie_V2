// CORRECTIONS POUR admin.js - Affichage données complètes

// ==================== CORRECTION AFFICHAGE RÉSERVATIONS ====================

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
                    <span class="detail-value">
                        ${reservation.date_formatted || formatDate(reservation.date)} à ${reservation.time_formatted || reservation.time}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏱️ Durée :</span>
                    <span class="detail-value">${reservation.duration || 'Non spécifiée'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">💰 Prix :</span>
                    <span class="detail-value">${reservation.price || 'Non spécifié'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📝 Créée le :</span>
                    <span class="detail-value">
                        ${reservation.created_at_formatted || formatDateTime(reservation.created_at_local || reservation.created_at)}
                    </span>
                </div>
                ${reservation.message ? `
                <div class="detail-row">
                    <span class="detail-label">💬 Message :</span>
                    <span class="detail-value" style="font-style: italic;">"${reservation.message}"</span>
                </div>
                ` : ''}
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

// ==================== CORRECTION AFFICHAGE PARTICIPANTS ====================

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
            <div class="participant-avatar">
                ${participant.prenom ? participant.prenom.charAt(0).toUpperCase() : 'U'}${participant.nom ? participant.nom.charAt(0).toUpperCase() : ''}
            </div>
            <div class="participant-info">
                <h3>${participant.prenom || 'Prénom'} ${participant.nom || 'Nom'}</h3>
                <div class="participant-contact">
                    <span>📧 ${participant.email}</span>
                    ${participant.telephone ? `<span>📱 ${participant.telephone}</span>` : ''}
                </div>
                <div class="participant-stats">
                    <span class="stat-item">📋 ${participant.total_reservations || 0} réservation${(participant.total_reservations || 0) > 1 ? 's' : ''}</span>
                    ${participant.derniere_reservation ? `
                        <span class="stat-item">📅 Dernière : ${participant.derniere_reservation_formatted || formatDateShort(participant.derniere_reservation)}</span>
                    ` : ''}
                </div>
                <div class="participant-meta">
                    <span class="join-date">Membre depuis ${participant.created_at_formatted || formatDateShort(participant.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== CORRECTION DÉTAILS PARTICIPANTS ====================

async function viewParticipantDetails(id) {
    try {
        const response = await fetchWithAuth(`${API_URL}?action=participants/details&id=${id}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const participant = await response.json();
        
        // S'assurer qu'on a une modal pour les participants
        let modal = document.getElementById('participantModal');
        if (!modal) {
            // Créer la modal si elle n'existe pas
            modal = createParticipantModal();
            document.body.appendChild(modal);
        }
        
        // Créer le contenu de la modal avec TOUTES les données
        const modalContent = `
            <div class="participant-details">
                <div class="detail-card">
                    <h3>👤 Informations personnelles</h3>
                    <div class="info-row">
                        <span class="info-label">Nom complet :</span>
                        <span class="info-value">${participant.prenom || 'N/A'} ${participant.nom || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email :</span>
                        <span class="info-value"><a href="mailto:${participant.email}">${participant.email}</a></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Téléphone :</span>
                        <span class="info-value">
                            ${participant.telephone ? `<a href="tel:${participant.telephone}">${participant.telephone}</a>` : 'Non renseigné'}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Membre depuis :</span>
                        <span class="info-value">${participant.created_at_formatted || formatDate(participant.created_at)}</span>
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3>📋 Historique des réservations (${participant.reservations.length})</h3>
                    ${participant.reservations.length > 0 ? 
                        participant.reservations.map(res => `
                            <div class="reservation-item" style="margin-bottom: 15px; padding: 15px; background: var(--dark-tertiary); border-radius: 8px;">
                                <div class="reservation-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <strong style="color: var(--primary);">${res.service}</strong>
                                    <span class="status-badge status-${res.status}">${getStatusText(res.status)}</span>
                                </div>
                                <div class="reservation-details" style="font-size: 14px; color: var(--gray);">
                                    📅 ${res.date_formatted || formatDate(res.date)} à ${res.time_formatted || res.time}<br>
                                    ⏱️ Durée: ${res.duration || 'Non spécifiée'} - 💰 Prix: ${res.price || 'Non spécifié'}<br>
                                    📝 Créée le: ${res.created_at_formatted || formatDateTime(res.created_at)}
                                    ${res.message ? `<br>💬 "${res.message}"` : ''}
                                </div>
                            </div>
                        `).join('') :
                        '<p style="color: var(--gray);">Aucune réservation</p>'
                    }
                </div>
                
                <div class="detail-card">
                    <h3>📝 Notes et observations (${participant.notes.length})</h3>
                    ${participant.notes.length > 0 ?
                        participant.notes.map(note => `
                            <div class="note-item" style="margin-bottom: 15px; padding: 15px; background: var(--dark); border-radius: 8px;">
                                <div class="note-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span class="note-author" style="font-size: 12px; color: var(--gray);">
                                        Par ${note.prenom} ${note.nom} - ${note.created_at_formatted || formatDateTime(note.created_at_local || note.created_at)}
                                    </span>
                                    <div class="note-actions">
                                        <button onclick="deleteNote(${note.id})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;">🗑️</button>
                                    </div>
                                </div>
                                <div class="note-content" style="color: var(--white); line-height: 1.6;">${note.note_html}</div>
                            </div>
                        `).join('') :
                        '<p style="color: var(--gray);">Aucune note pour le moment</p>'
                    }
                    
                    <div class="add-note-section" style="margin-top: 20px;">
                        <h4>Ajouter une note :</h4>
                        <div id="noteEditor" style="height: 200px; border: 1px solid #ccc; border-radius: 8px; background: white;"></div>
                        <button class="btn btn-primary" onclick="saveNote(${participant.id})" style="margin-top: 10px;">💾 Enregistrer la note</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remplir la modal
        const modalContentDiv = modal.querySelector('#participantModalContent');
        if (modalContentDiv) {
            modalContentDiv.innerHTML = modalContent;
        }
        
        // Initialiser l'éditeur Quill pour les notes
        setTimeout(() => {
            if (typeof Quill !== 'undefined') {
                const editorElement = document.getElementById('noteEditor');
                if (editorElement) {
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
            }
        }, 100);
        
        // Ouvrir la modal
        openModal('participantModal');
        
    } catch (error) {
        console.error('Erreur détails participant:', error);
        alert(`❌ Erreur lors du chargement des détails: ${error.message}`);
    }
}

// Créer la modal participant si elle n'existe pas
function createParticipantModal() {
    const modal = document.createElement('div');
    modal.id = 'participantModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>Détails du participant</h2>
                <button class="modal-close" onclick="closeModal('participantModal')">✕</button>
            </div>
            <div class="modal-body" id="participantModalContent">
                <!-- Contenu chargé dynamiquement -->
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('participantModal')">Fermer</button>
            </div>
        </div>
    `;
    return modal;
}

// ==================== FONCTIONS UTILITAIRES AMÉLIORÉES ====================

function formatDate(dateStr) {
    if (!dateStr) return 'Date inconnue';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { 
            weekday: 'long',
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
    } catch (e) {
        return dateStr;
    }
}

function formatDateShort(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR');
    } catch (e) {
        return dateStr;
    }
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'Date inconnue';
    try {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

function getStatusText(status) {
    const statusMap = {
        'confirmee': '✅ Confirmée',
        'en_attente': '⏳ En attente',
        'annulee': '❌ Annulée'
    };
    return statusMap[status] || status;
}

console.log('🔧 Corrections d\'affichage admin chargées');