/**
 * 개별 멤버 LI 요소를 생성합니다.
 */
export function createMemberElement(name, isChecked, onDelete, onToggle) {
    const li = document.createElement('li');
    li.className = 'member-item';
    li.innerHTML = `
        <div class="member-info">
            <input type="checkbox" class="member-checkbox" ${isChecked ? 'checked' : ''}>
            <span class="name-text">${name}</span>
        </div>
        <button class="delete-btn">&times;</button>
    `;

    // 이벤트 리스너: 삭제 버튼
    li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(name);
    });

    // 이벤트 리스너: 전체 클릭 (토글)
    li.addEventListener('click', () => onToggle(name));

    return li;
}

/**
 * 상단 카운터 숫자를 갱신합니다.
 */
export function updateCounter(count) {
    const counterElement = document.getElementById('counter');
    if (counterElement) counterElement.textContent = `선택된 인원: ${count}명`;
}