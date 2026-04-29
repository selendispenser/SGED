/**
 * 짧은 비암호화 지문(djb2 변형). member.json 인덱스 송수신 mismatch 감지용.
 * 같은 입력 → 같은 출력. 충돌 가능성은 있지만 용도(데이터 정합 체크)에는 충분.
 *
 * @param {string[]} names
 * @returns {string} base36 인코딩된 6~7자 해시
 */
export function fingerprint(names) {
    let h = 5381;
    for (const name of names) {
        for (let i = 0; i < name.length; i++) {
            h = ((h << 5) + h + name.charCodeAt(i)) | 0;
        }
        h = ((h << 5) + h + 0x7c) | 0; // '|' 구분자로 이름 경계 보호
    }
    return (h >>> 0).toString(36);
}
