// js/post.js

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    // 1. 파라미터 추출
    const winner1 = params.get('w1');
    const winner2 = params.get('w2');
    const pParam = params.get('p'); // 명단 데이터

    // 2. 디버깅 로그 (브라우저 F12 콘솔에서 확인용)
    console.log("추출된 참여자 명단 문자열:", pParam);

    if (pParam) {
        // 쉼표로 분리하여 배열로 복원
        const participants = pParam.split(',').map(name => name.trim());
        
        // 3. 화면에 명단 렌더링 함수 호출
        renderParticipantList(participants, [winner1, winner2]);
        
        // 4. 슬롯 애니메이션 실행
        startSlotSlide("slot1-rail", winner1, participants);
        setTimeout(() => {
            startSlotSlide("slot2-rail", winner2, participants);
        }, 800);
    } else {
        console.error("URL에 참여자 명단(p)이 없습니다.");
        const container = document.getElementById('participant-list');
        if (container) container.innerHTML = "<p>참여자 정보를 불러올 수 없습니다.</p>";
    }
});

function renderParticipantList(names, winners) {
    const container = document.getElementById('participant-list');
    if (!container) {
        console.error("ID가 'participant-list'인 요소를 찾을 수 없습니다.");
        return;
    }

    // 명단 생성
    container.innerHTML = names.map(name => {
        const isWinner = winners.includes(name);
        return `<span class="participant-badge ${isWinner ? 'is-winner' : ''}">${name}</span>`;
    }).join('');
}
function startSlotSlide(railId, winner, namePool) {
    const rail = document.getElementById(railId);
    const slotElement = rail.parentElement;
    const itemHeight = slotElement.offsetHeight;

    // 1. 가짜 리스트 생성 (30개 정도)
    const displayList = [];
    for(let i = 0; i < 30; i++) {
        displayList.push(namePool[Math.floor(Math.random() * namePool.length)]);
    }
    displayList.push(winner); // 마지막에 당첨자 배치

    // 2. HTML 생성 (마지막 요소에만 클래스를 넣기 쉽게 id 부여 가능)
    rail.innerHTML = displayList.map((name, index) => {
        const isLast = index === displayList.length - 1;
        return `<div class="name-item ${isLast ? 'target-winner' : ''}" style="height: ${itemHeight}px;">${name}</div>`;
    }).join('');

    // 3. 애니메이션 완료 후 하이라이트 실행 (transitionend 이벤트 활용)
    rail.addEventListener('transitionend', () => {
        const winnerElement = rail.querySelector('.target-winner');
        if (winnerElement) {
            winnerElement.classList.add('winner-display'); // CSS에 정의된 하이라이트 효과
        }
    }, { once: true }); // 이벤트가 한 번만 실행되도록 설정

    // 4. 슬라이드 시작
    setTimeout(() => {
        const totalMove = (displayList.length - 1) * itemHeight;
        rail.style.transform = `translateY(-${totalMove}px)`;
    }, 100);
}