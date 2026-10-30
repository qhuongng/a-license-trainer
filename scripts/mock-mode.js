import {
  ctx, root, clear, el, fmtTime, shuffle, pickRandom,
  MOCK_SPEC, MOCK_DURATION_SEC, PASS_THRESHOLD,
} from './utils.js';

export function startMock() {
  const picked = [];
  for (const spec of MOCK_SPEC) {
    const pool = ctx.allQuestions.filter(q =>
      spec.critical ? q.critical : (!q.critical && q.type === spec.type),
    );
    picked.push(...pickRandom(pool, spec.count));
  }
  ctx.state = {
    mode: 'mock',
    deck: shuffle(picked),
    index: 0,
    answers: {},        // deck index -> chosen answer (mutable until submit)
    revealed: false,    // becomes true after submit or timeout
    endReason: null,
    timeLeft: MOCK_DURATION_SEC,
    timerId: null,
    license: ctx.licenseType,
  };
  ctx.state.timerId = setInterval(() => {
    const s = ctx.state;
    if (!s || s.mode !== 'mock' || s.revealed) return;
    s.timeLeft -= 1;
    if (s.timeLeft <= 0) {
      endMock();
      return;
    }
    const t = document.getElementById('mock-timer');
    if (t) t.textContent = fmtTime(s.timeLeft);
  }, 1000);
  ctx.renderQuestion();
}

export function handleMockAnswer(answer) {
  const s = ctx.state;
  if (s.revealed) return;
  s.answers[s.index] = answer;
  ctx.renderQuestion();
}

export function mockNavigate(delta) {
  const s = ctx.state;
  const next = s.index + delta;
  if (next < 0 || next >= s.deck.length) return;
  s.index = next;
  ctx.renderQuestion();
}

export function submitMock() {
  const s = ctx.state;
  const answered = Object.keys(s.answers).length;
  const total = s.deck.length;
  const missing = total - answered;
  const msg = missing > 0
    ? `Vẫn chưa trả lời ${missing} câu. Nộp bài?`
    : 'Nộp bài thi?';
  if (!confirm(msg)) return;
  endMock();
}

export function endMock() {
  const s = ctx.state;
  if (s.timerId) { clearInterval(s.timerId); s.timerId = null; }
  s.revealed = true;
  renderMockResult();
}

function renderMockResult() {
  const s = ctx.state;
  clear();
  const threshold = PASS_THRESHOLD[s.license];
  const total = s.deck.length;

  let correctCount = 0;
  const wrongList = [];
  const criticalQ = s.deck.find(q => q.critical);
  const criticalIdx = s.deck.indexOf(criticalQ);
  const criticalChosen = s.answers[criticalIdx];
  const criticalFailed = criticalChosen != null && criticalChosen !== criticalQ.correct;

  s.deck.forEach((q, i) => {
    const chosen = s.answers[i];
    if (chosen === q.correct) correctCount += 1;
    else wrongList.push({ q, chosen: chosen ?? null, index: i });
  });

  const wrongCount = total - correctCount;
  const passed = !criticalFailed && wrongCount <= threshold;
  const title = passed ? 'Đậu!' : 'Trượt';
  let detail;
  if (passed) {
    detail = `Đúng ${correctCount}/${total} câu (sai ${wrongCount}, tối đa cho phép ${threshold}).`;
  } else if (criticalFailed) {
    detail = `Trả lời sai câu liệt. Đúng ${correctCount}/${total} câu.`;
  } else {
    detail = `Đúng ${correctCount}/${total} câu, sai ${wrongCount}, vượt ngưỡng ${threshold} của hạng ${s.license}.`;
  }

  const header = el('div', { class: 'text-center space-y-2' }, [
    el('h2', { class: `text-4xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}` }, title),
    el('p', { class: 'text-gray-700' }, detail),
    el('p', { class: 'text-xs text-gray-500' },
      `Hạng ${s.license} · ngưỡng đậu: sai không quá ${threshold} câu và đúng câu liệt.`),
  ]);

  const actions = el('div', { class: 'flex justify-center gap-3 pt-2' }, [
    el('button', {
      class: 'rounded-lg bg-[darkblue] text-white px-5 py-2 hover:opacity-90',
      onClick: startMock,
    }, 'Thi lại'),
    el('button', {
      class: 'rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-100',
      onClick: ctx.renderMenu,
    }, 'Về menu'),
  ]);

  const sections = [header, actions];

  if (wrongList.length > 0) {
    sections.push(el('div', { class: 'pt-4 space-y-3' }, [
      el('h3', { class: 'text-lg font-semibold text-gray-800' },
        `Các câu làm sai (${wrongList.length})`),
      ...wrongList.map(({ q, chosen, index }) => {
        const originalNo = ctx.allQuestions.findIndex(x => x.id === q.id) + 1;
        return el('div', { class: 'rounded-lg border border-gray-200 bg-white p-4 space-y-2' }, [
          el('div', { class: 'text-xs text-gray-500' }, [
            q.critical
              ? el('span', { class: 'font-bold text-red-600 mr-1' }, '[CÂU LIỆT]')
              : null,
            `Câu ${index + 1} (câu ${originalNo} trong bộ câu hỏi gốc)`,
          ]),
          el('div', { class: 'font-semibold text-[darkblue]' }, q.question),
          q.image
            ? el('img', { src: `./media/${q.image}`, alt: '', class: 'max-w-full h-auto rounded' })
            : null,
          el('div', { class: 'text-sm' }, [
            el('span', { class: 'text-gray-500' }, 'Đã chọn: '),
            chosen == null
              ? el('span', { class: 'italic text-gray-500' }, 'Chưa trả lời')
              : el('span', { class: 'text-red-700 font-medium' }, chosen),
          ]),
          el('div', { class: 'text-sm' }, [
            el('span', { class: 'text-gray-500' }, 'Đáp án đúng: '),
            el('span', { class: 'text-green-700 font-medium' }, q.correct),
          ]),
        ]);
      }),
    ]));
  }

  root.appendChild(el('div', { class: 'space-y-6' }, sections));
}
