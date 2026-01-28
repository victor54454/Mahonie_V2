// ========================================
// Booking Form Multi-Step
// ========================================
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    let currentStep = 1;
    const totalSteps = 4;

    const formSteps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');

    // Show specific step
    function showStep(step) {
        formSteps.forEach((formStep, index) => {
            formStep.classList.remove('active');
            stepIndicators[index].classList.remove('active');
            
            if (index + 1 === step) {
                formStep.classList.add('active');
                stepIndicators[index].classList.add('active');
            }
        });
        
        currentStep = step;
        updateSummary();
        
        // Scroll to top of form
        document.querySelector('.booking-container').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Next button click
    nextButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (await validateStep(currentStep)) {
                if (currentStep < totalSteps) {
                    showStep(currentStep + 1);
                }
            }
        });
    });

    // Previous button click
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
    });

    // Validate current step
    async function validateStep(step) {
        const currentFormStep = document.querySelector(`.form-step[data-step="${step}"]`);
        const requiredInputs = currentFormStep.querySelectorAll('[required]');
        
        let isValid = true;
        
        requiredInputs.forEach(input => {
            if (!input.value || (input.type === 'radio' && !document.querySelector(`input[name="${input.name}"]:checked`))) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
        
        if (!isValid) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return false;
        }

        // Vérifier la disponibilité pour l'étape 2 (date et heure)
        if (step === 2) {
            const date = document.getElementById('bookingDate').value;
            const time = document.querySelector('input[name="time"]:checked')?.value;
            
            if (date && time) {
                const available = await checkAvailability(date, time);
                if (!available) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // Vérifier la disponibilité via l'API
    async function checkAvailability(date, time) {
        try {
            const response = await fetch(`php/admin_api.php?action=check-availability&date=${date}&time=${time}`);
            const data = await response.json();
            
            if (!data.available) {
                alert(`❌ Ce créneau n'est pas disponible : ${data.reason || 'Fermé'}`);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Erreur vérification disponibilité:', error);
            // En cas d'erreur, on laisse passer (pas optimal mais évite de bloquer)
            return true;
        }
    }

    // Update summary
    function updateSummary() {
        const selectedService = document.querySelector('input[name="service"]:checked');
        const selectedDate = document.getElementById('bookingDate').value;
        const selectedTime = document.querySelector('input[name="time"]:checked');

        if (selectedService) {
            document.getElementById('summaryService').textContent = selectedService.value;
            document.getElementById('summaryDuration').textContent = selectedService.dataset.duration;
            document.getElementById('summaryPrice').textContent = selectedService.dataset.price + '€';
        }

        if (selectedDate) {
            const date = new Date(selectedDate);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('summaryDate').textContent = date.toLocaleDateString('fr-FR', options);
        }

        if (selectedTime) {
            document.getElementById('summaryTime').textContent = selectedTime.value;
        }
    }

    // Form submission
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('🎯 Formulaire soumis, validation étape 3...');
        
        if (!await validateStep(3)) {
            console.log('❌ Validation étape 3 échouée');
            return;
        }

        console.log('✅ Validation étape 3 réussie');

        // Vérifier une dernière fois la disponibilité
        const date = document.getElementById('bookingDate').value;
        const time = document.querySelector('input[name="time"]:checked')?.value;
        
        console.log('🔍 Vérification disponibilité finale...');
        const available = await checkAvailability(date, time);
        if (!available) {
            console.log('❌ Créneau non disponible');
            return;
        }

        console.log('✅ Créneau disponible');

        // Show loading state
        const submitButton = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span>⏳</span> Envoi en cours...';
        submitButton.disabled = true;

        // Prepare form data
        const formData = new FormData(bookingForm);

        // DEBUG: Afficher toutes les données du formulaire
        console.log('📋 DONNÉES DU FORMULAIRE :');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }

        // Send to PHP backend
        console.log('🚀 Envoi vers php/booking.php...');
        fetch('php/booking.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('📡 Réponse reçue:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Réponse serveur:', data);
            
            if (data.success) {
                console.log('🎉 Réservation réussie !');
                showStep(4);
            } else {
                console.log('❌ Réservation échouée:', data.message);
                alert('❌ Erreur : ' + (data.message || 'Une erreur est survenue'));
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('❌ ERREUR FETCH:', error);
            alert('❌ Impossible d\'envoyer la réservation. Vérifiez votre connexion et réessayez.');
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        });
    });

    // Update summary when inputs change
    document.querySelectorAll('input[name="service"]').forEach(input => {
        input.addEventListener('change', updateSummary);
    });

    document.getElementById('bookingDate').addEventListener('change', updateSummary);

    document.querySelectorAll('input[name="time"]').forEach(input => {
        input.addEventListener('change', updateSummary);
    });
}

// ========================================
// Service Selection Highlighting
// ========================================
document.querySelectorAll('.service-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove active class from all
        document.querySelectorAll('.service-option-card').forEach(card => {
            card.style.transform = '';
        });
        
        // Add active class to selected
        const card = this.querySelector('.service-option-card');
        card.style.transform = 'scale(1.02)';
    });
});

// ========================================
// Date Input - Disable weekends and past dates
// ========================================
const dateInput = document.getElementById('bookingDate');
if (dateInput) {
    dateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        const dayOfWeek = selectedDate.getDay();
        
        // 0=Dimanche 3=Mercredi 6=Samedi
        if (dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 6) {
            alert('Les réservations sont disponibles du lundi, mardi, jeudi et vendredi uniquement.');
            this.value = '';
        }
    });
}

// ========================================
// Smooth transitions between steps
// ========================================
const style = document.createElement('style');
style.textContent = `
    .form-step {
        opacity: 0;
        transition: opacity 0.3s ease-out;
    }
    
    .form-step.active {
        opacity: 1;
    }
`;
document.head.appendChild(style);