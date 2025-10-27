// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Timeline inicializando...');
    initializeTimeline();
    loadSavedTheme();
});

// Función principal de inicialización
function initializeTimeline() {
    // Animar entrada de las cajas
    animateContentBoxes();
    
    // Configurar efectos hover
    setupHoverEffects();
    
    console.log('Timeline inicializado correctamente');
}

// Animar cajas cuando entran en viewport
// Animar cajas cuando entran en viewport
function animateContentBoxes() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '-10% 0px -10% 0px'
    };
    
    const yearObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const yearMarker = entry.target;
                console.log('Año visible:', yearMarker);
                
                // Mostrar el año con la transformación correcta
                yearMarker.style.opacity = '1';
                yearMarker.style.transform = 'translateX(-50%) translateY(0)';
                yearMarker.classList.add('visible');
                
                // Animar la caja de contenido asociada
                const section = yearMarker.closest('.timeline-section');
                const contentBox = section?.querySelector('.content-box');
                
                if (contentBox) {
                    setTimeout(() => {
                        contentBox.style.opacity = '1';
                        contentBox.style.transform = 'translateY(0)';
                        contentBox.classList.add('visible');
                        contentBox.classList.add('animate-in');
                        contentBox.style.pointerEvents = 'auto';
                    }, 400);
                }
                
                // Dejar de observar este marcador
                yearObserver.unobserve(yearMarker);
            }
        });
    }, observerOptions);
    
    // Observador separado para cajas de contenido
    const contentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.closest('.timeline-section')?.querySelector('.year-marker')) {
                console.log('Contenido sin año visible:', entry.target);
                entry.target.classList.add('visible');
                entry.target.classList.add('animate-in');
                contentObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Mostrar la intro inmediatamente
    const introBox = document.querySelector('.intro-section .content-box');
    if (introBox) {
        introBox.style.opacity = '1';
        introBox.style.transform = 'translateY(0)';
        introBox.classList.add('visible');
        introBox.classList.add('animate-in');
        introBox.style.pointerEvents = 'auto';
        console.log('Intro mostrada');
    }
    
    // Observar todos los marcadores de año
    const yearMarkers = document.querySelectorAll('.year-marker');
    console.log(`Marcadores de año encontrados: ${yearMarkers.length}`);
    yearMarkers.forEach(marker => {
        yearObserver.observe(marker);
        console.log('Marcador en observación:', marker.querySelector('.year-label')?.textContent);
    });
    
    // Observar las cajas de contenido sin marcador de año
    const contentBoxes = document.querySelectorAll('.content-box:not(.intro-section .content-box)');
    contentBoxes.forEach(box => {
        if (!box.closest('.timeline-section')?.querySelector('.year-marker')) {
            contentObserver.observe(box);
        }
    });
}

// Configurar efectos hover
function setupHoverEffects() {
    // Tech tags con efecto de colección
    const techTags = document.querySelectorAll('.tech-tag');
    console.log(`Tech tags encontrados: ${techTags.length}`);
    
    techTags.forEach(tag => {
        tag.style.cursor = 'pointer';
        
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.toggle('collected');
            console.log(`Tech tag clickeado: ${this.textContent}`);
            
            // Animación de confirmación
            const originalTransform = this.style.transform;
            this.style.transform = 'scale(1.15) translateY(-2px)';
            
            setTimeout(() => {
                this.style.transform = originalTransform;
            }, 200);
        });
    });
    
    // Achievements con efecto de expansión
    const achievements = document.querySelectorAll('.achievement-list li');
    console.log(`Achievements encontrados: ${achievements.length}`);
    
    achievements.forEach(achievement => {
        achievement.addEventListener('mouseenter', function() {
            this.style.paddingLeft = '1.5rem';
        });
        
        achievement.addEventListener('mouseleave', function() {
            this.style.paddingLeft = '1rem';
        });
    });
}

// Toggle de tema
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    console.log(`Tema cambiado a: ${newTheme}`);
}

// Cargar tema guardado
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    console.log(`Tema cargado: ${savedTheme}`);
}

// Prevenir transiciones durante resize
let resizeTimer;
window.addEventListener('resize', () => {
    document.body.classList.add('resize-animation-stopper');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        document.body.classList.remove('resize-animation-stopper');
    }, 400);
});

// Debug helper
window.debugTimeline = function() {
    console.log('=== DEBUG TIMELINE ===');
    console.log('Content boxes:', document.querySelectorAll('.content-box').length);
    console.log('Visible boxes:', document.querySelectorAll('.content-box.visible').length);
    console.log('Year markers:', document.querySelectorAll('.year-marker').length);
    console.log('Visible markers:', document.querySelectorAll('.year-marker.visible').length);
};