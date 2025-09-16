// Registrar ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Variables globales
let avatar;
let avatarSprite;
let tooltip;
let currentSection = null;
let collectedTechs = new Set();

// Estados del avatar
const AvatarStates = {
    IDLE: 'pointing',
    WALKING: 'walking',
    JUMPING: 'jumping',
    HANGING: 'hanging'
};

// Configuración de sprites (rutas reales basadas en tu estructura)
const spriteImages = {
    pointing_right: '/portfolio/assets/avatar-pointing-right.png',
    pointing_left: '/portfolio/assets/avatar-pointing-left.png',
    walking_right: '/portfolio/assets/avatar-walking-right.png',
    walking_left: '/portfolio/assets/avatar-walking-left.png',
    jumping_right: '/portfolio/assets/avatar-jumping-right.png',
    jumping_left: '/portfolio/assets/avatar-jumping-left.png',
    hanging_right: '/portfolio/assets/avatar-hanging-right.png',
    hanging_left: '/portfolio/assets/avatar-hanging-left.png',
    default: '/portfolio/assets/avatar-walking-right.png'
};

// determinar dirección según sección
function getSpriteDirection(section) {
    if (!section) return 'right'; // Validación adicional
    
    const contentBox = section.querySelector('.content-box');
    if (!contentBox) return 'right';
    
    if (contentBox.classList.contains('left-content')) {
        return 'right';
    } else if (contentBox.classList.contains('right-content')) {
        return 'left';
    }
    return 'right';
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    avatar = document.getElementById('gameAvatar');
    avatarSprite = document.getElementById('avatarSprite');
    tooltip = document.getElementById('avatarTooltip');
    
    initializeGSAP();
    setupInteractions();
    loadSavedTheme();
    preloadSprites();
});

// Precargar todas las imágenes de sprites
function preloadSprites() {
    let loadedCount = 0;
    const totalSprites = Object.keys(spriteImages).length;
    
    Object.entries(spriteImages).forEach(([key, src]) => {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            if (loadedCount === totalSprites) {
                console.log('Todos los sprites cargados correctamente');
            }
        };
        img.onerror = () => {
            console.warn(`Error cargando sprite: ${key} - ${src}`);
            loadedCount++;
        };
        img.src = src;
    });
}

function initializeGSAP() {
    // Configurar avatar inicial
    if (spriteImages.default) {
        avatarSprite.style.backgroundImage = `url(${spriteImages.default})`;
    }
    changeAvatarState(AvatarStates.IDLE);
    
    // Mostrar avatar después de la intro
    // Avatar siempre visible para debug
// ScrollTrigger.create({
//     trigger: "#year-2021", 
//     start: "top 80%",
//     onEnter: () => {
//         console.log("Avatar debería aparecer");
//     }
// });

    // Configurar ScrollTriggers para cada sección
    const sections = document.querySelectorAll('.timeline-section[data-section]');
    
    sections.forEach((section, index) => {
        const sectionData = section.dataset.section;
        const yearMarker = section.querySelector('.year-marker');
        const contentBox = section.querySelector('.content-box');
        
        // ScrollTrigger principal para cada sección
        ScrollTrigger.create({
            trigger: section,
            start: "top 70%",
            end: "bottom 30%",
            onEnter: () => {
                console.log(`Entrando a sección: ${sectionData}`);
                handleSectionEnter(section, sectionData);
                updateAvatarPosition(section); // AGREGAR ESTA LÍNEA
            },
            onLeave: () => {
                handleSectionLeave(section, sectionData);
            },
            onEnterBack: () => {
                console.log(`Volviendo a sección: ${sectionData}`);
                handleSectionEnter(section, sectionData);
                updateAvatarPosition(section); // AGREGAR ESTA LÍNEA
            },
            onLeaveBack: () => {
                handleSectionLeave(section, sectionData);
            }
        });

        // Animar year markers con mejor posicionamiento
        if (yearMarker && sectionData !== 'intro') {
            gsap.set(yearMarker, { opacity: 0, scale: 0.5 });
            
            ScrollTrigger.create({
                trigger: section,
                start: "top 65%",
                end: "bottom 35%",
                onEnter: () => {
                    gsap.to(yearMarker, {
                        opacity: 1,
                        scale: 1,
                        duration: 0.6,
                        ease: "back.out(2)"
                    });
                },
                onLeave: () => {
                    gsap.to(yearMarker, { 
                        scale: 0.85, 
                        opacity: 0.7,
                        duration: 0.3 
                    });
                },
                onEnterBack: () => {
                    gsap.to(yearMarker, { 
                        scale: 1, 
                        opacity: 1,
                        duration: 0.3 
                    });
                }
            });
        }
    });
    setupScrollBasedMovement();
    setTimeout(() => {
        const firstSection = document.querySelector('.timeline-section[data-section="intro"]');
        if (firstSection) {
            updateAvatarPosition(firstSection);
        }
    }, 100);
}

