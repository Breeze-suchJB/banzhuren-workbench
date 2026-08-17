/* ================= 模块：家校沟通 ================= */
function renderContact() {
  const tab = state.contactTab || 'book';
  const tabs = [['book', '通讯录'], ['notice', '班级通知'], ['reply', '私聊回复助手'], ['aid', '贫困生资助']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="contactTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'book' ? contactBookHtml() : tab === 'notice' ? contactNoticeHtml() : tab === 'reply' ? contactReplyHtml() : contactAidHtml();
  return '<div class="page-title">📞 家校沟通</div><div class="page-sub">' + esc(currentClass() ? currentClass().name : '') + ' · 通讯录、通知、回复助手与资助</div><div class="tabs">' + tabs + '</div>' + body;
}
function contactBookHtml() {
  const d = DB.data;
  const cards = currentStudents().map(s => {
    const showFull = state.showFullPhone === s.id;
    const phone = showFull ? s.phone : maskPhone(s.phone);
    return '<div class="contact-card">' + avatarHtml(s) +
      '<div class="cc-info"><div class="cc-name">' + esc(s.name) + ' <span class="cc-rel">的家长</span></div>' +
      '<div class="cc-rel">' + esc(s.guardian || '监护人') + ' · ' + esc(s.parentName || '—') + '</div>' +
      '<div class="cc-phone">📱 ' + esc(phone) + '</div></div>' +
      '<div class="cc-acts"><button class="btn btn-ico" data-action="togglePhone" data-id="' + s.id + '" title="显示/隐藏完整号码">👁️</button>' +
      '<button class="btn btn-ico" data-action="copyPhone" data-id="' + s.id + '" title="复制号码">📋</button>' +
      '<button class="btn btn-ico" data-action="contactCall" data-id="' + s.id + '" title="联系家长">📲</button></div></div>';
  }).join('');
  return '<div class="card"><div class="card-title">👨‍👩‍👧 学生家长通讯录 <span class="ct-sub">' + (d.settings.maskPhone ? '手机号默认脱敏' : '手机号未脱敏') + '</span></div>' +
    '<div class="contact-grid">' + cards + '</div></div>';
}
function contactNoticeHtml() {
  const d = DB.data;
  const rows = d.notices.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(n =>
    '<tr><td style="font-weight:600">' + esc(n.title) + '</td><td class="center"><span class="badge blue">' + esc(n.type) + '</span></td><td style="max-width:300px">' + esc(n.content) + '</td><td class="center">' + esc(n.date) + '</td>' +
    '<td class="actions"><button class="btn btn-ico" data-action="editNotice" data-id="' + n.id + '">✏️</button><button class="btn btn-ico danger" data-action="delNotice" data-id="' + n.id + '">🗑️</button></td></tr>').join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addNotice">＋ 发布通知</button></div>' +
    '<div class="card"><div class="card-title">📢 班级通知</div><div class="table-wrap"><table class="tbl"><thead><tr><th>标题</th><th>类型</th><th>内容</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">' + emptyHtml('暂无通知') + '</td></tr>') + '</tbody></table></div></div>';
}
function noticeFormModal(n) {
  n = n || {};
  openModal(
    '<div class="form-grid">' +
    field('title', '标题 *', n.title || '', 'text', 'full') +
    field('type', '类型', n.type || '通知', 'select', '', optionsHtml(['通知', '考试通知', '家长会', '安全提醒', '活动通知'], n.type)) +
    field('date', '日期', n.date || todayStr(), 'date') +
    field('content', '内容', n.content || '', 'textarea', 'full') +
    '</div>',
    { title: n.id ? '编辑通知' : '发布通知' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveNotice" data-id="' + (n.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveNotice(id) {
  const v = readFields();
  if (!v.title) { toast('请填写标题', 'err'); return; }
  const d = DB.data;
  if (id) { const x = d.notices.find(o => o.id === id); if (x) Object.assign(x, { title: v.title, type: v.type, content: v.content, date: v.date }); toast('通知已更新'); }
  else { d.notices.push({ id: uid('nt'), title: v.title, type: v.type, content: v.content, date: v.date }); toast('通知已发布'); }
  DB.save(); closeModal(); render();
}
function contactReplyHtml() {
  return '<div class="card"><div class="card-title">🤖 私聊回复助手 <span class="ct-sub">粘贴家长消息，自动识别主题并生成 3 种回复</span></div>' +
    '<div class="field"><label>家长消息</label><textarea id="replyInput" placeholder="例：老师您好，我家孩子最近上课老走神，成绩也下降了，您看怎么办？" style="min-height:100px"></textarea></div>' +
    '<div class="btn-row" style="margin-top:10px"><button class="btn primary" data-action="genReply">生成回复</button><button class="btn ghost" data-action="replyExample">填入示例</button></div>' +
    '<div id="replyResult"></div></div>';
}
function genReplyText(msg) {
  const s = msg || '';
  const topics = [];
  if (/作业|成绩|学习|补课|复习|考试|听写/.test(s)) topics.push('学业');
  if (/纪律|迟到|打架|违纪|上课说话|处分/.test(s)) topics.push('纪律');
  if (/安全|受伤|病|发烧|磕|碰/.test(s)) topics.push('安全');
  if (/座位|调位|同桌/.test(s)) topics.push('座位');
  if (/情绪|心理|厌学|焦虑|压力|抑郁/.test(s)) topics.push('心理');
  if (!topics.length) topics.push('日常');
  const topic = topics[0];
  const t = {
    '学业': { a: '收到，我会在课堂上多关注孩子的学习状态，及时和您同步。', b: '理解您的担心，学习上需要家校一起配合，我会找孩子聊聊并制定一个小目标，也请您在家多鼓励他。', c: '感谢反馈。学习问题我们分工配合：课堂由我督促，作业请您协助检查，两周后我们再沟通一次进展。' },
    '纪律': { a: '收到，我会找孩子谈话了解情况，并进行教育引导。', b: '很理解您的心情，孩子这个阶段需要耐心引导，我会先了解原因，再和您商量一个合适的教育方式。', c: '关于纪律问题，我会按规定批评教育并记录，也希望家长在家同步强调规则，共同帮助孩子改正。' },
    '安全': { a: '收到，孩子安全第一，我会第一时间关注并处理。', b: '请别担心，我先了解具体情况，必要时会联系校医，并及时向您反馈进展。', c: '已收到安全相关情况。请您先确认孩子目前状况，如有异常请及时就医，我这边同步做好记录与跟进。' },
    '座位': { a: '收到，我会综合身高和视力情况考虑调位。', b: '理解您的诉求，座位调整会结合孩子身高、视力与课堂表现统一安排，近期会给出方案。', c: '座位安排以公平和有利于学习为前提，我会在下次调整时一并考虑，也请您理解不能单独频繁调位。' },
    '心理': { a: '收到，我会多关注孩子的情绪状态，必要时联系心理老师。', b: '感谢您及时告诉我，孩子的心理健康很重要，我会私下和他聊聊，也建议您在家多倾听、少施压。', c: '关于孩子的情绪问题，我会安排一次谈心，并视情况对接学校心理辅导资源，请您同步观察并随时和我沟通。' }
  }[topic];
  return { topic, replies: ['【简洁肯定型】' + t.a, '【共情加建议型】' + t.b, '【边界清晰型】' + t.c] };
}
function contactAidHtml() {
  const d = DB.data;
  const rows = d.aids.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(a => {
    const st = getStudent(a.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div></div></div></td>' +
      '<td class="center"><span class="badge purple">' + esc(a.type) + '</span></td><td>' + esc(a.desc) + '</td><td class="center">' + esc(a.date) + '</td>' +
      '<td class="actions"><button class="btn btn-ico danger" data-action="delAid" data-id="' + a.id + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addAid">＋ 新增资助记录</button></div>' +
    '<div class="card"><div class="card-title">💝 贫困生资助台账</div><div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>类型</th><th>说明</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">' + emptyHtml('暂无资助记录') + '</td></tr>') + '</tbody></table></div></div>';
}
function aidFormModal() {
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = stu.map(s => '<option value="' + s.id + '">' + esc(s.name) + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('type', '类型', '困难补助', 'select', '', optionsHtml(['困难补助', '营养餐', '校服减免', '课后服务减免', '其他'], '困难补助')) +
    field('date', '日期', todayStr(), 'date') +
    field('desc', '说明', '', 'textarea', 'full') +
    '</div>',
    { title: '新增资助记录' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveAid">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveAid() {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  DB.data.aids.push({ id: uid('ad'), studentId: v.studentId, type: v.type, desc: v.desc, date: v.date || todayStr() });
  DB.save(); closeModal(); render();
  toast('资助记录已添加');
}

/* ================= 模块：学生评价 ================= */
function renderEvaluation() {
  const tab = state.evalTab || 'comment';
  const tabs = [['comment', '评语'], ['five', '五育评价'], ['abcd', 'ABCD 分层'], ['archive', '成长档案']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="evalTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'comment' ? evalCommentHtml() : tab === 'five' ? evalFiveHtml() : tab === 'abcd' ? evalAbcdHtml() : evalArchiveHtml();
  return '<div class="page-title">⭐ 学生评价</div><div class="page-sub">' + esc(currentClass() ? currentClass().name : '') + ' · 评语、五育评价与成长档案</div><div class="tabs">' + tabs + '</div>' + body;
}
function generateComment(st) {
  const d = DB.data;
  const weight = d.settings.commentTeacherWeight || 0.7;
  const rank = st.classRank || '—';
  const total = st.totalScore || '—';
  const level = total >= 90 ? '非常优秀' : total >= 80 ? '表现良好' : total >= 70 ? '稳步提升' : total >= 60 ? '基础扎实但需努力' : '需要重点关注';
  const warns = (st.warningTags || []).filter(w => w !== '学困生').length ? '，同时老师注意到你' + (st.warningTags || []).filter(w => w !== '学困生').join('、') + '，希望你能正视并改进' : '';
  const praise = total >= 80 ? '学习态度认真，作业完成质量高' : total >= 60 ? '学习态度端正，能够按时完成作业' : '有上进心，但学习方法还需要改进';
  const self = (1 - weight) >= 0.2 ? '希望你继续保持' : '期待你下次带来更好的表现';
  return st.name + '同学：本学期你' + praise + '，综合成绩 ' + total + ' 分，班级排名第 ' + rank + ' 名，整体处于' + level + '水平' + warns + '。' + self + '，老师相信你会越来越棒！';
}
function evalCommentHtml() {
  const d = DB.data;
  if (!d.comments) d.comments = {};
  const stu = currentStudents().slice().sort((a, b) => (a.classRank || 999) - (b.classRank || 999));
  const rows = stu.map(st => {
    const text = d.comments[st.id] || generateComment(st);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st.name) + '</div><div class="stu-no">第 ' + (st.classRank || '—') + ' 名</div></div></div></td>' +
      '<td><textarea class="comment-box" data-comment="' + st.id + '" style="width:100%;min-height:64px;border:1px solid var(--border);border-radius:10px;padding:8px 10px;font-size:12.5px;resize:vertical;font-family:inherit">' + esc(text) + '</textarea></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="genAllComments">一键生成全部评语</button><button class="btn outline" data-action="saveComments">保存评语</button><button class="btn outline" data-action="exportCommentsCsv">导出评语 CSV</button></div>' +
    '<div class="card"><div class="card-title">💬 个性化评语 <span class="ct-sub">按成绩分层与教师权重 ' + Math.round((d.settings.commentTeacherWeight || 0.7) * 100) + '% 自动生成，可编辑</span></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th style="width:150px">学生</th><th>评语</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}
function evalFiveHtml() {
  const d = DB.data;
  const stu = currentStudents().slice().sort((a, b) => (a.classRank || 999) - (b.classRank || 999));
  const rows = stu.map(st => {
    const f = d.fiveEval[st.id] || { moral: 80, academic: 80, physical: 80, artistic: 80, practice: 80, note: '' };
    return '<tr data-sid="' + st.id + '"><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st.name) + '</div></div></div></td>' +
      '<td class="num">' + f.moral + '</td><td class="num">' + f.academic + '</td><td class="num">' + f.physical + '</td><td class="num">' + f.artistic + '</td><td class="num">' + f.practice + '</td>' +
      '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(f.note) + '">' + esc(f.note || '—') + '</td>' +
      '<td class="actions"><button class="btn btn-ico" data-action="editFive" data-id="' + st.id + '">✏️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn outline" data-action="exportFiveCsv">导出五育 CSV</button></div>' +
    '<div class="card"><div class="card-title">🌟 五育评价 <span class="ct-sub">品德 / 学业 / 身心 / 艺术 / 实践（0-100）</span></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>品德</th><th>学业</th><th>身心</th><th>艺术</th><th>实践</th><th>备注</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}
function fiveFormModal(stuId) {
  const st = getStudent(stuId);
  const f = DB.data.fiveEval[stuId] || { moral: 80, academic: 80, physical: 80, artistic: 80, practice: 80, note: '' };
  openModal(
    '<div class="form-grid">' +
    field('moral', '品德', f.moral, 'number', 'min="0" max="100"') +
    field('academic', '学业', f.academic, 'number', 'min="0" max="100"') +
    field('physical', '身心', f.physical, 'number', 'min="0" max="100"') +
    field('artistic', '艺术', f.artistic, 'number', 'min="0" max="100"') +
    field('practice', '实践', f.practice, 'number', 'min="0" max="100"') +
    field('note', '备注', f.note, 'textarea', 'full') +
    '</div>',
    { title: '五育评价 · ' + (st ? st.name : '') }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveFive" data-id="' + stuId + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveFive(stuId) {
  const v = readFields();
  const d = DB.data;
  d.fiveEval[stuId] = { moral: parseInt(v.moral, 10) || 0, academic: parseInt(v.academic, 10) || 0, physical: parseInt(v.physical, 10) || 0, artistic: parseInt(v.artistic, 10) || 0, practice: parseInt(v.practice, 10) || 0, note: v.note };
  DB.save(); closeModal(); render();
  toast('五育评价已保存');
}
function evalAbcdHtml() {
  const d = DB.data;
  const stu = currentStudents().slice().sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  const n = stu.length;
  const aN = Math.ceil(n * 0.25), bN = Math.ceil(n * 0.3), cN = Math.ceil(n * 0.3);
  const rows = stu.map((st, i) => {
    let level;
    if (i < aN) level = 'A';
    else if (i < aN + bN) level = 'B';
    else if (i < aN + bN + cN) level = 'C';
    else level = 'D';
    const cls = { A: 'green', B: 'blue', C: 'amber', D: 'red' }[level];
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st.name) + '</div><div class="stu-no">' + esc(st.no) + '</div></div></div></td>' +
      '<td class="num">' + (st.totalScore || '—') + '</td><td class="num">' + (st.classRank || '—') + '</td>' +
      '<td class="center"><span class="badge ' + cls + '" style="font-size:14px;padding:3px 12px">' + level + '</span></td></tr>';
  }).join('');
  return '<div class="card"><div class="card-title">🔠 ABCD 分层 <span class="ct-sub">按综合成绩自动分层：A 前 25% / B 前 55% / C 前 85% / D 其余</span></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>综合成绩</th><th>排名</th><th>层级</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}
function evalArchiveHtml() {
  const d = DB.data;
  const rows = currentStudents().slice().sort((a, b) => (a.classRank || 999) - (b.classRank || 999)).map(st => {
    const points = d.points.filter(p => p.studentId === st.id).length;
    const talks = d.talks.filter(t => t.studentId === st.id).length;
    const recites = d.recites.filter(r => r.studentId === st.id).length;
    const f = d.fiveEval[st.id];
    const avg5 = f ? Math.round((f.moral + f.academic + f.physical + f.artistic + f.practice) / 5) : '—';
    return '<tr style="cursor:pointer" data-action="openStudent" data-id="' + st.id + '"><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st.name) + '</div><div class="stu-no">' + esc(st.no) + '</div></div></div></td>' +
      '<td class="center"><span class="badge primary">' + points + ' 条</span></td><td class="center"><span class="badge blue">' + talks + ' 次</span></td><td class="center"><span class="badge amber">' + recites + ' 次</span></td>' +
      '<td class="center">' + avg5 + '</td><td class="num">' + (st.totalScore || '—') + '</td><td class="num">' + (st.classRank || '—') + '</td></tr>';
  }).join('');
  return '<div class="card"><div class="card-title">📁 成长档案汇总 <span class="ct-sub">点击行查看完整档案</span></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>积分记录</th><th>谈话记录</th><th>背诵检查</th><th>五育均分</th><th>综合成绩</th><th>排名</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

/* ================= 模块：工作管理 ================= */
function renderWork() {
  const tab = state.workTab || 'todo';
  const tabs = [['todo', '待办'], ['log', '工作日志'], ['talk', '谈心谈话']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="workTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'todo' ? workTodoHtml() : tab === 'log' ? workLogHtml() : workTalkHtml();
  return '<div class="page-title">📌 工作管理</div><div class="page-sub">待办四象限、工作日志与谈心谈话</div><div class="tabs">' + tabs + '</div>' + body;
}
const QUADRANTS = [
  ['紧急重要', 'q1'], ['重要不紧急', 'q2'], ['紧急不重要', 'q3'], ['不紧急不重要', 'q4']
];
function workTodoHtml() {
  const d = DB.data;
  const open = d.todos.filter(t => !t.done);
  const done = d.todos.filter(t => t.done);
  const quads = QUADRANTS.map(q => {
    const items = open.filter(t => t.quadrant === q[0]);
    const list = items.map(t =>
      '<div class="quad-todo"><span class="todo-check" data-action="toggleTodo" data-id="' + t.id + '"></span><span class="qt-text">' + esc(t.content) + '</span>' +
      '<span class="badge ' + (t.priority === '高' ? 'red' : t.priority === '中' ? 'amber' : 'green') + '">' + esc(t.priority) + '</span>' +
      '<span class="qt-due">' + esc(t.due || '—') + '</span>' +
      '<button class="btn btn-ico danger" data-action="delTodo" data-id="' + t.id + '" title="删除">✕</button></div>').join('');
    return '<div class="quad ' + q[1] + '"><div class="quad-title">' + q[0] + '（' + items.length + '）</div>' + (list || '<div class="empty" style="padding:14px;background:transparent">暂无</div>') + '</div>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addTodo">＋ 添加待办</button></div>' +
    '<div class="quad-grid">' + quads + '</div>' +
    (done.length ? '<div class="card" style="margin-top:16px"><div class="card-title">✅ 已完成（' + done.length + '）</div>' + done.slice(0, 12).map(t => '<div class="list-line"><div class="ll-main"><div class="ll-title" style="text-decoration:line-through;color:var(--text3)">' + esc(t.content) + '</div><div class="ll-sub">' + esc(t.quadrant) + ' · ' + esc(t.due || '') + '</div></div><span class="badge green">已完成</span></div>').join('') + '</div>' : '');
}
function todoFormModal(t) {
  t = t || {};
  openModal(
    '<div class="form-grid">' +
    field('content', '内容 *', t.content || '', 'text', 'full') +
    field('priority', '紧急程度', t.priority || '中', 'select', '', optionsHtml(['高', '中', '低'], t.priority)) +
    field('quadrant', '四象限', t.quadrant || '重要不紧急', 'select', '', optionsHtml(['紧急重要', '重要不紧急', '紧急不重要', '不紧急不重要'], t.quadrant)) +
    field('due', '截止时间', t.due || '', 'date') +
    '</div>',
    { title: t.id ? '编辑待办' : '添加待办' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveTodo" data-id="' + (t.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveTodo(id) {
  const v = readFields();
  if (!v.content) { toast('请填写待办内容', 'err'); return; }
  const d = DB.data;
  if (id) { const x = d.todos.find(o => o.id === id); if (x) Object.assign(x, { content: v.content, priority: v.priority, quadrant: v.quadrant, due: v.due }); toast('待办已更新'); }
  else { d.todos.push({ id: uid('td'), content: v.content, priority: v.priority, quadrant: v.quadrant, due: v.due, done: false }); toast('待办已添加'); }
  DB.save(); closeModal(); render();
}
function workLogHtml() {
  const d = DB.data;
  const rows = d.logs.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(l =>
    '<tr><td class="center">' + esc(l.date) + '</td><td>' + esc(l.content) + '</td>' +
    '<td class="log-thumbs-td">' + ((l.photos || []).map((p, i) =>
      '<img class="log-thumb" src="' + esc(p.data) + '" data-action="viewLogPhoto" data-log-id="' + l.id + '" data-idx="' + i + '" title="查看留痕" alt="留痕">').join('') || '<span class="hint" style="font-size:12px">—</span>') + '</td>' +
    '<td class="num">' + l.hours + ' 小时</td>' +
    '<td class="actions"><button class="btn btn-ico" data-action="editLog" data-id="' + l.id + '">✏️</button><button class="btn btn-ico danger" data-action="delLog" data-id="' + l.id + '">🗑️</button></td></tr>').join('');
  const total = d.logs.reduce((a, b) => a + (parseFloat(b.hours) || 0), 0);
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addLog">＋ 记录工作日志</button><span class="badge primary" style="margin-left:auto">累计 ' + d.logs.length + ' 条 · ' + total + ' 小时</span></div>' +
    '<div class="card"><div class="card-title">📓 工作日志</div><div class="table-wrap"><table class="tbl"><thead><tr><th>日期</th><th>内容</th><th>留痕</th><th>时长</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">' + emptyHtml('暂无日志') + '</td></tr>') + '</tbody></table></div></div>';
}

/* ---- 工作日志 · 工作留痕（拍照 / 上传截图） ---- */
const LOG_PHOTO_LIMIT = 6;
let logPhotosDraft = [];

function compressImageFile(file, cb) {
  const reader = new FileReader();
  reader.onload = function (ev) {
    const img = new Image();
    img.onload = function () {
      const MAX = 1280;
      let w = img.width || 800, h = img.height || 600;
      const scale = Math.min(1, MAX / Math.max(w, h));
      if (scale < 1) { w = Math.round(w * scale); h = Math.round(h * scale); }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      try {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        cb({ data: canvas.toDataURL('image/jpeg', 0.72), name: file.name || ('留痕-' + Date.now() + '.jpg'), ts: Date.now() });
      } catch (e) { cb({ data: ev.target.result, name: file.name || 'photo.jpg', ts: Date.now() }); }
    };
    img.onerror = function () { cb({ data: ev.target.result, name: file.name || 'photo.jpg', ts: Date.now() }); };
    img.src = ev.target.result;
  };
  reader.onerror = function () { cb(null); };
  reader.readAsDataURL(file);
}
function logStorageGuard(addLen) {
  try {
    const used = (JSON.stringify(DB.data) || '').length + (addLen || 0);
    if (used > 4200000) { toast('本地存储空间接近上限，请删除部分旧留痕或改用更小的图片', 'err'); return false; }
    return true;
  } catch (e) { return true; }
}
function addLogPhoto(file) {
  if (logPhotosDraft.length >= LOG_PHOTO_LIMIT) { toast('每条日志最多 ' + LOG_PHOTO_LIMIT + ' 张留痕', 'err'); return; }
  compressImageFile(file, function (p) {
    if (!p) { toast('图片读取失败', 'err'); return; }
    if (!logStorageGuard(p.data.length)) return;
    logPhotosDraft.push(p);
    renderLogPhotoPicker();
  });
}
function renderLogPhotoPicker() {
  const box = document.getElementById('logPhotoBox');
  if (!box) return;
  box.innerHTML = logPhotosDraft.map(function (p, i) {
    return '<div class="log-thumb-wrap"><img class="log-thumb" src="' + esc(p.data) + '" data-action="viewLogPhoto" data-idx="' + i + '" alt="留痕">' +
      '<button type="button" class="log-thumb-x" data-action="removeLogPhoto" data-idx="' + i + '" title="删除">×</button></div>';
  }).join('') || '<span class="hint" style="font-size:12px;color:var(--text3)">暂无留痕图片（最多 ' + LOG_PHOTO_LIMIT + ' 张）</span>';
}
function removeLogPhoto(idx) {
  if (idx >= 0 && idx < logPhotosDraft.length) logPhotosDraft.splice(idx, 1);
  renderLogPhotoPicker();
}
function viewLogPhoto(logId, idx) {
  let photos = logPhotosDraft;
  if (logId) { const x = DB.data.logs.find(o => o.id === logId); photos = (x && x.photos) || []; }
  const p = photos[idx];
  if (!p) return;
  openModal(
    '<div class="log-viewer"><img src="' + esc(p.data) + '" alt="工作留痕">' +
    '<div style="text-align:center;font-size:12px;color:var(--text3);margin-top:10px">' + esc(p.name || '留痕图片') + ' · ' + (idx + 1) + ' / ' + photos.length + '</div></div>',
    { title: '📎 工作留痕' }
  );
}

function logFormModal(l) {
  l = l || {};
  openModal(
    '<div class="form-grid">' +
    field('date', '日期', l.date || todayStr(), 'date') +
    field('hours', '时长（小时）', l.hours || 1, 'number', 'min="0.5" step="0.5"') +
    field('content', '内容 *', l.content || '', 'textarea', 'full') +
    '<div class="field full"><label>📎 工作留痕（拍照 / 上传截图）</label>' +
    '<div class="log-photo-pick">' +
    '<button type="button" class="btn small outline" id="logPhotoCameraBtn">📷 拍照</button>' +
    '<button type="button" class="btn small outline" id="logPhotoGalleryBtn">🖼️ 上传截图/图片</button>' +
    '<span class="hint" style="font-size:12px;color:var(--text3)">最多 ' + LOG_PHOTO_LIMIT + ' 张，自动压缩后保存</span>' +
    '</div><div id="logPhotoBox" class="log-thumbs"></div>' +
    '<input type="file" id="logPhotoCamera" accept="image/*" capture="environment" style="display:none">' +
    '<input type="file" id="logPhotoGallery" accept="image/*" multiple style="display:none">' +
    '</div>' +
    '</div>',
    { title: l.id ? '编辑日志' : '记录工作日志' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveLog" data-id="' + (l.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
  logPhotosDraft = (l.photos || []).map(p => typeof p === 'string' ? { data: p, name: '留痕-' + Date.now() + '.jpg', ts: Date.now() } : Object.assign({}, p));
  renderLogPhotoPicker();
  const camBtn = document.getElementById('logPhotoCameraBtn');
  const galBtn = document.getElementById('logPhotoGalleryBtn');
  const camIn = document.getElementById('logPhotoCamera');
  const galIn = document.getElementById('logPhotoGallery');
  if (camBtn) camBtn.addEventListener('click', function () { camIn.click(); });
  if (galBtn) galBtn.addEventListener('click', function () { galIn.click(); });
  camIn.addEventListener('change', function () { if (camIn.files && camIn.files[0]) addLogPhoto(camIn.files[0]); camIn.value = ''; });
  galIn.addEventListener('change', function () { const fs = galIn.files || []; for (let i = 0; i < fs.length; i++) addLogPhoto(fs[i]); galIn.value = ''; });
}
function saveLog(id) {
  const v = readFields();
  if (!v.content) { toast('请填写内容', 'err'); return; }
  const d = DB.data;
  const payload = { date: v.date || todayStr(), content: v.content, hours: parseFloat(v.hours) || 0, photos: logPhotosDraft.slice() };
  if (id) { const x = d.logs.find(o => o.id === id); if (x) Object.assign(x, payload); toast('日志已更新'); }
  else { d.logs.push(Object.assign({ id: uid('lg') }, payload)); toast('日志已记录'); }
  logPhotosDraft = [];
  DB.save(); closeModal(); render();
}
function workTalkHtml() {
  const d = DB.data;
  const rows = d.talks.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(t => {
    const st = getStudent(t.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div></div></div></td>' +
      '<td class="center"><span class="badge blue">' + esc(t.type) + '</span></td><td>' + esc(t.summary) + '</td><td>' + esc(t.next) + '</td><td class="center">' + esc(t.date) + '</td>' +
      '<td class="actions"><button class="btn btn-ico" data-action="editTalk" data-id="' + t.id + '">✏️</button><button class="btn btn-ico danger" data-action="delTalk" data-id="' + t.id + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addTalk">＋ 记录谈心谈话</button><button class="btn outline" data-action="exportTalks">导出 CSV</button></div>' +
    '<div class="card"><div class="card-title">💬 谈心谈话记录</div><div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>类型</th><th>内容摘要</th><th>后续跟进</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6">' + emptyHtml('暂无记录') + '</td></tr>') + '</tbody></table></div></div>';
}
function talkFormModal(t) {
  t = t || {};
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = stu.map(s => '<option value="' + s.id + '"' + (s.id === t.studentId ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('type', '类型', t.type || '学习指导', 'select', '', optionsHtml(['学习指导', '心理疏导', '纪律教育', '生涯规划', '其他'], t.type)) +
    field('date', '日期', t.date || todayStr(), 'date') +
    field('summary', '内容摘要', t.summary || '', 'textarea', 'full') +
    field('next', '后续跟进', t.next || '', 'text', 'full') +
    '</div>',
    { title: t.id ? '编辑谈话' : '记录谈心谈话' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveTalk" data-id="' + (t.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveTalk(id) {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  const d = DB.data;
  const payload = { studentId: v.studentId, type: v.type, summary: v.summary, next: v.next, date: v.date || todayStr() };
  if (id) { const x = d.talks.find(o => o.id === id); if (x) Object.assign(x, payload); toast('谈话已更新'); }
  else { d.talks.push(Object.assign({ id: uid('tk') }, payload)); toast('谈话已记录'); }
  DB.save(); closeModal(); render();
}

/* ================= 模块：安全特殊 ================= */
function renderSafety() {
  const tab = state.safeTab || 'physical';
  const tabs = [['physical', '特异体质'], ['retention', '控辍保学'], ['ledger', '安全台账'], ['mental', '心理健康']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="safeTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const meta = {
    physical: { title: '🩺 特异体质台账', icon: '🩺' },
    retention: { title: '📚 控辍保学台账', icon: '📚' },
    ledger: { title: '🛡️ 安全台账', icon: '🛡️' },
    mental: { title: '🧠 心理健康台账', icon: '🧠' }
  };
  const m = meta[tab];
  const list = DB.data.safety[tab] || [];
  const rows = list.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(r => {
    const st = getStudent(r.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div></div></div></td>' +
      '<td>' + esc(r.note) + '</td><td class="center">' + esc(r.date) + '</td>' +
      '<td class="actions"><button class="btn btn-ico" data-action="editSafety" data-tab="' + tab + '" data-id="' + r.id + '">✏️</button><button class="btn btn-ico danger" data-action="delSafety" data-tab="' + tab + '" data-id="' + r.id + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="page-title">🛡️ 安全特殊</div><div class="page-sub">特异体质、控辍保学、安全台账与心理健康管理</div><div class="tabs">' + tabs + '</div>' +
    '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addSafety" data-tab="' + tab + '">＋ 新增记录</button></div>' +
    '<div class="card"><div class="card-title">' + m.title + '</div><div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>说明</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">' + emptyHtml('暂无记录') + '</td></tr>') + '</tbody></table></div></div>';
}
function safetyFormModal(tab, rec) {
  rec = rec || {};
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = stu.map(s => '<option value="' + s.id + '"' + (s.id === rec.studentId ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('date', '日期', rec.date || todayStr(), 'date') +
    field('note', '说明', rec.note || '', 'textarea', 'full') +
    '</div>',
    { title: rec.id ? '编辑记录' : '新增记录' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveSafety" data-tab="' + tab + '" data-id="' + (rec.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveSafety(tab, id) {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  const d = DB.data;
  if (!d.safety[tab]) d.safety[tab] = [];
  const payload = { studentId: v.studentId, note: v.note, date: v.date || todayStr() };
  if (id) { const x = d.safety[tab].find(o => o.id === id); if (x) Object.assign(x, payload); toast('记录已更新'); }
  else { d.safety[tab].push(Object.assign({ id: uid('sf') }, payload)); toast('记录已添加'); }
  DB.save(); closeModal(); render();
}

/* ================= 模块：智能助手 ================= */
function renderAssistant() {
  const tab = state.assistTab || 'talk';
  const tabs = [['talk', '话术'], ['plan', '方案'], ['analysis', '分析'], ['doc', '文档'], ['remind', '提醒']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="assistTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'talk' ? assistTalkHtml() : tab === 'plan' ? assistPlanHtml() : tab === 'analysis' ? assistAnalysisHtml() : tab === 'doc' ? assistDocHtml() : assistRemindHtml();
  return '<div class="page-title">🤖 智能助手</div><div class="page-sub">本地规则与预设模板生成，不调用任何外部接口</div><div class="tabs">' + tabs + '</div>' + body;
}
function assistTalkHtml() {
  const cards = [
    { key: 'family', name: '家校沟通', ico: '📞', desc: '生成与家长沟通的短信/微信文案' },
    { key: 'discipline', name: '违纪批评教育', ico: '⚠️', desc: '生成批评教育谈话提纲' },
    { key: 'talk', name: '谈心引导', ico: '💬', desc: '生成与学生谈心的话术' },
    { key: 'parent', name: '家长会发言稿', ico: '📢', desc: '生成家长会发言稿' },
    { key: 'group', name: '班级群通知', ico: '👥', desc: '生成班级群通知文案' }
  ].map(c => '<div class="assist-card" data-action="assistGen" data-kind="' + c.key + '"><div class="a-ico">' + c.ico + '</div><div class="a-name">' + c.name + '</div><div class="a-desc">' + c.desc + '</div></div>').join('');
  return '<div class="assist-grid">' + cards + '</div><div class="card" style="margin-top:16px"><div class="card-title">✍️ 生成区</div>' +
    '<div class="form-grid"><div class="field"><label>学生姓名（可选）</label><input type="text" id="assistStu" placeholder="如：王梓涵"></div>' +
    '<div class="field"><label>事件 / 补充信息（可选）</label><input type="text" id="assistEvent" placeholder="如：上周数学考试成绩下滑"></div></div>' +
    '<div class="btn-row" style="margin-top:10px"><button class="btn primary" data-action="genAssistText" data-kind="family">生成家校沟通文案</button></div>' +
    '<div id="assistResult"></div></div>';
}
function assistText(kind, stuName, event) {
  const name = stuName || '该同学';
  const ev = event || '近期表现';
  const map = {
    family: '【' + name + '家长您好】我是' + DB.data.settings.teacherName + '。关于孩子' + ev + '的情况，想和您简单沟通一下：' +
      '孩子在校整体表现不错，' + ev + '需要我们共同关注。建议您在家多和孩子聊聊，我也会在学校持续跟进。' +
      '如有任何问题，随时可以联系我，我们一起帮助孩子进步。',
    discipline: '【与' + name + '谈话提纲】1. 先倾听：询问' + ev + '的具体经过，让他自己说明原因；' +
      '2. 再引导：帮助他认识行为的后果与对班级的影响；3. 定规则：共同约定改正目标和奖惩办法；' +
      '4. 给信任：表达老师相信他能改正，并约定一周后复查。',
    talk: '【与' + name + '谈心话术】"最近感觉怎么样？老师注意到你' + ev + '，有点担心你。' +
      '每个人都会有低谷，重要的是我们怎么面对。你可以把困难和我说说，我们一起想办法。" 先共情，再倾听，最后给建议。',
    parent: '【家长会发言稿】尊敬的各位家长：大家好！我是' + DB.data.settings.teacherName + '。感谢大家在百忙之中参加今天的家长会。' +
      '首先汇报班级情况：本学期班级整体学风良好，各项活动有序开展。关于' + ev + '，希望家长配合做好监督与鼓励。' +
      '最后强调安全教育与心理健康，让我们家校携手，共同守护孩子成长。谢谢大家！',
    group: '【班级群通知】各位家长好！' + ev + '，请家长们注意以下事项：1. 请配合学校做好相关准备；2. 如有特殊情况请提前与我联系；' +
      '3. 提醒孩子注意安全、按时作息。感谢大家的支持与配合！'
  };
  return map[kind];
}
function assistPlanHtml() {
  const plans = [
    { key: 'class', name: '班会方案', ico: '📋', desc: '主题班会完整方案', text: '【主题班会方案】\n一、主题：习惯养成与自律\n二、目标：帮助学生认识良好习惯的重要性，制定个人习惯清单\n三、准备：课件、习惯打卡表、小奖品\n四、流程：\n  1. 导入：讲一个关于习惯的小故事（5 分钟）\n  2. 讨论：学生分组讨论自己的好习惯/坏习惯（10 分钟）\n  3. 分享：小组代表发言（10 分钟）\n  4. 制定：每人填写《习惯养成打卡表》（8 分钟）\n  5. 总结：班主任寄语，约定两周后评比（5 分钟）\n五、延伸：每日打卡，月底评选"习惯之星"' },
    { key: 'build', name: '班级建设', ico: '🏫', desc: '班级建设整体方案', text: '【班级建设方案】\n一、目标：建设"团结、进取、温暖"的班集体\n二、组织：完善班委会与小组负责制，人人有岗位\n三、文化：设计班名、班训、班级公约与荣誉墙\n四、活动：每周一次主题班会、每月一次集体活动\n五、评价：量化积分制度 + 定期评优评先\n六、家校：每月至少一次家校沟通，重大事项及时联系' },
    { key: 'improve', name: '后进生转化', ico: '🌱', desc: '后进生转化工作方案', text: '【后进生转化方案】\n一、摸底：分析学困原因（基础薄弱/习惯/家庭/心理）\n二、建档：为每名后进生建立成长档案\n三、结对：安排学习伙伴，形成互助小组\n四、辅导：每周至少一次个别辅导，降低起点、小步快跑\n五、激励：多表扬进步，设置"进步之星"评选\n六、家校：定期与家长沟通，形成教育合力\n七、跟踪：每月评估一次转化效果，动态调整策略' },
    { key: 'style', name: '班风建设', ico: '🎯', desc: '班风建设实施方案', text: '【班风建设方案】\n一、核心：勤奋、守纪、友爱、上进\n二、公约：全班共同制定《班级公约》并签字\n三、示范：班干部带头，发挥榜样作用\n四、日常：晨读午练、两操一活动常抓不懈\n五、评比：每周班级之星、每月文明小组\n六、纠偏：对不良苗头及时教育，防微杜渐' },
    { key: 'event', name: '突发事件处置流程', ico: '🚨', desc: '突发事件处置流程', text: '【突发事件处置流程】\n一、立即处置：学生受伤→先送校医/就医，控制现场\n二、及时上报：第一时间报告年级组和学校领导\n三、通知家长：如实告知情况，安抚家长情绪\n四、调查记录：查明原因，做好记录留痕\n五、后续跟进：关注学生恢复情况，做好心理疏导\n六、总结反思：形成案例，完善预案' }
  ].map(p => '<div class="assist-card" data-action="showPlan" data-key="' + p.key + '"><div class="a-ico">' + p.ico + '</div><div class="a-name">' + p.name + '</div><div class="a-desc">' + p.desc + '</div></div>').join('');
  return '<div class="assist-grid">' + plans + '</div><div id="planResult"></div>';
}
function assistAnalysisHtml() {
  const d = DB.data;
  const stu = currentStudents();
  const latest = d.exams.filter(e => d.scores.some(s => s.examId === e.id)).sort((a, b) => a.date > b.date ? 1 : -1)[0];
  const list = latest ? d.scores.filter(s => s.examId === latest.id) : [];
  const cnt = list.length || stu.length;
  const avg = list.length ? Math.round(list.reduce((a, b) => a + b.total, 0) / list.length) : 0;
  const fail = latest ? list.filter(s => s.total < latest.total * 0.6).length : 0;
  const attRows = d.attendance.filter(a => currentStudents().some(s => s.id === a.studentId));
  const attRate = attRows.length ? Math.round(attRows.filter(a => a.status === '出勤').length / attRows.length * 1000) / 10 : 0;
  const text = '【' + (currentClass() ? currentClass().name : '本班') + '学情分析】\n' +
    '一、基本情况：全班共 ' + cnt + ' 人，' + (latest ? '最近一次考试为《' + latest.name + '》' : '暂无考试数据') + '。\n' +
    '二、成绩分析：班级平均分 ' + avg + ' 分，不及格 ' + fail + ' 人，需重点关注学困生。\n' +
    '三、考勤情况：班级出勤率 ' + attRate + '%，整体出勤良好。\n' +
    '四、存在问题：1. 部分学生基础薄弱，学科发展不均衡；2. 个别学生课堂参与度不高。\n' +
    '五、改进措施：1. 分层辅导，抓两头促中间；2. 加强课堂互动与作业面批；3. 家校联动，共同督促。';
  return '<div class="card"><div class="card-title">📊 基于本班真实数据生成学情分析</div>' +
    '<div class="mini-stat" style="margin-bottom:12px"><div class="ms"><b>' + cnt + '</b><span>班级人数</span></div><div class="ms"><b>' + avg + '</b><span>平均分</span></div><div class="ms"><b>' + fail + '</b><span>不及格人数</span></div><div class="ms"><b>' + attRate + '%</b><span>出勤率</span></div></div>' +
    '<button class="btn primary small" data-action="genAnalysisReport">生成学情分析</button><div id="analysisResult"></div></div>';
}
function assistDocHtml() {
  const docs = [
    { key: 'plan', name: '班主任工作计划', ico: '🗓️', text: '【班主任工作计划】\n一、班级基本情况：本班共 48 人，男生 24 人，女生 24 人，住校生 22 人。\n二、工作目标：1. 建设良好班风学风；2. 提升班级整体成绩；3. 培养学生良好习惯。\n三、具体措施：1. 加强常规管理，落实量化积分；2. 抓好课堂与作业质量；3. 开展主题班会与德育活动；4. 关注特殊学生，做好心理辅导；5. 加强家校沟通。\n四、每月重点：按月制定主题，逐步推进。' },
    { key: 'report', name: '学情报告', ico: '📄', text: '【学情报告】\n一、总体情况：班级学风良好，学生整体积极向上。\n二、成绩分析：平均分处于年级中上水平，尖子生稳定，临界生需提升。\n三、存在问题：部分学生偏科，个别学生自律性不足。\n四、改进建议：加强分层教学，落实培优补差，密切家校联系。' },
    { key: 'comment', name: '评语说明', ico: '💬', text: '【评语说明】\n一、原则：以鼓励为主，实事求是，体现个性。\n二、结构：优点 + 不足 + 期望三部分。\n三、要求：语气亲切，具体有针对性，避免空话套话。\n四、示例：见学生评价模块自动生成的个性化评语。' },
    { key: 'event', name: '突发事件情况说明', ico: '🚨', text: '【突发事件情况说明】\n一、事件经过：写清时间、地点、人物、起因、经过、结果。\n二、处置情况：写清第一时间采取的措施与上报情况。\n三、当前状态：写清学生现状与后续安排。\n四、经验教训：总结处置中的不足与改进措施。' },
    { key: 'meeting', name: '班会提纲', ico: '📋', text: '【班会提纲模板】\n主题：\n一、开场（2 分钟）：点明主题，激发兴趣\n二、主体（30 分钟）：1. 知识讲解/故事分享 2. 学生讨论 3. 代表发言\n三、总结（5 分钟）：班主任总结，布置任务\n四、延伸：课后实践/打卡活动' }
  ].map(doc => '<div class="assist-card" data-action="showDoc" data-key="' + doc.key + '"><div class="a-ico">' + doc.ico + '</div><div class="a-name">' + doc.name + '</div><div class="a-desc">查看模板内容</div></div>').join('');
  return '<div class="assist-grid">' + docs + '</div><div id="docResult"></div>';
}
function assistRemindHtml() {
  const d = DB.data;
  const today = todayStr();
  const cards = [];
  cards.push({ ico: '🎒', title: '开学提醒', days: daysBetween(today, d.settings.termStart), desc: '新学期开始日期 ' + d.settings.termStart, date: d.settings.termStart });
  cards.push({ ico: '🌴', title: '假期提醒', days: daysBetween(today, d.settings.summerStart), desc: '暑假开始 ' + d.settings.summerStart, date: d.settings.summerStart });
  d.exams.forEach(e => cards.push({ ico: '📝', title: e.name, days: daysBetween(today, e.date), desc: '考试日期 ' + e.date, date: e.date }));
  cards.push({ ico: '📅', title: '学期结束', days: daysBetween(today, d.settings.termEnd), desc: '学期结束 ' + d.settings.termEnd, date: d.settings.termEnd });
  cards.sort((a, b) => a.days - b.days);
  const html = cards.map(c => {
    const cls = c.days < 0 ? 'gray' : c.days <= 7 ? 'amber' : 'green';
    return '<div class="card" style="margin:0"><div class="card-title">' + c.ico + ' ' + esc(c.title) + '</div><div style="font-size:12.5px;color:var(--text2)">' + esc(c.desc) + '</div>' +
      '<div style="margin-top:8px"><span class="badge ' + cls + '">' + (c.days < 0 ? '已过 ' + Math.abs(c.days) + ' 天' : c.days === 0 ? '就是今天' : '还有 ' + c.days + ' 天') + '</span></div></div>';
  }).join('');
  return '<div class="grid-3">' + html + '</div>';
}

/* ================= 模块：学科工具 ================= */
function renderSubjectTools() {
  const tab = state.subjTab || 'lesson';
  const tabs = [['lesson', '备课'], ['paper', '试卷'], ['recite', '背书'], ['resource', '资源'], ['subject', '选科'], ['career', '生涯']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="subjTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'lesson' ? subjLessonHtml() : tab === 'paper' ? subjPaperHtml() : tab === 'recite' ? subjReciteHtml() : tab === 'resource' ? subjResourceHtml() : tab === 'subject' ? subjChoiceHtml() : subjCareerHtml();
  return '<div class="page-title">🧮 学科工具</div><div class="page-sub">备课、试卷、背书、资源、选科与生涯规划</div><div class="tabs">' + tabs + '</div>' + body;
}
function subjLessonHtml() {
  const d = DB.data;
  const rows = d.lessons.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(l =>
    '<tr><td style="font-weight:600">' + esc(l.title) + '</td><td class="center"><span class="badge" style="background:' + subjectColor(l.subject) + '22;color:' + subjectColor(l.subject) + '">' + esc(l.subject) + '</span></td><td style="max-width:300px">' + esc(l.content) + '</td><td class="center">' + esc(l.date) + '</td>' +
    '<td class="actions"><button class="btn btn-ico" data-action="editLesson" data-id="' + l.id + '">✏️</button><button class="btn btn-ico danger" data-action="delLesson" data-id="' + l.id + '">🗑️</button></td></tr>').join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addLesson">＋ 添加备课资料</button></div>' +
    '<div class="card"><div class="card-title">📖 备课资料库</div><div class="table-wrap"><table class="tbl"><thead><tr><th>标题</th><th>学科</th><th>内容</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">' + emptyHtml('暂无备课资料') + '</td></tr>') + '</tbody></table></div></div>';
}
function lessonFormModal(l) {
  l = l || {};
  const subjectOpts = Object.keys(DB.data.settings.subjectColors).map(s => '<option value="' + s + '"' + (s === l.subject ? ' selected' : '') + '>' + s + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    field('title', '标题 *', l.title || '', 'text', 'full') +
    '<div class="field"><label>学科</label><select data-field="subject">' + subjectOpts + '</select></div>' +
    field('date', '日期', l.date || todayStr(), 'date') +
    field('content', '内容', l.content || '', 'textarea', 'full') +
    '</div>',
    { title: l.id ? '编辑备课资料' : '添加备课资料' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveLesson" data-id="' + (l.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveLesson(id) {
  const v = readFields();
  if (!v.title) { toast('请填写标题', 'err'); return; }
  const d = DB.data;
  const payload = { title: v.title, subject: v.subject, content: v.content, date: v.date || todayStr() };
  if (id) { const x = d.lessons.find(o => o.id === id); if (x) Object.assign(x, payload); toast('备课资料已更新'); }
  else { d.lessons.push(Object.assign({ id: uid('ls') }, payload)); toast('备课资料已添加'); }
  DB.save(); closeModal(); render();
}
function subjPaperHtml() {
  const subjectOpts = Object.keys(DB.data.settings.subjectColors).filter(s => ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'].indexOf(s) >= 0).map(s => '<option value="' + s + '">' + s + '</option>').join('');
  return '<div class="card"><div class="card-title">📄 试卷模板生成</div>' +
    '<div class="field" style="max-width:280px"><label>选择学科</label><select id="paperSubject">' + subjectOpts + '</select></div>' +
    '<div class="btn-row" style="margin-top:10px"><button class="btn primary small" data-action="genPaper">生成试卷模板</button></div>' +
    '<div id="paperResult"></div></div>';
}
function paperTemplate(subject) {
  if (subject === '语文') {
    return '【语文试卷模板】\n一、古诗词默写（10 分）\n  1. ________，________。（《观沧海》）\n  2. ________，________。（《春》）\n二、阅读理解（30 分）\n  （一）课内现代文阅读（15 分）\n  （二）课外文言文阅读（15 分）\n三、作文（40 分）\n  题目：________\n  要求：中心明确，内容具体，字数不少于 600 字。\n四、附加题：名著阅读（20 分）';
  }
  if (subject === '数学') {
    return '【数学试卷模板】\n一、选择题（每题 3 分，共 30 分）\n  1. ________ 2. ________ 3. ________ 4. ________ 5. ________\n  6. ________ 7. ________ 8. ________ 9. ________ 10. ________\n二、填空题（每题 3 分，共 18 分）\n  11. ________ 12. ________ 13. ________ 14. ________ 15. ________ 16. ________\n三、解答题（共 52 分）\n  17.（8 分）计算题\n  18.（10 分）方程应用题\n  19.（12 分）几何证明题\n  20.（12 分）综合题\n  21.（10 分）拓展题';
  }
  if (subject === '英语') {
    return '【英语试卷模板】\n一、单项选择（每题 1 分，共 15 分）\n二、完形填空（每题 1 分，共 10 分）\n三、阅读理解（每题 2 分，共 20 分）\n  四篇阅读，每篇 2-3 题\n四、词汇运用（共 15 分）\n五、书面表达（20 分）\n  题目：________\n  要求：词数 80 词左右，内容完整，语法正确。';
  }
  return '【' + subject + '试卷模板】\n一、选择题（每题 2 分，共 20 分）\n二、填空题（每题 2 分，共 20 分）\n三、实验题（共 30 分）\n四、简答题 / 综合题（共 30 分）';
}
function subjReciteHtml() {
  const d = DB.data;
  const rows = d.recites.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(r => {
    const st = getStudent(r.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div></div></div></td>' +
      '<td>' + esc(r.content) + '</td><td class="center">' + (r.status === '已通过' ? '<span class="badge green">已通过</span>' : r.status === '未通过' ? '<span class="badge red">未通过</span>' : '<span class="badge amber">待检查</span>') + '</td><td class="center">' + esc(r.date) + '</td>' +
      '<td class="actions"><button class="btn btn-ico" data-action="editRecite" data-id="' + r.id + '">✏️</button><button class="btn btn-ico danger" data-action="delRecite" data-id="' + r.id + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addRecite">＋ 新增背诵检查</button></div>' +
    '<div class="card"><div class="card-title">📖 背诵检查记录</div><div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>内容</th><th>状态</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">' + emptyHtml('暂无记录') + '</td></tr>') + '</tbody></table></div></div>';
}
function reciteFormModal(r) {
  r = r || {};
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = stu.map(s => '<option value="' + s.id + '"' + (s.id === r.studentId ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('content', '背诵内容', r.content || '', 'text', 'full') +
    field('status', '状态', r.status || '待检查', 'select', '', optionsHtml(['待检查', '已通过', '未通过'], r.status)) +
    field('date', '日期', r.date || todayStr(), 'date') +
    '</div>',
    { title: r.id ? '编辑背诵检查' : '新增背诵检查' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveRecite" data-id="' + (r.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveRecite(id) {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  const d = DB.data;
  const payload = { studentId: v.studentId, content: v.content, status: v.status, date: v.date || todayStr() };
  if (id) { const x = d.recites.find(o => o.id === id); if (x) Object.assign(x, payload); toast('记录已更新'); }
  else { d.recites.push(Object.assign({ id: uid('rc') }, payload)); toast('记录已添加'); }
  DB.save(); closeModal(); render();
}
function subjResourceHtml() {
  const d = DB.data;
  const rows = d.resources.map(r =>
    '<tr><td style="font-weight:600">' + esc(r.title) + '</td><td class="center"><span class="badge blue">' + esc(r.type) + '</span></td><td>' + esc(r.link) + '</td><td>' + esc(r.note) + '</td>' +
    '<td class="actions"><button class="btn btn-ico" data-action="editResource" data-id="' + r.id + '">✏️</button><button class="btn btn-ico danger" data-action="delResource" data-id="' + r.id + '">🗑️</button></td></tr>').join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addResource">＋ 添加教学资源</button></div>' +
    '<div class="card"><div class="card-title">📦 教学资源库</div><div class="table-wrap"><table class="tbl"><thead><tr><th>标题</th><th>类型</th><th>链接</th><th>备注</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">' + emptyHtml('暂无资源') + '</td></tr>') + '</tbody></table></div></div>';
}
function resourceFormModal(r) {
  r = r || {};
  openModal(
    '<div class="form-grid">' +
    field('title', '标题 *', r.title || '', 'text', 'full') +
    field('type', '类型', r.type || '教案', 'select', '', optionsHtml(['教案', '课件', '练习', '视频', '文档', '其他'], r.type)) +
    field('link', '链接', r.link || '', 'text', 'full') +
    field('note', '备注', r.note || '', 'textarea', 'full') +
    '</div>',
    { title: r.id ? '编辑资源' : '添加教学资源' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveResource" data-id="' + (r.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveResource(id) {
  const v = readFields();
  if (!v.title) { toast('请填写标题', 'err'); return; }
  const d = DB.data;
  const payload = { title: v.title, type: v.type, link: v.link, note: v.note };
  if (id) { const x = d.resources.find(o => o.id === id); if (x) Object.assign(x, payload); toast('资源已更新'); }
  else { d.resources.push(Object.assign({ id: uid('rs') }, payload)); toast('资源已添加'); }
  DB.save(); closeModal(); render();
}
const COMBOS12 = ['物化生', '物化政', '物化地', '物生政', '物生地', '物政地', '史化生', '史化政', '史化地', '史生政', '史生地', '史政地'];
function subjChoiceHtml() {
  const d = DB.data;
  const stats = {};
  COMBOS12.forEach(c => stats[c] = 0);
  const choices = currentStudents().map(s => d.subjectChoices[s.id]).filter(Boolean);
  choices.forEach(c => { if (stats[c] != null) stats[c]++; });
  const maxN = Math.max.apply(null, Object.values(stats)) || 1;
  const bars = COMBOS12.map(c => '<div class="list-line"><div class="ll-main"><div class="ll-title">' + c + '</div><div class="progress" style="margin-top:4px"><i style="width:' + Math.round(stats[c] / maxN * 100) + '%;background:var(--primary)"></i></div></div><span class="badge primary">' + stats[c] + ' 人</span></div>').join('');
  return '<div class="grid-2"><div class="card"><div class="card-title">🧭 山西新高考 "3+1+2" 选科说明</div>' +
    '<div style="font-size:13px;color:var(--text2);line-height:1.9">' +
    '<p>🔹 <b>3</b>：语文、数学、外语（全国统考）</p>' +
    '<p>🔹 <b>1</b>：物理 / 历史 二选一（首选科目）</p>' +
    '<p>🔹 <b>2</b>：化学、生物、政治、地理 四选二（再选科目）</p>' +
    '<p>共 <b>12</b> 种组合，高校专业按首选科目分物理类与历史类录取。</p></div>' +
    '<div class="btn-row" style="margin-top:12px"><button class="btn primary small" data-action="addChoice">＋ 登记学生选科</button></div></div>' +
    '<div class="card"><div class="card-title">📊 组合统计（已选 ' + choices.length + ' 人）</div>' + bars + '</div></div>';
}
function choiceFormModal() {
  const d = DB.data;
  const unset = currentStudents().filter(s => !d.subjectChoices[s.id]).sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = unset.map(s => '<option value="' + s.id + '">' + esc(s.name) + '（' + esc(s.no) + '）</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + (opt || '<option value="">暂无未选科学生</option>') + '</select></div>' +
    field('combo', '选科组合', '物化生', 'select', '', optionsHtml(COMBOS12, '物化生')) +
    '</div>',
    { title: '登记学生选科' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveChoice">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveChoice() {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  DB.data.subjectChoices[v.studentId] = v.combo;
  DB.save(); closeModal(); render();
  toast('选科已登记');
}
function subjCareerHtml() {
  const d = DB.data;
  const rows = d.career.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(c => {
    const st = getStudent(c.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div></div></div></td>' +
      '<td class="center"><span class="badge purple">' + esc(c.type) + '</span></td><td>' + esc(c.content) + '</td><td class="center">' + esc(c.date) + '</td>' +
      '<td class="actions"><button class="btn btn-ico" data-action="editCareer" data-id="' + c.id + '">✏️</button><button class="btn btn-ico danger" data-action="delCareer" data-id="' + c.id + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addCareer">＋ 添加生涯规划记录</button></div>' +
    '<div class="card"><div class="card-title">🧭 学生生涯规划</div><div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>类型</th><th>内容</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">' + emptyHtml('暂无记录') + '</td></tr>') + '</tbody></table></div></div>';
}
function careerFormModal(c) {
  c = c || {};
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = stu.map(s => '<option value="' + s.id + '"' + (s.id === c.studentId ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('type', '类型', c.type || '兴趣探索', 'select', '', optionsHtml(['兴趣探索', '职业启蒙', '学习规划', '目标设定', '其他'], c.type)) +
    field('date', '日期', c.date || todayStr(), 'date') +
    field('content', '内容', c.content || '', 'textarea', 'full') +
    '</div>',
    { title: c.id ? '编辑记录' : '添加生涯规划记录' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveCareer" data-id="' + (c.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveCareer(id) {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  const d = DB.data;
  const payload = { studentId: v.studentId, type: v.type, content: v.content, date: v.date || todayStr() };
  if (id) { const x = d.career.find(o => o.id === id); if (x) Object.assign(x, payload); toast('记录已更新'); }
  else { d.career.push(Object.assign({ id: uid('cr') }, payload)); toast('记录已添加'); }
  DB.save(); closeModal(); render();
}

/* ================= 模块：日历假期 ================= */
function renderCalendar() {
  const today = todayStr();
  const y = state.calYear != null ? state.calYear : parseInt(today.slice(0, 4), 10);
  const m = state.calMonth != null ? state.calMonth : parseInt(today.slice(5, 7), 10) - 1;
  state.calYear = y; state.calMonth = m;
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeekday = first.getDay();
  const weeks = [];
  const cells = [];
  const prevDays = new Date(y, m, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) cells.push({ date: fmtDate(new Date(y, m - 1, prevDays - i)), other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: fmtDate(new Date(y, m, d)), other: false });
  let fill = 42 - cells.length;
  for (let i = 1; i <= fill; i++) cells.push({ date: fmtDate(new Date(y, m + 1, i)), other: true });

  const d = DB.data;
  const customMap = {};
  d.customHolidays.forEach(h => { if (!customMap[h.date]) customMap[h.date] = []; customMap[h.date].push(h); });
  const cdMap = {};
  d.countdowns.forEach(c => { if (!cdMap[c.date]) cdMap[c.date] = []; cdMap[c.date].push(c); });
  const todoMap = {};
  d.todos.forEach(t => { if (t.due) { if (!todoMap[t.due]) todoMap[t.due] = []; todoMap[t.due].push(t); } });

  const dayCells = cells.map(c => {
    const info = dayTags(c.date);
    const lunar = solar2lunar(parseInt(c.date.slice(0, 4), 10), parseInt(c.date.slice(5, 7), 10), parseInt(c.date.slice(8, 10), 10));
    const lunarLabel = lunar.lDay === 1 ? lunar.monthName : lunar.dayName;
    let tags = '';
    if (info.term) tags += '<span class="d-tag term">' + info.term + '</span>';
    info.tags.forEach(t => {
      const cls = t.type === 'legal' ? 'legal' : t.type === 'memorial' ? 'mem' : 'normal';
      tags += '<span class="d-tag ' + cls + '">' + esc(t.name) + '</span>';
    });
    const customs = customMap[c.date] || [];
    const cds = cdMap[c.date] || [];
    const todos = todoMap[c.date] || [];
    const dots = todos.map(t => '<span class="d-dot ' + (t.priority === '高' ? 'high' : t.priority === '中' ? 'mid' : 'low') + '" title="待办：' + esc(t.content) + '"></span>').join('');
    const emos = customs.map(h => '<span class="d-emo" title="' + esc(h.name) + '">' + (h.icon || '🎉') + '</span>').join('') +
      cds.map(c => '<span class="d-emo" title="' + esc(c.name) + '">' + (c.icon || '⏰') + '</span>').join('');
    const isToday = c.date === today;
    return '<div class="cal-day' + (c.other ? ' other' : '') + (isToday ? ' today' : '') + '" data-action="openDay" data-date="' + c.date + '">' +
      '<div class="d-num">' + parseInt(c.date.slice(8, 10), 10) + '</div>' +
      '<div class="d-lunar">' + esc(lunarLabel) + '</div>' + dots + emos +
      '<div class="d-tags">' + tags + '</div></div>';
  }).join('');

  const tp = termProgress();
  const vs = vacationStatus();
  const nh = nextHoliday(today);
  const side = '<div class="cal-side">' +
    '<div class="card next-holiday"><div class="card-title" style="color:#fff">🎉 下一个假日</div>' +
      (nh ? '<div class="nh-days">' + nh.days + '</div><div class="nh-name">' + nh.icon + ' ' + esc(nh.name) + '</div><div class="nh-sub">' + esc(nh.date) + ' · 还有 ' + nh.days + ' 天</div>' : '<div class="nh-days">—</div><div class="nh-name">暂无假期</div>') +
    '</div>' +
    '<div class="card term-prog"><div class="card-title">📈 学期进度</div>' +
      '<div class="tp-bar"><i style="width:' + tp.pct + '%"></i></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3)"><span>' + esc(d.settings.termStart) + '</span><span style="font-weight:700;color:var(--primary)">' + tp.pct + '%</span><span>' + esc(d.settings.termEnd) + '</span></div>' +
      '<div style="font-size:11.5px;color:var(--text3);margin-top:6px">已进行 ' + tp.passed + ' 天 / 共 ' + tp.total + ' 天</div></div>' +
    '<div class="card"><div class="card-title">🌴 寒暑假倒计时 <button class="btn ghost small" data-action="goSettings" style="margin-left:auto">去设置</button></div>' +
      '<div style="font-size:13px;color:var(--text2)">' + esc(vs.text) + '</div></div>' +
    '</div>';

  const ranges = [['90', '近三个月'], ['180', '近半年'], ['365', '近一年']];
  const range = state.legalRange || '90';
  const legalList = [];
  [fixedHolidays(y), fixedHolidays(y + 1), fixedHolidays(y + 2)].forEach(arr => arr.forEach(h => legalList.push(h)));
  d.customHolidays.forEach(h => legalList.push({ name: h.name, date: h.date, icon: h.icon || '🎉' }));
  legalList.sort((a, b) => a.date < b.date ? -1 : 1);
  const legalFiltered = legalList.filter(h => { const diff = daysBetween(today, h.date); return diff >= 0 && diff <= parseInt(range, 10); }).slice(0, 12);
  const legalHtml = legalFiltered.map(h => {
    const diff = daysBetween(today, h.date);
    const icon = h.icon || LEGAL_ICONS[h.name] || (customMap[h.date] && customMap[h.date][0] ? customMap[h.date][0].icon : '📅');
    return '<div class="legal-item"><div class="li-ico">' + (icon || '📅') + '</div><div class="li-info"><div class="li-name">' + esc(h.name) + '</div><div class="li-date">' + esc(h.date) + '</div></div><div class="li-days">' + daysText(h.date, today) + '</div></div>';
  }).join('');
  const customRows = d.customHolidays.slice().sort((a, b) => a.date < b.date ? -1 : 1).map(h =>
    '<div class="list-line"><div class="ll-main"><div class="ll-title">' + (h.icon || '🎉') + ' ' + esc(h.name) + '</div><div class="ll-sub">' + esc(h.date) + '</div></div>' +
    '<span class="badge gray">' + daysText(h.date, today) + '</span><button class="btn btn-ico danger" data-action="delCustomHoliday" data-id="' + h.id + '">🗑️</button></div>').join('');

  return '<div class="page-title">📅 日历假期</div><div class="page-sub">农历、节气、节日与假期倒计时</div>' +
    '<div class="cal-wrap">' +
    '<div class="card cal-card"><div class="cal-head"><div class="ch-title">' + y + ' 年 ' + (m + 1) + ' 月</div>' +
      '<div class="ch-nav"><button class="btn small" data-action="calNav" data-d="-1">‹</button><button class="btn small" data-action="calToday">今天</button><button class="btn small" data-action="calNav" data-d="1">›</button></div></div>' +
      '<div class="cal-week">' + ['日', '一', '二', '三', '四', '五', '六'].map(x => '<div>' + x + '</div>').join('') + '</div>' +
      '<div class="cal-days">' + dayCells + '</div></div>' + side + '</div>' +
    '<div class="grid-2" style="margin-top:16px"><div class="card"><div class="card-title">⏳ 法定节假日倒计时</div>' +
      '<div class="seg" style="margin-bottom:12px">' + ranges.map(r => '<button class="' + (range === r[0] ? 'on' : '') + '" data-action="legalRange" data-r="' + r[0] + '">' + r[1] + '</button>').join('') + '</div>' +
      '<div class="legal-list">' + legalHtml + '</div></div>' +
    '<div class="card"><div class="card-title">🎨 自定义节假日管理</div><div class="btn-row" style="margin-bottom:10px"><button class="btn primary small" data-action="addCustomHoliday">＋ 添加自定义节假日</button></div>' +
      (customRows || emptyHtml('暂无自定义节假日')) + '</div></div>';
}
function openDayModal(dateStr) {
  const d = DB.data;
  const customs = d.customHolidays.filter(h => h.date === dateStr);
  const cds = d.countdowns.filter(c => c.date === dateStr);
  const todos = d.todos.filter(t => t.due === dateStr);
  const info = dayTags(dateStr);
  const lunar = solar2lunar(parseInt(dateStr.slice(0, 4), 10), parseInt(dateStr.slice(5, 7), 10), parseInt(dateStr.slice(8, 10), 10));
  const tagLine = [].concat(info.tags.map(t => t.name), info.term ? [info.term] : []).map(esc).join(' · ') || '普通的一天';
  const rows = '<div style="margin-top:12px">' +
    (customs.length ? customs.map(h => '<div class="list-line"><div class="ll-main"><div class="ll-title">' + (h.icon || '🎉') + ' ' + esc(h.name) + '</div><div class="ll-sub">自定义节假日</div></div><button class="btn btn-ico danger" data-action="delCustomHoliday" data-id="' + h.id + '">🗑️</button></div>').join('') : '') +
    (cds.length ? cds.map(c => '<div class="list-line"><div class="ll-main"><div class="ll-title">' + (c.icon || '⏰') + ' ' + esc(c.name) + '</div><div class="ll-sub">倒数日</div></div><button class="btn btn-ico danger" data-action="delCountdown" data-id="' + c.id + '">🗑️</button></div>').join('') : '') +
    (todos.length ? todos.map(t => '<div class="list-line"><div class="ll-main"><div class="ll-title">📌 ' + esc(t.content) + '</div><div class="ll-sub">' + esc(t.quadrant) + ' · ' + esc(t.priority) + '优先级</div></div><span class="todo-check ' + (t.done ? 'done' : '') + '" data-action="toggleTodo" data-id="' + t.id + '">' + (t.done ? '✓' : '') + '</span></div>').join('') : '') +
    '</div>';
  openModal(
    '<div style="font-size:15px;font-weight:700">' + dateStr + ' · ' + esc(lunar.monthName + lunar.dayName) + '</div>' +
    '<div style="font-size:12.5px;color:var(--text3);margin-top:4px">' + tagLine + '</div>' +
    '<div class="btn-row" style="margin-top:14px"><button class="btn primary" data-action="calAddTodo" data-date="' + dateStr + '">＋ 添加待办</button><button class="btn outline" data-action="calAddHoliday" data-date="' + dateStr + '">🎨 自定义节假日</button></div>' + rows,
    { title: '日期详情' }
  );
}
function todoFromCalendarModal(dateStr) {
  openModal(
    '<div class="form-grid">' +
    field('content', '内容 *', '', 'text', 'full') +
    field('priority', '紧急程度', '中', 'select', '', optionsHtml(['高', '中', '低'], '中')) +
    field('quadrant', '四象限', '重要不紧急', 'select', '', optionsHtml(['紧急重要', '重要不紧急', '紧急不重要', '不紧急不重要'], '重要不紧急')) +
    field('due', '截止时间', dateStr, 'date') +
    '</div>',
    { title: '添加待办 · ' + dateStr }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveTodo" data-id="">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function customHolidayModal(dateStr) {
  const icons = ['🎉', '🎂', '🎓', '🏆', '🏃', '📝', '🏖️', '📋', '🩺', '🎒', '🧹', '⏰'];
  const chips = icons.map(ic => '<span class="chip' + (ic === '🎉' ? ' on' : '') + '" data-ico="' + ic + '" style="font-size:20px;padding:4px 10px">' + ic + '</span>').join('');
  openModal(
    '<div class="form-grid">' +
    field('name', '节日名称 *', '', 'text', 'full placeholder="如：校庆日"') +
    field('date', '日期', dateStr, 'date') +
    '<div class="field full"><label>选择图标</label><div class="chip-row" data-chipgroup="holidayIco">' + chips + '</div></div>' +
    '</div>',
    { title: '自定义节假日 · ' + dateStr }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveCustomHoliday">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveCustomHoliday() {
  const v = readFields();
  if (!v.name) { toast('请填写节日名称', 'err'); return; }
  let ico = '🎉';
  const on = document.querySelector('#modalBox [data-chipgroup="holidayIco"] .chip.on');
  if (on) ico = on.getAttribute('data-ico') || '🎉';
  DB.data.customHolidays.push({ id: uid('ch'), name: v.name, date: v.date || todayStr(), icon: ico });
  DB.save(); closeModal(); render();
  toast('自定义节假日已添加');
}

/* ================= 模块：数据管理 ================= */
function renderDataMgr() {
  const d = DB.data;
  const warnStu = d.students.filter(s => (s.warningTags || []).length);
  const overview = '<div class="stat-grid" style="margin-bottom:16px">' +
    statCard('var(--primary)', '班级数', d.classes.length, '个班级') +
    statCard('var(--info)', '学生数', d.students.length, '名学生') +
    statCard('var(--danger)', '预警学生数', warnStu.length, '名带预警标签') +
    statCard('var(--purple)', '家校记录数', d.contacts.length, '条沟通记录') +
    '</div>';
  const themeOpts = [['theme-blue', '教育蓝'], ['theme-green', '抹茶绿'], ['theme-orange', '温馨教育风'], ['theme-glass', '渐变毛玻璃']]
    .map(t => '<option value="' + t[0] + '"' + (d.settings.theme === t[0] ? ' selected' : '') + '>' + t[1] + '</option>').join('');
  const subjectRows = Object.keys(d.settings.subjectColors).map(k => k + ',' + d.settings.subjectColors[k]).join('\n');
  const ccNow = currentClass();
  const classNameValue = (ccNow && ccNow.name) ? ccNow.name : d.settings.className;
  const settingsForm = '<div class="card"><div class="card-title">⚙️ 系统设置</div><div class="form-grid">' +
    field('className', '班级名称（当前右上角选中的班级）', classNameValue, 'text', 'placeholder="保存后同步修改该班级名称"') +
    field('teacherName', '教师姓名', d.settings.teacherName, 'text', 'placeholder="如：郑老师"') +
    field('termStart', '学期开始', d.settings.termStart, 'date') +
    field('termEnd', '学期结束', d.settings.termEnd, 'date') +
    field('retireDate', '退休日期', d.settings.retireDate, 'date') +
    field('winterStart', '寒假开始', d.settings.winterStart, 'date') +
    field('winterEnd', '寒假结束', d.settings.winterEnd, 'date') +
    field('summerStart', '暑假开始', d.settings.summerStart, 'date') +
    field('summerEnd', '暑假结束', d.settings.summerEnd, 'date') +
    '<div class="field"><label>主题配色</label><select data-field="theme">' + themeOpts + '</select></div>' +
    '<div class="field"><label>评语权重（教师占比 %）</label><input type="number" data-field="commentTeacherWeight" min="0" max="100" value="' + Math.round((d.settings.commentTeacherWeight || 0.7) * 100) + '"></div>' +
    '<div class="field"><label>尖子生 划线方式</label><select data-field="topMode"><option value="pct"' + (d.settings.topMode !== 'score' ? ' selected' : '') + '>按百分位</option><option value="score"' + (d.settings.topMode === 'score' ? ' selected' : '') + '>按具体分数</option></select></div>' +
    '<div class="field"><label>尖子生 ' + (d.settings.topMode === 'score' ? '分数线（分）' : '百分位 %') + '</label><input type="number" data-field="topValue" min="1" max="' + (d.settings.topMode === 'score' ? '9999' : '50') + '" value="' + esc(d.settings.topMode === 'score' ? (d.settings.topScore || 0) : d.settings.topPercent) + '"></div>' +
    '<div class="field"><label>临界生 划线方式</label><select data-field="criticalMode"><option value="pct"' + (d.settings.criticalMode !== 'score' ? ' selected' : '') + '>按百分位</option><option value="score"' + (d.settings.criticalMode === 'score' ? ' selected' : '') + '>按具体分数</option></select></div>' +
    '<div class="field"><label>临界生 ' + (d.settings.criticalMode === 'score' ? '分数线（分）' : '百分位 %') + '</label><input type="number" data-field="criticalValue" min="1" max="' + (d.settings.criticalMode === 'score' ? '9999' : '90') + '" value="' + esc(d.settings.criticalMode === 'score' ? (d.settings.criticalScore || 0) : d.settings.criticalPercent) + '"></div>' +
    '<div class="field"><label>不及格生 划线方式</label><select data-field="failMode"><option value="pct"' + (d.settings.failMode !== 'score' ? ' selected' : '') + '>按百分位</option><option value="score"' + (d.settings.failMode === 'score' ? ' selected' : '') + '>按具体分数</option></select></div>' +
    '<div class="field"><label>不及格生 ' + (d.settings.failMode === 'score' ? '分数线（低于此分）' : '百分位（后 %）') + '</label><input type="number" data-field="failValue" min="1" max="' + (d.settings.failMode === 'score' ? '9999' : '90') + '" value="' + esc(d.settings.failMode === 'score' ? (d.settings.failScore || 0) : d.settings.failPercent) + '"></div>' +
    field('tagLibrary', '学生标签库（逗号分隔）', d.settings.tagLibrary.join(','), 'text', 'full') +
    field('subjectColors', '科目配色（每行一条"科目,颜色"）', subjectRows, 'textarea', 'full') +
    '<div class="field"><label class="hint" style="font-size:13px"><input type="checkbox" data-field="maskPhone" ' + (d.settings.maskPhone ? 'checked' : '') + '> 手机号脱敏</label></div>' +
    '<div class="field"><label class="hint" style="font-size:13px"><input type="checkbox" data-field="showClock" ' + (d.settings.showClock ? 'checked' : '') + '> 显示实时时钟</label></div>' +
    '</div><div class="btn-row" style="margin-top:14px"><button class="btn primary" data-action="saveSettings">保存设置</button></div></div>';
  const danger = '<div class="card"><div class="card-title">💾 数据备份与恢复</div><div class="btn-row">' +
    '<button class="btn primary" data-action="exportJson">导出 JSON 完整备份</button>' +
    '<button class="btn outline" data-action="importJson">导入 JSON 恢复</button>' +
    '<button class="btn outline" data-action="exportStudents">导出学生 CSV</button></div></div>' +
    '<div class="risk-zone"><div class="rz-title">⚠️ 危险操作区</div><div style="font-size:12.5px;color:var(--text2);margin-bottom:10px">以下操作会清空或重置本地数据，请谨慎操作。</div>' +
    '<div class="btn-row"><button class="btn danger" data-action="clearAllData">清除现有数据（保留班级与设置）</button><button class="btn danger" data-action="clearDemo">清空演示数据</button><button class="btn danger-solid" data-action="resetDemo">重新生成演示数据</button></div></div>';
  const syncCard = (typeof syncCardHtml === 'function') ? syncCardHtml() : '';
  const ver = (typeof APP_VERSION !== 'undefined' && APP_VERSION) ? APP_VERSION : '?';
  return '<div class="page-title">💾 数据管理</div><div class="page-sub">数据总览、备份恢复与系统设置</div>' + overview +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:10px">当前版本：v' + ver + '</div>' +
    settingsForm + '<div style="margin-top:16px">' + syncCard + '</div><div style="margin-top:16px">' + danger + '</div>';
}
function saveSettings() {
  const v = readFields();
  const d = DB.data;
  if (v.className) {
    d.settings.className = v.className;
    const ccNow = currentClass();
    if (ccNow) ccNow.name = v.className; /* 与右上角当前班级联动 */
  }
  d.settings.teacherName = v.teacherName || d.settings.teacherName;
  ['termStart', 'termEnd', 'retireDate', 'winterStart', 'winterEnd', 'summerStart', 'summerEnd'].forEach(k => { if (v[k]) d.settings[k] = v[k]; });
  if (v.theme) d.settings.theme = v.theme;
  d.settings.commentTeacherWeight = Math.min(1, Math.max(0, (parseInt(v.commentTeacherWeight, 10) || 70) / 100));
  d.settings.topMode = v.topMode === 'score' ? 'score' : 'pct';
  if (d.settings.topMode === 'score') d.settings.topScore = Math.max(0, parseInt(v.topValue, 10) || 0);
  else d.settings.topPercent = Math.min(50, Math.max(1, parseInt(v.topValue, 10) || 20));
  d.settings.criticalMode = v.criticalMode === 'score' ? 'score' : 'pct';
  if (d.settings.criticalMode === 'score') d.settings.criticalScore = Math.max(0, parseInt(v.criticalValue, 10) || 0);
  else d.settings.criticalPercent = Math.min(90, Math.max(1, parseInt(v.criticalValue, 10) || 40));
  d.settings.failMode = v.failMode === 'score' ? 'score' : 'pct';
  if (d.settings.failMode === 'score') d.settings.failScore = Math.max(0, parseInt(v.failValue, 10) || 0);
  else d.settings.failPercent = Math.min(90, Math.max(1, parseInt(v.failValue, 10) || 15));
  d.settings.maskPhone = !!v.maskPhone;
  d.settings.showClock = !!v.showClock;
  d.settings.tagLibrary = (v.tagLibrary || '').split(/[,，]/).map(x => x.trim()).filter(Boolean);
  const colors = {};
  (v.subjectColors || '').split(/\n/).forEach(line => {
    const parts = line.split(/[,，]/);
    if (parts.length >= 2 && parts[0].trim()) colors[parts[0].trim()] = parts[1].trim();
  });
  if (Object.keys(colors).length) d.settings.subjectColors = colors;
  DB.save(); applyTheme(); updateBrand(); render();
  toast('设置已保存');
}
function renderProfile() {
  const d = DB.data;
  const themeOpts = [['theme-blue', '教育蓝'], ['theme-green', '抹茶绿'], ['theme-orange', '温馨教育风'], ['theme-glass', '渐变毛玻璃']]
    .map(t => '<option value="' + t[0] + '"' + (d.settings.theme === t[0] ? ' selected' : '') + '>' + t[1] + '</option>').join('');
  return '<div class="page-title">👤 个人资料修改</div><div class="page-sub">修改教师信息、头像与显示偏好</div>' +
    '<div class="grid-2"><div class="card"><div class="card-title">👤 个人资料</div>' +
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">' + avatarHtml({ name: d.settings.teacherName, avatar: d.settings.avatar }, 'lg') +
    '<div><div style="font-weight:700;font-size:15px">' + esc(d.settings.teacherName) + '</div><div style="font-size:12px;color:var(--text3)">' + esc(d.settings.className) + ' · 班主任</div>' +
    '<button class="btn small outline" data-action="changeAvatar" style="margin-top:8px">更换头像</button></div></div>' +
    '<div class="form-grid">' +
    field('teacherName', '教师姓名', d.settings.teacherName, 'text') +
    field('className', '所在班级', d.settings.className, 'text') +
    '</div><div class="btn-row" style="margin-top:14px"><button class="btn primary" data-action="saveProfile">保存资料</button></div></div>' +
    '<div class="card"><div class="card-title">🎨 显示偏好</div><div class="form-grid">' +
    '<div class="field"><label>主题配色</label><select data-field="theme">' + themeOpts + '</select></div>' +
    '<div class="field"><label class="hint" style="font-size:13px"><input type="checkbox" data-field="maskPhone" ' + (d.settings.maskPhone ? 'checked' : '') + '> 手机号脱敏</label></div>' +
    '<div class="field"><label class="hint" style="font-size:13px"><input type="checkbox" data-field="showClock" ' + (d.settings.showClock ? 'checked' : '') + '> 显示实时时钟</label></div>' +
    '</div><div class="btn-row" style="margin-top:14px"><button class="btn primary" data-action="saveProfilePrefs">保存偏好</button></div></div></div>';
}
function saveProfile() {
  const v = readFields();
  const d = DB.data;
  if (v.teacherName) d.settings.teacherName = v.teacherName;
  if (v.className) d.settings.className = v.className;
  DB.save(); updateBrand(); render();
  toast('个人资料已保存');
}
function saveProfilePrefs() {
  const v = readFields();
  const d = DB.data;
  if (v.theme) d.settings.theme = v.theme;
  d.settings.maskPhone = !!v.maskPhone;
  d.settings.showClock = !!v.showClock;
  DB.save(); applyTheme(); render();
  toast('偏好已保存');
}


/* ================= 云同步（多设备实时同步） ================= */
/* 驱动：LeanCloud 国际版（免备案、国内可直连）/ 自建 WebDAV（需开启 CORS）
   策略：整库上传，版本号 rev 递增，新版本覆盖旧版本（最后保存者胜）；
   拉取覆盖前若本机还有未上传的修改，会自动在 localStorage 里备份一份，避免丢数据。 */

/* ===== 内置云同步配置（由维护者在构建前填入；anon 公钥本就是公开给浏览器的） =====
   作用：部署网址更换/新设备首次打开时，自动填入并恢复 Supabase 配置，无需手动重新绑定。
   supUrl/supKey 填入后请重新运行 python work/build.py 构建再部署。 */
window.DEFAULT_SYNC = Object.assign({
  provider: 'supabase',
  supUrl: 'https://nkfspiaeelwnedsqjveq.supabase.co',  // Supabase Project URL（内置，自动恢复）
  supKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZnNwaWFlZWx3bmVkc3FqdmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTQ4MzQsImV4cCI6MjEwMjI3MDgzNH0.LoE2sWBZFlQn2iLxXbJC6AKkpleSjpTAgDXtkmyl3yQ',  // anon public（公钥）
  syncKey: 'main'   // 必须与你在工作台“同步空间标识”里填的一致
}, window.DEFAULT_SYNC || {});

const SYNC_DEVICE_KEY = 'banzhuren_device_id';
const SYNC_BACKUP_PREFIX = 'banzhuren_sync_backup_';
const SYNC_POLL_MS = 30000;   /* 自动拉取间隔 */
const SYNC_CHUNK_SIZE = 60000; /* LeanCloud 单对象上限约 128KB，留余量分块 */

function syncDeviceId() {
  try {
    let id = localStorage.getItem(SYNC_DEVICE_KEY);
    if (!id) {
      id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(SYNC_DEVICE_KEY, id);
    }
    return id;
  } catch (e) { return 'dev-' + Date.now().toString(36); }
}
function syncNowIso() { return new Date().toISOString(); }
function fmtSyncTime(iso) {
  if (!iso) return '从未';
  try {
    const d = new Date(iso);
    const p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  } catch (e) { return String(iso); }
}
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function base64FromBytes(bytes) {
  let bin = '';
  const STEP = 0x8000;
  for (let i = 0; i < bytes.length; i += STEP) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + STEP));
  return btoa(bin);
}
function bytesFromBase64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
/* 带超时的 fetch，避免断网时无限等待 */
function fetchTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(function () { ctrl.abort(); }, ms || 15000);
  opts = opts || {};
  opts.signal = ctrl.signal;
  return fetch(url, opts).finally(function () { clearTimeout(t); });
}

const SyncEngine = {
  _ready: false,
  _busy: false,
  _dirty: false,
  _applying: false,
  _pushT: null,
  _timer: null,
  _driverCache: null,

  settings: function () {
    const st = DB.data.settings;
    if (!st.sync) st.sync = { provider: '', appId: '', appKey: '', syncServer: '', supUrl: '', supKey: '', wdUrl: '', wdUser: '', wdPass: '', syncKey: 'main', rev: 0, updatedAt: '', lastSyncAt: '', lastError: '', deviceName: '' };
    return st.sync;
  },
  enabled: function () {
    const s = this.settings();
    if (s.provider === 'leancloud') return !!(s.appId && s.appKey);
    if (s.provider === 'supabase') return !!(s.supUrl && s.supKey);
    if (s.provider === 'webdav') return !!(s.wdUrl);
    return false;
  },
  applyDefaultIfNeeded: function () {
    const s = this.settings();
    if (this.enabled()) return false;                 /* 已配置过就不再覆盖 */
    const d = window.DEFAULT_SYNC || {};
    if (!d.supUrl || !d.supKey) return false;         /* 未内置配置 */
    s.provider = d.provider || 'supabase';
    s.supUrl = String(d.supUrl).trim();
    s.supKey = String(d.supKey).trim();
    if (d.syncKey) s.syncKey = String(d.syncKey);
    this._driverCache = null;
    this._saveMeta();
    return true;
  },
  init: function () {
    if (this._ready) return;
    this._ready = true;
    const self = this;
    /* 新网址/新设备首次打开：自动应用内置 Supabase 配置（随后 _pullSilent 会拉取云端数据） */
    this.applyDefaultIfNeeded();
    /* 在 DB.save 里挂钩：任何本地修改 2 秒后自动上传 */
    const origSave = DB.save.bind(DB);
    DB.save = function () {
      origSave();
      SyncEngine._onLocalChange();
    };
    /* 同浏览器多标签页即时同步 */
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY && e.newValue && e.newValue !== e.oldValue && !self._dirty && !self._busy && !self._applying) {
        self._applying = true;
        try { DB.load(); } catch (err) {} finally { self._applying = false; }
        render();
      }
    });
    /* 多设备轮询 + 回到前台/联网时主动拉取 */
    window.addEventListener('focus', function () { self._pullSilent(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) self._pullSilent(); });
    window.addEventListener('online', function () { if (self._dirty && self.enabled()) self.push(); });
    this._timer = setInterval(function () { self._pullSilent(); }, SYNC_POLL_MS);
  },
  _onLocalChange: function () {
    if (this._applying || !this.enabled()) return;
    this._dirty = true;
    this._setStatus('本地有未同步修改，稍后自动上传…', 'orange');
    clearTimeout(this._pushT);
    const self = this;
    this._pushT = setTimeout(function () { self.push(); }, 2000);
  },
  _setStatus: function (text, color) {
    const el = document.getElementById('syncStatus');
    if (el) el.innerHTML = '<span class="sync-dot ' + (color || 'gray') + '"></span><span>' + esc(text) + '</span>';
  },
  _saveMeta: function () {
    this._applying = true;
    try { DB.save(); } catch (e) {} finally { this._applying = false; }
  },
  driver: function () {
    const s = this.settings();
    if (this._driverCache && this._driverCache.type === s.provider) return this._driverCache;
    if (s.provider === 'leancloud') this._driverCache = makeLeanCloudDriver();
    else if (s.provider === 'supabase') this._driverCache = makeSupabaseDriver();
    else this._driverCache = makeWebDAVDriver();
    return this._driverCache;
  },
  serialize: function () {
    /* 云同步配置（凭据/rev 等）只留在本机，不进云端，避免多设备互相覆盖配置 */
    const clone = JSON.parse(JSON.stringify(DB.data));
    if (clone.settings && clone.settings.sync) delete clone.settings.sync;
    return JSON.stringify(clone);
  },
  _compress: async function (text) {
    if (typeof CompressionStream === 'undefined') return { enc: 'none', data: text };
    try {
      const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      return { enc: 'gzip', data: base64FromBytes(new Uint8Array(buf)) };
    } catch (e) { return { enc: 'none', data: text }; }
  },
  _decompress: async function (payload, enc) {
    if (enc === 'gzip') {
      try {
        const stream = new Blob([bytesFromBase64(payload)]).stream().pipeThrough(new DecompressionStream('gzip'));
        const buf = await new Response(stream).arrayBuffer();
        return new TextDecoder().decode(buf);
      } catch (e) { throw new Error('云端数据解压失败'); }
    }
    return payload;
  },
  push: async function () {
    if (!this.enabled() || this._busy) return;
    this._busy = true;
    this._setStatus('正在上传同步…', 'blue');
    try {
      const drv = this.driver();
      const remote = await drv.getMeta();
      const cur = this.settings();
      if (remote && (remote.rev || 0) > (cur.rev || 0)) {
        if (this._dirty) {
          /* 云端有更新且本机有未同步修改：以本机为准上传（最后保存者胜），云端旧版先备份防丢 */
          try {
            const rp = await drv.fetchPayload(remote);
            try { localStorage.setItem(SYNC_BACKUP_PREFIX + 'remote_' + Date.now(), rp); } catch (e2) {}
          } catch (e3) {}
          this._setStatus('云端有新版本，本机有未同步修改 → 以本机为准上传（云端已备份）', 'orange');
        } else {
          /* 云端有更新且本机干净：先拉取再上传 */
          this._setStatus('云端有更新，先拉取再上传…', 'blue');
          const ok = await this._pull(true, true);
          if (!ok) { this._setStatus('先拉取失败，已暂停上传', 'red'); return; }
        }
        /* 版本号取 max(本地, 云端)+1，保证云端版本严格递增 */
        const sRev = this.settings();
        if ((remote.rev || 0) > (sRev.rev || 0)) sRev.rev = remote.rev || 0;
      }
      const s2 = this.settings();
      const comp = await this._compress(this.serialize());
      const payload = comp.data;
      const meta = {
        syncKey: s2.syncKey || 'main',
        rev: (s2.rev || 0) + 1,
        updatedAt: syncNowIso(),
        deviceId: syncDeviceId(),
        checksum: hashStr(payload),
        size: payload.length,
        enc: comp.enc
      };
      await drv.push(payload, meta);
      const s3 = this.settings();
      s3.rev = meta.rev;
      s3.updatedAt = meta.updatedAt;
      s3.lastSyncAt = meta.updatedAt;
      s3.lastError = '';
      this._dirty = false;
      this._saveMeta();
      this._setStatus('已同步 · ' + fmtSyncTime(s3.lastSyncAt), 'green');
    } catch (e) {
      const s2 = this.settings();
      s2.lastError = e.message || String(e);
      this._saveMeta();
      this._setStatus('同步失败：' + (e.message || '网络错误'), 'red');
      console.warn('云同步失败', e);
    } finally {
      this._busy = false;
    }
  },
  _pullSilent: function () {
    /* 自动拉取：本地有未同步修改时跳过，避免覆盖刚输入的内容（稍后会由 push 合并上传） */
    if (!this.enabled() || this._busy || this._dirty) return;
    const self = this;
    this._pull(true, false).catch(function () {});
  },
  pull: function (silent) {
    return this._pull(!!silent, false);
  },
  _pull: async function (silent, force) {
    const s = this.settings();
    if (!this.enabled()) return false;
    if (this._busy && !force) return false;
    this._busy = true;
    if (!silent) this._setStatus('正在拉取…', 'blue');
    try {
      const drv = this.driver();
      const remote = await drv.getMeta();
      if (!remote) {
        if (!silent) { this._setStatus('云端暂无数据，请先在其他设备上传', 'orange'); toast('云端暂无数据'); }
        return false;
      }
      const localRev = s.rev || 0;
      const remoteNewer = (remote.rev || 0) > localRev ||
        ((remote.rev || 0) === localRev && (remote.updatedAt || '') > (s.updatedAt || ''));
      if (!remoteNewer) {
        if (!silent) { this._setStatus('已是最新版本', 'green'); toast('已是最新'); }
        return false;
      }
      const payload = await drv.fetchPayload(remote);
      if (hashStr(payload) !== (remote.checksum || '')) throw new Error('云端数据校验失败');
      const text = await this._decompress(payload, remote.enc || 'none');
      let remoteData;
      try { remoteData = JSON.parse(text); } catch (e) { throw new Error('云端数据解析失败'); }
      if (this._dirty) {
        try { localStorage.setItem(SYNC_BACKUP_PREFIX + Date.now(), text); } catch (e) {}
      }
      const oldSync = Object.assign({}, s);
      this._applying = true;
      try {
        DB.data = DB.normalize(remoteData);
        /* 云端数据不含同步配置，这里保留本机配置，只更新版本号 */
        const s2 = this.settings();
        s2.provider = oldSync.provider || '';
        s2.appId = oldSync.appId || '';
        s2.appKey = oldSync.appKey || '';
        s2.wdUrl = oldSync.wdUrl || '';
        s2.wdUser = oldSync.wdUser || '';
        s2.wdPass = oldSync.wdPass || '';
        s2.syncKey = oldSync.syncKey || 'main';
        s2.syncServer = oldSync.syncServer || '';
        s2.supUrl = oldSync.supUrl || '';
        s2.supKey = oldSync.supKey || '';
        s2.rev = remote.rev || 0;
        s2.updatedAt = remote.updatedAt || '';
        s2.lastSyncAt = syncNowIso();
        s2.lastError = '';
        this._dirty = false;
        DB.save();
      } finally { this._applying = false; }
      render();
      this._setStatus('已拉取云端最新数据 · ' + fmtSyncTime(this.settings().lastSyncAt), 'green');
      if (!silent) toast('已从云端同步最新数据');
      return true;
    } catch (e) {
      const s2 = this.settings();
      s2.lastError = e.message || String(e);
      this._saveMeta();
      this._setStatus('拉取失败：' + (e.message || '网络错误'), 'red');
      if (!silent) toast('拉取失败：' + (e.message || '网络错误'), 'err');
      return false;
    } finally {
      this._busy = false;
    }
  },
  disconnect: function () {
    const s = this.settings();
    s.provider = ''; s.appId = ''; s.appKey = ''; s.wdUrl = ''; s.wdUser = ''; s.wdPass = '';
    s.rev = 0; s.updatedAt = ''; s.lastSyncAt = ''; s.lastError = ''; s.syncKey = 'main';
    this._dirty = false;
    this._driverCache = null;
    this._saveMeta();
    render();
    toast('已断开云同步（本地数据保留）');
  },
  toggleProviderFields: function (v) {
    const lc = document.querySelector('.sync-fields-lc');
    const sb = document.querySelector('.sync-fields-sb');
    const wd = document.querySelector('.sync-fields-wd');
    if (lc) lc.style.display = (v === 'leancloud') ? '' : 'none';
    if (sb) sb.style.display = (v === 'supabase') ? '' : 'none';
    if (wd) wd.style.display = (v === 'webdav') ? '' : 'none';
  },
  statusHtml: function () {
    const s = this.settings();
    const en = this.enabled();
    let dot = 'gray', txt = '未配置云同步';
    if (en) {
      if (s.lastError) { dot = 'red'; txt = '连接异常：' + esc(s.lastError); }
      else if (this._dirty) { dot = 'orange'; txt = '本地有未同步修改，稍后自动上传…'; }
      else if (s.lastSyncAt) { dot = 'green'; txt = '已连接 · 上次同步 ' + fmtSyncTime(s.lastSyncAt) + ' · 设备 ' + esc(syncDeviceId().slice(0, 10)); }
      else { dot = 'blue'; txt = '已配置，等待首次同步'; }
    }
    return '<span class="sync-dot ' + dot + '"></span><span>' + txt + '</span>';
  },
  cardHtml: function () {
    const s = this.settings();
    const isLC = s.provider === 'leancloud';
    const isSB = s.provider === 'supabase';
    const isWD = s.provider === 'webdav';
    const providerOpts = [
      ['', '不使用云同步（仅本地）'],
      ['leancloud', 'LeanCloud 国际版（推荐，免备案）'],
      ['supabase', 'Supabase（PostgreSQL，免费额度大）'],
      ['webdav', '自建 WebDAV（需开启 CORS）']
    ].map(function (o) {
      return '<option value="' + o[0] + '"' + (s.provider === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');
    const lcFields = '<div class="sync-fields-lc"' + (isLC ? '' : ' style="display:none"') + '>' +
      field('syncAppId', 'AppID', s.appId, 'text', 'placeholder="控制台 → 设置 → 应用凭证 → AppID"') +
      field('syncAppKey', 'AppKey（客户端 Key）', s.appKey, 'password', 'placeholder="控制台 → 设置 → 应用凭证 → AppKey"') +
      field('syncServer', 'API 服务器地址（可选）', s.syncServer, 'text', 'placeholder="留空自动使用 https://appid前8位.api.lncldglobal.com"') +
      '</div>';
    const sbFields = '<div class="sync-fields-sb"' + (isSB ? '' : ' style="display:none"') + '>' +
      field('syncSupUrl', 'Supabase 项目地址（Project URL）', s.supUrl, 'text', 'placeholder="https://xxxx.supabase.co"') +
      field('syncSupKey', 'anon 公钥（anon public）', s.supKey, 'password', 'placeholder="项目设置 → API → anon public"') +
      '</div>';
    const wdFields = '<div class="sync-fields-wd"' + (isWD ? '' : ' style="display:none"') + '>' +
      field('syncWdUrl', 'WebDAV 文件地址', s.wdUrl, 'text', 'placeholder="https://主机/dav/banzhuren-sync.json 或目录"') +
      field('syncWdUser', 'WebDAV 用户名', s.wdUser, 'text') +
      field('syncWdPass', 'WebDAV 密码', s.wdPass, 'password') +
      '</div>';
    const body = lcFields + sbFields + wdFields + field('syncKey', '同步空间标识（同一账号多套数据可区分）', s.syncKey || 'main', 'text');
    const builtIn = (window.DEFAULT_SYNC && window.DEFAULT_SYNC.supUrl && s.supUrl === String(window.DEFAULT_SYNC.supUrl).trim())
      ? '<div style="font-size:12.5px;color:var(--ok, #16a34a);margin-bottom:8px">📌 已内置 Supabase 配置：更换网址/新设备打开时会自动恢复，无需重新填写。</div>' : '';
    return '<div class="card"><div class="card-title">☁️ 云同步（多设备实时同步）</div>' +
      '<div id="syncStatus" class="sync-status">' + this.statusHtml() + '</div>' + builtIn +
      '<div style="font-size:12.5px;color:var(--text3);margin-bottom:10px">在每台设备打开本工作台并填写<b>相同</b>的云同步凭据即可互通：本机修改约 2 秒自动上传，每 30 秒自动拉取，也可手动同步。</div>' +
      '<div class="form-grid"><div class="field"><label>同步方式</label><select data-field="syncProvider">' + providerOpts + '</select></div>' + body + '</div>' +
      '<div class="btn-row" style="margin-top:12px">' +
      '<button class="btn primary" data-action="saveSync">保存并立即同步</button>' +
      '<button class="btn outline" data-action="syncPull">立即拉取</button>' +
      '<button class="btn danger" data-action="syncDisconnect">断开云同步</button>' +
      '</div>' +
      '<div style="margin-top:12px;font-size:12px;color:var(--text3);line-height:1.9">' +
      '<b>冲突规则：</b>多台设备同时编辑时以“最后保存的版本”为准；覆盖前会自动在浏览器里备份一份（banzhuren_sync_backup_*），不会丢数据。<br>' +
      (isLC ? '<b>LeanCloud 配置步骤：</b>① 打开 leancloud.app 注册国际版（免备案、国内可直连）→ 创建应用；② 进入 设置 → 应用凭证，复制 AppID 和 AppKey；③ 粘贴后点“保存并立即同步”，首次同步会自动创建两个数据表（WorkbenchSyncMeta / WorkbenchSyncChunk）。' : '') +
      (isSB ? '<b>Supabase 配置步骤：</b>① 注册 supabase.com 并创建项目；② 打开 SQL Editor，执行建表 + 授权 SQL（完整代码见 README-云同步与部署.md）；③ 项目设置 → API，复制 Project URL 和 anon public 粘贴到上方；④ 点“保存并立即同步”。' : '') +
      (isWD ? '<b>WebDAV 要求：</b>服务器（如 Cloudreve、Nextcloud）必须开启跨域 CORS，并支持 PUT/GET/DELETE；填入文件完整地址即可。' : '') +
      '</div></div>';
  }
};
function syncCardHtml() { return SyncEngine.cardHtml(); }

/* ---------- LeanCloud 国际版驱动 ---------- */
function makeLeanCloudDriver() {
  const s = SyncEngine.settings();
  const host = s.syncServer ? (s.syncServer.replace(/\/+$/, '') + '/1.1/classes/') : ('https://' + s.appId.slice(0, 8).toLowerCase() + '.api.lncldglobal.com/1.1/classes/');
  const headers = { 'X-LC-Id': s.appId, 'X-LC-Key': s.appKey, 'Content-Type': 'application/json' };
  const where = encodeURIComponent(JSON.stringify({ syncKey: s.syncKey || 'main' }));
  let metaObjId = null;
  async function req(method, path, body) {
    const res = await fetchTimeout(host + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined }, 15000);
    const text = await res.text().catch(function () { return ''; });
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) {}
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) ? (data.error || data.message) : ('HTTP ' + res.status + ' ' + text.slice(0, 100));
      throw new Error(msg);
    }
    return data;
  }
  return {
    type: 'leancloud',
    getMeta: async function () {
      const data = await req('GET', 'WorkbenchSyncMeta?where=' + where + '&limit=1&order=-updatedAt');
      const rows = (data && data.results) || [];
      if (!rows.length) return null;
      const m = rows[0];
      metaObjId = m.objectId;
      return { syncKey: m.syncKey, rev: m.rev || 0, updatedAt: m.updatedAt || '', deviceId: m.deviceId || '', checksum: m.checksum || '', size: m.size || 0, enc: m.enc || 'none' };
    },
    fetchPayload: async function () {
      const data = await req('GET', 'WorkbenchSyncChunk?where=' + where + '&limit=1000');
      const rows = (data && data.results) || [];
      if (!rows.length) throw new Error('云端没有数据块');
      rows.sort(function (a, b) { return (a.idx || 0) - (b.idx || 0); });
      let out = '';
      rows.forEach(function (r) { out += r.payload || ''; });
      return out;
    },
    push: async function (payload, meta) {
      /* 先删旧块，再传新块，最后写 meta（保证 meta.rev 永远指向完整数据） */
      const old = await req('GET', 'WorkbenchSyncChunk?where=' + where + '&limit=1000');
      const oldRows = (old && old.results) || [];
      for (let i = 0; i < oldRows.length; i++) {
        try { await req('DELETE', 'WorkbenchSyncChunk/' + oldRows[i].objectId); } catch (e) {}
      }
      const chunks = [];
      for (let i = 0; i < payload.length; i += SYNC_CHUNK_SIZE) chunks.push(payload.slice(i, i + SYNC_CHUNK_SIZE));
      for (let i = 0; i < chunks.length; i++) {
        await req('POST', 'WorkbenchSyncChunk', { syncKey: meta.syncKey, idx: i, total: chunks.length, payload: chunks[i], rev: meta.rev, deviceId: meta.deviceId });
      }
      const body = { syncKey: meta.syncKey, rev: meta.rev, updatedAt: meta.updatedAt, deviceId: meta.deviceId, checksum: meta.checksum, size: meta.size, enc: meta.enc };
      if (metaObjId) { await req('PUT', 'WorkbenchSyncMeta/' + metaObjId, body); }
      else { const created = await req('POST', 'WorkbenchSyncMeta', body); metaObjId = created.objectId; }
    }
  };
}

/* ---------- WebDAV 驱动（需服务器开启 CORS） ---------- */
function makeWebDAVDriver() {
  const s = SyncEngine.settings();
  let url = (s.wdUrl || '').trim();
  if (!/\.json$/i.test(url)) url = url.replace(/\/+$/, '') + '/banzhuren-sync.json';
  let cached = null;
  function authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (s.wdUser || s.wdPass) {
      try { h['Authorization'] = 'Basic ' + btoa(unescape(encodeURIComponent(s.wdUser + ':' + s.wdPass))); } catch (e) {}
    }
    return h;
  }
  async function req(method, body) {
    const res = await fetchTimeout(url, { method: method, headers: authHeaders(), body: body ? JSON.stringify(body) : undefined }, 15000);
    if (res.status === 404 || res.status === 405) return null;
    if (!res.ok) {
      const txt = await res.text().catch(function () { return ''; });
      throw new Error('HTTP ' + res.status + (txt ? ' ' + txt.slice(0, 120) : ''));
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return {
    type: 'webdav',
    getMeta: async function () {
      const obj = await req('GET');
      if (!obj) return null;
      cached = obj;
      return { syncKey: obj.syncKey, rev: obj.rev || 0, updatedAt: obj.updatedAt || '', deviceId: obj.deviceId || '', checksum: obj.checksum || '', size: obj.size || 0, enc: obj.enc || 'none', payload: obj.payload || '' };
    },
    fetchPayload: async function (meta) {
      if (meta.payload != null && meta.payload !== '') return meta.payload;
      if (cached && cached.payload != null && cached.payload !== '') return cached.payload;
      const obj = await req('GET');
      return (obj && obj.payload) || '';
    },
    push: async function (payload, meta) {
      await req('PUT', { syncKey: meta.syncKey, rev: meta.rev, updatedAt: meta.updatedAt, deviceId: meta.deviceId, checksum: meta.checksum, size: meta.size, enc: meta.enc, payload: payload });
    }
  };
}


/* ---------- Supabase 驱动（PostgREST + anon key，需先建表并授权） ---------- */
function makeSupabaseDriver() {
  const s = SyncEngine.settings();
  const base = s.supUrl.replace(/\/+$/, '') + '/rest/v1/';
  const auth = { apikey: s.supKey, Authorization: 'Bearer ' + s.supKey, 'Content-Type': 'application/json' };
  let cached = null;
  async function req(method, path, body, prefer) {
    const headers = Object.assign({}, auth);
    if (prefer) headers['Prefer'] = prefer;
    const res = await fetchTimeout(base + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined }, 15000);
    const text = await res.text().catch(function () { return ''; });
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) {}
    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.hint)) ? (data.message || data.error || data.hint) : ('HTTP ' + res.status + ' ' + text.slice(0, 100));
      throw new Error(msg);
    }
    return data;
  }
  const keyExpr = function () { return 'sync_key=eq.' + encodeURIComponent(s.syncKey || 'main'); };
  return {
    type: 'supabase',
    getMeta: async function () {
      const rows = await req('GET', 'workbench_sync?' + keyExpr() + '&select=*');
      if (!rows || !rows.length) return null;
      const r = rows[0];
      cached = r;
      return { syncKey: r.sync_key, rev: r.rev || 0, updatedAt: r.updated_at || '', deviceId: r.device_id || '', checksum: r.checksum || '', size: r.size || 0, enc: r.enc || 'none', payload: r.payload || '' };
    },
    fetchPayload: async function (meta) {
      if (meta.payload != null && meta.payload !== '') return meta.payload;
      if (cached && cached.payload != null && cached.payload !== '') return cached.payload;
      const rows = await req('GET', 'workbench_sync?' + keyExpr() + '&select=payload');
      return (rows && rows[0] && rows[0].payload) || '';
    },
    push: async function (payload, meta) {
      const row = { sync_key: meta.syncKey, rev: meta.rev, updated_at: meta.updatedAt, device_id: meta.deviceId, checksum: meta.checksum, size: meta.size, enc: meta.enc, payload: payload };
      const rows = await req('POST', 'workbench_sync?on_conflict=sync_key', row, 'resolution=merge-duplicates,return=representation');
      if (rows && rows[0]) cached = rows[0];
    }
  };
}
/* ================= 应用核心 ================= */
const state = {
  module: 'dashboard',
  calYear: null, calMonth: null,
  studentQuery: '', personalStuId: '',
  gradeTab: 'entry', attTab: 'daily', hwTab: 'list', affTab: 'point', moralTab: 'class',
  contactTab: 'book', evalTab: 'comment', workTab: 'todo', safeTab: 'physical',
  assistTab: 'talk', subjTab: 'lesson', legalRange: '90',
  attDate: '', leaveFilter: '全部', showFullPhone: '', cmpA: '', cmpB: '', studentSort: { key: '', dir: 1 }
};
const MODULE_RENDER = {
  dashboard: renderDashboard,
  settings: renderSettings,
  classes: renderClasses,
  students: renderStudents,
  grades: renderGrades,
  attendance: renderAttendance,
  homework: renderHomework,
  leave: renderLeave,
  affairs: renderAffairs,
  moral: renderMoral,
  contact: renderContact,
  evaluation: renderEvaluation,
  work: renderWork,
  safety: renderSafety,
  assistant: renderAssistant,
  subjecttools: renderSubjectTools,
  calendar: renderCalendar,
  datamgr: renderDataMgr,
  profile: renderProfile
};
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); }
function render() {
  renderSidebar();
  renderTopbar();
  const content = document.getElementById('content');
  const fn = MODULE_RENDER[state.module];
  try {
    content.innerHTML = fn ? fn() : '<div class="empty">模块不存在</div>';
  } catch (e) {
    console.error('渲染失败:', e);
    content.innerHTML = '<div class="card"><div class="card-title">⚠️ 页面渲染出错</div><div style="color:var(--danger);font-size:13px">' + esc(e.message) + '</div></div>';
  }
}
function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  const html = NAV_GROUPS.map(g =>
    '<div class="nav-group"><div class="nav-group-title">' + esc(g.name) + '</div>' +
    g.items.map(it =>
      '<div class="nav-item' + (state.module === it.id ? ' active' : '') + (it.special ? ' special' : '') + '" data-action="nav" data-mod="' + it.id + '">' +
      '<span class="nav-ico">' + it.ico + '</span><span>' + esc(it.label) + '</span></div>').join('') +
    '</div>').join('');
  nav.innerHTML = html;
}
function brandTitle() {
  const name = DB.data.settings.teacherName || '某老师';
  const suffix = /老师$/.test(name) ? '' : '老师';
  return name + suffix + '的工作台';
}
function renderTopbar() {
  const d = DB.data;
  document.getElementById('brandTitle').textContent = '🏫 ' + brandTitle();
  const clsSel = document.getElementById('classSelect');
  clsSel.innerHTML = d.classes.map(c => '<option value="' + c.id + '"' + (c.id === d.settings.currentClassId ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') ||
    '<option value="">暂无班级</option>';
  const av = document.getElementById('avatarBtn');
  if (d.settings.avatar) av.innerHTML = '<img src="' + esc(d.settings.avatar) + '" alt="头像">';
  else av.innerHTML = '<span class="avatar-letter">' + esc((d.settings.teacherName || '某').charAt(0)) + '</span>';
  const now = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  document.getElementById('topDate').textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + week;
  document.getElementById('topClock').style.display = d.settings.showClock ? '' : 'none';
  /* 云同步状态角标（点击进入数据管理） */
  const oldSync = document.getElementById('syncBadge');
  if (oldSync) oldSync.remove();
  const syncBadge = document.createElement('span');
  syncBadge.className = 'sync-badge';
  syncBadge.id = 'syncBadge';
  syncBadge.setAttribute('data-action', 'nav');
  syncBadge.setAttribute('data-mod', 'datamgr');
  syncBadge.title = '云同步状态（点击管理）';
  if (SyncEngine && SyncEngine.enabled()) {
    syncBadge.textContent = SyncEngine._dirty ? '☁️…' : (SyncEngine.settings().lastError ? '☁️⚠️' : '☁️');
    syncBadge.style.color = SyncEngine.settings().lastError ? 'var(--danger)' : 'var(--primary)';
  } else {
    syncBadge.textContent = '☁️';
    syncBadge.style.opacity = '.35';
  }
  document.getElementById('topbarRight').insertBefore(syncBadge, document.getElementById('classSelectWrap'));
  /* 退休倒计时徽标（仅日历页显示） */
  const oldBadge = document.querySelector('#topbarRight .retire-badge');
  if (oldBadge) oldBadge.remove();
  if (state.module === 'calendar') {
    const badge = document.createElement('span');
    badge.className = 'retire-badge';
    const rd = d.settings.retireDate;
    const diff = rd ? daysBetween(todayStr(), rd) : null;
    badge.textContent = diff != null && diff >= 0 ? '🕰️ 退休倒计时 ' + diff + ' 天' : '退休日期未设置';
    badge.setAttribute('data-action', 'goSettings');
    document.getElementById('topbarRight').insertBefore(badge, document.getElementById('classSelectWrap'));
  }
}
function applyTheme() {
  document.documentElement.className = (DB.data.settings.theme || 'theme-blue');
  const colors = { 'theme-blue': '#2B7FFF', 'theme-green': '#2FB37A', 'theme-orange': '#E8743B', 'theme-glass': '#6D5DF6' };
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', colors[DB.data.settings.theme] || '#2B7FFF');
}
function updateBrand() {
  document.title = brandTitle();
  setFavicon();
}
function setFavicon() {
  try {
    const s = DB.data.settings;
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (s.avatar) {
      const img = new Image();
      img.onload = function () {
        ctx.save();
        ctx.beginPath(); ctx.arc(32, 32, 32, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, 0, 0, 64, 64);
        ctx.restore();
        setFaviconHref(canvas.toDataURL('image/png'));
      };
      img.src = s.avatar;
    } else {
      const colors = { 'theme-blue': '#2B7FFF', 'theme-green': '#2FB37A', 'theme-orange': '#E8743B', 'theme-glass': '#6D5DF6' };
      ctx.fillStyle = colors[s.theme] || '#2B7FFF';
      ctx.beginPath(); ctx.arc(32, 32, 32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((s.teacherName || '某').charAt(0), 32, 34);
      setFaviconHref(canvas.toDataURL('image/png'));
    }
  } catch (e) { /* 静默跳过 */ }
}
function setFaviconHref(dataUrl) {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = dataUrl;
}
function startClock() {
  setInterval(function () {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const el = document.getElementById('topClock');
    if (el) el.textContent = hh + ':' + mm + ':' + ss;
  }, 1000);
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('已复制到剪贴板'); }, function () { toast('复制失败，请手动复制', 'err'); });
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('已复制到剪贴板'); } catch (e) { toast('复制失败', 'err'); }
    ta.remove();
  }
}

/* ================= 动作处理 ================= */
const ACTIONS = {
  /* 基础 */
  closeModal: closeModal,
  closeDrawer: closeDrawer,
  toggleSidebar: function () { document.getElementById('sidebar').classList.toggle('open'); },
  closeSidebar: function () { document.getElementById('sidebar').classList.remove('open'); },
  nav: function (el) { state.module = el.dataset.mod; closeSidebar(); render(); },
  quick: function (el) {
    const mod = el.dataset.mod, p = el.dataset.p;
    state.module = mod;
    if (mod === 'grades' && p === 'score') state.gradeTab = 'entry';
    if (mod === 'homework' && p === 'add') { state.hwTab = 'list'; render(); homeworkFormModal(); return; }
    if (mod === 'leave' && p === 'add') { state.module = 'leave'; render(); leaveFormModal(); return; }
    if (mod === 'affairs' && p === 'vio') state.affTab = 'vio';
    if (mod === 'evaluation' && p === 'comment') state.evalTab = 'comment';
    if (mod === 'contact' && p === 'notice') state.contactTab = 'notice';
    if (mod === 'work' && p === 'todo') state.workTab = 'todo';
    if (mod === 'assistant') state.assistTab = 'talk';
    if (mod === 'students' && p === 'add') { render(); studentFormModal(); return; }
    render();
    if (mod === 'work' && p === 'todo') todoFormModal();
  },
  jump: function (el) {
    const mod = el.dataset.mod;
    state.module = mod;
    if (mod === 'leave') { state.leaveFilter = '待审批'; }
    if (mod === 'attendance') { state.attTab = 'depart'; }
    if (mod === 'students') { state.module = 'students'; }
    render();
  },
  statJump: function (el) {
    const target = el.dataset.target || '';
    const parts = target.split(':');
    state.module = parts[0];
    const tabMap = { attendance: 'attTab', affairs: 'affTab', work: 'workTab', homework: 'hwTab', grades: 'gradeTab', contact: 'contactTab', evaluation: 'evalTab', moral: 'moralTab', safety: 'safeTab', assistant: 'assistTab', subjecttools: 'subjTab', leave: 'leaveFilter' };
    if (parts[1] && tabMap[parts[0]]) state[tabMap[parts[0]]] = parts[1];
    closeSidebar();
    render();
  },
  changeAvatar: function () { document.getElementById('avatarFile').click(); },
  goSettings: function () { state.module = 'datamgr'; render(); },

  /* 班级 */
  setCurClass: function (el) { DB.data.settings.currentClassId = el.dataset.id; DB.save(); closeModal(); render(); toast('已切换仪表盘班级'); },
  openClass: function (el) { DB.data.settings.currentClassId = el.dataset.id; DB.save(); state.module = 'students'; render(); },
  addClass: function () { classFormModal(); },
  editClass: function (el) { const c = getClass(el.dataset.id); if (c) classFormModal(c); },
  saveClass: function (el) { saveClass(el.dataset.id); },
  delClass: function (el) {
    const c = getClass(el.dataset.id);
    confirmBox({ title: '删除班级', message: '确定删除班级「' + (c ? c.name : '') + '」吗？该班级学生不会删除。', danger: true, okText: '删除', onOk: function () {
      DB.data.classes = DB.data.classes.filter(x => x.id !== el.dataset.id);
      if (DB.data.settings.currentClassId === el.dataset.id) DB.data.settings.currentClassId = DB.data.classes[0] ? DB.data.classes[0].id : '';
      DB.save(); closeModal(); render(); toast('班级已删除');
    }});
  },

  /* 学生 */
  openStudent: function (el) { openStudentDrawer(el.dataset.id); },
  addStudent: function () { studentFormModal(); },
  editStudent: function (el) { const st = getStudent(el.dataset.id); if (st) studentFormModal(st); },
  saveStudent: function (el) { saveStudent(el.dataset.id); },
  sortStudents: function (el) {
    const k = el.dataset.key;
    const ss = state.studentSort = state.studentSort || { key: '', dir: 1 };
    if (ss.key === k) ss.dir = -ss.dir; else { ss.key = k; ss.dir = 1; }
    render();
  },
  delStudent: function (el) {
    const st = getStudent(el.dataset.id);
    confirmBox({ title: '删除学生', message: '确定删除学生「' + (st ? st.name : '') + '」吗？相关成绩、考勤等记录将一并删除。', danger: true, okText: '删除', onOk: function () {
      const id = el.dataset.id;
      const d = DB.data;
      d.students = d.students.filter(x => x.id !== id);
      d.scores = d.scores.filter(x => x.studentId !== id);
      d.attendance = d.attendance.filter(x => x.studentId !== id);
      d.leaves = d.leaves.filter(x => x.studentId !== id);
      d.points = d.points.filter(x => x.studentId !== id);
      d.violations = d.violations.filter(x => x.studentId !== id);
      d.contacts = d.contacts.filter(x => x.studentId !== id);
      d.aids = d.aids.filter(x => x.studentId !== id);
      d.talks = d.talks.filter(x => x.studentId !== id);
      d.recites = d.recites.filter(x => x.studentId !== id);
      d.departures = d.departures.filter(x => x.studentId !== id);
      d.career = d.career.filter(x => x.studentId !== id);
      d.seat.layout.forEach(cell => { if (cell.studentId === id) cell.studentId = ''; });
      DB.save(); closeDrawer(); render(); toast('学生已删除');
    }});
  },
  importStudents: function () { document.getElementById('importCsv').click(); },
  exportStudents: function () { exportStudentsOpen(); },
  exportStudentsRange: function () { exportStudentsRange(); },
  dashJump: function (el) {
    const mod = el.dataset.mod, tab = el.dataset.tab || '';
    state.module = mod;
    const tabMap = { attendance: 'attTab', affairs: 'affTab', work: 'workTab', homework: 'hwTab', grades: 'gradeTab', contact: 'contactTab', evaluation: 'evalTab', moral: 'moralTab', safety: 'safeTab', assistant: 'assistTab', subjecttools: 'subjTab', leave: 'leaveFilter' };
    if (tab && tabMap[mod]) state[tabMap[mod]] = tab;
    closeSidebar();
    render();
  },
  setClassExam: function () { const sel = document.getElementById('classExamSel'); if (sel) { state.classExamId = sel.value; render(); } },
  analysisDetail: function (el) { analysisDetailModal(el.dataset.target || ''); },
  addExamSubject: function (el) { addExamSubject(el.dataset.id); },
  removeExamSubject: function (el) { removeExamSubject(el.dataset.id, el.dataset.subject); },
  viewActivityPhoto: function (el) { viewActivityPhoto(el.dataset.id || '', parseInt(el.dataset.idx || '0', 10)); },
  removeActivityPhoto: function (el) { removeActivityPhoto(parseInt(el.dataset.idx || '0', 10)); },
  dashBlockMove: function (el) {
    const d = DB.data;
    const arr = d.settings.dashboard.blocks;
    const i = arr.findIndex(b => b.id === el.dataset.id);
    const j = i + (el.dataset.dir === 'up' ? -1 : 1);
    if (i >= 0 && j >= 0 && j < arr.length) { const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; DB.save(); render(); }
  },
  saveDashSettings: function () { saveDashSettings(); },
  jumpDash: function () { state.module = 'dashboard'; render(); },
  dashEditOpen: function () { dashEditOpen(); },
  dashEditSave: function () { dashEditSave(); },
  pickSuggestion: function (el) {
    const inputId = el.dataset.input;
    const sid = el.dataset.id;
    const st = getStudent(sid);
    if (!st) return;
    const inp = document.getElementById(inputId);
    closeSuggest();
    if (inputId === 'studentSearch') { if (inp) inp.value = st.name; state.studentQuery = st.name; render(); }
    else if (inputId === 'personalSearch') { const sel = document.getElementById('personalStu'); if (sel) sel.value = sid; state.personalStuId = sid; render(); }
    else if (inputId === 'classStuSearch') { if (inp) inp.value = st.name; state.classStuQuery = st.name; render(); }
  },

  /* 成绩 */
  addExam: function () { examFormModal(); },
  editExam: function (el) { const e = DB.data.exams.find(x => x.id === el.dataset.id); if (e) examFormModal(e); },
  saveExam: function (el) { saveExam(el.dataset.id); },
  delExam: function (el) {
    confirmBox({ title: '删除考试', message: '确定删除该考试及其全部成绩记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.exams = DB.data.exams.filter(x => x.id !== el.dataset.id);
      DB.data.scores = DB.data.scores.filter(x => x.examId !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('考试已删除');
    }});
  },
  enterScore: function (el) { enterScoreModal(el.dataset.id); },
  saveScores: function (el) { saveScores(el.dataset.id); },
  viewScores: function (el) { viewScoresModal(el.dataset.id); },
  exportExamCsv: function (el) { exportExamCsv(el.dataset.id); },
  subjectSettings: function () { subjectSettingsModal(); },
  saveSubjects: function () { saveSubjects(); },
  subjectPreset: function (el) { fillSubjectPreset(el.dataset.type); },
  scheduleSubjectSettings: function () { scheduleSubjectSettingsModal(); },
  saveScheduleSubjects: function () { saveScheduleSubjects(); },
  syncScheduleTeachers: function () { syncScheduleTeachers(); },
  refreshDutyRoster: function () { refreshDutyRoster(); },
  classAddSubject: function (el) { classAddSubject(el.dataset.id); },
  saveClassAddSubject: function (el) { saveClassAddSubject(el.dataset.id); },
  classRemoveSubject: function (el) { classRemoveSubject(el.dataset.id, el.dataset.subject); },
  openDeleteSubjectModal: function (el) { openDeleteSubjectModal(el.dataset.id); },
  confirmDeleteSubject: function (el) { confirmDeleteSubject(el.dataset.id, el.dataset.subject); },
  undoDeleteSubject: function () { undoDeleteSubject(); },
  attDetail: function (el) { attDetailModal(el.dataset.id); },
  moveGradeSubject: function (el) { moveGradeSubject(parseInt(el.dataset.idx, 10), el.dataset.dir); },
  addGradeSubject: function () { addGradeSubject(); },
  removeGradeSubject: function (el) { removeGradeSubject(parseInt(el.dataset.idx, 10)); },
  scoreCsvPick: function () { const f = document.getElementById('scoreCsvFile'); if (f) f.click(); },
  scoreCsvTemplate: function (el) { scoreCsvTemplate(el.dataset.id); },
  sortClassScores: function (el) { sortClassScores(el); },
  gradeTab: function (el) { state.gradeTab = el.dataset.tab; render(); },
  doCompare: function () {
    state.cmpA = document.getElementById('cmpA') ? document.getElementById('cmpA').value : '';
    state.cmpB = document.getElementById('cmpB') ? document.getElementById('cmpB').value : '';
    render();
  },
  setPersonalStu: function () {
    const sel = document.getElementById('personalStu');
    if (sel) state.personalStuId = sel.value;
    render();
  },
  genAnalysis: function (el) { genStudentAnalysis(el.dataset.id); },

  /* 考勤 */
  attTab: function (el) { state.attTab = el.dataset.tab; render(); },
  setAttDate: function () {
    const inp = document.getElementById('attDate');
    if (inp) state.attDate = inp.value || todayStr();
    render();
  },
  saveAttAll: function () {
    const date = state.attDate || todayStr();
    const d = DB.data;
    document.querySelectorAll('[data-att-select]').forEach(function (sel) {
      const sid = sel.getAttribute('data-sid');
      const status = sel.value;
      const rec = d.attendance.find(a => a.studentId === sid && a.date === date);
      if (rec) rec.status = status;
      else d.attendance.push({ id: uid('at'), studentId: sid, date: date, status: status });
    });
    DB.save(); closeModal(); render(); toast('点名已保存');
  },
  addDepart: function () { departFormModal(); },
  confirmBack: function (el) {
    const dp = DB.data.departures.find(x => x.id === el.dataset.id);
    if (dp) { dp.confirmed = true; dp.backTime = dp.backTime || new Date().toTimeString().slice(0, 5); DB.save(); closeModal(); render(); toast('已确认返校'); }
  },
  delDepart: function (el) {
    confirmBox({ title: '删除登记', message: '确定删除这条离校登记吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.departures = DB.data.departures.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },

  /* 作业 */
  hwTab: function (el) { state.hwTab = el.dataset.tab; render(); },
  addHomework: function () { homeworkFormModal(); },
  editHomework: function (el) { const h = DB.data.homeworks.find(x => x.id === el.dataset.id); if (h) homeworkFormModal(h); },
  saveHomework: function (el) { saveHomework(el.dataset.id); },
  delHomework: function (el) {
    confirmBox({ title: '删除作业', message: '确定删除该作业及收缴记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.homeworks = DB.data.homeworks.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('作业已删除');
    }});
  },
  toggleHwStatus: function (el) {
    const hw = DB.data.homeworks.find(x => x.id === el.dataset.hw);
    if (!hw) return;
    const sid = el.dataset.sid, to = el.dataset.to;
    hw.submitted = hw.submitted || []; hw.late = hw.late || [];
    hw.submitted = hw.submitted.filter(x => x !== sid);
    hw.late = hw.late.filter(x => x !== sid);
    if (to === 'submit') hw.submitted.push(sid);
    else if (to === 'late') hw.late.push(sid);
    DB.save(); closeModal(); render(); toast('收缴状态已更新');
  },
  genRecite: function () {
    const content = document.getElementById('reciteContent') ? document.getElementById('reciteContent').value.trim() : '背诵默写';
    const stu = currentStudents();
    if (!stu.length) { toast('当前班级没有学生', 'err'); return; }
    stu.forEach(s => DB.data.recites.push({ id: uid('rc'), studentId: s.id, content: content, status: '待检查', date: todayStr() }));
    DB.save(); toast('已为全班 ' + stu.length + ' 名学生生成背诵检查记录');
  },
  exportComments: function () { exportCommentsCsv(); },

  /* 请假 */
  leaveFilter: function (el) { state.leaveFilter = el.dataset.f; render(); },
  addLeave: function () { leaveFormModal(); },
  editLeave: function (el) { const l = DB.data.leaves.find(x => x.id === el.dataset.id); if (l) leaveFormModal(l); },
  saveLeave: function (el) { saveLeave(el.dataset.id); },
  delLeave: function (el) {
    confirmBox({ title: '删除请假', message: '确定删除这条请假记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.leaves = DB.data.leaves.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },
  approveLeave: function (el) {
    const ok = el.dataset.ok === '1';
    confirmBox({ title: ok ? '批准请假' : '驳回请假', message: ok ? '确定批准这条请假申请吗？' : '确定驳回这条请假申请吗？', okText: ok ? '批准' : '驳回', danger: !ok, onOk: function () {
      const l = DB.data.leaves.find(x => x.id === el.dataset.id);
      if (l) { l.status = ok ? '已批准' : '已驳回'; DB.save(); closeModal(); render(); toast(ok ? '已批准' : '已驳回'); }
    }});
  },

  /* 班级事务 */
  affTab: function (el) { state.affTab = el.dataset.tab; render(); },
  addPoint: function () { pointFormModal(); },
  savePoint: function () { savePoint(); },
  delPoint: function (el) {
    confirmBox({ title: '删除积分记录', message: '确定删除这条积分记录吗？', danger: true, okText: '删除', onOk: function () {
      const p = DB.data.points.find(x => x.id === el.dataset.id);
      if (p) {
        const st = getStudent(p.studentId);
        if (st) st.score = (st.score || 0) - p.value;
        DB.data.points = DB.data.points.filter(x => x.id !== el.dataset.id);
        DB.save(); closeModal(); render(); toast('积分记录已删除');
      }
    }});
  },
  addVio: function () { vioFormModal(); },
  editVio: function (el) { const v = DB.data.violations.find(x => x.id === el.dataset.id); if (v) vioFormModal(v); },
  saveVio: function (el) { saveVio(el.dataset.id); },
  delVio: function (el) {
    confirmBox({ title: '删除违纪', message: '确定删除这条违纪记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.violations = DB.data.violations.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },
  editDuty: function () { dutyFormModal(); },
  saveDuty: function () { saveDuty(); },
  rotateDuty: function () { rotateDuty(); },
  autoRoomDuty: function () { autoRoomDuty(); },
  setSeat: function (el) { seatAssignModal(parseInt(el.dataset.row, 10), parseInt(el.dataset.col, 10)); },
  seatSettings: function () { seatSettingsModal(); },
  randomSeats: function () { randomSeats(); },
  saveSeatSettings: function () { saveSeatSettings(); },
  clearSeats: function () {
    confirmBox({ title: '清空座位', message: '确定清空所有座位安排吗？', danger: true, okText: '清空', onOk: function () {
      DB.data.seat.layout.forEach(c => { c.studentId = ''; });
      DB.save(); closeModal(); render(); toast('座位已清空');
    }});
  },
  saveSeatAssign: function (el) { saveSeatAssign(parseInt(el.dataset.row, 10), parseInt(el.dataset.col, 10)); },
  addPeriod: function () { periodFormModal(); },
  editPeriod: function (el) { periodFormModal(parseInt(el.dataset.id, 10)); },
  savePeriod: function (el) { savePeriod(el.dataset.idx || ''); },
  delPeriod: function (el) {
    confirmBox({ title: '删除节次', message: '确定删除该节次及对应课程吗？', danger: true, okText: '删除', onOk: function () {
      const idx = parseInt(el.dataset.id, 10);
      const d = DB.data;
      if (d.schedule.periods && d.schedule.periods[idx]) d.schedule.periods.splice(idx, 1);
      Object.keys(d.schedule.grid).forEach(k => { if (d.schedule.grid[k][idx]) d.schedule.grid[k].splice(idx, 1); });
      DB.save(); closeModal(); render(); toast('节次已删除');
    }});
  },
  setCell: function (el) { cellFormModal(parseInt(el.dataset.day, 10), parseInt(el.dataset.per, 10)); },
  saveCell: function (el) { saveCell(parseInt(el.dataset.day, 10), parseInt(el.dataset.per, 10)); },
  clearCell: function (el) {
    const d = DB.data;
    if (d.schedule.grid[el.dataset.day]) d.schedule.grid[el.dataset.day][el.dataset.per] = { subject: '', teacher: '' };
    DB.save(); closeModal(); render(); toast('课程已清空');
  },
  addMeeting: function () { meetingFormModal(); },
  editMeeting: function (el) { const m = DB.data.meetings.find(x => x.id === el.dataset.id); if (m) meetingFormModal(m); },
  saveMeeting: function (el) { saveMeeting(el.dataset.id); },
  delMeeting: function (el) {
    confirmBox({ title: '删除班会记录', message: '确定删除这条班会记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.meetings = DB.data.meetings.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },

  /* 德育 */
  moralTab: function (el) { state.moralTab = el.dataset.tab; render(); },
  addHonor: function (el) { honorFormModal(el.dataset.kind); },
  saveHonor: function (el) { saveHonor(el.dataset.kind); },
  delHonor: function (el) {
    confirmBox({ title: '删除荣誉', message: '确定删除这条荣誉吗？', danger: true, okText: '删除', onOk: function () {
      const k = el.dataset.kind === 'class' ? 'honorsClass' : 'honorsTeacher';
      DB.data[k] = DB.data[k].filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('荣誉已删除');
    }});
  },
  addActivity: function () { activityFormModal(); },
  editActivity: function (el) { const a = DB.data.activities.find(x => x.id === el.dataset.id); if (a) activityFormModal(a); },
  saveActivity: function (el) { saveActivity(el.dataset.id); },
  delActivity: function (el) {
    confirmBox({ title: '删除活动', message: '确定删除该活动吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.activities = DB.data.activities.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('活动已删除');
    }});
  },

  /* 家校 */
  contactTab: function (el) { state.contactTab = el.dataset.tab; render(); },
  togglePhone: function (el) { state.showFullPhone = state.showFullPhone === el.dataset.id ? '' : el.dataset.id; render(); },
  copyPhone: function (el) { const st = getStudent(el.dataset.id); if (st && st.phone) copyText(st.phone); else toast('无手机号', 'err'); },
  contactCall: function (el) { const st = getStudent(el.dataset.id); toast('正在联系 ' + (st ? st.parentName : '家长') + '（演示）', 'warn'); },
  addNotice: function () { noticeFormModal(); },
  editNotice: function (el) { const n = DB.data.notices.find(x => x.id === el.dataset.id); if (n) noticeFormModal(n); },
  saveNotice: function (el) { saveNotice(el.dataset.id); },
  delNotice: function (el) {
    confirmBox({ title: '删除通知', message: '确定删除这条通知吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.notices = DB.data.notices.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('通知已删除');
    }});
  },
  genReply: function () {
    const inp = document.getElementById('replyInput');
    const msg = inp ? inp.value : '';
    if (!msg.trim()) { toast('请先粘贴家长消息', 'err'); return; }
    const r = genReplyText(msg);
    const html = '<div style="margin-top:14px"><span class="badge primary">识别主题：' + r.topic + '</span></div>' + r.replies.map((t, i) =>
      '<div class="gen-result" style="position:relative;padding-right:70px"><button class="btn small outline" style="position:absolute;top:10px;right:10px" data-action="copyResult" data-text="' + esc(t) + '">复制</button>' + esc(t) + '</div>').join('');
    document.getElementById('replyResult').innerHTML = html;
  },
  replyExample: function () {
    const inp = document.getElementById('replyInput');
    if (inp) inp.value = '老师您好，我家孩子最近上课老走神，成绩也下降了，您看怎么办？';
  },
  copyResult: function (el) { copyText(el.dataset.text); },
  addAid: function () { aidFormModal(); },
  saveAid: function () { saveAid(); },
  delAid: function (el) {
    confirmBox({ title: '删除资助记录', message: '确定删除这条资助记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.aids = DB.data.aids.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },

  /* 评价 */
  evalTab: function (el) { state.evalTab = el.dataset.tab; render(); },
  genAllComments: function () {
    const d = DB.data;
    currentStudents().forEach(st => { d.comments[st.id] = generateComment(st); });
    DB.save(); closeModal(); render(); toast('已为全班生成评语');
  },
  saveComments: function () {
    const d = DB.data;
    document.querySelectorAll('[data-comment]').forEach(function (ta) {
      d.comments[ta.getAttribute('data-comment')] = ta.value;
    });
    DB.save(); closeModal(); render(); toast('评语已保存');
  },
  exportCommentsCsv: function () { exportCommentsCsv(); },
  exportFiveCsv: function () {
    const d = DB.data;
    const rows = [['学号', '姓名', '品德', '学业', '身心', '艺术', '实践', '备注']];
    currentStudents().forEach(st => {
      const f = d.fiveEval[st.id] || {};
      rows.push([st.no, st.name, f.moral || 0, f.academic || 0, f.physical || 0, f.artistic || 0, f.practice || 0, f.note || '']);
    });
    downloadFile('五育评价.csv', '\ufeff' + toCSV(rows), 'text/csv;charset=utf-8');
    toast('五育评价 CSV 已导出');
  },
  editFive: function (el) { fiveFormModal(el.dataset.id); },
  saveFive: function (el) { saveFive(el.dataset.id); },

  /* 工作 */
  workTab: function (el) { state.workTab = el.dataset.tab; render(); },
  addTodo: function () { todoFormModal(); },
  saveTodo: function (el) { saveTodo(el.dataset.id); },
  delTodo: function (el) {
    confirmBox({ title: '删除待办', message: '确定删除这条待办吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.todos = DB.data.todos.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('待办已删除');
    }});
  },
  toggleTodo: function (el) {
    const t = DB.data.todos.find(x => x.id === el.dataset.id);
    if (t) { t.done = !t.done; DB.save(); closeModal(); render(); toast(t.done ? '已完成 🎉' : '已取消完成'); }
  },
  addLog: function () { logFormModal(); },
  editLog: function (el) { const l = DB.data.logs.find(x => x.id === el.dataset.id); if (l) logFormModal(l); },
  saveLog: function (el) { saveLog(el.dataset.id); },
  viewLogPhoto: function (el) { viewLogPhoto(el.dataset.logId || '', parseInt(el.dataset.idx || '0', 10)); },
  removeLogPhoto: function (el) { removeLogPhoto(parseInt(el.dataset.idx || '0', 10)); },
  delLog: function (el) {
    confirmBox({ title: '删除日志', message: '确定删除这条工作日志吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.logs = DB.data.logs.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('日志已删除');
    }});
  },
  addTalk: function () { talkFormModal(); },
  editTalk: function (el) { const t = DB.data.talks.find(x => x.id === el.dataset.id); if (t) talkFormModal(t); },
  saveTalk: function (el) { saveTalk(el.dataset.id); },
  delTalk: function (el) {
    confirmBox({ title: '删除谈话记录', message: '确定删除这条谈话记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.talks = DB.data.talks.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },
  exportTalks: function () {
    const rows = [['学生', '类型', '内容摘要', '后续跟进', '日期']];
    DB.data.talks.forEach(t => { const st = getStudent(t.studentId); rows.push([st ? st.name : '', t.type, t.summary, t.next, t.date]); });
    downloadFile('谈心谈话记录.csv', '\ufeff' + toCSV(rows), 'text/csv;charset=utf-8');
    toast('谈话记录 CSV 已导出');
  },

  /* 安全 */
  safeTab: function (el) { state.safeTab = el.dataset.tab; render(); },
  addSafety: function (el) { safetyFormModal(el.dataset.tab); },
  editSafety: function (el) { const rec = (DB.data.safety[el.dataset.tab] || []).find(x => x.id === el.dataset.id); if (rec) safetyFormModal(el.dataset.tab, rec); },
  saveSafety: function (el) { saveSafety(el.dataset.tab, el.dataset.id); },
  delSafety: function (el) {
    confirmBox({ title: '删除记录', message: '确定删除这条台账记录吗？', danger: true, okText: '删除', onOk: function () {
      const tab = el.dataset.tab;
      DB.data.safety[tab] = (DB.data.safety[tab] || []).filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },

  /* 智能助手 */
  assistTab: function (el) { state.assistTab = el.dataset.tab; render(); },
  assistGen: function (el) {
    state.assistKind = el.dataset.kind;
    const names = { family: '家校沟通', discipline: '违纪批评教育', talk: '谈心引导', parent: '家长会发言稿', group: '班级群通知' };
    const box = document.getElementById('assistResult');
    if (box) box.innerHTML = '<div class="section-tip">已选择「' + (names[el.dataset.kind] || '') + '」模板，填写学生姓名或事件信息后，点击上方生成按钮。</div>';
    const btn = document.querySelector('[data-action="genAssistText"]');
    if (btn) btn.textContent = '生成' + (names[el.dataset.kind] || '') + '文案';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  },
  genAssistText: function (el) {
    const kind = state.assistKind || el.dataset.kind || 'family';
    const stu = document.getElementById('assistStu') ? document.getElementById('assistStu').value.trim() : '';
    const ev = document.getElementById('assistEvent') ? document.getElementById('assistEvent').value.trim() : '';
    const text = assistText(kind, stu, ev);
    const box = document.getElementById('assistResult');
    if (box) box.innerHTML = '<div class="gen-result" style="position:relative;padding-right:80px"><button class="btn small outline" style="position:absolute;top:10px;right:10px" data-action="copyResult" data-text="' + esc(text) + '">复制</button>' + esc(text) + '</div>';
  },
  showPlan: function (el) {
    const plans = {
      class: '【主题班会方案】\n一、主题：习惯养成与自律\n二、目标：帮助学生认识良好习惯的重要性，制定个人习惯清单\n三、准备：课件、习惯打卡表、小奖品\n四、流程：\n  1. 导入：讲一个关于习惯的小故事（5 分钟）\n  2. 讨论：学生分组讨论自己的好习惯/坏习惯（10 分钟）\n  3. 分享：小组代表发言（10 分钟）\n  4. 制定：每人填写《习惯养成打卡表》（8 分钟）\n  5. 总结：班主任寄语，约定两周后评比（5 分钟）\n五、延伸：每日打卡，月底评选"习惯之星"',
      build: '【班级建设方案】\n一、目标：建设"团结、进取、温暖"的班集体\n二、组织：完善班委会与小组负责制，人人有岗位\n三、文化：设计班名、班训、班级公约与荣誉墙\n四、活动：每周一次主题班会、每月一次集体活动\n五、评价：量化积分制度 + 定期评优评先\n六、家校：每月至少一次家校沟通，重大事项及时联系',
      improve: '【后进生转化方案】\n一、摸底：分析学困原因（基础薄弱/习惯/家庭/心理）\n二、建档：为每名后进生建立成长档案\n三、结对：安排学习伙伴，形成互助小组\n四、辅导：每周至少一次个别辅导，降低起点、小步快跑\n五、激励：多表扬进步，设置"进步之星"评选\n六、家校：定期与家长沟通，形成教育合力\n七、跟踪：每月评估一次转化效果，动态调整策略',
      style: '【班风建设方案】\n一、核心：勤奋、守纪、友爱、上进\n二、公约：全班共同制定《班级公约》并签字\n三、示范：班干部带头，发挥榜样作用\n四、日常：晨读午练、两操一活动常抓不懈\n五、评比：每周班级之星、每月文明小组\n六、纠偏：对不良苗头及时教育，防微杜渐',
      event: '【突发事件处置流程】\n一、立即处置：学生受伤→先送校医/就医，控制现场\n二、及时上报：第一时间报告年级组和学校领导\n三、通知家长：如实告知情况，安抚家长情绪\n四、调查记录：查明原因，做好记录留痕\n五、后续跟进：关注学生恢复情况，做好心理疏导\n六、总结反思：形成案例，完善预案'
    };
    const box = document.getElementById('planResult');
    if (box) box.innerHTML = '<div class="gen-result" style="position:relative;padding-right:80px"><button class="btn small outline" style="position:absolute;top:10px;right:10px" data-action="copyResult" data-text="' + esc(plans[el.dataset.key] || '') + '">复制</button>' + esc(plans[el.dataset.key] || '') + '</div>';
  },
  showDoc: function (el) {
    const docs = {
      plan: '【班主任工作计划】\n一、班级基本情况：本班共 48 人，男生 24 人，女生 24 人，住校生 22 人。\n二、工作目标：1. 建设良好班风学风；2. 提升班级整体成绩；3. 培养学生良好习惯。\n三、具体措施：1. 加强常规管理，落实量化积分；2. 抓好课堂与作业质量；3. 开展主题班会与德育活动；4. 关注特殊学生，做好心理辅导；5. 加强家校沟通。\n四、每月重点：按月制定主题，逐步推进。',
      report: '【学情报告】\n一、总体情况：班级学风良好，学生整体积极向上。\n二、成绩分析：平均分处于年级中上水平，尖子生稳定，临界生需提升。\n三、存在问题：部分学生偏科，个别学生自律性不足。\n四、改进建议：加强分层教学，落实培优补差，密切家校联系。',
      comment: '【评语说明】\n一、原则：以鼓励为主，实事求是，体现个性。\n二、结构：优点 + 不足 + 期望三部分。\n三、要求：语气亲切，具体有针对性，避免空话套话。\n四、示例：见学生评价模块自动生成的个性化评语。',
      event: '【突发事件情况说明】\n一、事件经过：写清时间、地点、人物、起因、经过、结果。\n二、处置情况：写清第一时间采取的措施与上报情况。\n三、当前状态：写清学生现状与后续安排。\n四、经验教训：总结处置中的不足与改进措施。',
      meeting: '【班会提纲模板】\n主题：\n一、开场（2 分钟）：点明主题，激发兴趣\n二、主体（30 分钟）：1. 知识讲解/故事分享 2. 学生讨论 3. 代表发言\n三、总结（5 分钟）：班主任总结，布置任务\n四、延伸：课后实践/打卡活动'
    };
    const box = document.getElementById('docResult');
    if (box) box.innerHTML = '<div class="gen-result" style="position:relative;padding-right:80px"><button class="btn small outline" style="position:absolute;top:10px;right:10px" data-action="copyResult" data-text="' + esc(docs[el.dataset.key] || '') + '">复制</button>' + esc(docs[el.dataset.key] || '') + '</div>';
  },
  genAnalysisReport: function () { genStudentAnalysis(''); },

  /* 学科工具 */
  subjTab: function (el) { state.subjTab = el.dataset.tab; render(); },
  addLesson: function () { lessonFormModal(); },
  editLesson: function (el) { const l = DB.data.lessons.find(x => x.id === el.dataset.id); if (l) lessonFormModal(l); },
  saveLesson: function (el) { saveLesson(el.dataset.id); },
  delLesson: function (el) {
    confirmBox({ title: '删除备课资料', message: '确定删除这条备课资料吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.lessons = DB.data.lessons.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },
  genPaper: function () {
    const sel = document.getElementById('paperSubject');
    const subj = sel ? sel.value : '数学';
    const text = paperTemplate(subj);
    const box = document.getElementById('paperResult');
    if (box) box.innerHTML = '<div class="gen-result" style="position:relative;padding-right:80px"><button class="btn small outline" style="position:absolute;top:10px;right:10px" data-action="copyResult" data-text="' + esc(text) + '">复制</button>' + esc(text) + '</div>';
  },
  addRecite: function () { reciteFormModal(); },
  editRecite: function (el) { const r = DB.data.recites.find(x => x.id === el.dataset.id); if (r) reciteFormModal(r); },
  saveRecite: function (el) { saveRecite(el.dataset.id); },
  delRecite: function (el) {
    confirmBox({ title: '删除记录', message: '确定删除这条背诵检查记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.recites = DB.data.recites.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },
  addResource: function () { resourceFormModal(); },
  editResource: function (el) { const r = DB.data.resources.find(x => x.id === el.dataset.id); if (r) resourceFormModal(r); },
  saveResource: function (el) { saveResource(el.dataset.id); },
  delResource: function (el) {
    confirmBox({ title: '删除资源', message: '确定删除这条教学资源吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.resources = DB.data.resources.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },
  addChoice: function () { choiceFormModal(); },
  saveChoice: function () { saveChoice(); },
  addCareer: function () { careerFormModal(); },
  editCareer: function (el) { const c = DB.data.career.find(x => x.id === el.dataset.id); if (c) careerFormModal(c); },
  saveCareer: function (el) { saveCareer(el.dataset.id); },
  delCareer: function (el) {
    confirmBox({ title: '删除记录', message: '确定删除这条生涯规划记录吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.career = DB.data.career.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },

  /* 日历 */
  calNav: function (el) {
    const d = parseInt(el.dataset.d, 10);
    const y = state.calYear, m = state.calMonth;
    const nd = new Date(y, m + d, 1);
    state.calYear = nd.getFullYear(); state.calMonth = nd.getMonth();
    render();
  },
  calToday: function () { state.calYear = parseInt(todayStr().slice(0, 4), 10); state.calMonth = parseInt(todayStr().slice(5, 7), 10) - 1; render(); },
  openDay: function (el) { openDayModal(el.dataset.date); },
  calAddTodo: function (el) { closeModal(); todoFromCalendarModal(el.dataset.date); },
  calAddHoliday: function (el) { closeModal(); customHolidayModal(el.dataset.date); },
  saveCustomHoliday: function () { saveCustomHoliday(); },
  delCustomHoliday: function (el) {
    confirmBox({ title: '删除自定义节假日', message: '确定删除这个自定义节假日吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.customHolidays = DB.data.customHolidays.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },
  delCountdown: function (el) {
    confirmBox({ title: '删除倒数日', message: '确定删除这个倒数日吗？', danger: true, okText: '删除', onOk: function () {
      DB.data.countdowns = DB.data.countdowns.filter(x => x.id !== el.dataset.id);
      DB.save(); closeModal(); render(); toast('已删除');
    }});
  },
  legalRange: function (el) { state.legalRange = el.dataset.r; render(); },

  /* 数据 */
  exportJson: function () {
    downloadFile('班主任工作台备份_' + todayStr() + '.json', JSON.stringify(DB.data, null, 2), 'application/json;charset=utf-8');
    toast('JSON 备份已导出');
  },
  importJson: function () { document.getElementById('importJson').click(); },
  clearAllData: function () {
    confirmBox({ title: '清除现有数据', message: '将清除学生、成绩、考勤、积分、日志等全部业务数据（班级与系统设置、云同步配置保留），此操作不可恢复，请先导出备份！', danger: true, okText: '清除', onOk: function () {
      DB.clearBusinessData(); render(); toast('现有数据已清除（班级与设置保留）');
    }});
  },
  clearDemo: function () {
    confirmBox({ title: '清空演示数据', message: '确定清空全部本地数据吗？此操作不可恢复，请先导出备份！', danger: true, okText: '清空', onOk: function () {
      DB.clearAll(); render(); toast('数据已清空');
    }});
  },
  resetDemo: function () {
    confirmBox({ title: '重新生成演示数据', message: '确定重新生成演示数据吗？现有数据将被覆盖。', danger: true, okText: '重新生成', onOk: function () {
      DB.resetDemo(); applyTheme(); updateBrand(); render(); toast('演示数据已重新生成');
    }});
  },
  saveSettings: function () { saveSettings(); },
  saveSync: function () {
    const v = readFields();
    const s = SyncEngine.settings();
    s.provider = v.syncProvider || '';
    if (s.provider === 'leancloud') { s.appId = (v.syncAppId || '').trim(); s.appKey = v.syncAppKey || ''; s.syncServer = (v.syncServer || '').trim(); }
    if (s.provider === 'supabase') { s.supUrl = (v.syncSupUrl || '').trim(); s.supKey = v.syncSupKey || ''; }
    if (s.provider === 'webdav') { s.wdUrl = (v.syncWdUrl || '').trim(); s.wdUser = (v.syncWdUser || '').trim(); s.wdPass = v.syncWdPass || ''; }
    if (v.syncKey) s.syncKey = String(v.syncKey).trim() || 'main';
    s.deviceName = (DB.data.settings.teacherName || '我的') + '的设备';
    s.lastError = '';
    SyncEngine._driverCache = null;
    SyncEngine._saveMeta();
    render();
    if (!SyncEngine.enabled()) { toast('已保存：云同步未启用'); return; }
    SyncEngine.push();
  },
  syncPull: function () { SyncEngine.pull(false); },
  syncDisconnect: function () {
    confirmBox({ title: '断开云同步', message: '断开后本机不再上传/下载云端数据，本地数据会完整保留；云端数据也保留，之后可随时重新连接。确定断开吗？', danger: true, okText: '断开', onOk: function () { SyncEngine.disconnect(); } });
  },
  saveProfile: function () { saveProfile(); },
  saveProfilePrefs: function () { saveProfilePrefs(); }
};

/* ================= 辅助函数 ================= */
function departFormModal() {
  const d = DB.data;
  const stu = currentStudents().filter(s => s.boarding).concat(currentStudents().filter(s => !s.boarding));
  const opt = stu.map(s => '<option value="' + s.id + '">' + esc(s.name) + '（' + esc(s.no) + '）' + (s.boarding ? ' 住校' : ' 走读') + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('date', '离校日期', dateAdd(todayStr(), -3), 'date') +
    field('leaveTime', '离校时间', '16:50', 'time') +
    field('backTime', '返校时间（可空）', '', 'time') +
    '</div>',
    { title: '登记离校' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveDepart">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveDepart() {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  DB.data.departures.push({ id: uid('dp'), studentId: v.studentId, date: v.date || todayStr(), leaveTime: v.leaveTime, backTime: v.backTime || '', confirmed: !!v.backTime });
  DB.save(); closeModal(); render();
  toast('离校登记已保存');
}
ACTIONS.saveDepart = saveDepart;
function exportStudentsOpen() {
  openModal(
    '<div class="form-grid">' +
    field('rStart', '开始日期（选填）', '', 'date') +
    field('rEnd', '结束日期（选填）', '', 'date') +
    '<div style="font-size:12.5px;color:var(--text3)">选择时间段后导出：每个学生的期内考勤（出勤/迟到/缺勤/请假）、积分增减、违纪次数、家校沟通次数都会一并统计；留空则导出全部学生基础信息。</div>' +
    '</div>',
    { title: '导出学生 CSV' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="exportStudentsRange">导出 CSV</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function exportStudentsRange() {
  const v = readFields();
  exportStudentsCsv(v.rStart || '', v.rEnd || '');
}
function exportStudentsCsv(rStart, rEnd) {
  const d = DB.data;
  const S = rStart && rEnd ? (rStart <= rEnd ? rStart : rEnd) : '';
  const E = rStart && rEnd ? (rStart <= rEnd ? rEnd : rStart) : '';
  const inR = function (dt) { return !!dt && (!S || (dt >= S && dt <= E)); };
  const head = ['学号', '姓名', '性别', '手机号', '住校', '职务', '家庭情况', '家长姓名', '监护人', '入学日期', '小组编号', '综合成绩', '排名', '积分', '预警标签', '标签'];
  if (S) { head.push('期内出勤', '期内迟到', '期内缺勤', '期内请假', '期内积分', '期内违纪', '期内沟通', '时间段'); }
  const rows = [head];
  currentStudents().forEach(s => {
    const base = [s.no, s.name, s.gender, s.phone, s.boarding ? '是' : '否', s.position || '', s.family || '', s.parentName || '', s.guardian || '', s.admitDate || '', s.groupId || '', s.totalScore || '', s.classRank || '', s.score || 0, (s.warningTags || []).join('/'), (s.tags || []).join('/')];
    if (S) {
      const att = d.attendance.filter(a => a.studentId === s.id && inR(a.date));
      const pts = d.points.filter(p => p.studentId === s.id && inR(p.date));
      rows.push(base.concat([
        att.filter(a => a.status === '出勤').length,
        att.filter(a => a.status === '迟到').length,
        att.filter(a => a.status === '缺勤').length,
        att.filter(a => a.status === '请假').length,
        pts.reduce((a, b) => a + (b.value || 0), 0),
        d.violations.filter(v => v.studentId === s.id && inR(v.date)).length,
        d.contacts.filter(c => c.studentId === s.id && inR(c.date)).length,
        S + ' ~ ' + E
      ]));
    } else rows.push(base);
  });
  const fname = '学生名单' + (S ? '_' + S + '_' + E : '') + '_' + (currentClass() ? currentClass().name : '班级') + '.csv';
  downloadFile(fname, '\ufeff' + toCSV(rows), 'text/csv;charset=utf-8');
  closeModal();
  toast('学生 CSV 已导出' + (S ? '（' + S + ' ~ ' + E + '）' : ''));
}

function handleImportCsv(input) {
  readFile(input, function (text) {
    const rows = parseCSV(text);
    if (!rows.length) { toast('CSV 内容为空', 'err'); return; }
    let start = 0, header = null;
    if (/姓名|学号/.test(rows[0][0] || '')) { header = rows[0]; start = 1; }
    const data = rows.slice(start).filter(r => (r[0] || '').trim());
    if (!data.length) { toast('没有可导入的数据行', 'err'); return; }
    confirmBox({ title: '导入学生', message: '将为当前班级导入 ' + data.length + ' 名学生，确定继续吗？', okText: '导入', onOk: function () {
      const d = DB.data;
      const cc = currentClass();
      const idx = function (name, def) {
        if (!header) return def;
        const i = header.indexOf(name);
        return i >= 0 ? i : def;
      };
      data.forEach((r, i) => {
        const name = r[idx('姓名', 1)] || ('新同学' + (i + 1));
        const no = r[idx('学号', 0)] || String(d.students.filter(s => s.classId === cc.id).length + 1);
        d.students.push({
          id: uid('s'), classId: cc ? cc.id : (d.classes[0] || {}).id,
          name: String(name).trim(), no: String(no).trim(),
          gender: r[idx('性别', 2)] === '女' ? '女' : '男',
          phone: r[idx('手机号', 3)] || '',
          boarding: /是|住/.test(r[idx('住校', 4)] || ''),
          position: r[idx('职务', 5)] || '', family: r[idx('家庭情况', 6)] || '正常',
          parentName: r[idx('家长姓名', 7)] || '', guardian: r[idx('监护人', 8)] || '',
          admitDate: r[idx('入学日期', 9)] || '2025-09-01', groupId: parseInt(r[idx('小组编号', 10)] || '1', 10) || 1,
          attendanceRate: 1, lateCount: 0, absentCount: 0, totalScore: 0, behaviorScore: 80, classRank: 0, score: 0,
          warningTags: (r[idx('预警标签', 14)] || '').split(/[\/]/).map(x => x.trim()).filter(Boolean),
          tags: (r[idx('标签', 15)] || '').split(/[\/]/).map(x => x.trim()).filter(Boolean)
        });
      });
      DB.save(); closeModal(); render(); toast('已导入 ' + data.length + ' 名学生');
    }});
  });
}
function handleImportJson(input) {
  readFile(input, function (text) {
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { toast('JSON 解析失败，请检查文件格式', 'err'); return; }
    if (!parsed || typeof parsed !== 'object' || !parsed.settings) { toast('不是有效的备份文件', 'err'); return; }
    confirmBox({ title: '导入备份', message: '导入后将替换当前全部数据，确定继续吗？', danger: true, okText: '导入', onOk: function () {
      DB.data = DB.normalize(parsed);
      DB.save(); applyTheme(); updateBrand(); render();
      toast('备份已恢复');
    }});
  });
}
function genStudentAnalysis(stuId) {
  const d = DB.data;
  const latest = d.exams.filter(e => d.scores.some(s => s.examId === e.id)).sort((a, b) => a.date > b.date ? 1 : -1)[0];
  if (stuId) {
    const st = getStudent(stuId);
    if (!st) { toast('请先选择学生', 'err'); return; }
    const sc = latest ? d.scores.find(s => s.examId === latest.id && s.studentId === stuId) : null;
    const weak = sc ? sc.subjects.filter(x => x.score != null && x.score < (latest.subjects.find(s2 => s2.name === x.name) || { full: 100 }).full * 0.6).map(x => x.name) : [];
    const strong = sc ? sc.subjects.filter(x => x.score != null).slice().sort((a, b) => b.score - a.score).slice(0, 2).map(x => x.name) : [];
    const text = '【' + st.name + '学情分析】\n' +
      '一、总体评价：' + (sc ? '最近一次考试《' + latest.name + '》总分 ' + sc.total + ' 分，班级排名第 ' + sc.rank + ' 名。' : '暂无成绩数据。') +
      (strong.length ? '优势科目：' + strong.join('、') + '。' : '') +
      (weak.length ? '薄弱科目：' + weak.join('、') + '，建议加强基础训练。' : '各科发展较为均衡。') +
      '\n二、学习建议：1. 保持优势科目，稳定发挥；2. 针对薄弱科目制定专项练习计划；3. 合理分配时间，提高课堂效率。' +
      '\n三、家校配合：建议家长关注作业完成质量，多鼓励少施压，两周后由老师复查效果。';
    openModal('<div class="gen-result">' + esc(text) + '</div>', { title: '学情分析 · ' + st.name });
    const foot = modalFootHtml('<button class="btn" data-action="closeModal">关闭</button><button class="btn primary" data-action="copyResult" data-text="' + esc(text) + '">复制</button>');
    document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
    return;
  }
  const stu = currentStudents();
  const list = latest ? d.scores.filter(s => s.examId === latest.id) : [];
  const cnt = list.length || stu.length;
  const avg = list.length ? Math.round(list.reduce((a, b) => a + b.total, 0) / list.length) : 0;
  const fail = latest ? list.filter(s => s.total < latest.total * 0.6).length : 0;
  const attRows = d.attendance.filter(a => stu.some(s => s.id === a.studentId));
  const attRate = attRows.length ? Math.round(attRows.filter(a => a.status === '出勤').length / attRows.length * 1000) / 10 : 0;
  const text = '【' + (currentClass() ? currentClass().name : '本班') + '学情分析】\n' +
    '一、基本情况：全班共 ' + cnt + ' 人，' + (latest ? '最近一次考试为《' + latest.name + '》' : '暂无考试数据') + '。\n' +
    '二、成绩分析：班级平均分 ' + avg + ' 分，不及格 ' + fail + ' 人，需重点关注学困生。\n' +
    '三、考勤情况：班级出勤率 ' + attRate + '%，整体出勤良好。\n' +
    '四、存在问题：1. 部分学生基础薄弱，学科发展不均衡；2. 个别学生课堂参与度不高。\n' +
    '五、改进措施：1. 分层辅导，抓两头促中间；2. 加强课堂互动与作业面批；3. 家校联动，共同督促。';
  const box = document.getElementById('analysisResult');
  if (box) box.innerHTML = '<div class="gen-result" style="position:relative;padding-right:80px"><button class="btn small outline" style="position:absolute;top:10px;right:10px" data-action="copyResult" data-text="' + esc(text) + '">复制</button>' + esc(text) + '</div>';
}
function exportCommentsCsv() {
  const d = DB.data;
  const rows = [['学号', '姓名', '综合成绩', '排名', '评语']];
  currentStudents().forEach(st => {
    rows.push([st.no, st.name, st.totalScore || '', st.classRank || '', d.comments[st.id] || generateComment(st)]);
  });
  downloadFile('学生评语.csv', '\ufeff' + toCSV(rows), 'text/csv;charset=utf-8');
  toast('评语 CSV 已导出');
}
function handleAvatarFile(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = function () {
    DB.data.settings.avatar = reader.result;
    DB.save(); closeModal(); render(); updateBrand();
    toast('头像已更新');
  };
  reader.readAsDataURL(f);
}

function filterPersonalOptions(q) {
  q = (q || '').trim().toLowerCase();
  const sel = document.getElementById('personalStu');
  if (!sel) return;
  Array.from(sel.options).forEach(function (o) { o.style.display = (!q || o.textContent.toLowerCase().indexOf(q) >= 0) ? '' : 'none'; });
  const visible = Array.from(sel.options).filter(function (o) { return o.style.display !== 'none'; });
  if (visible.length === 1) { sel.value = visible[0].value; }
  else if (!visible.length && sel.options.length) { sel.value = ''; }
}
/* ================= 事件绑定 ================= */
function studentSuggestHtml(q) {
  q = (q || '').trim().toLowerCase();
  if (!q) return '';
  const p = function (ch) { return (typeof PINYIN_INITIALS !== 'undefined' && PINYIN_INITIALS[ch]) || ''; };
  const hits = currentStudents().filter(function (s) {
    const name = s.name || '';
    const initial = name.split('').map(function (c) { return p(c); }).join('');
    return name.toLowerCase().indexOf(q) >= 0 || String(s.no).indexOf(q) >= 0 || initial.indexOf(q) >= 0;
  }).slice(0, 8);
  if (!hits.length) return '';
  return hits.map(function (s) {
    return '<div class="sug-item" data-action="pickSuggestion" data-input="' + window.__sugInput + '" data-id="' + s.id + '">' +
      '<span class="sug-name">' + esc(s.name) + '</span><span class="sug-no">' + esc(s.no) + ' · ' + esc(s.gender) + '</span></div>';
  }).join('');
}
function showSuggest(inputId, q) {
  closeSuggest();
  const inp = document.getElementById(inputId);
  if (!inp || !q) return;
  window.__sugInput = inputId;
  const html = studentSuggestHtml(q);
  if (!html) return;
  const div = document.createElement('div');
  div.id = 'stuSuggest';
  div.innerHTML = html;
  document.body.appendChild(div);
  const r = inp.getBoundingClientRect();
  div.style.top = (r.bottom + 4) + 'px';
  div.style.left = r.left + 'px';
  div.style.width = Math.max(r.width, 180) + 'px';
}
function closeSuggest() {
  const el = document.getElementById('stuSuggest');
  if (el) el.remove();
}
document.addEventListener('input', function (e) {
  const t = e.target;
  if (!t) return;
  if (t.id === 'personalSearch') filterPersonalOptions(t.value);
  if (t.id === 'studentSearch' || t.id === 'personalSearch' || t.id === 'classStuSearch') showSuggest(t.id, t.value);
});

document.addEventListener('dragstart', function (e) {
  const row = e.target.closest ? e.target.closest('.dash-block-row, .dash-edit-card') : null;
  if (row) { e.dataTransfer.setData('text/plain', row.getAttribute('data-id')); row.classList.add('dragging'); }
});
document.addEventListener('dragover', function (e) {
  const row = e.target.closest ? e.target.closest('.dash-block-row, .dash-edit-card') : null;
  if (row) { e.preventDefault(); row.classList.add('drag-over'); }
});
document.addEventListener('dragleave', function (e) {
  const row = e.target.closest ? e.target.closest('.dash-block-row, .dash-edit-card') : null;
  if (row) row.classList.remove('drag-over');
});
document.addEventListener('drop', function (e) {
  e.preventDefault();
  const from = e.dataTransfer.getData('text/plain');
  const row = e.target.closest ? e.target.closest('.dash-block-row, .dash-edit-card') : null;
  if (from && row) { moveDashBlock(from, row.getAttribute('data-id')); if (document.querySelector('.dash-edit-card')) dashEditOpen(); }
  document.querySelectorAll('.dash-block-row, .dash-edit-card').forEach(function (r) { r.classList.remove('dragging', 'drag-over'); });
});
/* 仪表盘详情页：拖拽右下角调整大小 */
let __dashResize = null;
document.addEventListener('mousedown', function (e) {
  const h = e.target.closest ? e.target.closest('.dec-resize') : null;
  if (!h) return;
  e.preventDefault();
  const card = h.closest('.dash-edit-card');
  const grid = card.closest('.dash-edit-grid');
  const gRect = grid.getBoundingClientRect();
  __dashResize = { id: card.getAttribute('data-id'), startX: e.clientX, startY: e.clientY, w0: card.offsetWidth / gRect.width * 100, h0: card.offsetHeight, gLeft: gRect.left, gW: gRect.width };
});
document.addEventListener('mousemove', function (e) {
  if (!__dashResize) return;
  const card = document.querySelector('.dash-edit-card[data-id="' + __dashResize.id + '"]');
  if (!card) return;
  let w = (e.clientX - __dashResize.gLeft) / __dashResize.gW * 100;
  w = Math.max(20, Math.min(100, w));
  let h = __dashResize.h0 + (e.clientY - __dashResize.startY);
  h = Math.max(120, Math.min(700, h));
  card.style.width = w + '%';
  card.style.minHeight = h + 'px';
  const lbl = card.querySelector('.dec-size');
  if (lbl) lbl.textContent = Math.round(w) + '% × ' + Math.round(h) + 'px';
  __dashResize.w = w; __dashResize.h = h;
});
document.addEventListener('mouseup', function () {
  if (!__dashResize) return;
  const d = DB.data;
  const b = d.settings.dashboard.blocks.find(x => x.id === __dashResize.id);
  if (b) { b.w = Math.round(__dashResize.w); b.h = Math.round(__dashResize.h); DB.save(); }
  __dashResize = null;
  const pv = document.getElementById('dashLivePreview');
  if (pv) pv.innerHTML = dashPreviewHtml();
});

document.addEventListener('click', function (e) {
  const target = e.target;
  /* 弹窗遮罩点击关闭 */
  if (!target.closest || !target.closest('#stuSuggest')) closeSuggest();
  if (target.id === 'modalMask') { closeModal(); return; }
  if (target.id === 'drawerMask') { closeDrawer(); return; }
  if (target.id === 'sidebarMask') { document.getElementById('sidebar').classList.remove('open'); return; }
  /* chip 切换 */
  if (target.classList && target.classList.contains('chip')) {
    target.classList.toggle('on');
    return;
  }
  if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;
  const el = target.closest ? target.closest('[data-action]') : null;
  if (el) {
    const fn = ACTIONS[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el); }
  }
});
document.addEventListener('change', function (e) {
  const t = e.target;
  if (t.id === 'personalStu') {
    state.personalStuId = t.value;
    render();
  } else if (t.id === 'classExamSel') {
    state.classExamId = t.value;
    render();
  } else if (t.id === 'classSelect') {
    DB.data.settings.currentClassId = t.value;
    DB.save(); closeModal(); render();
  } else if (t.id === 'studentSearch') {
    state.studentQuery = t.value;
    const content = document.getElementById('content');
    content.innerHTML = MODULE_RENDER[state.module]();
    const inp = document.getElementById('studentSearch');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  } else if (t.classList && t.classList.contains('dash-enable')) {
    const b = DB.data.settings.dashboard.blocks.find(x => x.id === t.dataset.id);
    if (b) { b.enabled = t.checked; DB.save(); render(); }
  } else if (t.classList && t.classList.contains('dash-width')) {
    const b = DB.data.settings.dashboard.blocks.find(x => x.id === t.dataset.id);
    if (b) { b.w = parseInt(t.value, 10) || 100; DB.save(); render(); }
  } else if (t.classList && t.classList.contains('dash-height')) {
    const b = DB.data.settings.dashboard.blocks.find(x => x.id === t.dataset.id);
    if (b) { b.h = parseInt(t.value, 10) || 0; DB.save(); render(); }
  } else if (t.id === 'classStuSearch') {
    state.classStuQuery = t.value;
    const content = document.getElementById('content');
    if (content) content.innerHTML = MODULE_RENDER[state.module]();
    const inp = document.getElementById('classStuSearch');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  } else if (t.id === 'personalSearch') {
    filterPersonalOptions(t.value);
  } else if (t.id === 'avatarFile') {
    handleAvatarFile(t);
    t.value = '';
  } else if (t.id === 'importJson') {
    handleImportJson(t);
    t.value = '';
  } else if (t.id === 'importCsv') {
    handleImportCsv(t);
    t.value = '';
  } else if (t.id === 'attDate') {
    state.attDate = t.value;
  } else if (t.id === 'personalStu') {
    state.personalStuId = t.value;
  } else if (t.getAttribute && t.getAttribute('data-field') === 'syncProvider') {
    SyncEngine.toggleProviderFields(t.value);
  }
});
window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeModal(); closeDrawer(); document.getElementById('sidebar').classList.remove('open'); }
});
window.addEventListener('resize', function () {
  if (window.innerWidth > 860) document.getElementById('sidebar').classList.remove('open');
});
/* PWA：部署到 http(s) 环境时自动注入 manifest 并注册 Service Worker */
function setupPWA() {
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'manifest.json';
    document.head.appendChild(link);
  }
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const at = document.createElement('link');
    at.rel = 'apple-touch-icon';
    at.href = 'icons/icon-192.png';
    document.head.appendChild(at);
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
}
function init() {
  DB.load();
  SyncEngine.init();
  if (!DB.data.settings.currentClassId && DB.data.classes.length) DB.data.settings.currentClassId = DB.data.classes[0].id;
  applyTheme();
  updateBrand();
  render();
  setupPWA();
  startClock();
  setTimeout(function () { SyncEngine._pullSilent(); }, 1500);
}
init();

