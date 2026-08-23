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
    talkmem: null, // Set<string> — 톡방 명단. 로드 실패 시 null
};

/** 톡방 명단(talkmem.json)에 있어 추첨 대상이 되는 인원인지 */
function isEligible(name) {
    // 명단을 못 불러온 상태에서는 UI에 제외 표시를 하지 않는다(추첨 자체는 chance.js가 막음)
    return state.talkmem === null || state.talkmem.has(name);
}
const elementsByName = new Map(); // name -> li element (타겟 업데이트용 인덱스)

// 1. 초기 로드 및 데이터 병합
async function init() {
    await loadTalkmem();

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

/** 톡방 명단을 불러와 state.talkmem에 Set으로 저장합니다. 실패하면 null로 둡니다. */
async function loadTalkmem() {
    try {
        const res = await fetch(`./assets/talkmem.json?v=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list = await res.json();
        state.talkmem = new Set(list.map(m => m.name));
    } catch (error) {
        console.error("톡방 명단(talkmem.json) 로드 실패:", error);
        state.talkmem = null;
        showToast("톡방 명단을 불러오지 못해 추첨을 진행할 수 없습니다.", { type: 'error', duration: 4500 });
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
        const el = Render.createMemberElement(m.name, m.checked, handleDelete, handleToggle, isEligible(m.name));
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

    const el = Render.createMemberElement(name, true, handleDelete, handleToggle, isEligible(name));
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

/**
 * 붙여넣은 텍스트에서 이름 목록을 추출합니다.
 * 줄바꿈·공백 어느 것으로 구분되든 토큰을 모두 이름으로 취급합니다.
 * (닉네임에 공백이 없다는 전제.) 순수 숫자 토큰은 카운터로 보고 무시합니다.
 */
function parseRosterText(text) {
    const names = [];
    const seen = new Set();
    for (const line of text.split(/\r?\n/)) {
        for (const token of line.trim().split(/\s+/)) {
            if (!token || /^\d+$/.test(token) || seen.has(token)) continue;
            seen.add(token);
            names.push(token);
        }
    }
    return names;
}

// 자모 1개 차이까지는 확신 있는 오타로 보고 자동 교정, 2개 차이는 추천만.
const TYPO_AUTO_MAX = 1;
const TYPO_SUGGEST_MAX = 2;

/**
 * 문자열을 자모 토큰 배열로 분해합니다.
 * 한글 음절은 초/중/종성으로 나누고(종성 없으면 생략), 그 외 문자는 그대로 한 토큰으로 둡니다.
 * 편집 거리 비교용이라 실제 자모 문자 대신 구분 가능한 식별자('L#','V#','T#')를 사용합니다.
 */
function decomposeToTokens(str) {
    const tokens = [];
    for (const ch of str) {
        const code = ch.codePointAt(0);
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const s = code - 0xAC00;
            const initial = Math.floor(s / (21 * 28));
            const medial = Math.floor((s % (21 * 28)) / 28);
            const final = s % 28;
            tokens.push('L' + initial, 'V' + medial);
            if (final > 0) tokens.push('T' + final);
        } else {
            tokens.push(ch);
        }
    }
    return tokens;
}

/** 두 토큰 배열 사이의 편집 거리(자모 개수 차이) */
function tokenDistance(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        }
        prev = cur;
    }
    return prev[n];
}

/**
 * 붙여넣은 이름과 가장 가까운 기존 멤버(들)를 찾습니다.
 * @returns {{ distance: number, matches: string[] }} 최소 거리와 그 거리의 후보 이름 목록
 */
function findSimilarMembers(nameTokens, memberTokensList) {
    let distance = Infinity;
    let matches = [];
    for (const m of memberTokensList) {
        const d = tokenDistance(nameTokens, m.tokens);
        if (d < distance) {
            distance = d;
            matches = [m.name];
        } else if (d === distance) {
            matches.push(m.name);
        }
    }
    return { distance, matches };
}

/**
 * 붙여넣은 명단으로 전체 동기화합니다.
 * - 정확히 일치: 체크
 * - 자모 1개 차이(후보 1명): 오타로 보고 그 기존 멤버 자동 체크
 * - 자모 2개 차이 또는 후보가 여럿: 추천만 표시(자동 처리 안 함)
 * - 닮은 이름 없음: 신규 인원으로 추가 후 체크
 * 붙여넣은 명단에 없는(그리고 자동 매칭되지 않은) 기존 인원은 체크 해제됩니다.
 */
function handleApplyRoster() {
    const input = document.getElementById('rosterInput');
    const names = parseRosterText(input.value);
    if (names.length === 0) {
        showToast("붙여넣은 명단에서 이름을 찾지 못했습니다.", { type: 'error' });
        return;
    }

    const existingSet = new Set(state.members.map(m => m.name));
    const memberTokensList = state.members.map(m => ({ name: m.name, tokens: decomposeToTokens(m.name) }));

    const checkedTargets = new Set(); // 최종적으로 체크할 기존/신규 이름
    const autoMatched = [];           // { from, to } 자모 1개 오타 자동 교정
    const suggestions = [];           // { from, candidates } 확인 필요
    const toAdd = [];                 // 신규 인원 이름

    for (const name of names) {
        if (existingSet.has(name)) {
            checkedTargets.add(name);
            continue;
        }
        const { distance, matches } = findSimilarMembers(decomposeToTokens(name), memberTokensList);
        if (distance <= TYPO_AUTO_MAX && matches.length === 1) {
            autoMatched.push({ from: name, to: matches[0] });
            checkedTargets.add(matches[0]);
        } else if (distance <= TYPO_SUGGEST_MAX) {
            suggestions.push({ from: name, candidates: matches });
        } else {
            toAdd.push(name);
        }
    }

    // 신규 인원 추가 (state + DOM)
    const listElement = document.getElementById('memberList');
    for (const name of toAdd) {
        state.members.push({ name, checked: true });
        const el = Render.createMemberElement(name, true, handleDelete, handleToggle, isEligible(name));
        elementsByName.set(name, el);
        listElement.appendChild(el);
        checkedTargets.add(name);
    }

    // 전체 동기화: checkedTargets에 있으면 체크, 없으면 해제
    for (const m of state.members) {
        const shouldCheck = checkedTargets.has(m.name);
        m.checked = shouldCheck;
        const cb = elementsByName.get(m.name)?.querySelector('.member-checkbox');
        if (cb) cb.checked = shouldCheck;
    }

    persist();
    refreshCounter();

    renderRosterResult({ autoMatched, suggestions, added: toAdd, checkedCount: checkedTargets.size });
}

/** 붙여넣기 처리 결과(체크 수, 오타 교정, 확인 필요, 신규 추가)를 결과 블록에 표시 */
function renderRosterResult({ autoMatched, suggestions, added, checkedCount }) {
    const box = document.getElementById('rosterResult');
    if (!box) return;
    box.replaceChildren();

    const summary = document.createElement('p');
    summary.className = 'roster-result-summary';
    summary.textContent = `${checkedCount}명 체크 완료.`;
    box.appendChild(summary);

    const addSection = (className, heading, items, format) => {
        if (items.length === 0) return;
        const sec = document.createElement('div');
        sec.className = `roster-result-section ${className}`;
        const h = document.createElement('strong');
        h.textContent = heading;
        sec.appendChild(h);
        const ul = document.createElement('ul');
        for (const item of items) {
            const li = document.createElement('li');
            li.textContent = format(item);
            ul.appendChild(li);
        }
        sec.appendChild(ul);
        box.appendChild(sec);
    };

    addSection('roster-auto', '오타 자동 교정', autoMatched, ({ from, to }) => `${from} → ${to}`);
    addSection('roster-suggest', '확인 필요 (비슷한 이름 있음)', suggestions,
        ({ from, candidates }) => `${from} → 혹시 ${candidates.join(', ')}?`);
    addSection('roster-added', `신규 추가 ${added.length}명`, added, (name) => name);

    box.hidden = false;
}

const btnApplyRoster = document.getElementById('btnApplyRoster');
if (btnApplyRoster) {
    btnApplyRoster.addEventListener('click', handleApplyRoster);
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
            // 현재 state 객체에 담긴 멤버 리스트와 톡방 명단을 Chance 모듈로 전달
            Chance.shareToKakao(state.members, state.talkmem);
        });
    }
}