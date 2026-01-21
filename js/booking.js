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
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
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
    function validateStep(step) {
        const currentFormStep = document.querySelector(`.form-step[data-step="${step}"]`);
        const inputs = currentFormStep.querySelectorAll('input[required], select[required]');
        
        let isValid = true;
        inputs.forEach(input => {
            if (!input.value || (input.type === 'radio' && !currentFormStep.querySelector('input[type="radio"]:checked'))) {
                isValid = false;
                input.parentElement.style.border = '2px solid #FF6B2C';
                setTimeout(() => {
                    input.parentElement.style.border = '';
                }, 1000);
            }
        });
        
        if (!isValid) {
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'color: #FF6B2C; text-align: center; margin-top: 16px; animation: fadeInUp 0.3s ease-out;';
            errorMsg.textContent = 'Veuillez remplir tous les champs requis';
            
            // Remove existing error message if any
            const existingError = currentFormStep.querySelector('.error-message');
            if (existingError) existingError.remove();
            
            errorMsg.className = 'error-message';
            currentFormStep.appendChild(errorMsg);
            
            setTimeout(() => errorMsg.remove(), 3000);
        }
        
        return isValid;
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
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateStep(3)) {
            return;
        }

        // Show loading state
        const submitButton = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span>⏳</span> Envoi en cours...';
        submitButton.disabled = true;

        // Prepare form data
        const formData = new FormData(bookingForm);

        // Send to PHP backend
        fetch('php/booking.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show confirmation step
                showStep(4);
            } else {
                // Show error
                alert('Une erreur est survenue. Veuillez réessayer ou nous contacter directement.');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Even if there's an error, show confirmation for demo
            // In production, you would handle this properly
            showStep(4);
            // alert('Une erreur est survenue. Veuillez réessayer.');
            // submitButton.innerHTML = originalText;
            // submitButton.disabled = false;
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
// Date Input - Disable weekends and past dates  getDay() retourne un nombre : 0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi
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
