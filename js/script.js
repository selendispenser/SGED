import * as Render from './render.js';
import * as Chance from './chance.js';
import { showToast } from './toast.js';

const KAKAO_APP_KEY = '9693a2be8ecf395d39691e85a32bc174';
const kakaoReady = !!window.Kakao;
if (kakaoReady) {
    if (!Kakao.isInitialized()) Kakao.init(KAKAO_APP_KEY);
} else {
    console.error("카카오 SDK 스크립트가 로드되지 않았습니다.");
}

const state = {
    members: [], // { name: string, checked: boolean }
};
const elementsByName = new Map(); // name -> li element (타겟 업데이트용 인덱스)

// 1. 초기 로드 및 데이터 병합
async function init() {
    try {
        const response = await fetch(`./assets/member.json?v=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const serverMembers = await response.json();

        const currentCheckedMap = readLocalCheckedMap();

        // 서버 명단을 기준으로 상태를 재구성합니다.
        // 파일에서 사라진 사람은 자연스럽게 삭제되고, 남은 사람의 체크 상태는 유지됩니다.
        const newMembers = serverMembers.map(m => ({
            name: m.name,
            checked: currentCheckedMap.has(m.name) ? currentCheckedMap.get(m.name) : true
        }));

        rebuild(newMembers);

    } catch (error) {
        console.error("데이터 초기화 실패:", error);
        showLoadError();
    }
}

function showLoadError() {
    const listElement = document.getElementById('memberList');
    if (!listElement) return;
    listElement.replaceChildren();
    const li = document.createElement('li');
    li.className = 'loading-state';
    li.textContent = '명단을 불러오지 못했어요. 잠시 후 새로고침해 주세요.';
    listElement.appendChild(li);
}

function persist() {
    try {
        localStorage.setItem('guild_members', JSON.stringify(state.members));
    } catch (err) {
        console.error("localStorage 저장 실패:", err);
    }
}

function readLocalCheckedMap() {
    const map = new Map();
    let raw = null;
    try {
        raw = localStorage.getItem('guild_members');
    } catch (err) {
        console.error("localStorage 접근 실패:", err);
        return map;
    }
    if (!raw) return map;

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            for (const m of parsed) {
                if (m && typeof m.name === 'string') {
                    map.set(m.name, !!m.checked);
                }
            }
        }
    } catch (err) {
        console.error("localStorage 데이터 손상, 무시합니다:", err);
    }
    return map;
}

function refreshCounter() {
    const checkedCount = state.members.filter(m => m.checked).length;
    Render.updateCounter(checkedCount);
}

// 전체 리빌드 — 초기 로드/명단 최신화처럼 명단 전체가 바뀔 때만 사용
function rebuild(newMembers) {
    state.members = newMembers;
    persist();

    const listElement = document.getElementById('memberList');
    listElement.replaceChildren();
    elementsByName.clear();

    for (const m of state.members) {
        const el = Render.createMemberElement(m.name, m.checked, handleDelete, handleToggle);
        elementsByName.set(m.name, el);
        listElement.appendChild(el);
    }
    refreshCounter();
}

// 핸들러 — 모두 타겟 업데이트(전체 재렌더 X)
function handleAdd() {
    const input = document.getElementById('memberInput');
    const name = input.value.trim();
    if (!name) return;
    if (state.members.some(m => m.name === name)) {
        showToast(`'${name}'은 이미 명단에 있습니다.`, { type: 'error' });
        return;
    }

    state.members.push({ name, checked: true });

    const el = Render.createMemberElement(name, true, handleDelete, handleToggle);
    elementsByName.set(name, el);
    document.getElementById('memberList').appendChild(el);

    persist();
    refreshCounter();
    input.value = '';
    input.focus();
}

function handleDelete(name) {
    if (!confirm(`${name}님을 명단에서 삭제하시겠습니까?`)) return;

    state.members = state.members.filter(m => m.name !== name);
    elementsByName.get(name)?.remove();
    elementsByName.delete(name);

    persist();
    refreshCounter();
}

function handleToggle(name) {
    const member = state.members.find(m => m.name === name);
    if (!member) return;
    // 체크박스 자체가 이미 새 상태로 그려진 상황 → state만 동기화
    member.checked = !member.checked;
    persist();
    refreshCounter();
}

function setAllChecked(value) {
    for (const m of state.members) {
        m.checked = value;
        const cb = elementsByName.get(m.name)?.querySelector('.member-checkbox');
        if (cb) cb.checked = value;
    }
    persist();
    refreshCounter();
}

// 이벤트 바인딩
document.getElementById('btnAddMember').addEventListener('click', handleAdd);
document.getElementById('memberInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdd();
});
document.addEventListener('DOMContentLoaded', init);

// 전체 해제/선택 — 기존 li를 그대로 두고 체크박스 상태만 업데이트
const btnReset = document.getElementById('btnReset');
if (btnReset) {
    btnReset.addEventListener('click', () => setAllChecked(false));
}

const btnSelectAll = document.getElementById('btnSelectAll');
if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => setAllChecked(true));
}

/**
 * 서버의 member.json 데이터를 불러와 로컬 리스트를 완전히 최신화(덮어쓰기)하는 함수
 */
async function handleLoadSoldiers() {
    try {
        // 1. 사용자에게 데이터 초기화 확인 (기존 편집 내용이 사라지므로 권장)
        if (!confirm("서버의 최신 명단으로 초기화하시겠습니까?\n(직접 추가한 인원이나 현재 체크 상태가 모두 초기화됩니다.)")) {
            return;
        }

        // 2. 서버에서 최신 member.json 가져오기 (캐시 방지 파라미터 포함)
        const res = await fetch(`./assets/member.json?v=${Date.now()}`);
        const freshMembers = await res.json();

        if (!freshMembers || freshMembers.length === 0) {
            throw new Error("데이터가 비어있습니다.");
        }

        // 3. 명단 전체 교체 → rebuild 사용
        const updatedMembers = freshMembers.map(m => ({
            name: m.name,
            checked: false
        }));
        rebuild(updatedMembers);
        showToast("최신 명단으로 초기화되었습니다.", { type: 'success' });

    } catch (error) {
        console.error("명단 불러오기 실패:", error);
        showToast("최신 명단을 불러오는 중 오류가 발생했습니다.", { type: 'error' });
    }
}

// 이벤트 바인딩 영역에 추가
const btnLoadSoldiers = document.getElementById('btnLoadSoldiers');
if (btnLoadSoldiers) {
    btnLoadSoldiers.addEventListener('click', handleLoadSoldiers);
}

const btnSendKakao = document.getElementById('btnSendKakao');
if (btnSendKakao) {
    if (!kakaoReady) {
        btnSendKakao.disabled = true;
        btnSendKakao.setAttribute('aria-disabled', 'true');
        btnSendKakao.title = '카카오 SDK 로드 실패';
        showToast("카카오 SDK 로드 실패. 공유 기능을 사용할 수 없습니다.", {
            type: 'error',
            duration: 4000,
        });
    } else {
        btnSendKakao.addEventListener('click', () => {
            // 현재 state 객체에 담긴 멤버 리스트를 Chance 모듈로 전달
            Chance.shareToKakao(state.members);
        });
    }
}