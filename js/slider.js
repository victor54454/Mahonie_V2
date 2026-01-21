// Slider automatique pour les photos VTT - Version Ultra Robuste
console.log('🚵 Chargement du slider Planckeel Bike...');

class PhotoSlider {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.slideInterval = null;
        this.slideDuration = 2000; // 2 secondes par image (plus lent pour debug)
        this.initialized = false;
        
        console.log('📸 Constructeur PhotoSlider appelé');
        this.findImages();
        this.init();
    }
    
    findImages() {
        // Essayer plusieurs sélecteurs
        const selectors = [
            '.slider-image',
            '.photo-slider img', 
            '.slider-container img'
        ];
        
        for (let selector of selectors) {
            this.images = document.querySelectorAll(selector);
            console.log(`🔍 Tentative avec "${selector}": ${this.images.length} images trouvées`);
            if (this.images.length > 0) break;
        }
        
        // Log de chaque image trouvée
        this.images.forEach((img, i) => {
            console.log(`📷 Image ${i}: ${img.src} (${img.complete ? 'chargée' : 'en cours'})`);
        });
    }
    
    init() {
        if (this.images.length === 0) {
            console.error('❌ ERREUR: Aucune image trouvée pour le slider!');
            console.log('🔧 Vérifiez que vos images sont bien dans le HTML avec la classe .slider-image');
            return;
        }
        
        console.log(`✅ Initialisation avec ${this.images.length} images`);
        
        // Reset de toutes les images
        this.images.forEach((img, i) => {
            img.classList.remove('active');
            img.style.opacity = '0';
            img.style.zIndex = '1';
        });
        
        // Première image visible
        if (this.images[0]) {
            this.images[0].classList.add('active');
            this.images[0].style.opacity = '1';
            this.images[0].style.zIndex = '2';
            console.log('👍 Première image activée');
        }
        
        this.initialized = true;
        this.startSlider();
        this.setupEvents();
    }
    
    startSlider() {
        if (!this.initialized) {
            console.warn('⚠️ Slider non initialisé, abandon');
            return;
        }
        
        console.log('🚀 Démarrage du slider automatique');
        
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, this.slideDuration);
        
        // Test immédiat après 3 secondes
        setTimeout(() => {
            console.log('🧪 Test automatique du slider...');
            this.nextSlide();
        }, 3000);
    }
    
    nextSlide() {
        if (!this.initialized || this.images.length <= 1) {
            console.log('🛑 nextSlide abandonné (pas initialisé ou une seule image)');
            return;
        }
        
        // Image actuelle
        const currentImg = this.images[this.currentIndex];
        
        // Calculer la prochaine image
        const oldIndex = this.currentIndex;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        const nextImg = this.images[this.currentIndex];
        
        // Changer les images
        if (currentImg) {
            currentImg.classList.remove('active');
            currentImg.style.opacity = '0';
            currentImg.style.zIndex = '1';
        }
        
        if (nextImg) {
            nextImg.classList.add('active');
            nextImg.style.opacity = '1';
            nextImg.style.zIndex = '2';
        }
        
        console.log(`🔄 Slide: ${oldIndex} → ${this.currentIndex} (${nextImg ? nextImg.src.split('/').pop() : 'undefined'})`);
    }
    
    setupEvents() {
        const sliderContainer = document.querySelector('.photo-slider');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', () => {
                this.pauseSlider();
                console.log('⏸️ Slider pausé (survol)');
            });
            
            sliderContainer.addEventListener('mouseleave', () => {
                this.resumeSlider();
                console.log('▶️ Slider repris');
            });
            
            console.log('🖱️ Events de survol configurés');
        } else {
            console.warn('⚠️ Container .photo-slider introuvable pour les events');
        }
    }
    
    pauseSlider() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
    
    resumeSlider() {
        if (!this.slideInterval && this.initialized) {
            this.slideInterval = setInterval(() => {
                this.nextSlide();
            }, this.slideDuration);
        }
    }
    
    // Debug info
    getInfo() {
        return {
            initialized: this.initialized,
            imagesCount: this.images.length,
            currentIndex: this.currentIndex,
            isRunning: !!this.slideInterval
        };
    }
}

// Fonction d'initialisation robuste
function initSlider() {
    console.log('🔧 Tentative d\'initialisation du slider...');
    
    try {
        const slider = new PhotoSlider();
        window.photoSlider = slider;
        
        // Info de debug
        console.log('📊 Info slider:', slider.getInfo());
        
        // Test manuel disponible
        console.log('🎮 Test manuel disponible: window.photoSlider.nextSlide()');
        
        return slider;
    } catch (error) {
        console.error('💥 Erreur lors de l\'initialisation:', error);
        return null;
    }
}

// Plusieurs tentatives d'initialisation
let initAttempts = 0;
const maxAttempts = 5;

function tryInit() {
    initAttempts++;
    console.log(`🔄 Tentative d'init ${initAttempts}/${maxAttempts}`);
    
    const images = document.querySelectorAll('.slider-image');
    console.log(`🖼️ Images disponibles: ${images.length}`);
    
    if (images.length > 0) {
        initSlider();
    } else if (initAttempts < maxAttempts) {
        console.log('⏳ Retry dans 500ms...');
        setTimeout(tryInit, 500);
    } else {
        console.error('❌ Échec d\'initialisation après', maxAttempts, 'tentatives');
        console.log('🔍 Vérifiez votre HTML et la présence des images avec la classe .slider-image');
    }
}

// Démarrage
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
} else {
    tryInit();
}

// Backup au cas où
setTimeout(() => {
    if (!window.photoSlider) {
        console.log('🚨 Tentative de secours...');
        tryInit();
    }
}, 2000);