function setupScrollBasedMovement() {
    ScrollTrigger.create({
        trigger: ".timeline-container",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
            const progress = self.progress;
            const sections = document.querySelectorAll('.timeline-section[data-section]');
            const totalSections = sections.length;
            
            // Determinar sección actual con mejor lógica
            const currentIndex = Math.min(
                Math.floor(progress * totalSections), 
                totalSections - 1
            );
            const targetSection = sections[currentIndex];
            
            // Solo actualizar si cambió de sección y después de un pequeño delay
            if (targetSection && targetSection !== window.lastActiveSection) {
                clearTimeout(window.avatarMoveTimeout);
                window.avatarMoveTimeout = setTimeout(() => {
                    window.lastActiveSection = targetSection;
                    updateAvatarPosition(targetSection);
                }, 100); // 100ms de delay para evitar actualizaciones excesivas
            }
        }
    });
}

function updateAvatarPosition(section) {
    if (!section) return;
    
    const sectionRect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const contentBox = section.querySelector('.content-box');
    
    // Calcular posición vertical más inteligente
    let newTop;
    if (sectionRect.top > windowHeight || sectionRect.bottom < 0) {
        // Si la sección no está visible, usar una posición estimada
        const minTop = windowHeight * 0.3;
        const maxTop = windowHeight * 0.6;
        newTop = minTop + Math.random() * (maxTop - minTop);
    } else {
        // Si está visible, usar el centro de la sección
        const sectionCenter = sectionRect.top + (sectionRect.height / 2);
        const minTop = windowHeight * 0.2;
        const maxTop = windowHeight * 0.7;
        newTop = Math.max(minTop, Math.min(maxTop, sectionCenter));
    }
    
    // Posición horizontal según el contenido
    let horizontalPosition = '50%';
    if (contentBox) {
        if (contentBox.classList.contains('left-content')) {
            horizontalPosition = '25%';
        } else if (contentBox.classList.contains('right-content')) {
            horizontalPosition = '75%';
        }
    }
    
    // Animar suavemente a la nueva posición
    gsap.to(avatar, {
        top: newTop + 'px',
        left: horizontalPosition,
        duration: 0.8,
        ease: "power2.out"
    });
}

function handleSectionEnter(section, sectionData) {
    currentSection = section;
    updateAvatarForSection(sectionData, section);
    
    // Pequeña animación de "llegada" a la sección
    gsap.to(avatar, {
        scale: 1.1,
        duration: 0.3,
        ease: "back.out(1.7)",
        onComplete: () => {
            gsap.to(avatar, {
                scale: 1,
                duration: 0.2
            });
        }
    });
    
    // Recolectar tecnologías con delay
    setTimeout(() => {
        collectTechnologies(section);
    }, 500);
}

function handleSectionLeave(section, sectionData) {
    if (currentSection === section) {
        // Transición suave al estado idle
        gsap.to(avatarSprite, {
            scale: 0.95,
            duration: 0.2,
            onComplete: () => {
                changeAvatarState(AvatarStates.IDLE, section); // Agregar section aquí también
                gsap.to(avatarSprite, { scale: 1, duration: 0.2 });
            }
        });
    }
}

function updateAvatarForSection(sectionData, section) {
    const tooltips = {
        'intro': '¡Comenzando la aventura!',
        '2021': '2021 - Mis primeros códigos ✨',
        '2022': '2022 - Descubriendo Java ☕',
        '2023': '2023 - Dominando WordPress 🎨',
        '2024': '2024 - Mi primer trabajo! 🚀',
        '2025': '2025 - El futuro me espera 🌟'
    };

    const tooltipText = tooltips[sectionData] || 'Explorando...';
    updateTooltip(tooltipText);

    // Animación de transición antes del cambio de estado
    gsap.to(avatarSprite, {
        scale: 0.8,
        rotation: 10,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
            // Estados específicos por sección
            switch(sectionData) {
                case 'intro':
                    changeAvatarState(AvatarStates.IDLE, section);
                    break;
                case '2021':
                    changeAvatarState(AvatarStates.JUMPING, section);
                    break;
                case '2022':
                    changeAvatarState(AvatarStates.WALKING, section);
                    break;
                case '2023':
                    changeAvatarState(AvatarStates.HANGING, section);
                    break;
                case '2024':
                    changeAvatarState(AvatarStates.JUMPING, section);
                    break;
                case '2025':
                    changeAvatarState(AvatarStates.IDLE, section);
                    break;
                default:
                    changeAvatarState(AvatarStates.IDLE, section);
            }
        }
    });
}

function changeAvatarState(newState, section = currentSection) {
    const direction = getSpriteDirection(section);
    const spriteKey = `${newState}_${direction}`;
    
    gsap.to(avatarSprite, {
        scale: 0.9,
        rotation: 5,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
            // Remover todas las clases de estado
            Object.values(AvatarStates).forEach(state => {
                avatarSprite.classList.remove(state);
            });
            
            avatarSprite.classList.add(newState);
            
            const spriteUrl = spriteImages[spriteKey] || spriteImages.default || '/portfolio/assets/avatar-walking-right.png';
            avatarSprite.style.backgroundImage = `url(${spriteUrl})`;
            
            // Animación de entrada más dramática
            gsap.timeline()
                .to(avatarSprite, {
                    scale: 1.1,
                    rotation: 0,
                    duration: 0.2,
                    ease: "back.out(1.7)"
                })
                .to(avatarSprite, {
                    scale: 1,
                    duration: 0.1
                });
        }
    });
}

