(() => {
  for (const id of ['total-posts', 'allocated-posts', 'remaining-posts']) document.getElementById(id).textContent = '不适用（AI 实时生成）';
  let stats = {};
  try { stats = JSON.parse(localStorage.getItem('qdc-nio-checkin:copy-stats:v1')) || {}; }
  catch (_) { document.getElementById('stats-note').textContent = '浏览器存储不可用，无法读取已保存的次数。'; }
  for (const key of ['title', 'content']) {
    const count = Number.isSafeInteger(stats[key]) && stats[key] >= 0 ? stats[key] : 0;
    document.getElementById(`${key}-copies`).textContent = count.toLocaleString('zh-CN');
  }
})();
