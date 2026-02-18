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

    // 1. 체크된 멤버 이름만 추출
    const checkedNames = stateMembers.filter(m => m.checked).map(m => m.name);
    
    if (checkedNames.length < 2) {
        alert("추첨 인원이 부족합니다.");
        return;
    }

    // 2. 당첨자 추첨
    const shuffled = [...checkedNames].sort(() => 0.5 - Math.random());
    const [winner1, winner2] = shuffled.slice(0, 2);

    // 3. 참여자 명단 생성 (쉼표로 구분)
    // 여기서 console.log를 찍어 데이터가 제대로 생성되는지 확인해보세요.
    const participantsStr = checkedNames.join(',');
    console.log("전달될 명단:", participantsStr); 

    // 4. 경로 생성 (상대 경로 방식)
    const currentPath = window.location.pathname;
    const dirPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    
    const finalUrl = `${dirPath}/post.html?w1=${encodeURIComponent(winner1)}&w2=${encodeURIComponent(winner2)}&p=${encodeURIComponent(participantsStr)}`;
    Kakao.Share.sendCustom({
        templateId: 129560,
        templateArgs: {
            'url': finalUrl
        },
    });
}