function updateTooltip(text) {
    // Animación más fluida del tooltip
    gsap.to(tooltip, {
        opacity: 0,
        y: 5,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
            tooltip.textContent = text;
            gsap.to(tooltip, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out"
            });
            
            // Auto-ocultar después de 3 segundos
            gsap.to(tooltip, {
                opacity: 0,
                duration: 0.3,
                delay: 3,
                ease: "power2.in"
            });
        }
    });
}

function collectTechnologies(section) {
    const techTags = section.querySelectorAll('.tech-tag');
    
    techTags.forEach((tag, index) => {
        setTimeout(() => {
            const techName = tag.dataset.tech;
            if (!collectedTechs.has(techName)) {
                // Efecto de recolección más llamativo
                gsap.fromTo(tag, 
                    { scale: 1 },
                    { 
                        scale: 1.15, 
                        duration: 0.3,
                        yoyo: true,
                        repeat: 1,
                        ease: "power2.inOut",
                        onComplete: () => {
                            tag.classList.add('collected');
                            
                            // Pequeña celebración del avatar
                            gsap.to(avatar, {
                                y: -5,
                                duration: 0.2,
                                yoyo: true,
                                repeat: 1,
                                ease: "power2.inOut"
                            });
                        }
                    }
                );
                
                collectedTechs.add(techName);
            }
        }, index * 150); // Delay escalonado
    });
}

function setupInteractions() {
    // Click en avatar - interacción mejorada
    avatar.addEventListener('click', function() {
        updateTooltip('¡Hola! Soy tu guía en esta aventura 👋');
        
        // Animación de saludo
        gsap.timeline()
            .to(avatarSprite, {
                rotation: -10,
                duration: 0.2,
                ease: "power2.out"
            })
            .to(avatarSprite, {
                rotation: 10,
                duration: 0.3,
                ease: "power2.inOut"
            })
            .to(avatarSprite, {
                rotation: 0,
                duration: 0.2,
                ease: "power2.out"
            });
    });

    // Hover en avatar
    avatar.addEventListener('mouseenter', function() {
        gsap.to(avatar, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
        });
    });

    avatar.addEventListener('mouseleave', function() {
        gsap.to(avatar, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
    });

    // Click en tech tags con mejor feedback
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tech-tag')) {
            handleTechTagClick(e.target);
        }
    });

    // Animación idle ocasional
    setInterval(() => {
        if (currentSection && Math.random() < 0.3) { // 30% de chance cada 3 segundos
            idleAnimation();
        }
    }, 3000);
}

function handleTechTagClick(tag) {
    const techName = tag.textContent;
    
    // Avatar reacciona al tech tag
    changeAvatarState(AvatarStates.IDLE);
    updateTooltip(`¡${techName} desbloqueado! 🎉`);
    
    // Efecto visual mejorado
    gsap.timeline()
        .to(tag, {
            scale: 1.2,
            rotation: 5,
            duration: 0.2,
            ease: "power2.out"
        })
        .to(tag, {
            scale: 1,
            rotation: 0,
            duration: 0.3,
            ease: "back.out(1.7)"
        });
    
    // Avatar celebra
    gsap.to(avatar, {
        y: -8,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
    });
}

function idleAnimation() {
    // Animaciones idle aleatorias para dar "vida" al avatar
    const animations = [
        // Respiración sutil
        () => gsap.to(avatarSprite, {
            scale: 1.02,
            duration: 1,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut"
        }),
        // Movimiento lateral sutil
        () => gsap.to(avatar, {
            x: "+=5",
            duration: 0.5,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        }),
        // Pequeño salto
        () => gsap.to(avatar, {
            y: -3,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.out"
        })
    ];
    
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    randomAnimation();
}

// Toggle de tema con reacción del avatar
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    localStorage.setItem('theme', newTheme);
    
    // Avatar reacciona al cambio de tema
    gsap.timeline()
        .to(avatarSprite, {
            scale: 0.8,
            rotation: 180,
            duration: 0.4,
            ease: "power2.in"
        })
        .to(avatarSprite, {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            ease: "back.out(1.7)"
        });
    
    updateTooltip(newTheme === 'dark' ? '🌙 Modo nocturno' : '☀️ Modo diurno');
}

// Cargar tema guardado
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Función para debug y testing
window.debugAvatar = {
    setState: changeAvatarState,
    states: AvatarStates,
    updateSprites: (images) => Object.assign(spriteImages, images),
    currentSection: () => currentSection?.dataset?.section || 'none',
    triggerIdle: idleAnimation,
    collectTech: (section) => collectTechnologies(section || currentSection)
};

// Optimización de performance
window.addEventListener('beforeunload', function() {
    ScrollTrigger.killAll();
});