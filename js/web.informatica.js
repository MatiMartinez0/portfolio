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

    // sonfigurar ScrollTriggers para cada seccion
    const sections = document.querySelectorAll('.timeline-section[data-section]');
    
    sections.forEach((section, index) => {
        const sectionData = section.dataset.section;
        const yearMarker = section.querySelector('.year-marker');
        const contentBox = section.querySelector('.content-box');
        
        // scrollTrigger principal para cada seccion
        ScrollTrigger.create({
            trigger: section,
            start: "top 70%",
            end: "bottom 30%",
            onEnter: () => {
                console.log(`Entrando a sección: ${sectionData}`);
                handleSectionEnter(section, sectionData);
                updateAvatarPosition(section);
            },
            onLeave: () => {
                handleSectionLeave(section, sectionData);
            },
            onEnterBack: () => {
                console.log(`Volviendo a sección: ${sectionData}`);
                handleSectionEnter(section, sectionData);
                updateAvatarPosition(section);
            },
            onLeaveBack: () => {
                handleSectionLeave(section, sectionData);
            }
        });

        // Animacion de year markers con mejor posicionamiento
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
    setupWalkingOnScroll();
    setupWalkingOnScroll();
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

function setupWalkingOnScroll() {
    let lastScrollY = window.scrollY;
    let isScrolling = false;
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
        
        isScrolling = true;
        clearTimeout(scrollTimeout);
        
        // Solo mover avatar si estamos en una sección válida
        if (window.avatarWalkingData && currentSection) {
            const walkData = window.avatarWalkingData;
            const scrollDelta = Math.abs(currentScrollY - lastScrollY);
            
            // Calcular nueva posición horizontal basada en scroll
            let newLeft = walkData.currentLeft;
            
            if (scrollDirection === 'down') {
                // Scrolling hacia abajo - caminar según dirección de la sección
                if (walkData.direction === 'right') {
                    newLeft = Math.min(newLeft + (scrollDelta * 0.5), walkData.rightBound);
                    changeAvatarStateWithDirection(AvatarStates.WALKING, 'right');
                } else {
                    newLeft = Math.max(newLeft - (scrollDelta * 0.5), walkData.leftBound);
                    changeAvatarStateWithDirection(AvatarStates.WALKING, 'left');
                }
            } else {
                // Scrolling hacia arriba - caminar en dirección opuesta
                if (walkData.direction === 'right') {
                    newLeft = Math.max(newLeft - (scrollDelta * 0.5), walkData.leftBound);
                    changeAvatarStateWithDirection(AvatarStates.WALKING, 'left');
                } else {
                    newLeft = Math.min(newLeft + (scrollDelta * 0.5), walkData.rightBound);
                    changeAvatarStateWithDirection(AvatarStates.WALKING, 'right');
                }
            }
            
            // Actualizar posición
            walkData.currentLeft = newLeft;
            
            gsap.set(avatar, {
                left: newLeft + 'px',
                top: walkData.baseTop
            });
        }
        
        lastScrollY = currentScrollY;
        
        // Detener walking después de que pare el scroll
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            if (currentSection) {
                changeAvatarState(AvatarStates.IDLE, currentSection);
            }
        }, 150);
    });
}

function updateWalkingDirection() {
    if (!currentSection) return;
    
    // Forzar actualización del sprite según dirección de scroll
    const direction = scrollDirection === 'down' ? 'right' : 'left';
    const spriteKey = `walking_${direction}`;
    
    if (spriteImages[spriteKey]) {
        avatarSprite.style.backgroundImage = `url(${spriteImages[spriteKey]})`;
    }
}

function updateAvatarPosition(section) {
    if (!section) return;
    
    const contentBox = section.querySelector('.content-box');
    if (!contentBox) return;
    
    const boxRect = contentBox.getBoundingClientRect();
    const avatarHeight = 120; // Altura del avatar
    
    // Posicionar exactamente sobre el borde superior del content-box
    const targetTop = (boxRect.top - avatarHeight/2) + 'px';
    
    // Posición horizontal según el tipo de content-box
    let targetLeft;
    if (contentBox.classList.contains('left-content')) {
        // Para content-box izquierdo, avatar empieza del lado izquierdo
        targetLeft = (boxRect.left + 50) + 'px';
    } else if (contentBox.classList.contains('right-content')) {
        // Para content-box derecho, avatar empieza del lado derecho
        targetLeft = (boxRect.right - 50) + 'px';
    } else {
        // Center content
        targetLeft = (boxRect.left + boxRect.width/2) + 'px';
    }
    
    // Guardar posición de referencia para walking
    window.avatarWalkingData = {
        section: section,
        baseTop: targetTop,
        leftBound: boxRect.left + 30,
        rightBound: boxRect.right - 30,
        currentLeft: parseFloat(targetLeft),
        direction: contentBox.classList.contains('left-content') ? 'right' : 'left'
    };
    
    // Animar a la posición con jumping
    changeAvatarState(AvatarStates.JUMPING, section);
    
    gsap.to(avatar, {
        position: 'fixed',
        top: targetTop,
        left: targetLeft,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
            // Cambiar a walking cuando llegue
            changeAvatarState(AvatarStates.WALKING, section);
        }
    });
}

