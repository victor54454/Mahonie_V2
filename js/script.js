// ========================================
// Navigation
// ========================================
const navbar = document.getElementById('navbar');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
if (burger && navLinks) {
    burger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        burger.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            burger.classList.remove('active');
        });
    });
}

// ========================================
// Smooth Scroll
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// Scroll Animations
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all service cards and about elements
document.querySelectorAll('.service-card, .about-grid > *, .feature-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// ========================================
// Service Cards Stagger Animation
// ========================================
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
});

// ========================================
// Get URL Parameters (for preselecting service)
// ========================================
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Preselect service if coming from a specific service link
const serviceParam = getUrlParameter('service');
if (serviceParam && document.getElementById('bookingForm')) {
    const serviceMapping = {
        'decouverte': 'Sortie VTT Découverte',
        'coaching': 'Coaching Technique',
        'physique': 'Préparation Physique',
        'mecanique': 'Mécanique Vélo',
        'enduro': 'Sortie VTT Enduro',
        'stage': 'Stage Weekend'
    };
    
    const serviceName = serviceMapping[serviceParam];
    if (serviceName) {
        const serviceInput = document.querySelector(`input[name="service"][value="${serviceName}"]`);
        if (serviceInput) {
            serviceInput.checked = true;
        }
    }
}

// ========================================
// Set minimum date for booking (today)
// ========================================
const bookingDateInput = document.getElementById('bookingDate');
if (bookingDateInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    
    bookingDateInput.min = `${year}-${month}-${day}`;
}

// ========================================
// Simple Console Message
// ========================================
console.log('%c🚵 Planckeel Bike', 'font-size: 24px; font-weight: bold; color: #FF6B2C;');
console.log('%cSite développé avec passion pour le VTT 🚴‍♂️', 'font-size: 14px; color: #7FD94B;');