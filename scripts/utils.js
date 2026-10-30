// Mock test composition
export const MOCK_SPEC = [
  { count: 1,  critical: true },
  { count: 12, type: 'QUY ĐỊNH CHUNG VÀ QUY TẮC GIAO THÔNG ĐƯỜNG BỘ' },
  { count: 1,  type: 'VĂN HÓA GIAO THÔNG, ĐẠO ĐỨC NGƯỜI LÁI XE, KỸ NĂNG PHÒNG CHÁY, CHỮA CHÁY VÀ CỨU HỘ, CỨU NẠN' },
  { count: 1,  type: 'KỸ THUẬT LÁI XE' },
  { count: 5,  type: 'BÁO HIỆU ĐƯỜNG BỘ' },
  { count: 5,  type: 'GIẢI THẾ SA HÌNH VÀ KỸ NĂNG XỬ LÝ TÌNH HUỐNG GIAO THÔNG' },
];
export const MOCK_DURATION_SEC = 19 * 60;

export const PASS_THRESHOLD = { A: 2, A1: 4 };

export const FULL_STORAGE_KEY = 'a-license-trainer:full-answers:v1';
export const LICENSE_STORAGE_KEY = 'a-license-trainer:license:v1';

export const ctx = {
  allQuestions: [],
  state: null,
  licenseType: localStorage.getItem(LICENSE_STORAGE_KEY) || 'A1',
  renderMenu: () => {},
  renderQuestion: () => {},
};

// Helpers
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom(pool, n) {
  return shuffle(pool).slice(0, n);
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// DOM
export const root = document.getElementById('app');

export function clear() { root.innerHTML = ''; }

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'onClick') node.addEventListener('click', v);
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

// Full-mode storage
export function loadFullAnswers() {
  try { return JSON.parse(localStorage.getItem(FULL_STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
export function saveFullAnswers(answers) {
  localStorage.setItem(FULL_STORAGE_KEY, JSON.stringify(answers));
}
export function resetFullAnswers() {
  localStorage.removeItem(FULL_STORAGE_KEY);
}

export function setLicenseType(kind) {
  ctx.licenseType = kind;
  localStorage.setItem(LICENSE_STORAGE_KEY, kind);
}