function changeAvatarStateWithDirection(newState, direction) {
    const spriteKey = `${newState}_${direction}`;
    
    gsap.to(avatarSprite, {
        scale: 0.9,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
            // Remover todas las clases de estado
            Object.values(AvatarStates).forEach(state => {
                avatarSprite.classList.remove(state);
            });
            
            avatarSprite.classList.add(newState);
            
            const spriteUrl = spriteImages[spriteKey] || spriteImages.default;
            avatarSprite.style.backgroundImage = `url(${spriteUrl})`;
            
            // Animación de entrada
            gsap.to(avatarSprite, {
                scale: 1,
                duration: 0.2,
                ease: "back.out(1.7)"
            });
        }
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
    
    // Hover en achievement items para hanging
    document.addEventListener('mouseenter', function(e) {
        if (e.target.closest('.achievement-list li')) {
            const achievementItem = e.target.closest('.achievement-list li');
            const itemRect = achievementItem.getBoundingClientRect();
            const avatarHeight = 120;
            
            // Posicionar avatar colgando del borde derecho del logro
            const targetTop = (itemRect.top - avatarHeight/2) + 'px';
            const targetLeft = (itemRect.right - 40) + 'px'; // Un poco dentro del borde derecho
            
            gsap.to(avatar, {
                top: targetTop,
                left: targetLeft,
                duration: 0.4,
                ease: "power2.out",
                onComplete: () => {
                    changeAvatarState(AvatarStates.HANGING, currentSection);
                    updateTooltip('¡Colgándome de este logro!');
                }
            });
        }
    }, true);

    document.addEventListener('mouseleave', function(e) {
        if (e.target.closest('.achievement-list li')) {
            // Volver a la posición de walking después de un delay
            setTimeout(() => {
                if (window.avatarWalkingData && currentSection) {
                    // Restaurar a la posición de walking
                    gsap.to(avatar, {
                        top: window.avatarWalkingData.baseTop,
                        left: window.avatarWalkingData.currentLeft + 'px',
                        duration: 0.5,
                        ease: "power2.out",
                        onComplete: () => {
                            changeAvatarState(AvatarStates.IDLE, currentSection);
                        }
                    });
                }
            }, 200);
        }
    }, true);

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

function returnToWalkingPosition() {
    if (window.avatarWalkingData && currentSection) {
        gsap.to(avatar, {
            top: window.avatarWalkingData.baseTop,
            left: window.avatarWalkingData.currentLeft + 'px',
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => {
                changeAvatarState(AvatarStates.IDLE, currentSection);
            }
        });
    }
}

function handleTechTagClick(tag) {
    const techName = tag.textContent;
    const tagRect = tag.getBoundingClientRect();
    const contentBox = tag.closest('.content-box');
    
    // Calcular posición más precisa
    let avatarTop, avatarLeft, direction;
    
    // Posición vertical: un poco arriba del tech tag
    avatarTop = (tagRect.top - 80) + 'px';
    
    // Determinar dirección y posición horizontal según ubicación del content-box
    if (contentBox.classList.contains('left-content')) {
        // Content-box a la izquierda, avatar mira hacia la derecha (hacia los tags)
        avatarLeft = (tagRect.left - 100) + 'px';
        direction = 'right';
    } else if (contentBox.classList.contains('right-content')) {
        // Content-box a la derecha, avatar mira hacia la izquierda (hacia los tags)
        avatarLeft = (tagRect.right + 50) + 'px';
        direction = 'left';
    } else {
        // Content centrado
        avatarLeft = (tagRect.left - 80) + 'px';
        direction = 'right';
    }
    
    // Animar avatar al tech tag
    gsap.to(avatar, {
        top: avatarTop,
        left: avatarLeft,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => {
            changeAvatarStateWithDirection(AvatarStates.IDLE, direction);
            updateTooltipWithBubble(techName, getTechDescription(techName));
        }
    });
    
    // Efecto visual del tag
    gsap.timeline()
        .to(tag, {
            scale: 1.15,
            duration: 0.2,
            ease: "power2.out"
        })
        .to(tag, {
            scale: 1,
            duration: 0.3,
            ease: "back.out(1.7)"
        });
}

function getTechDescription(techName) {
    const descriptions = {
        'pseint': 'Mi primer lenguaje de programación para aprender algoritmos',
        'html': 'La base de toda página web',
        'css': 'Para hacer que las páginas se vean increíbles',
        'javascript': 'El lenguaje que da vida a las páginas',
        'java': 'Mi introducción a la programación orientada a objetos',
        'wordpress': 'CMS que me abrió las puertas al mundo profesional',
        //agregar mas
    };
    return descriptions[techName] || `¡${techName} desbloqueado!`;
}

function updateTooltipWithBubble(title, description) {
    const bubbleContent = `
        <div class="bubble-title">${title}</div>
        <div class="bubble-text">${description}</div>
    `;
    
    gsap.to(tooltip, {
        opacity: 0,
        y: 5,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
            tooltip.innerHTML = bubbleContent;
            gsap.to(tooltip, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out"
            });
            
            // Auto-ocultar y retornar a posición después de 4 segundos
            gsap.to(tooltip, {
                opacity: 0,
                duration: 0.3,
                delay: 4,
                ease: "power2.in",
                onComplete: () => {
                    // Retornar a posición de walking
                    setTimeout(returnToWalkingPosition, 500);
                }
            });
        }
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