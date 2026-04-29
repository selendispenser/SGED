// js/post.js
import { showToast } from './toast.js';
import { fingerprint } from './fingerprint.js';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);

    // 1. 당첨자
    const winner1 = params.get('w1');
    const winner2 = params.get('w2');

    // 2. 참여자 복원
    //    - 신규 포맷: i = member.json 인덱스(. 구분), c = 직접 추가된 이름(, 구분)
    //    - 구버전 포맷(p=name1,name2,...) 도 호환 유지
    const participants = await resolveParticipants(params);

    if (participants.length === 0) {
        console.error("참여자 명단을 복원할 수 없습니다.");
        const container = document.getElementById('participant-list');
        if (container) {
            const msg = document.createElement('p');
            msg.textContent = "참여자 정보를 불러올 수 없습니다.";
            container.replaceChildren(msg);
        }
        return;
    }

    renderParticipantList(participants, [winner1, winner2]);

    startSlotSlide("slot1-rail", winner1, participants);
    setTimeout(() => {
        startSlotSlide("slot2-rail", winner2, participants);
    }, 800);
});

async function resolveParticipants(params) {
    const iParam = params.get('i');
    const cParam = params.get('c');
    const fParam = params.get('f');

    if (iParam || cParam) {
        const result = [];
        if (iParam) {
            try {
                const res = await fetch(`./assets/member.json?v=${Date.now()}`);
                const baseNames = (await res.json()).map(m => m.name);

                // 송신 시점과 현재 member.json이 다르면 인덱스가 어긋날 수 있음
                if (fParam && fingerprint(baseNames) !== fParam) {
                    console.warn("member.json 지문 불일치 — 명단이 달라졌을 수 있습니다.");
                    showToast(
                        "명단이 갱신되어 일부 참여자 표시가 부정확할 수 있습니다.",
                        { type: 'error', duration: 4500 }
                    );
                }

                for (const token of iParam.split('.')) {
                    const idx = parseInt(token, 10);
                    if (Number.isInteger(idx) && baseNames[idx] != null) {
                        result.push(baseNames[idx]);
                    }
                }
            } catch (err) {
                console.error("member.json 로드 실패:", err);
                showToast("참여자 명단 일부를 불러오지 못했습니다.", { type: 'error' });
            }
        }
        if (cParam) {
            for (const name of cParam.split(',')) {
                const trimmed = name.trim();
                if (trimmed) result.push(trimmed);
            }
        }
        return result;
    }

    // 구버전 호환: p=이름1,이름2,...
    const pParam = params.get('p');
    if (!pParam) return [];
    return pParam.split(',').map(n => n.trim()).filter(Boolean);
}

function renderParticipantList(names, winners) {
    const container = document.getElementById('participant-list');
    if (!container) {
        console.error("ID가 'participant-list'인 요소를 찾을 수 없습니다.");
        return;
    }

    const winnerSet = new Set(winners);
    container.replaceChildren();
    for (const name of names) {
        const badge = document.createElement('span');
        const isWinner = winnerSet.has(name);
        badge.className = isWinner ? 'participant-badge is-winner' : 'participant-badge';
        badge.textContent = name;
        if (isWinner) badge.setAttribute('aria-label', `당첨자: ${name}`);
        container.appendChild(badge);
    }
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

    // 2. DOM 노드 생성 (이름은 textContent로 안전하게 주입)
    rail.replaceChildren();
    displayList.forEach((name, index) => {
        const item = document.createElement('div');
        const isLast = index === displayList.length - 1;
        item.className = isLast ? 'name-item target-winner' : 'name-item';
        item.style.height = `${itemHeight}px`;
        item.textContent = name;
        rail.appendChild(item);
    });

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