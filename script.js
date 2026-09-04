(() => {
  'use strict';
  // 从浏览器往返缓存恢复时也重新取下一组，避免返回旧文案。
  window.addEventListener('pageshow', event => {
    if (event.persisted) window.location.reload();
  });
  // 独立 GitHub Pages 版本，浏览器直接生成。
  let post = null;
  let loading = false;
  const title = document.getElementById('post-title');
  const content = document.getElementById('post-content');
  let toastTimer;
  function toast(message) {
    const box = document.getElementById('toast');
    box.textContent = message;
    box.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('visible'), 2400);
  }
  const retry = document.getElementById('retry-load');
  async function claim() {
    if (loading) return;
    loading = true;
    post = null;
    document.getElementById('copy-title').disabled = true;
    document.getElementById('copy-content').disabled = true;
    retry.hidden = true;
    content.textContent = '正在生成 qdc 试听文案…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 100000);
    try {
      post = await window.generateQdcPost(controller.signal);
      title.textContent = post.title;
      content.textContent = post.content;
      document.getElementById('copy-title').disabled = false;
      document.getElementById('copy-content').disabled = false;
    } catch (error) {
      title.textContent = '暂时无法生成';
      content.textContent = error.name === 'AbortError' ? '生成超时，请稍后重试。' : error instanceof TypeError ? '连接未成功，请检查网络后重试。' : error.message;
      retry.hidden = false;
    } finally { clearTimeout(timeout); loading = false; }
  }
  retry.addEventListener('click', claim);
  claim();

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return; } catch (_) { /* 兼容权限拒绝的浏览器。 */ }
    }
    const area = document.createElement('textarea');
    const active = document.activeElement;
    area.value = text;
    area.readOnly = true;
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    try {
      if (!document.execCommand('copy')) throw new Error('Copy failed');
    } finally {
      area.remove();
      if (active && active.focus) active.focus({preventScroll:true});
    }
  }
  const STATS_KEY = 'qdc-nio-checkin:copy-stats:v1';
  let copyStats = {title: 0, content: 0};
  try {
    const saved = JSON.parse(localStorage.getItem(STATS_KEY));
    for (const key of ['title', 'content']) {
      if (saved && Number.isSafeInteger(saved[key]) && saved[key] >= 0) copyStats[key] = saved[key];
    }
  } catch (_) { /* 无有效历史数据时从零开始。 */ }
  let titleClicks = 0;
  let lastTitleClick = 0;
  document.addEventListener('click', event => {
    if (!event.target.closest('#copy-title')) titleClicks = 0;
  });
  ['copy-title', 'copy-content'].forEach(id => {
    const button = document.getElementById(id);
    const label = button.querySelector('span');
    const original = label.textContent;
    let resetTimer;
    button.addEventListener('click', async () => {
      if (!post) return;
      let openStats = false;
      if (id === 'copy-title') {
        const now = Date.now();
        titleClicks = now - lastTitleClick <= 3000 ? titleClicks + 1 : 1;
        lastTitleClick = now;
        if (titleClicks === 15) { openStats = true; titleClicks = 0; }
      }
      try {
        await copyText(id === 'copy-title' ? post.title : post.content);
        const kind = id === 'copy-title' ? 'title' : 'content';
        copyStats[kind] += 1;
        try { localStorage.setItem(STATS_KEY, JSON.stringify(copyStats)); } catch (_) { /* 不影响复制。 */ }
        toast('已复制');
        label.textContent = '已复制';
        button.classList.add('copied');
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { label.textContent = original; button.classList.remove('copied'); }, 1800);
      } catch (_) { toast('复制失败，请长按文字手动复制'); }
      if (openStats) window.location.assign('./stats.html');
    });
  });

  // 浏览器不提供可靠的 App 安装检测。尝试 scheme，未离开页面则回退网页版。
  let cancelPending = () => {};
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const wechat = /MicroMessenger/i.test(navigator.userAgent);
  document.getElementById('platform-help').hidden = !wechat;
  document.querySelectorAll('[data-scheme]').forEach(link => {
    link.addEventListener('click', event => {
      if (!mobile || wechat || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      cancelPending();
      const cleanup = () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pagehide', cleanup);
      };
      const onVisibility = () => { if (document.hidden) cleanup(); };
      const timer = setTimeout(() => {
        cleanup();
        if (!document.hidden) window.location.assign(link.href);
      }, 1800);
      cancelPending = cleanup;
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', cleanup);
      try { window.location.assign(link.dataset.scheme); }
      catch (_) { cleanup(); window.location.assign(link.href); }
    });
  });
})();
