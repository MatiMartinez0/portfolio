    // Registrar ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Variables globales
    let avatar;
    let avatarSprite;
    let tooltip;
    let currentSection = null;
    let isHangingOnAchievement = false;

    const AVATAR_CONFIG = {
        size: { width: 120, height: 120 },
        offset: { x: 60, y: 60 },
        baseY: window.innerHeight * 0.3
    };

    // Estados del avatar simplificados
    const AvatarStates = {
        IDLE: 'pointing',
        WALKING: 'walking',
        JUMPING: 'jumping',
        HANGING: 'hanging',
        POINTING: 'pointing'
    };

    // Configuración de sprites
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

    // Función principal para cambiar el estado del avatar
    function changeAvatarState(state, direction = 'right') {
        if (!avatarSprite) return;
        
        const spriteKey = `${state}_${direction}`;
        const spriteUrl = spriteImages[spriteKey] || spriteImages.default;
        
        // Limpiar estados anteriores
        Object.values(AvatarStates).forEach(s => {
            avatarSprite.classList.remove(s);
        });
        
        avatarSprite.classList.add(state);
        avatarSprite.style.backgroundImage = `url(${spriteUrl})`;
    }

    // Inicializar ScrollTrigger
    function initializeGSAP() {
        const sections = gsap.utils.toArray('.timeline-section');
        
        sections.forEach((section, index) => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top center',
                end: 'bottom center',
                onEnter: () => handleSectionTransition(section, 'down'),
                onEnterBack: () => handleSectionTransition(section, 'up'),
                markers: false
            });
        });
    }

    // Manejar transiciones entre secciones
    function handleSectionTransition(section, direction) {
        if (!section || !avatar) return;
        
        currentSection = section;
        
        const contentBox = section.querySelector('.content-box');
        if (!contentBox) return;
        
        const rect = contentBox.getBoundingClientRect();
        const isLeftContent = contentBox.classList.contains('left-content');
        const isCenterContent = contentBox.classList.contains('center-content');
        
        // Calcular posición objetivo
        let targetX, targetY;
        
        if (isCenterContent) {
            // Para la intro, posicionar a la derecha
            targetX = rect.right + 100;
            targetY = rect.top + (rect.height / 2) - 60;
        } else if (isLeftContent) {
            // Contenido a la izquierda -> avatar a la derecha
            targetX = rect.right + 100;
            targetY = rect.top + (rect.height * 0.3);
        } else {
            // Contenido a la derecha -> avatar a la izquierda
            targetX = rect.left - 220;
            targetY = rect.top + (rect.height * 0.3);
        }
        
        const spriteDirection = isLeftContent ? 'right' : 'left';
        
        gsap.timeline()
            .to(avatar, {
                x: targetX,
                y: targetY,
                duration: 0.8,
                ease: "power2.inOut",
                onStart: () => {
                    changeAvatarState(AvatarStates.JUMPING, spriteDirection);
                    updateTooltip('¡Saltando!');
                },
                onComplete: () => {
                    changeAvatarState(AvatarStates.IDLE, spriteDirection);
                    updateTooltip(`Sección ${section.dataset.section}`);
                }
            });
    }

        // Configurar interacciones
        function setupInteractions() {
            // Tech tags
            document.querySelectorAll('.tech-tag').forEach(tag => {
                tag.addEventListener('click', () => handleTechClick(tag));
            });
            
            // Achievements
            document.querySelectorAll('.achievement-list li').forEach(achievement => {
                achievement.addEventListener('mouseenter', () => handleAchievementHover(achievement, true));
                achievement.addEventListener('mouseleave', () => handleAchievementHover(achievement, false));
            });
        }

    // Manejar click en tech tags
    function handleTechClick(tag) {
        if (!tag || !avatar) return;
        
        const rect = tag.getBoundingClientRect();
        const currentAvatar = avatar.getBoundingClientRect();
        
        // Determinar dirección según posición relativa
        const isLeft = currentAvatar.left > rect.left;
        
        // Guardar posición antes del click
        const beforeX = gsap.getProperty(avatar, "x");
        const beforeY = gsap.getProperty(avatar, "y");
        
        gsap.timeline()
            .to(avatar, {
                x: isLeft ? rect.left - 150 : rect.right + 30,
                y: rect.top + (rect.height / 2) - 60,
                duration: 0.6,
                ease: "power2.out",
                onStart: () => {
                    changeAvatarState(AvatarStates.WALKING, isLeft ? 'left' : 'right');
                    updateTooltip(`Explorando ${tag.textContent}`);
                },
                onComplete: () => changeAvatarState(AvatarStates.POINTING, isLeft ? 'left' : 'right')
            })
            .to(avatar, {
                x: beforeX,
                y: beforeY,
                duration: 0.6,
                delay: 1.5,
                ease: "power2.inOut",
                onStart: () => changeAvatarState(AvatarStates.WALKING, isLeft ? 'right' : 'left'),
                onComplete: () => {
                    changeAvatarState(AvatarStates.IDLE, isLeft ? 'right' : 'left');
                    if (currentSection) {
                        updateTooltip(`Sección ${currentSection.dataset.section}`);
                    }
                }
            });
        
        // Marcar como recolectado
        tag.classList.add('collected');
    }

    function handleAchievementHover(achievement, isEntering) {
        if (!achievement || !avatar) return;
        
        if (isEntering && !isHangingOnAchievement) {
            const rect = achievement.getBoundingClientRect();
            const currentAvatar = avatar.getBoundingClientRect();
            const isLeft = currentAvatar.left > rect.left;
            
            isHangingOnAchievement = true;
            
            gsap.to(avatar, {
                x: rect.right + 20,
                y: rect.top - 80,
                duration: 0.4,
                ease: "power2.out",
                onStart: () => {
                    changeAvatarState(AvatarStates.WALKING, 'right');
                    updateTooltip('¡Colgándome!');
                },
                onComplete: () => changeAvatarState(AvatarStates.HANGING, 'right')
            });
        } else if (!isEntering && isHangingOnAchievement) {
            isHangingOnAchievement = false;
            if (currentSection) {
                handleSectionTransition(currentSection, 'none');
            }
        }
    }

    // inicialización
    document.addEventListener('DOMContentLoaded', () => {
        // Inicializar elementos
        avatar = document.getElementById('gameAvatar');
        tooltip = document.getElementById('avatarTooltip');
        
        // Crear y configurar sprite
        avatarSprite = document.createElement('div');
        avatarSprite.classList.add('avatar-sprite');
        avatar.insertBefore(avatarSprite, tooltip);
        
        // Configuración inicial del avatar
        const introSection = document.querySelector('.intro-section');
        const introBox = introSection.querySelector('.content-box');
        const rect = introBox.getBoundingClientRect();
        
        // Posicionar avatar inicialmente
        gsap.set(avatar, {
            position: 'fixed',
            x: rect.right + 100,
            y: rect.top + (rect.height / 2) - 60,
            xPercent: 0,
            yPercent: 0
        });
        
        // Establecer estado inicial
        changeAvatarState(AvatarStates.IDLE, 'right');
        
        // Inicializar sistemas
        initializeGSAP();
        setupInteractions();
        
        // Activar primera sección después de un pequeño delay
        setTimeout(() => {
            const firstSection = document.querySelector('.intro-section');
            if (firstSection) {
                handleSectionTransition(firstSection, 'down');
            }
        }, 100);
    });

    // Función para actualizar tooltip
    function updateTooltip(text) {
        if (!tooltip) return;
        
        tooltip.textContent = text;
        tooltip.style.opacity = '1';
        
        // Ocultar después de 2 segundos
        setTimeout(() => {
            tooltip.style.opacity = '0';
        }, 2000);
    }