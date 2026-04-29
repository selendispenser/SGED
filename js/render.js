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

    // 토글의 단일 권위: 체크박스의 change 이벤트
    // (마우스 클릭, Tab+Space 키보드 입력 모두 change 이벤트를 발생시킴)
    checkbox.addEventListener('change', () => onToggle(name));

    // 삭제 버튼 — li로의 버블링 차단
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(name);
    });

    // li 빈 영역 클릭 시 체크박스로 위임 → change 이벤트 단일 흐름
    li.addEventListener('click', (e) => {
        if (e.target === checkbox) return; // 체크박스 직접 클릭은 자체 처리
        checkbox.click();
    });

    return li;
}

/**
 * 상단 카운터 숫자를 갱신합니다.
 */
export function updateCounter(count) {
    const counterElement = document.getElementById('counter');
    if (counterElement) counterElement.textContent = `선택된 인원: ${count}명`;
}