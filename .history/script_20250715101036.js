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
    const speakerIcon = document.getElementById('speaker-icon'); // ▼▼▼ [추가됨] ▼▼▼

    // 상태 변수
    let allWords = {};
    let currentWords = [];
    let shuffledIndices = [];
    let currentIndex = 0;
    let checkedStatus = {};

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

    // ▼▼▼ [추가됨] 단어 발음 듣기 기능 ▼▼▼
    function speakWord(word) {
        // 진행 중인 음성 출력이 있다면 취소
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US'; // 영어(미국) 발음으로 설정
        utterance.rate = 0.9; // 약간 느린 속도로 설정
        window.speechSynthesis.speak(utterance);
    }
    // ▲▲▲ [추가됨] ▲▲▲

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

    checkmarkAreas.forEach((area) => {
        area.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCheckmark();
        });
    });

    // ▼▼▼ [추가됨] 스피커 아이콘 클릭 이벤트 ▼▼▼
    speakerIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // 카드가 뒤집히는 것을 방지
        const wordToSpeak = wordDisplay.textContent;
        if (wordToSpeak && 'speechSynthesis' in window) {
            speakWord(wordToSpeak);
        } else {
            alert('음성 지원이 되지 않는 브라우저입니다.');
        }
    });
    // ▲▲▲ [추가됨] ▲▲▲

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

    // 초기 데이터 로딩
    loadWords();
});
