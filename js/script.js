import * as Render from './render.js';
import * as Chance from './chance.js';

const KAKAO_APP_KEY = '9693a2be8ecf395d39691e85a32bc174'; 
if (window.Kakao) {
    if (!Kakao.isInitialized()) {
        Kakao.init(KAKAO_APP_KEY); 
        console.log("✅ 카카오 SDK 초기화 완료:", Kakao.isInitialized());
    }
} else {
    console.error("❌ 카카오 SDK 스크립트가 로드되지 않았습니다.");
}

let state = {
    members: [], // { name: string, checked: boolean }
};

// 1. 초기 로드 및 데이터 병합
async function init() {
    try {
        // 1. 전체 명단만 가져옵니다.
        const response = await fetch(`./assets/member.json?v=${Date.now()}`);
        const serverMembers = await response.json();

        const localData = localStorage.getItem('guild_members');
        let currentCheckedMap = new Map();

        if (localData) {
            const parsedLocal = JSON.parse(localData);
            parsedLocal.forEach(m => currentCheckedMap.set(m.name, m.checked));
        }

        // 2. 서버 명단을 기준으로 상태를 재구성합니다.
        // 파일에서 사라진 사람은 자연스럽게 삭제되고, 남은 사람의 체크 상태는 유지됩니다.
        state.members = serverMembers.map(m => ({
            name: m.name,
            // 새로 추가된 사람은 기본적으로 체크 상태(true)로 설정하거나 false로 설정 가능
            checked: currentCheckedMap.has(m.name) ? currentCheckedMap.get(m.name) : true
        }));

        setState(state.members);
        console.log("✅ member.json 기반 명단 통합 완료");

    } catch (error) {
        console.error("데이터 초기화 실패:", error);
    }
    render();
}

/**
 * 상태 업데이트 및 로컬 저장소 동기화
 */
function setState(newMembers) {
    state.members = newMembers;
    localStorage.setItem('guild_members', JSON.stringify(state.members));
    render();
}

/**
 * 화면 렌더링
 */
function render() {
    const listElement = document.getElementById('memberList');
    listElement.innerHTML = '';

    state.members.forEach(m => {
        const el = Render.createMemberElement(
            m.name, 
            m.checked, 
            handleDelete, 
            handleToggle
        );
        listElement.appendChild(el);
    });

    const checkedCount = state.members.filter(m => m.checked).length;
    Render.updateCounter(checkedCount);
}

// 핸들러 함수들
function handleAdd() {
    const input = document.getElementById('memberInput');
    const name = input.value.trim();
    if (!name || state.members.some(m => m.name === name)) return;

    // 새로 추가하는 인원은 기본적으로 체크됨 (또는 false로 설정 가능)
    setState([...state.members, { name, checked: true }]);
    input.value = '';
    input.focus();
}

function handleDelete(name) {
    if (!confirm(`${name}님을 명단에서 삭제하시겠습니까?`)) return;
    setState(state.members.filter(m => m.name !== name));
}

function handleToggle(name) {
    setState(state.members.map(m => 
        m.name === name ? { ...m, checked: !m.checked } : m
    ));
}

// 이벤트 바인딩
document.getElementById('btnAddMember').addEventListener('click', handleAdd);
memberInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAdd(); });
document.addEventListener('DOMContentLoaded', init);

/**
 * 모든 멤버의 체크 상태를 해제하는 함수
 */
function handleAllUncheck() {
    // 모든 멤버의 checked 속성만 false로 변경한 새 배열 생성
    const resetMembers = state.members.map(m => ({
        ...m,
        checked: false
    }));
    
    // 변경된 상태를 적용 (저장 및 리렌더링 자동 수행)
    setState(resetMembers);
    console.log("🔓 모든 인원의 체크가 해제되었습니다.");
}

// 기존 btnReset 버튼에 이벤트 연결
const btnReset = document.getElementById('btnReset');
if (btnReset) {
    btnReset.addEventListener('click', handleAllUncheck);
}

function handleAllCheck() {
    // 모든 멤버의 checked 속성을 true로 변경한 새 배열 생성
    const allCheckedMembers = state.members.map(m => ({
        ...m,
        checked: true
    }));
    
    // 변경된 상태 적용 및 저장
    setState(allCheckedMembers);
    console.log("✅ 모든 인원이 선택되었습니다.");
}

// 이벤트 바인딩 영역에 추가
const btnSelectAll = document.getElementById('btnSelectAll');
if (btnSelectAll) {
    btnSelectAll.addEventListener('click', handleAllCheck);
}

/**
 * soldier.json 데이터를 가져와 현재 리스트의 체크 상태만 갱신하는 함수
 */
async function handleLoadSoldiers() {
    try {
        const res = await fetch('./assets/soldier.json');
        const activeSoldiers = await res.json();
        
        // 검색 최적화를 위해 Set 생성
        const soldierSet = new Set(activeSoldiers.map(s => s.name));

        // 현재 리스트(state.members)를 유지하면서 체크 상태만 업데이트
        const updatedMembers = state.members.map(m => ({
            ...m,
            checked: soldierSet.has(m.name)
        }));

        // 상태 반영 및 로컬 저장소 저장
        setState(updatedMembers);
        console.log("📥 수로 참여 명단을 기반으로 체크 상태를 동기화했습니다.");

    } catch (error) {
        console.error("참여 인원 불러오기 실패:", error);
        alert("데이터를 불러오는 중 오류가 발생했습니다.");
    }
}

// 이벤트 바인딩 영역에 추가
const btnLoadSoldiers = document.getElementById('btnLoadSoldiers');
if (btnLoadSoldiers) {
    btnLoadSoldiers.addEventListener('click', handleLoadSoldiers);
}

const btnSendKakao = document.getElementById('btnSendKakao');
if (btnSendKakao) {
    btnSendKakao.addEventListener('click', () => {
        // 현재 state 객체에 담긴 멤버 리스트를 Chance 모듈로 전달
        Chance.shareToKakao(state.members);
    });
}