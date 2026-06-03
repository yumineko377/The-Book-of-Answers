/* ============================================
   答案之书 · The Book of Answers
   JavaScript v7.0 - 恢复最简版
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // 1. DOM 元素
  // ============================================
  const el = {
    book: document.getElementById('book'),
    bookCover: document.getElementById('bookCover'),
    bookAnswer: document.getElementById('bookAnswer'),
    btnRandom: document.getElementById('btnRandom'),
    btnGo: document.getElementById('btnGo'),
    btnBack: document.getElementById('btnBack'),
    pageInput: document.getElementById('pageInput'),
    errorMsg: document.getElementById('errorMsg'),
    answerPage: document.getElementById('answerPage'),
    answerText: document.getElementById('answerText'),
    coverHint: document.getElementById('coverHint')
  };

  // ============================================
  // 2. 状态
  // ============================================
  const state = {
    answers: null,
    isLoading: false,
    isOpen: false,
    totalPages: 500
  };

  // ============================================
  // 3. 工具
  // ============================================
  function showError(msg) {
    el.errorMsg.textContent = msg;
    el.errorMsg.classList.add('is-visible');
    setTimeout(() => el.errorMsg.classList.remove('is-visible'), 3000);
  }

  function clearError() {
    el.errorMsg.classList.remove('is-visible');
    el.errorMsg.textContent = '';
  }

  function formatPageNum(num) {
    return String(num).padStart(3, '0');
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // 4. 数据加载
  // ============================================
  async function loadAnswers() {
    if (state.answers) return state.answers;
    if (typeof ANSWERS_DATA !== 'undefined' && Array.isArray(ANSWERS_DATA)) {
      state.answers = ANSWERS_DATA;
      return ANSWERS_DATA;
    }
    try {
      const response = await fetch('answers.json');
      if (!response.ok) throw new Error('无法加载');
      const data = await response.json();
      state.answers = data;
      return data;
    } catch (err) {
      console.error('加载失败:', err);
      showError('答案数据加载失败，请刷新页面重试');
      return null;
    }
  }

  // ============================================
  // 5. 翻书动画核心
  // ============================================

  function openBook() {
    if (state.isOpen) return;
    state.isOpen = true;
    el.book.classList.add('is-open');
    el.coverHint.innerHTML = '<span class="hint__icon" aria-hidden="true">✦</span>答案已揭晓';
  }

  function closeBook() {
    if (!state.isOpen) return;
    state.isOpen = false;
    el.book.classList.remove('is-open');
    el.btnBack.classList.remove('is-visible');

    setTimeout(() => {
      el.answerPage.textContent = '000';
      el.answerText.textContent = '答案正在揭晓……';
      el.pageInput.value = '';
      el.coverHint.innerHTML = '<span class="hint__icon" aria-hidden="true">✦</span>默念你的问题，然后点击书本';
    }, 600);
  }

  // ============================================
  // 6. 显示答案
  // ============================================
  async function showAnswer(pageNum) {
    if (state.isLoading) return;
    state.isLoading = true;
    clearError();

    if (typeof pageNum !== 'number' || isNaN(pageNum)) {
      pageNum = parseInt(pageNum, 10);
    }
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > state.totalPages) {
      showError('请输入 1 到 500 之间的页码');
      state.isLoading = false;
      return;
    }

    const answers = await loadAnswers();
    if (!answers) { state.isLoading = false; return; }

    const answer = answers.find(a => a.page === pageNum);
    if (!answer) { showError('未找到对应答案'); state.isLoading = false; return; }

    // 如果已经翻开，先合上
    if (state.isOpen) {
      closeBook();
      await wait(800);
    }

    // 更新答案内容
    el.answerPage.textContent = formatPageNum(answer.page);
    
    // 5个字以内强制一行显示
    if (answer.text.length <= 5) {
      el.answerText.innerHTML = '<nobr>' + answer.text + '</nobr>';
    } else {
      el.answerText.textContent = answer.text;
    }

    // 翻开封面
    openBook();

    // 显示返回按钮
    setTimeout(() => {
      el.btnBack.classList.add('is-visible');
    }, 1000);

    state.isLoading = false;
  }

  // ============================================
  // 7. 随机翻页
  // ============================================
  async function randomFlip() {
    if (state.isLoading) return;
    const answers = await loadAnswers();
    if (!answers) return;
    const randomIndex = Math.floor(Math.random() * answers.length);
    await showAnswer(answers[randomIndex].page);
  }

  // ============================================
  // 8. 事件绑定
  // ============================================

  // 点击书本翻页
  el.book.addEventListener('click', (e) => {
    if (e.target.closest('.book__cover-back')) {
      return;
    }
    if (state.isOpen) return;
    randomFlip();
  });

  el.book.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!state.isOpen) randomFlip();
    }
  });

  el.btnRandom.addEventListener('click', randomFlip);

  el.btnGo.addEventListener('click', () => {
    const value = el.pageInput.value.trim();
    if (value) showAnswer(parseInt(value, 10));
    else showError('请输入页码');
  });

  el.pageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = el.pageInput.value.trim();
      if (value) showAnswer(parseInt(value, 10));
      else showError('请输入页码');
    }
  });
  el.pageInput.addEventListener('input', clearError);

  // 返回按钮
  el.btnBack.addEventListener('click', (e) => {
    e.stopPropagation();
    closeBook();
  });

  // 封面背面点击关闭
  const coverBack = el.bookCover.querySelector('.book__cover-back');
  if (coverBack) {
    coverBack.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.isOpen) closeBook();
    });
  }

  // ============================================
  // 9. 键盘快捷键
  // ============================================
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !state.isOpen) {
      const active = document.activeElement;
      if (active !== el.pageInput && active.tagName !== 'BUTTON') {
        e.preventDefault();
        randomFlip();
      }
    }
    if (e.code === 'Escape' && state.isOpen) {
      closeBook();
    }
    if (e.key >= '0' && e.key <= '9' && !state.isOpen) {
      if (document.activeElement !== el.pageInput) {
        e.preventDefault();
        el.pageInput.focus();
        el.pageInput.value = '';
      }
    }
  });

  // ============================================
  // 10. 触摸滑动（合上书）
  // ============================================
  let touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const deltaY = e.changedTouches[0].screenY - touchStartY;
    if (deltaY > 60 && state.isOpen) closeBook();
  }, { passive: true });

  // ============================================
  // 11. 预加载
  // ============================================
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => loadAnswers());
  } else {
    setTimeout(() => loadAnswers(), 1000);
  }

  console.log('答案之书 v7.0 已加载 · 简化的翻书效果就绪');
})();
