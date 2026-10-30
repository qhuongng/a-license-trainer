import {
  ctx, root, clear, el, fmtTime, setLicenseType, PASS_THRESHOLD,
} from './scripts/utils.js';
import {
  startMock, handleMockAnswer, mockNavigate, submitMock,
} from './scripts/mock-mode.js';
import {
  startFull, handleFullAnswer, fullNavigate, fullReset,
} from './scripts/full-mode.js';

// Menu
function renderMenu() {
  if (ctx.state && ctx.state.mode === 'mock' && ctx.state.timerId) {
    clearInterval(ctx.state.timerId);
  }
  ctx.state = null;
  clear();
  const criticalCount = ctx.allQuestions.filter(q => q.critical).length;
  const toggle = el('div', { class: 'inline-flex rounded-lg border border-gray-300 overflow-hidden text-sm' }, [
    makeLicenseBtn('A'),
    makeLicenseBtn('A1'),
  ]);
  root.appendChild(
    el('div', { class: 'space-y-6' }, [
      el('header', { class: 'text-center space-y-3' }, [
        el('h1', { class: 'text-3xl font-bold text-[darkblue]' }, 'Luyện thi GPLX hạng A & A1'),
        el('p', { class: 'text-sm text-gray-600' },
          `${ctx.allQuestions.length} câu hỏi · ${criticalCount} câu liệt`),
        el('div', { class: 'flex justify-center items-center gap-2 pt-2 flex-wrap' }, [
          el('span', { class: 'text-sm text-gray-600' }, 'Hạng:'),
          toggle,
          el('span', { class: 'text-xs text-gray-500' }, [
            `(đậu khi sai không quá ${PASS_THRESHOLD[ctx.licenseType]} câu `,
            el('b', {}, 'và đúng câu liệt'),
            ')',
          ]),
        ]),
      ]),
      el('div', { class: 'grid gap-4 md:grid-cols-2 mt-8' }, [
        el('button', {
          class: 'rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition',
          onClick: startMock,
        }, [
          el('div', { class: 'text-xl font-semibold text-[darkblue]' }, 'Thi thử'),
          el('p', { class: 'text-sm text-gray-600 mt-2' },
            `Bài thi gồm 25 câu theo cấu trúc đề thật, thời gian thi 19 phút. Bài thi kết thúc nếu sai câu liệt.`),
        ]),
        el('button', {
          class: 'rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition',
          onClick: startFull,
        }, [
          el('div', { class: 'text-xl font-semibold text-[darkblue]' }, 'Luyện tập toàn bộ'),
          el('p', { class: 'text-sm text-gray-600 mt-2' },
            `Ôn tập toàn bộ ${ctx.allQuestions.length} câu theo thứ tự, nhóm theo nội dung và có đánh dấu câu liệt.`),
        ]),
      ]),
    ]),
  );
}

function makeLicenseBtn(kind) {
  const active = ctx.licenseType === kind;
  return el('button', {
    class: `px-3 py-1 ${active ? 'bg-[darkblue] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`,
    onClick: () => {
      setLicenseType(kind);
      renderMenu();
    },
  }, kind);
}

