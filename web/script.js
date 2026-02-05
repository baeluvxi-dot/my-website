document.addEventListener('DOMContentLoaded', () => {
    // Сброс прогресса при каждом новом открытии сайта
    localStorage.removeItem('love_progress');
    let videoPlayer = document.getElementById('videoPlayer');
    const continueBtn = document.getElementById('continueBtn');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const submitQuizBtn = document.getElementById('submitQuizBtn');
    const finalMessageElement = document.getElementById('finalMessage');
    const restartBtn = document.getElementById('restartBtn');
    const heroRotatingTextElement = document.getElementById('heroRotatingText');
    const heroLink = document.getElementById('heroLink');
    let stateVideo = document.getElementById('stateVideo');
    let requirementsVideo = document.getElementById('requirementsVideo');
    let perceptionsVideo = document.getElementById('perceptionsVideo');
    let heroLinkVideo = document.getElementById('heroLinkVideo');

    let currentStep = 0; // Главная страница по умолчанию
    let currentQuestionIndex = 0;
    let selectedOption = null;
    
    // ============================================
    // СИСТЕМА ПРОГРЕССА И БЛОКИРОВКИ ГЛАВ
    // ============================================
    const PROGRESS_KEY = 'love_progress';
    const progressToast = document.getElementById('progressToast');
    
    // Правила разблокировки шагов
    const unlockRules = {
        0: [], // step0 (меню) - всегда доступен
        1: [], // step1 - доступен по умолчанию
        2: [1], // step2 (квиз) - после step1
        3: [2], // step3 - после step2
        4: [], // step4 - всегда доступен
        5: [4], // step5 (письмо) - после step4
        6: ['quiz_complete'], // step6 - после прохождения квиза (все ответы правильные)
        7: [6], // step7 - после step6
        8: [7], // step8 - после step7
        9: [7], // step9 - после step7
        10: [] // step10 - доступен всегда (hero link)
    };
    
    // Инициализация прогресса
    function initProgress() {
        let progress = localStorage.getItem(PROGRESS_KEY);
        if (!progress) {
            progress = {
                visitedSteps: [0], // step0 посещен по умолчанию
                unlocked: { 0: true, 1: true, 4: true, 10: true }, // step4 тоже доступен сразу
                quizCompleted: false
            };
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        } else {
            progress = JSON.parse(progress);
        }
        return progress;
    }
    
    // Сохранение прогресса
    function saveProgress(stepNumber) {
        let progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{"visitedSteps":[],"unlocked":{},"quizCompleted":false}');
        
        // Добавляем шаг в посещенные
        if (!progress.visitedSteps.includes(stepNumber)) {
            progress.visitedSteps.push(stepNumber);
        }
        
        // Разблокируем следующий шаг согласно правилам
        const nextStep = stepNumber + 1;
        if (unlockRules[nextStep]) {
            const canUnlock = unlockRules[nextStep].every(requirement => {
                if (requirement === 'quiz_complete') {
                    return progress.quizCompleted;
                }
                return progress.visitedSteps.includes(requirement);
            });
            
            if (canUnlock) {
                progress.unlocked[nextStep] = true;
            }
        }
        
        // Разблокируем все шаги, которые зависят от текущего или уже выполненных требований
        Object.keys(unlockRules).forEach(step => {
            const stepNum = parseInt(step);
            const requirements = unlockRules[step];
            
            // Пропускаем шаги без требований или уже разблокированные
            if (requirements.length === 0 || progress.unlocked[stepNum]) {
                return;
            }
            
            // Проверяем, все ли требования выполнены
            const canUnlock = requirements.every(requirement => {
                if (requirement === 'quiz_complete') {
                    return progress.quizCompleted;
                }
                return progress.visitedSteps.includes(requirement);
            });
            
            if (canUnlock) {
                progress.unlocked[stepNum] = true;
            }
        });
        
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        updateMenuLockStates();
    }
    
    // Проверка, разблокирован ли шаг
    function isStepUnlocked(stepNumber) {
        const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{"visitedSteps":[],"unlocked":{},"quizCompleted":false}');
        return progress.unlocked[stepNumber] === true;
    }
    
    // Обновление визуального состояния блокировки в меню
    function updateMenuLockStates() {
        const cards = document.querySelectorAll('.chapter-card');
        cards.forEach(card => {
            const stepNumber = parseInt(card.getAttribute('data-step'));
            const wasLocked = card.classList.contains('locked');
            
            if (isStepUnlocked(stepNumber)) {
                card.classList.remove('locked');
                // Если глава только что разблокировалась, показываем анимацию
                if (wasLocked && stepNumber !== 1 && stepNumber !== 0) {
                    card.classList.add('unlocked');
                    createHeartsAnimation(card);
                    setTimeout(() => card.classList.remove('unlocked'), 600);
                }
            } else {
                card.classList.add('locked');
                card.classList.remove('unlocked');
            }
        });
    }
    
    // Создание анимации сердечек при открытии новой главы (полноэкранная, нежная)
    function createHeartsAnimation(element) {
        const heartsContainer = document.getElementById('heartsAnimation');
        if (!heartsContainer) return;

        // Количество сердечек — невысокая плотность для «волшебного» эффекта
        const count = 70;
        const hearts = ['💛', '💖', '💕', '💗', '💝'];

        for (let i = 0; i < count; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];

            // Случайный старт слева/справа/ниже экрана
            const startX = Math.random() * 110 - 5; // -5% .. 105%
            const startY = 80 + Math.random() * 25; // 80% .. 105% (ниже видимой части)
            heart.style.left = startX + 'vw';
            heart.style.top = startY + 'vh';

            // Случайный горизонтальный смещение до конца анимации
            const dx = Math.floor((Math.random() * 240) - 120); // px
            heart.style.setProperty('--dx', dx + 'px');

            // Случайные размеры и длительность
            const size = 16 + Math.floor(Math.random() * 28); // 16..44px
            heart.style.fontSize = size + 'px';
            heart.style.opacity = (0.7 + Math.random() * 0.3).toString();

            const duration = 4 + Math.random() * 4; // 4..8s
            heart.style.animationDuration = duration + 's';
            heart.style.animationDelay = (Math.random() * 0.3) + 's';

            // Добавляем в контейнер и удаляем после окончания анимации
            heartsContainer.appendChild(heart);
            heart.addEventListener('animationend', () => heart.remove());
        }
    }
    
    // Показ toast сообщения
    function showToast(message) {
        if (!progressToast) return;
        progressToast.textContent = message;
        progressToast.classList.add('show');
        setTimeout(() => {
            progressToast.classList.remove('show');
        }, 3000);
    }
    
    // Отметка квиза как пройденного
    function markQuizComplete() {
        let progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{"visitedSteps":[],"unlocked":{},"quizCompleted":false}');
        progress.quizCompleted = true;
        
        // Разблокируем step6 если квиз пройден
        if (progress.visitedSteps.includes(2)) {
            progress.unlocked[6] = true;
        }
        
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        updateMenuLockStates();
    }
    
    // Инициализация прогресса при загрузке
    let progress = initProgress();
    
    // ============================================
    // МАССИВ СЛОВ ДЛЯ HERO-ЭКРАНА
    // Измените слова здесь на свои
    // ============================================
    const rotatingWords = [
        'Любовь',
        'Мы',
        'Алёнка',
        'Алимочка',
        'Будущее',
        'Счастье',
        'Вместе',
        'Тепло',
        'Радость',
        'Поддержка',
        'Понимание',
        'Забота',
        'Верность',
        'Доверие',
        'Нежность',
        'Смех',
        'Мечты',
        'Сердце',
        'Объятия',
        'Поцелуи',
        'Судьба'

    ];
    
    let currentWordIndex = 0;
    let rotatingInterval = null;
    
    // ============================================
    // ИНТЕРВАЛ СМЕНЫ СЛОВ (в миллисекундах)
    // Измените значение для другого интервала
    // Например: 2000 = 2 секунды, 3000 = 3 секунды
    // ============================================
    const WORD_ROTATION_INTERVAL = 2500; // 2.5 секунды

    const quizData = [
        {
            question: "Сколько раз ты меня поцелуешь?",
            options: ["Сколлько захочешь", "мало", "много", "в засос"],
            answer: "Сколлько захочешь"
        },
        {
            question: "Я пойду с тобой ,,,",
            options: ["какать", "смотреть подарки", "хоть на край света", "я не пойду с тобой"],
            answer: "хоть на край света"
        },
        {
            question: "Зачем ты мурлыкаешь ?",
            options: ["я не мурлычу", "это пуки", "чтобы ты мурлыкал в ответ"],
            answer: "чтобы ты мурлыкал в ответ"
        }
    ];

    const finalMessages = {
        pass: "Ура, Алёнка у нас метч! 💛",
        fail: "Подожди-ка, пересчитай"
    };

    function showStep(stepNumber) {
        // Проверка блокировки (кроме step0 и step10)
        if (stepNumber !== 0 && stepNumber !== 10 && !isStepUnlocked(stepNumber)) {
            showToast('Сначала пройди предыдущую главу 💛');
            return;
        }
        
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(`step${stepNumber}`).classList.add('active');
        currentStep = stepNumber;
        
        // Сохраняем прогресс при посещении шага
        saveProgress(stepNumber);
        
        // Сброс видео при уходе со страницы
        pauseAllVideos();
        initCustomVideoPreviews();
    }
    
    function pauseAllVideos() {
        // Stop iframes and restore previews
        document.querySelectorAll('.video-wrapper').forEach(wrapper => {
            const iframe = wrapper.querySelector('.video-iframe');
            if (iframe) {
                iframe.src = ''; // stop video
                const id = iframe.id;
                if (id === 'videoPlayer') videoPlayer = null;
                else if (id === 'stateVideo') stateVideo = null;
                else if (id === 'requirementsVideo') requirementsVideo = null;
                else if (id === 'perceptionsVideo') perceptionsVideo = null;
                else if (id === 'heroLinkVideo') heroLinkVideo = null;
            }
            wrapper.classList.remove('is-playing');
            wrapper.classList.remove('embed-failed');
        });
    }
    
    // Функция для переключения слов в hero-секции
    function startRotatingWords() {
        if (rotatingInterval) return;
        
        // Показываем первое слово сразу
        if (heroRotatingTextElement && rotatingWords.length > 0) {
            heroRotatingTextElement.textContent = rotatingWords[0];
            heroRotatingTextElement.classList.add('active');
            currentWordIndex = 0;
        }
        
        // Переключаем слова с заданным интервалом
        rotatingInterval = setInterval(() => {
            if (!heroRotatingTextElement) return;
            
            // Плавно скрываем текущее слово
            heroRotatingTextElement.classList.remove('active');
            
            setTimeout(() => {
                // Переходим к следующему слову
                currentWordIndex = (currentWordIndex + 1) % rotatingWords.length;
                heroRotatingTextElement.textContent = rotatingWords[currentWordIndex];
                heroRotatingTextElement.classList.add('active');
            }, 400); // Небольшая задержка для плавности перехода
        }, WORD_ROTATION_INTERVAL);
    }
    
    function stopRotatingWords() {
        if (rotatingInterval) {
            clearInterval(rotatingInterval);
            rotatingInterval = null;
        }
        if (heroRotatingTextElement) {
            heroRotatingTextElement.classList.remove('active');
        }
    }

    function loadQuestion() {
        const question = quizData[currentQuestionIndex];
        if (!question) {
            console.error("No more questions.");
            return;
        }
        questionText.textContent = question.question;
        optionsContainer.innerHTML = '';
        selectedOption = null;
        submitQuizBtn.disabled = true;

        // Accessibility: mark container as listbox for screen readers
        optionsContainer.setAttribute('role', 'listbox');
        optionsContainer.setAttribute('aria-label', 'Варианты ответа');

        // Create multiple-choice buttons based on question.options
        question.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'option-button';
            btn.textContent = option;
            btn.setAttribute('role', 'option');
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('aria-selected', 'false');

            btn.addEventListener('click', () => {
                selectedOption = option;
                // visually mark selected and unmark others
                optionsContainer.querySelectorAll('.option-button').forEach(b => {
                    b.classList.remove('selected');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('selected');
                btn.setAttribute('aria-selected', 'true');
                submitQuizBtn.disabled = false;
            });

            optionsContainer.appendChild(btn);
        });

        // Keyboard navigation for options (added once)
        if (!optionsContainer.dataset.keyboardInit) {
            optionsContainer.addEventListener('keydown', (e) => {
                const focusable = Array.from(optionsContainer.querySelectorAll('.option-button'));
                if (!focusable.length) return;
                const active = document.activeElement;
                const idx = focusable.indexOf(active);

                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const next = focusable[(idx + 1) % focusable.length];
                    next.focus();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prev = focusable[(idx - 1 + focusable.length) % focusable.length];
                    prev.focus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    // Space or Enter activates the focused option
                    if (active && active.classList.contains('option-button')) {
                        e.preventDefault();
                        active.click();
                    }
                }
            });
            optionsContainer.dataset.keyboardInit = '1';
        }

        // Focus first option for easier keyboard use
        const firstOption = optionsContainer.querySelector('.option-button');
        if (firstOption) firstOption.focus();
    }

    function checkAnswer() {
        const question = quizData[currentQuestionIndex];
        if (!question) return;

        // Если ничего не выбрано — ничего не делаем
        if (!selectedOption) return;

        // Сравниваем ответ без учета регистра
        if (selectedOption.toLowerCase() === question.answer.toLowerCase()) {
            currentQuestionIndex++;
            if (currentQuestionIndex < quizData.length) {
                loadQuestion();
            } else {
                // All questions answered correctly
                finalMessageElement.textContent = finalMessages.pass;
                markQuizComplete(); // Отмечаем квиз как пройденный
                showStep(3);
            }
        } else {
            // Incorrect answer
            finalMessageElement.textContent = finalMessages.fail;
            showStep(3);
        }
    }

    // Normalize YouTube iframe links (convert watch?v or youtu.be to /embed/ID) and add a fallback link
    function normalizeYouTubeIframes() {
        document.querySelectorAll('.video-wrapper').forEach(wrap => {
            const iframe = wrap.querySelector('iframe');
            if (!iframe) return;
            let src = iframe.getAttribute('src') || '';
            // Try to extract video ID from different URL formats
            const idMatchEmbed = src.match(/embed\/([^?&]+)/);
            const idMatchWatch = src.match(/[?&]v=([^&]+)/);
            const idMatchShort = src.match(/youtu\.be\/([^?&]+)/);
            let id = idMatchEmbed ? idMatchEmbed[1] : (idMatchWatch ? idMatchWatch[1] : (idMatchShort ? idMatchShort[1] : null));
            if (!id) return;
            const embedUrl = `https://www.youtube.com/embed/${id}`;
            if (!src.includes('/embed/')) iframe.setAttribute('src', embedUrl);

            // Add a small fallback link so user can open the video directly on YouTube if embedding is blocked
            if (!wrap.querySelector('.video-fallback')) {
                const fallback = document.createElement('div');
                fallback.className = 'video-fallback';
                fallback.innerHTML = `<a href="https://youtu.be/${id}" target="_blank" rel="noopener noreferrer">Открыть на YouTube</a>`;
                wrap.appendChild(fallback);
            }
        });
    }

    // Extract YouTube video ID from various URL formats
    function extractYouTubeId(url) {
        if (!url) return null;
        let id = null;
        try {
            const parsed = new URL(url, document.baseURI);
            if (parsed.hostname.includes('youtu.be')) {
                id = parsed.pathname.slice(1).split('/')[0];
            } else if (parsed.hostname.includes('youtube.com')) {
                if (parsed.pathname.includes('/watch')) {
                    id = parsed.searchParams.get('v');
                } else if (parsed.pathname.includes('/embed/')) {
                    id = parsed.pathname.split('/embed/')[1].split('/')[0];
                } else if (parsed.pathname.includes('/shorts/')) {
                    id = parsed.pathname.split('/shorts/')[1].split('/')[0];
                }
            }
        } catch (e) {
            // regex fallback
            const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]+)/);
            if (match) id = match[1];
        }
        return id;
    }

    // Initialize custom video previews
    function initCustomVideoPreviews() {
        document.querySelectorAll('.video-wrapper[data-youtube]').forEach(wrapper => {
            if (wrapper.dataset.bound) return; // prevent multiple bindings
            wrapper.dataset.bound = '1';

            const previewPath = wrapper.dataset.preview;
            const img = wrapper.querySelector('.video-preview__img');
            if (img && previewPath) img.src = previewPath;

            const url = wrapper.dataset.youtube;
            const id = extractYouTubeId(url);
            const link = wrapper.querySelector('.yt-link');
            if (link && id) link.href = `https://www.youtube.com/watch?v=${id}`;

            const button = wrapper.querySelector('.video-preview');
            if (button) {
                button.addEventListener('click', () => {
                    wrapper.classList.add('is-playing');
                    const iframe = wrapper.querySelector('.video-iframe');
                    if (iframe && id) {
                        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
                        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                        const targetId = wrapper.dataset.targetId;
                        if (targetId) iframe.id = targetId;
                        if (targetId === 'videoPlayer' && continueBtn) continueBtn.disabled = false;
                    }
                });
            }
        });
    }

    initCustomVideoPreviews();

    // Event Listeners
    continueBtn.addEventListener('click', () => {
        showStep(2);
        loadQuestion();
    });

    submitQuizBtn.addEventListener('click', checkAnswer);

    restartBtn.addEventListener('click', () => {
        currentQuestionIndex = 0;
        selectedOption = null;
        continueBtn.disabled = true;
        // Clear quiz UI and return to menu
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            optionsContainer.removeAttribute('role');
            optionsContainer.removeAttribute('aria-label');
        }
        if (submitQuizBtn) submitQuizBtn.disabled = true;
        showStep(0); // Возвращаемся в меню вместо step1
    });

    // Hero link click handler
    if (heroLink) {
        heroLink.addEventListener('click', (e) => {
            e.preventDefault();
            showStep(10); // Переход на step10 с видео из hero-ссылки
        });
    }

    // Menu chapter buttons
    document.querySelectorAll('.chapter-card').forEach(card => {
        card.addEventListener('click', () => {
            const targetStep = parseInt(card.getAttribute('data-step'));
            
            // Проверка блокировки
            if (!isStepUnlocked(targetStep)) {
                showToast('Сначала пройди предыдущую главу 💛');
                return;
            }
            
            showStep(targetStep);
            
            // Если переходим к квизу, загружаем первый вопрос
            if (targetStep === 2) {
                currentQuestionIndex = 0;
                loadQuestion();
            }
            
            // Если переходим к видео, сбрасываем его
            if (targetStep === 1) {
                continueBtn.disabled = true;
            }
        });
    });
    
    // Perceptions video button (кнопка "да я хочу сейчас посмотреть")
    const perceptionsVideoBtn = document.querySelector('.perceptions-video-btn');
    if (perceptionsVideoBtn) {
        perceptionsVideoBtn.addEventListener('click', () => {
            showStep(9); // Переход на step9 с видео про переживания
        });
    }

    // Back to menu buttons
    document.querySelectorAll('.back-to-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStep = parseInt(btn.getAttribute('data-step'));
            showStep(targetStep);
            
            // Сбрасываем состояние при возврате в меню
            if (currentStep === 1) {
                continueBtn.disabled = true;
            }
            if (currentStep === 2) {
                currentQuestionIndex = 0;
                selectedOption = null;
            }
        });
    });

    // Initial setup - показываем меню и запускаем переключение слов
    showStep(0); // Показываем главную страницу
    updateMenuLockStates(); // Обновляем состояние блокировки глав
    startRotatingWords();
    
    // Очистка при закрытии страницы
    window.addEventListener('beforeunload', () => {
        stopRotatingWords();
    });
});
