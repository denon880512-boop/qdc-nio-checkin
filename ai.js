(() => {
  const tags = '#蔚来#qdc#qdc耳机#HiFi#2026东莞蔚乐萤车友年会';
  const angles = ['看车之余偶遇 qdc', '车友年会里的试听小惊喜', '第一次现场体验 qdc', '带着熟悉的歌单试听', '从看车到听歌的片刻放松', '与车友分享现场发现'];
  window.generateQdcPost = async signal => {
    const cfg = window.QDC_AI;
    if (!cfg?.key) throw Error('未配置生成服务，请联系工作人员。');
    let recent = [];
    try { const saved = JSON.parse(localStorage.getItem('qdc-nio:recent')); if (Array.isArray(saved)) recent = saved.filter(s => typeof s === 'string').slice(-12); } catch {}
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', signal,
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}`},
      body: JSON.stringify({
        model: cfg.model, thinking: {type: 'disabled'},
        response_format: {type: 'json_object'}, temperature: 1.1, max_tokens: 600,
        messages: [
          {role: 'system', content: '为实际到场观众起草中文分享文案，发布者会按真实体验核对。仅输出 JSON，含 title 和 content 两个字符串。标题12—32字，正文50—120字。背景是2026东莞蔚乐萤车友年会，用户也称东莞蔚来车展。核心感觉：本来来看蔚来车、参加车友年会，现场发现 qdc 耳机，于是停下来试听，获得看车之外的小惊喜。标题必须含 qdc 和蔚来，正文必须含东莞、蔚来、qdc、试听，全文保留小写 qdc。活动全名若使用，须准确为2026东莞蔚乐萤车友年会。语气自然、轻松、有分享欲，不写空洞硬广，不强行每篇重复完整活动名。不输出标签、Markdown或HTML。不得写北京或耳机展。不编造型号、参数、价格、日期、具体场馆、排队时长、赠品、销量、合作背书或车载音响合作，不把 qdc 耳机写成汽车音响。围绕看车、偶遇、戴上耳机、熟悉曲目、人声器乐、HiFi试听体验展开；不编造具体实测音质结论，不用极致、顶级等绝对用语。参考标题：东莞蔚来打卡！试听qdc HiFi耳机；蔚来车友年会，邂逅qdc好声音。参考正文：来到东莞的蔚来车友年会，本来是来看看车，没想到还遇见了 qdc 耳机。看车之余坐下来试听，换上熟悉的歌，认真听听人声和器乐的呈现。逛展多了一段属于音乐的时间，这个小发现值得分享。每次变化句式、开头和叙述角度，不照抄参考。'},
          {role: 'user', content: `角度：${angles[Math.floor(Math.random() * angles.length)]}。避免这些近期标题：${JSON.stringify(recent)}。生成一组新内容。随机标记：${crypto.randomUUID()}`}
        ]
      })
    });
    if (!response.ok) throw Error(response.status === 402 ? '生成账户余额不足，请联系工作人员。' : response.status === 401 ? '生成服务密钥已失效，请联系工作人员。' : response.status === 429 ? '当前生成请求较多，请稍后重试。' : '生成服务暂不可用，请稍后重试。');
    const data = await response.json();
    let post;
    try { post = JSON.parse(data.choices?.[0]?.message?.content); } catch { throw Error('文案格式异常，请重新生成。'); }
    if (!post || typeof post.title !== 'string' || typeof post.content !== 'string') throw Error('文案格式异常，请重新生成。');
    post.title = post.title.trim(); post.content = post.content.trim();
    if (post.title.length < 8 || post.title.length > 60 || post.content.length < 30 || post.content.length > 250 || !post.title.includes('qdc') || !post.title.includes('蔚来') || !['东莞', '蔚来', 'qdc', '试听'].every(word => post.content.includes(word)) || /北京|耳机展|[#<>]/u.test(post.title + post.content)) throw Error('文案未符合主题要求，请重新生成。');
    if (recent.includes(post.title)) throw Error('本次标题与近期重复，请重新生成。');
    try { localStorage.setItem('qdc-nio:recent', JSON.stringify([...recent, post.title].slice(-12))); } catch {}
    return {title: post.title, content: `${post.content}\n${tags}`};
  };
})();
