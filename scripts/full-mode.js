import {
  ctx, loadFullAnswers, saveFullAnswers, resetFullAnswers,
} from './utils.js';

export function startFull() {
  ctx.state = {
    mode: 'full',
    deck: ctx.allQuestions.slice(),  // stable deck order
    index: 0,
    answers: loadFullAnswers(),      // { [questionId]: chosenAnswer }
  };
  ctx.renderQuestion();
}

export function handleFullAnswer(answer) {
  const s = ctx.state;
  const q = s.deck[s.index];
  if (s.answers[q.id] != null) return; // already answered, immutable
  s.answers[q.id] = answer;
  saveFullAnswers(s.answers);
  ctx.renderQuestion();
}

export function fullNavigate(delta) {
  const s = ctx.state;
  const next = s.index + delta;
  if (next < 0 || next >= s.deck.length) return;
  s.index = next;
  ctx.renderQuestion();
}

export function fullReset() {
  if (!confirm('Xoá toàn bộ câu trả lời đã lưu?')) return;
  const s = ctx.state;
  s.answers = {};
  s.index = 0;
  resetFullAnswers();
  ctx.renderQuestion();
}
