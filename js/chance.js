import { showToast } from './toast.js';
import { fingerprint } from './fingerprint.js';

// Fisher–Yates 셔플: 모든 순열이 균등 확률로 나오도록 보장
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// 카카오톡 공유 로직
export async function shareToKakao(stateMembers) {
    if (!window.Kakao) {
        showToast("카카오 SDK 로드 실패. 공유할 수 없습니다.", { type: 'error' });
        return;
    }

    // 1. 체크된 멤버 이름만 추출
    const checkedNames = stateMembers.filter(m => m.checked).map(m => m.name);

    if (checkedNames.length < 2) {
        showToast("추첨 인원이 부족합니다. (2명 이상 선택 필요)", { type: 'error' });
        return;
    }

    // 2. 당첨자 추첨 (편향 없는 Fisher–Yates 사용)
    const [winner1, winner2] = shuffle(checkedNames).slice(0, 2);

    // 3. URL 압축: member.json 멤버는 인덱스로, 직접 추가된 인원은 이름으로 분리
    //    (한글 1글자 ≈ URL 인코딩 9 byte → 인덱스로 보내면 평균 80~90% 절감)
    let baseNames = [];
    try {
        const res = await fetch(`./assets/member.json?v=${Date.now()}`);
        baseNames = (await res.json()).map(m => m.name);
    } catch (err) {
        console.error("member.json 로드 실패, 이름을 그대로 전달합니다:", err);
    }

    const baseIndex = new Map(baseNames.map((n, i) => [n, i]));
    const indices = [];
    const customs = [];
    for (const name of checkedNames) {
        if (baseIndex.has(name)) indices.push(baseIndex.get(name));
        else customs.push(name);
    }

    // 4. URL 조립
    const params = new URLSearchParams();
    params.set('w1', winner1);
    params.set('w2', winner2);
    if (indices.length) {
        params.set('i', indices.join('.'));
        // 송신 시점의 member.json 지문 → 수신 측에서 mismatch 감지에 사용
        params.set('f', fingerprint(baseNames));
    }
    if (customs.length) params.set('c', customs.join(','));

    const dirPath = window.location.pathname.replace(/\/[^/]*$/, '');
    const finalUrl = `${dirPath}/post.html?${params.toString()}`;

    Kakao.Share.sendCustom({
        templateId: 129560,
        templateArgs: {
            'url': finalUrl
        },
    });
}