/**
 * 개별 멤버 LI 요소를 생성합니다.
 */
export function createMemberElement(name, isChecked, onDelete, onToggle) {
    const li = document.createElement('li');
    li.className = 'member-item';

    const info = document.createElement('div');
    info.className = 'member-info';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'member-checkbox';
    checkbox.checked = isChecked;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name-text';
    nameSpan.textContent = name;

    info.append(checkbox, nameSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', `${name} 삭제`);
    deleteBtn.textContent = '×';

    li.append(info, deleteBtn);

    // 이벤트 리스너: 삭제 버튼
    deleteBtn.addEventListener('click', (e) => {
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