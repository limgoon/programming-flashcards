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

    // ▼▼▼ [추가됨] 영어 원어민 음성을 저장할 변수 ▼▼▼
    let englishVoice = null;
    // ▲▲▲ [추가됨] ▲▲▲

    // ▼▼▼ [추가됨] 사용 가능한 음성 목록에서 영어 음성을 찾아 설정하는 함수 ▼▼▼
    function loadAndSetVoice() {
        // 브라우저가 제공하는 음성 목록 가져오기
        const voices = window.speechSynthesis.getVoices();

        // 'en-US' (미국 영어) 음성을 우선적으로 찾습니다.
        englishVoice = voices.find((voice) => voice.lang === 'en-US');

        // 만약 미국 영어 음성이 없다면, 다른 영어 음성이라도 찾습니다.
        if (!englishVoice) {
            englishVoice = voices.find((voice) => voice.lang.startsWith('en-'));
        }
    }
    // ▲▲▲ [추가됨] ▲▲▲

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
        displayCard();
        stageSelectionScreen.classList.remove('active');
        flashcardScreen.classList.add('active');
    }

    // 3. 카드 내용 표시
    function displayCard() {
        if (shuffledIndices.length === 0) return;
        const wordIndex = shuffledIndices[currentIndex];
        const wordData = currentWords[wordIndex];

        wordDisplay.textContent = wordData.word;
        progMeaning.textContent = wordData.prog;
        dictMeaning.textContent = wordData.dict;

        card.classList.remove('is-flipped');
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

    // ▼▼▼ [수정됨] 단어 발음 듣기 기능 ▼▼▼
    function speakWord(word) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);

        // 미리 찾아둔 영어 음성이 있다면, 해당 음성으로 설정합니다.
        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        // 언어와 속도 설정 (음성을 못 찾았을 경우를 위한 대비)
        utterance.lang = 'en-US';
        utterance.rate = 0.9;

        window.speechSynthesis.speak(utterance);
    }
    // ▲▲▲ [수정됨] ▲▲▲

    // 5. 카드 이동
    function showNextCard() {
        const level = currentStageDisplay.textContent.charAt(0);
        const wordIndex = shuffledIndices[currentIndex];
        if (!checkedStatus[level][wordIndex]) {
            checkedStatus[level][wordIndex] = true;
        }
        currentIndex = (currentIndex + 1) % shuffledIndices.length;
        displayCard();
    }

    function showPrevCard() {
        currentIndex = (currentIndex - 1 + shuffledIndices.length) % shuffledIndices.length;
        displayCard();
    }

    // 6. 이벤트 리스너 설정
    stageButtons.forEach((button) => {
        button.addEventListener('click', () => initStage(button.dataset.level));
    });

    backButton.addEventListener('click', () => {
        flashcardScreen.classList.remove('active');
        stageSelectionScreen.classList.add('active');
    });

    card.addEventListener('click', () => {
        card.classList.toggle('is-flipped');
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
            touchStartX = e.changedTouches[0].screenX;
        },
        { passive: true },
    );

    cardArea.addEventListener('touchend', (e) => {
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

    // ▼▼▼ [추가됨] 페이지 로딩 시 음성 목록을 가져오도록 설정 ▼▼▼
    // getVoices()는 비동기로 작동하므로, voiceschanged 이벤트가 발생했을 때 음성을 찾아야 합니다.
    if ('speechSynthesis' in window) {
        loadAndSetVoice(); // 초기에 한 번 실행
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadAndSetVoice;
        }
    }
    // ▲▲▲ [추가됨] ▲▲▲

    // 초기 데이터 로딩
    loadWords();
});
