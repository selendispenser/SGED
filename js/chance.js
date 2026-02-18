// 현재 선택된 멤버 리스트 추출
function getSelectedMembers() {
    const checkedItems = document.querySelectorAll('.member-item');
    const selected = [];
    checkedItems.forEach(item => {
        const checkbox = item.querySelector('.member-checkbox');
        if (checkbox.checked) {
            selected.push(item.querySelector('.name-text').textContent);
        }
    });
    return selected;
}

export function getCheckedNames() {
    const localData = localStorage.getItem('guild_members');
    if (!localData) return [];
    
    const members = JSON.parse(localData);
    return members.filter(m => m.checked).map(m => m.name);
}

// 추첨 로직 (예: 참여자 중 랜덤 1명 추출)
export function drawWinner() {
    const members = getSelectedMembers();
    if (members.length === 0) return alert("선택된 인원이 없습니다.");
    
    const winner = members[Math.floor(Math.random() * members.length)];
    alert(`추첨 결과: ${winner}`);
    return winner;
}

// 카카오톡 공유 로직
export function shareToKakao(stateMembers) {
    if (!window.Kakao) {
        alert("카카오 SDK가 로드되지 않았습니다.");
        return;
    }

    // 1. 현재 체크된(참여한) 인원만 추출
    const checkedMembers = stateMembers.filter(m => m.checked).map(m => m.name);

    // 2. 유효성 검사: 당첨자 2명을 뽑아야 하므로 최소 2명 필요
    if (checkedMembers.length < 2) {
        alert("추첨을 위해 최소 2명 이상의 길드원을 선택해 주세요.");
        return;
    }

    // 3. 당첨자 2명 랜덤 추첨 (비복원 추출)
    const shuffled = [...checkedMembers].sort(() => 0.5 - Math.random());
    const [winner1, winner2] = shuffled.slice(0, 2);

    // 4. post.html 주소 생성 (당첨자 정보를 쿼리 파라미터로 전달)
    // 배포 후에는 실제 도메인 주소로 연동됩니다.
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname.split('/').slice(0, -1).join('/');
    const baseUrl = `${currentOrigin}${currentPath}/`;

    const shareUrl = `${baseUrl}post.html?w1=${encodeURIComponent(winner1)}&w2=${encodeURIComponent(winner2)}`;
    // 5. 카카오톡 메시지 전송
    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: '💎 Selen 길드 수로 추첨 결과',
            description: `총 ${checkedMembers.length}명이 참여했습니다!\n과연 행운의 주인공은 누구일까요?`,
            imageUrl: `${baseUrl}assets/Selen.png`, // 실제 배포될 이미지 경로
            link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
            },
        },
        buttons: [
            {
                title: '슬롯머신 결과 확인',
                link: {
                    mobileWebUrl: shareUrl,
                    webUrl: shareUrl,
                },
            },
        ],
    });
}