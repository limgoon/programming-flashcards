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

    // 상태 변수
    let allWords = {};
    let currentWords = [];
    let shuffledIndices = [];
    let currentIndex = 0;
    let checkedStatus = {}; // { 1: {0: true, 5: false}, 2: {...} }

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

        // 해당 레벨의 학습 상태 초기화
        if (!checkedStatus[level]) {
            checkedStatus[level] = {};
        }

        // 인덱스 배열 생성 후 랜덤 셔플
        shuffledIndices = Array.from({ length: currentWords.length }, (_, i) => i);
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }

        currentIndex = 0;
        displayCard();

        // 화면 전환
        stageSelectionScreen.classList.remove('active');
        flashcardScreen.classList.add('active');
    }

    // 3. 카드 내용 표시
    function displayCard() {
        if (shuffledIndices.length === 0) return;

        const wordIndex = shuffledIndices[currentIndex];
        const wordData = currentWords[wordIndex];

        // 카드 내용 업데이트
        wordDisplay.textContent = wordData.word;
        progMeaning.textContent = wordData.prog;
        dictMeaning.textContent = wordData.dict;

        // 뒤집힌 카드 원상태로
        card.classList.remove('is-flipped');

        // 체크 상태 업데이트
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

    // 5. 카드 이동
    function showNextCard() {
        // 현재 카드를 확인한 것으로 자동 표시
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
        button.addEventListener('click', () => {
            const level = button.dataset.level;
            initStage(level);
        });
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
            e.stopPropagation(); // 카드가 뒤집히는 것을 방지
            toggleCheckmark();
        });
    });

    // 데스크탑용 버튼
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
        const swipeThreshold = 50; // 최소 스와이프 거리
        if (touchEndX < touchStartX - swipeThreshold) {
            // 왼쪽으로 스와이프 -> 다음 카드
            showNextCard();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // 오른쪽으로 스와이프 -> 이전 카드
            showPrevCard();
        }
    }

    // 초기 데이터 로딩
    loadWords();
});
