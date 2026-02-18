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
    if (!window.Kakao) return;

    const checkedNames = stateMembers.filter(m => m.checked).map(m => m.name);
    if (checkedNames.length < 2) return alert("추첨 인원이 부족합니다.");

    const shuffled = [...checkedNames].sort(() => 0.5 - Math.random());
    const [winner1, winner2] = shuffled.slice(0, 2);

    // ✅ GitHub Pages 경로(서브디렉토리)에 완벽 대응하는 주소 생성
    const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/') + '/';
    const shareUrl = `${baseUrl}post.html?w1=${encodeURIComponent(winner1)}&w2=${encodeURIComponent(winner2)}`;

    Kakao.Share.sendCustom({
        templateId: 129560,
        templateArgs: {
            'url': shareUrl, // 템플릿의 ${url} 자리에 이 전체 주소가 들어갑니다.
            'title': '💎 Selen 길드 수로 추첨 결과',
            'desc': `총 ${checkedNames.length}명이 참여했습니다!`
        },
    });
}