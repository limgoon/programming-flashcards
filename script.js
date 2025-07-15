document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 가져오기
    const stageSelectionScreen = document.getElementById('stage-selection-screen');
    const flashcardScreen = document.getElementById('flashcard-screen');
    const stageButtons = document.querySelectorAll('.stage-btn');
    const backButton = document.getElementById('back-to-selection');
    const currentStageDisplay = document.getElementById('current-stage-display');
    const card = document.querySelector('.card');
    const cardArea = document.getElementById('card-area');
    const wordDisplay = document.getElementById('word-display');
    const progMeaning = document.getElementById('prog-meaning');
    const dictMeaning = document.getElementById('dict-meaning');
    const checkmarkAreas = document.querySelectorAll('.checkmark-area');
    const checkmarks = document.querySelectorAll('.checkmark');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const speakerIcon = document.getElementById('speaker-icon');

    // 상태 변수
    let allWords = {};
    let currentWords = [];
    let shuffledIndices = [];
    let currentIndex = 0;
    let checkedStatus = {};
    let englishVoice = null;
    let isAnimating = false; // ▼▼▼ [추가됨] 애니메이션 진행 상태를 추적하는 변수 ▼▼▼

    // 영어 음성 찾기
    function loadAndSetVoice() {
        const voices = window.speechSynthesis.getVoices();
        englishVoice = voices.find((voice) => voice.lang === 'en-US') || voices.find((voice) => voice.lang.startsWith('en-'));
    }

    // 1. 데이터 로딩
    async function loadWords() {
        try {
            const response = await fetch('words.json');
            allWords = await response.json();
        } catch (error) {
            console.error('단어 데이터를 불러오는 데 실패했습니다.', error);
            alert('단어 데이터를 불러오는 데 실패했습니다.');
        }
    }

    // 2. 단계 초기화 및 시작
    function initStage(level) {
        currentWords = allWords[`level_${level}`];
        currentStageDisplay.textContent = `${level}단계`;
        if (!checkedStatus[level]) {
            checkedStatus[level] = {};
        }
        shuffledIndices = Array.from({ length: currentWords.length }, (_, i) => i);
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }
        currentIndex = 0;
        displayCardContent();
        stageSelectionScreen.classList.remove('active');
        flashcardScreen.classList.add('active');
    }

    // 3. 카드 내용 표시 (이름 변경: displayCard -> displayCardContent)
    function displayCardContent() {
        if (shuffledIndices.length === 0) return;
        const wordIndex = shuffledIndices[currentIndex];
        const wordData = currentWords[wordIndex];

        // 애니메이션을 위해 카드 내용을 즉시 업데이트
        card.classList.remove('is-flipped'); // 카드를 앞면으로
        wordDisplay.textContent = wordData.word;
        progMeaning.textContent = wordData.prog;
        dictMeaning.textContent = wordData.dict;
        updateCheckmark();
    }

    // 4. 체크마크 업데이트 및 토글
    function updateCheckmark() {
        const level = currentStageDisplay.textContent.charAt(0);
        const wordIndex = shuffledIndices[currentIndex];
        const isChecked = checkedStatus[level][wordIndex] || false;

        checkmarks.forEach((c) => {
            isChecked ? c.classList.add('checked') : c.classList.remove('checked');
        });
    }

    function toggleCheckmark() {
        const level = currentStageDisplay.textContent.charAt(0);
        const wordIndex = shuffledIndices[currentIndex];
        checkedStatus[level][wordIndex] = !(checkedStatus[level][wordIndex] || false);
        updateCheckmark();
    }

    // 단어 발음 듣기 기능
    function speakWord(word) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }

    // ▼▼▼ [수정됨] 카드 이동 함수 전체 수정 ▼▼▼
    function showNextCard() {
        if (isAnimating) return; // 애니메이션 중이면 실행하지 않음

        // 현재 카드를 확인한 것으로 자동 표시
        const level = currentStageDisplay.textContent.charAt(0);
        const wordIndex = shuffledIndices[currentIndex];
        if (!checkedStatus[level][wordIndex]) {
            checkedStatus[level][wordIndex] = true;
        }

        isAnimating = true;
        card.classList.add('slide-out-left');

        // 사라지는 애니메이션이 끝난 후
        card.addEventListener(
            'animationend',
            () => {
                // 인덱스 업데이트 및 카드 내용 변경
                currentIndex = (currentIndex + 1) % shuffledIndices.length;
                displayCardContent();

                // 나타나는 애니메이션 적용
                card.classList.add('slide-in-from-right');

                // 나타나는 애니메이션이 끝난 후
                card.addEventListener(
                    'animationend',
                    () => {
                        card.classList.remove('slide-in-from-right');
                        isAnimating = false;
                    },
                    { once: true },
                );
            },
            { once: true },
        );
    }

    function showPrevCard() {
        if (isAnimating) return;
        isAnimating = true;
        card.classList.add('slide-out-right');

        card.addEventListener(
            'animationend',
            () => {
                currentIndex = (currentIndex - 1 + shuffledIndices.length) % shuffledIndices.length;
                displayCardContent();

                card.classList.add('slide-in-from-left');

                card.addEventListener(
                    'animationend',
                    () => {
                        card.classList.remove('slide-in-from-left');
                        isAnimating = false;
                    },
                    { once: true },
                );
            },
            { once: true },
        );
    }

    // `animationend` 이벤트 발생 시 애니메이션 클래스를 확실히 제거하기 위한 수정
    card.addEventListener('animationend', (e) => {
        if (e.animationName.includes('slide-out')) {
            card.classList.remove('slide-out-left', 'slide-out-right');
        }
    });
    // ▲▲▲ [수정됨] ▲▲▲

    // 6. 이벤트 리스너 설정
    stageButtons.forEach((button) => {
        button.addEventListener('click', () => initStage(button.dataset.level));
    });

    backButton.addEventListener('click', () => {
        flashcardScreen.classList.remove('active');
        stageSelectionScreen.classList.add('active');
    });

    card.addEventListener('click', (e) => {
        if (isAnimating) return; // 애니메이션 중에는 뒤집기 방지
        // 스피커나 체크마크 영역이 아니면 뒤집기
        if (!e.target.closest('#speaker-icon') && !e.target.closest('.checkmark-area')) {
            card.classList.toggle('is-flipped');
        }
    });

    speakerIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        const wordToSpeak = wordDisplay.textContent;
        if (wordToSpeak && 'speechSynthesis' in window) {
            speakerIcon.classList.add('speaking');
            speakWord(wordToSpeak);
            speakerIcon.addEventListener(
                'animationend',
                () => {
                    speakerIcon.classList.remove('speaking');
                },
                { once: true },
            );
        } else {
            alert('음성 지원이 되지 않는 브라우저입니다.');
        }
    });

    checkmarkAreas.forEach((area) => {
        area.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCheckmark();
        });
    });

    prevBtn.addEventListener('click', showPrevCard);
    nextBtn.addEventListener('click', showNextCard);

    // 스와이프 기능
    let touchStartX = 0;
    let touchEndX = 0;

    cardArea.addEventListener(
        'touchstart',
        (e) => {
            if (isAnimating) return;
            touchStartX = e.changedTouches[0].screenX;
        },
        { passive: true },
    );

    cardArea.addEventListener('touchend', (e) => {
        if (isAnimating) return;
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            showNextCard();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            showPrevCard();
        }
    }

    // 초기 설정
    if ('speechSynthesis' in window) {
        loadAndSetVoice();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadAndSetVoice;
        }
    }
    loadWords();
});
