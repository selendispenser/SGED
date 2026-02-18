document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const winners = [params.get('w1'), params.get('w2')];
    const participantsRaw = params.get('p'); // 참여자 명단 파라미터

    if (!winners[0] || !participantsRaw) {
        alert("잘못된 접근입니다. 메인 페이지를 통해 공유해 주세요.");
        return;
    }

    // 쉼표로 구분된 참여자 명단을 배열로 변환
    const participants = participantsRaw.split(',');

    // 1. 참여자 명단 하단에 렌더링
    renderParticipantList(participants, winners);

    // 2. 슬롯 애니메이션 실행 (참여자 명단을 애니메이션 소스로 활용하여 몰입감 증대)
    startSlotSlide("slot1-rail", winners[0], participants);
    setTimeout(() => {
        startSlotSlide("slot2-rail", winners[1], participants);
    }, 800);
});
function renderParticipantList(names, winners) {
    const container = document.getElementById('participant-list');
    if (!container) return;

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