// Shared question rendering for both modes
function renderQuestion() {
  const s = ctx.state;
  clear();
  const q = s.deck[s.index];
  const isMock = s.mode === 'mock';
  const showCritical = !isMock && q.critical;

  const chosen = isMock ? s.answers[s.index] : s.answers[q.id];
  // Only reveal correct answer at the end of the test for mock mode
  const reveal = !isMock && chosen != null;
  const selected = isMock && chosen != null;

  const menuBtn = el('button', {
    class: 'hover:text-gray-800',
    onClick: confirmExit,
  }, '← Menu');

  let topRight, statsRow;
  if (isMock) {
    const answered = Object.keys(s.answers).length;
    topRight = el('span', {
      id: 'mock-timer',
      class: `font-mono ${s.timeLeft <= 60 ? 'text-red-600' : 'text-[darkblue]'}`,
    }, fmtTime(s.timeLeft));
    statsRow = el('div', { class: 'flex items-center justify-end gap-4' }, [
      el('span', {}, `Câu ${s.index + 1}/${s.deck.length}`),
      el('span', {}, `Đã làm: ${answered}/${s.deck.length}`),
    ]);
  } else {
    const answered = Object.keys(s.answers).length;
    const correct = s.deck.reduce((acc, qq) =>
      acc + (s.answers[qq.id] === qq.correct ? 1 : 0), 0);
    topRight = el('button', {
      class: 'rounded-md border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-100',
      onClick: fullReset,
    }, 'Xoá các câu trả lời');
    statsRow = el('div', { class: 'flex items-center justify-end gap-3 flex-wrap' }, [
      el('span', {}, `Câu ${s.index + 1}/${s.deck.length}`),
      el('span', {}, `Đã làm: ${answered}`),
      el('span', { class: 'text-green-700' }, `Đúng: ${correct}`),
      el('span', { class: 'text-red-700' }, `Sai: ${answered - correct}`),
    ]);
  }

  const header = el('div', { class: 'text-sm text-gray-500 mb-4 space-y-2' }, [
    el('div', { class: 'flex items-center justify-between gap-3' }, [menuBtn, topRight]),
    statsRow,
  ]);

  const stem = el('div', { class: 'q-stem mt-3' }, q.question);
  const children = [header];
  if (!isMock) {
    children.push(el('div', {
      class: showCritical ? 'q-type-critical' : 'q-type-regular',
    }, showCritical ? `${q.type}` : q.type));
  }
  children.push(stem);

  if (q.image) {
    children.push(el('div', { class: 'q-image' }, [
      el('img', { src: `./media/${q.image}`, alt: '' }),
    ]));
  }
  children.push(el('hr', { class: 'my-4 border-gray-200' }));

  const answersWrap = el('div', { class: 'space-y-3' },
    q.answers.map((a, i) => {
      let cls = 'q-answer';
      if (reveal) {
        cls += ' locked';
        if (a === q.correct) cls += ' correct';
        else if (a === chosen) cls += ' wrong';
      } else if (selected && a === chosen) {
        cls += ' ring-2 ring-[darkblue] bg-blue-50';
      }
      return el('div', {
        class: cls,
        onClick: () => (isMock ? handleMockAnswer(a) : handleFullAnswer(a)),
      }, `${i + 1}. ${a}`);
    }),
  );
  children.push(answersWrap);

  // Footer
  const footer = el('div', { class: 'flex justify-between items-center pt-6 gap-3' });
  const nav = (delta, label, atEdge) =>
    el('button', {
      class: 'rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:opacity-40',
      disabled: atEdge,
      onClick: () => (isMock ? mockNavigate(delta) : fullNavigate(delta)),
    }, label);

  if (isMock) {
    footer.appendChild(el('button', {
      class: 'rounded-lg bg-[darkblue] text-white px-4 py-2 hover:opacity-90',
      onClick: submitMock,
    }, 'Nộp bài'));
    const rightSide = el('div', { class: 'flex items-center gap-2' }, [
      nav(-1, '←', s.index === 0),
      nav(1, '→', s.index + 1 >= s.deck.length),
    ]);
    footer.appendChild(rightSide);
  } else {
    footer.appendChild(nav(-1, '← Câu trước', s.index === 0));
    footer.appendChild(nav(1, 'Câu sau →', s.index + 1 >= s.deck.length));
  }
  children.push(footer);

  root.appendChild(el('div', {
    class: 'bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-8',
  }, children));
}

function confirmExit() {
  const s = ctx.state;
  if (s.mode === 'mock' && !s.revealed && Object.keys(s.answers).length > 0) {
    if (!confirm('Thoát và huỷ bài thi hiện tại?')) return;
  }
  renderMenu();
}

// Boot
ctx.renderMenu = renderMenu;
ctx.renderQuestion = renderQuestion;

fetch('./questions.json')
  .then(r => r.json())
  .then(data => {
    ctx.allQuestions = data;
    renderMenu();
  })
  .catch(err => {
    root.innerHTML = `<p class="text-red-600">Không tải được dữ liệu: ${err.message}</p>`;
  });
