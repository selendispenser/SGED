document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const winners = [params.get('w1'), params.get('w2')];

    if (!winners[0]) return alert("잘못된 접근입니다.");

    try {
        const response = await fetch('./assets/soldier.json');
        const soldiers = await response.json();
        const names = soldiers.map(s => s.name);

        // 슬라이드 실행
        startSlotSlide("slot1-rail", winners[0], names);
        setTimeout(() => {
            startSlotSlide("slot2-rail", winners[1], names);
        }, 800); // 0.8초 시차

    } catch (e) { console.error(e); }
});

function startSlotSlide(railId, winner, namePool) {
    const rail = document.getElementById(railId);
    const itemHeight = 80; // CSS의 .name-item 높이와 반드시 일치해야 함

    // 1. 가짜 리스트 생성 (30개 정도)
    const displayList = [];
    for(let i = 0; i < 30; i++) {
        displayList.push(namePool[Math.floor(Math.random() * namePool.length)]);
    }
    displayList.push(winner); // 마지막에 당첨자 배치

    // 2. HTML 생성 (마지막 요소에만 클래스를 넣기 쉽게 id 부여 가능)
    rail.innerHTML = displayList.map((name, index) => {
        const isLast = index === displayList.length - 1;
        return `<div class="name-item ${isLast ? 'target-winner' : ''}">${name}</div>`;
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