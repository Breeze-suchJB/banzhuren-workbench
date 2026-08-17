/* 构建版本 */
const APP_VERSION = '20260817-120445';
/* ================= 数据层 ================= */
const STORAGE_KEY = 'banzhuren_workbench_v1';
const DB_VERSION = 1;

/* 简单可复现随机数 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let _rng = mulberry32(20260814);
function rnd() { return _rng(); }
function rndInt(min, max) { return Math.floor(rnd() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function uid(prefix) { return (prefix || 'id') + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

/* 日期工具 */
function todayStr() {
  const d = new Date();
  return fmtDate(d);
}
function fmtDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}
function parseDate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}
function dateAdd(s, days) {
  const d = parseDate(s);
  if (!d) return s;
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}
function daysBetween(a, b) {
  const da = parseDate(a), db = parseDate(b);
  if (!da || !db) return 0;
  return Math.round((db - da) / 86400000);
}
function weekdayIndex(s) {
  const d = parseDate(s);
  return d ? d.getDay() : 0; // 0=周日
}
function recentWeekdays(n) {
  const out = [];
  let d = new Date();
  while (out.length < n) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) out.unshift(fmtDate(d));
    d.setDate(d.getDate() - 1);
  }
  return out;
}

/* ================= 默认设置 ================= */
function defaultSettings() {
  return {
    className: '七年级（2）班',
    teacherName: '郑老师',
    termStart: '2026-02-25',
    termEnd: '2026-07-05',
    retireDate: '2032-08-31',
    winterStart: '2027-01-16',
    winterEnd: '2027-02-14',
    summerStart: '2026-07-06',
    summerEnd: '2026-08-31',
    theme: 'theme-blue',
    avatar: '',
    currentClassId: '',
    commentTeacherWeight: 0.7,
    topPercent: 20,
    criticalPercent: 40,
    maskPhone: true,
    showClock: true,
    tagLibrary: ['学困生', '心理重点关注', '留守儿童', '单亲家庭', '低保家庭', '脱贫户', '贫困学生', '体弱多病', '进步之星', '纪律之星'],
    subjectColors: {
      '语文': '#EF4444', '数学': '#3B82F6', '英语': '#8B5CF6', '物理': '#F59E0B',
      '化学': '#14B8A6', '生物': '#22C55E', '政治': '#E8743B', '历史': '#64748B',
      '地理': '#06B6D4', '体育': '#10B981', '自习': '#94A3B8', '班会': '#EC4899'
    }
  };
}

/* ================= 演示数据 ================= */
const SURNAMES = ['王','李','张','刘','陈','杨','赵','黄','周','吴','徐','孙','马','朱','胡','郭','何','林','罗','高','郑','梁','谢','宋','唐','许','韩','冯','邓','曹','彭','曾','肖','田','董','袁','潘','于','蒋','蔡','余','杜','叶','程','苏','魏','吕','丁','任','沈','姚','卢','姜','崔','钟','谭','陆','汪','范','金','石','廖','贾','夏','韦','傅','方','白','邹','孟','熊','秦','邱','江','尹','薛','闫','段','雷','侯','龙','史','陶','黎','贺','顾','毛','郝','龚','邵','万','钱','严','覃','武','戴','莫','孔','向','汤'];
const GIVEN = ['梓涵','子轩','雨桐','浩然','欣怡','一诺','俊杰','诗涵','嘉懿','梦瑶','宇轩','思彤','铭泽','雅琪','博文','晨曦','天佑','语嫣','睿哲','若曦','子墨','雨欣','承泽','佳怡','明轩','欣妍','鹏飞','可欣','泽宇','舒涵','浩然','芷晴','志强','婉婷','俊熙','欣悦','昊然','雨萱','子涵','静怡','宇航','悦彤','建豪','思远','文静','奕辰','紫萱','晓峰','乐怡','子航','欣怡','凯文','梓萱','嘉豪','诗琪','明杰','若彤','浩然','语桐','振宇','梦洁'];
const POSITIONS = ['班长', '学习委员', '纪律委员', '卫生委员', '体育委员', '文艺委员', '心理委员', '电教员', '', '', '', ''];
const FAMILY = ['留守学生', '单亲家庭', '低保家庭', '脱贫户', '贫困学生', '正常'];
const WARNINGS = ['学困生', '心理重点关注', '近期成绩下滑', '经常迟到', '家庭变故'];

function genNames(n) {
  const names = [];
  const set = new Set();
  let guard = 0;
  while (names.length < n && guard < 5000) {
    guard++;
    const name = pick(SURNAMES) + pick(GIVEN) + (rnd() < 0.25 ? pick(GIVEN) : '');
    if (!set.has(name)) { set.add(name); names.push(name); }
  }
  return names;
}

function demoData() {
  const settings = defaultSettings();
  const today = todayStr();
  const classes = [
    { id: 'c1', name: '七年级（2）班', grade: '七年级', headTeacher: '郑老师', room: '教学楼A栋 302', roles: ['班主任：郑老师', '语文：郑老师', '数学：刘老师', '英语：王老师'] },
    { id: 'c2', name: '八年级（5）班', grade: '八年级', headTeacher: '李老师', room: '教学楼B栋 205', roles: ['班主任：李老师', '语文：李老师', '数学：赵老师', '英语：孙老师'] }
  ];
  settings.currentClassId = classes[0].id;
  settings.className = classes[0].name;

  const students = [];
  const allNames = genNames(96);
  const phones = new Set();
  const subjects = ['语文','数学','英语','物理','化学','生物','政治','历史','地理'];
  const classStudents = { c1: [], c2: [] };

  allNames.forEach((name, i) => {
    const cls = i < 48 ? 'c1' : 'c2';
    const idx = i < 48 ? i : i - 48;
    const boarding = rnd() < 0.45;
    const gender = rnd() < 0.5 ? '男' : '女';
    let phone;
    do { phone = '138' + String(rndInt(0, 99999999)).padStart(8, '0'); } while (phones.has(phone));
    phones.add(phone);
    const warn = [];
    if (rnd() < 0.18) warn.push('学困生');
    if (rnd() < 0.12) warn.push('心理重点关注');
    if (rnd() < 0.08) warn.push('近期成绩下滑');
    if (rnd() < 0.08) warn.push('经常迟到');
    const tags = warn.slice(0, 2);
    if (rnd() < 0.12) tags.push('进步之星');
    if (rnd() < 0.08) tags.push('纪律之星');
    const att = Math.round((0.85 + rnd() * 0.15) * 1000) / 1000;
    const total = Math.round(60 + rnd() * 40);
    students.push({
      id: 's' + (i + 1),
      name, no: String(cls === 'c1' ? 1 : 101 + idx).padStart(3, '0') + '',
      gender, phone, boarding,
      position: rnd() < 0.35 ? pick(POSITIONS) : '',
      tags: [...new Set(tags)],
      family: rnd() < 0.3 ? pick(FAMILY.slice(0, 5)) : '正常',
      parentName: pick(SURNAMES) + '家长',
      guardian: gender === '男' ? '父亲' : '母亲',
      attendanceRate: att,
      lateCount: rndInt(0, 8),
      absentCount: rndInt(0, 3),
      totalScore: total,
      behaviorScore: rndInt(60, 100),
      classRank: 0,
      warningTags: warn,
      score: rndInt(0, 120),
      admitDate: '2025-09-01',
      groupId: rndInt(1, 8),
      classId: cls
    });
    classStudents[cls].push(students[students.length - 1]);
  });

  /* 班级排名（按综合成绩） */
  Object.keys(classStudents).forEach(cls => {
    const list = classStudents[cls].slice().sort((a, b) => b.totalScore - a.totalScore);
    list.forEach((st, idx) => { st.classRank = idx + 1; });
  });

  /* 考试与成绩 */
  const exams = [
    { id: 'e1', name: '第一次月考', date: dateAdd(today, -32), subjects: subjects.map(n => ({ name: n, full: n === '语文' || n === '数学' || n === '英语' ? 120 : 100 })), total: 960 },
    { id: 'e2', name: '期中模拟考', date: dateAdd(today, 9), subjects: subjects.map(n => ({ name: n, full: n === '语文' || n === '数学' || n === '英语' ? 120 : 100 })), total: 960 },
    { id: 'e3', name: '期末统考', date: dateAdd(today, 42), subjects: subjects.map(n => ({ name: n, full: n === '语文' || n === '数学' || n === '英语' ? 120 : 100 })), total: 960 }
  ];
  const scores = [];
  const curClass = classStudents['c1'];
  exams.forEach(ex => {
    const rows = curClass.map(st => {
      const subj = ex.subjects.map(s => {
        let base = st.warningTags.includes('学困生') ? rndInt(42, 68) : rndInt(58, 98);
        return { name: s.name, score: Math.min(s.full, Math.max(0, base)) };
      });
      const total = subj.reduce((a, b) => a + b.score, 0);
      return { st, total, subj };
    });
    rows.sort((a, b) => b.total - a.total);
    rows.forEach((r, idx) => {
      scores.push({ id: uid('sc'), examId: ex.id, studentId: r.st.id, total: r.total, rank: idx + 1, subjects: r.subj });
    });
  });

  /* 考勤：最近 7 个工作日 */
  const attendance = [];
  const days = recentWeekdays(7);
  curClass.forEach(st => {
    days.forEach(d => {
      let status = '出勤';
      const r = rnd();
      if (r < 0.045) status = '迟到';
      else if (r < 0.055) status = '缺勤';
      else if (r < 0.075) status = '请假';
      attendance.push({ id: uid('at'), studentId: st.id, date: d, status });
    });
  });

  /* 请假 */
  const leaves = [
    { id: uid('lv'), studentId: 's5', type: '病假', start: dateAdd(today, -1), end: dateAdd(today, 1), days: 3, reason: '感冒发烧，需在家休息', status: '待审批' },
    { id: uid('lv'), studentId: 's12', type: '事假', start: dateAdd(today, -2), end: dateAdd(today, -1), days: 2, reason: '家里有要事需处理', status: '已批准' },
    { id: uid('lv'), studentId: 's23', type: '病假', start: dateAdd(today, -4), end: dateAdd(today, -3), days: 2, reason: '肠胃不适就医', status: '已驳回' }
  ];

  /* 积分流水 40 条 */
  const pointReasons = [
    ['+2', '课堂积极回答问题'], ['+3', '主动帮助同学'], ['+5', '月考进步明显'], ['+2', '拾金不昧'],
    ['+1', '按时完成作业'], ['+3', '代表班级参加比赛'], ['+2', '卫生打扫认真'], ['+1', '早读表现优秀'],
    ['-2', '上课迟到'], ['-3', '未交作业'], ['-2', '课间追逐打闹'], ['-5', '违反课堂纪律'], ['-1', '仪容仪表不规范']
  ];
  const points = [];
  for (let i = 0; i < 40; i++) {
    const st = pick(curClass);
    const pr = pick(pointReasons);
    const v = parseInt(pr[0], 10);
    points.push({ id: uid('pt'), studentId: st.id, value: v, reason: pr[1], date: dateAdd(today, -rndInt(0, 20)), type: v > 0 ? '加分' : '扣分' });
  }

  /* 违纪 12 条 */
  const vioTypes = ['上课说话', '迟到', '未交作业', '课间打闹', '携带手机', '损坏公物', '不服从管理'];
  const violations = [];
  for (let i = 0; i < 12; i++) {
    const st = pick(curClass);
    const t = pick(vioTypes);
    violations.push({ id: uid('vi'), studentId: st.id, date: dateAdd(today, -rndInt(0, 25)), type: t, desc: t + '，经批评教育后已认识到错误', handle: pick(['口头批评教育', '与家长电话沟通', '写检讨并全班通报', '课后谈话引导']) });
  }

  /* 作业 2 条 */
  const hw1Students = curClass.slice(0, 45);
  const hw2Students = curClass.slice(3, 48);
  const homeworks = [
    { id: uid('hw'), title: '语文《春》课后练习', subject: '语文', classId: 'c1', assignDate: dateAdd(today, -3), dueDate: dateAdd(today, -1), submitted: hw1Students.slice(0, 42).map(s => s.id), late: hw1Students.slice(42, 44).map(s => s.id) },
    { id: uid('hw'), title: '数学一元一次方程练习册 P45-46', subject: '数学', classId: 'c1', assignDate: dateAdd(today, -2), dueDate: dateAdd(today, 1), submitted: hw2Students.slice(0, 40).map(s => s.id), late: [] }
  ];

  /* 家校沟通 6 条 */
  const contactReasons = ['反馈期中考试成绩', '了解家庭作业情况', '孩子近期状态沟通', '请假事宜确认', '课堂表现反馈', '安全教育提醒'];
  const contacts = [];
  for (let i = 0; i < 6; i++) {
    const st = pick(curClass);
    contacts.push({ id: uid('ct'), studentId: st.id, date: dateAdd(today, -rndInt(0, 15)), method: pick(['微信', '电话', '当面沟通', '家长会']), content: '与' + st.parentName + '沟通' + pick(contactReasons) + '，家长表示会配合学校。', next: pick(['持续跟进', '一周后回访', '已结束']), status: pick(['已完成', '待跟进', '进行中']) });
  }

  /* 通知 3 条 */
  const notices = [
    { id: uid('nt'), title: '关于下周开展期中模拟考的通知', type: '考试通知', content: '下周将进行期中模拟考，请同学们认真复习，家长协助做好作息安排。', date: dateAdd(today, -1) },
    { id: uid('nt'), title: '家长会安排', type: '家长会', content: '本周五下午 3:00 召开家长会，请各位家长准时参加。', date: dateAdd(today, -2) },
    { id: uid('nt'), title: '安全教育提醒', type: '安全提醒', content: '天气渐热，请家长提醒孩子注意防溺水安全，周末不去危险水域。', date: dateAdd(today, -3) }
  ];

  /* 资助 4 条 */
  const aids = [
    { id: uid('ad'), studentId: 's7', type: '困难补助', desc: '申请春季学期困难学生生活补助', date: dateAdd(today, -12) },
    { id: uid('ad'), studentId: 's19', type: '营养餐', desc: '纳入营养改善计划', date: dateAdd(today, -20) },
    { id: uid('ad'), studentId: 's31', type: '校服减免', desc: '减免校服费用', date: dateAdd(today, -6) },
    { id: uid('ad'), studentId: 's44', type: '困难补助', desc: '申请课后服务费减免', date: dateAdd(today, -3) }
  ];

  /* 待办 6 条（覆盖四象限） */
  const todos = [
    { id: uid('td'), content: '批改语文《春》课后练习并反馈', priority: '高', quadrant: '紧急重要', due: dateAdd(today, 0), done: false },
    { id: uid('td'), content: '审批张同学的请假申请', priority: '高', quadrant: '紧急重要', due: dateAdd(today, 0), done: false },
    { id: uid('td'), content: '准备家长会发言提纲', priority: '中', quadrant: '重要不紧急', due: dateAdd(today, 3), done: false },
    { id: uid('td'), content: '整理期中考试复习资料', priority: '中', quadrant: '重要不紧急', due: dateAdd(today, 5), done: false },
    { id: uid('td'), content: '回复班级群家长消息', priority: '低', quadrant: '紧急不重要', due: dateAdd(today, 0), done: true },
    { id: uid('td'), content: '更新班级文化墙照片', priority: '低', quadrant: '不重要不紧急', due: dateAdd(today, 7), done: false }
  ];

  /* 工作日志 4 条 */
  const logs = [
    { id: uid('lg'), date: dateAdd(today, -1), content: '上午备课，下午批改作业并约谈 3 名学困生', hours: 2 },
    { id: uid('lg'), date: dateAdd(today, -2), content: '组织班级大扫除，检查宿舍卫生', hours: 1.5 },
    { id: uid('lg'), date: dateAdd(today, -3), content: '召开班委会，布置本周班级工作', hours: 1 },
    { id: uid('lg'), date: dateAdd(today, -4), content: '参加年级组教学研讨会，整理会议纪要', hours: 2 }
  ];

  /* 谈话记录 3 条 */
  const talks = [
    { id: uid('tk'), studentId: 's9', type: '学习指导', summary: '近期成绩下滑，帮助分析原因并制定复习计划', next: '两周后检查落实情况', date: dateAdd(today, -3) },
    { id: uid('tk'), studentId: 's16', type: '心理疏导', summary: '情绪低落，倾听其困扰并给予鼓励', next: '持续关注', date: dateAdd(today, -5) },
    { id: uid('tk'), studentId: 's27', type: '纪律教育', summary: '课堂多次讲话，进行批评教育并约定改进目标', next: '一周后复查', date: dateAdd(today, -2) }
  ];

  /* 班会 2 条 */
  const meetings = [
    { id: uid('mt'), theme: '期中考试动员会', date: dateAdd(today, -6), outline: '1. 考试安排说明 2. 复习方法指导 3. 诚信考试倡议' },
    { id: uid('mt'), theme: '安全教育主题班会', date: dateAdd(today, -13), outline: '1. 防溺水安全 2. 交通安全 3. 食品安全' }
  ];

  /* 资源 4 条 */
  const resources = [
    { id: uid('rs'), title: '初一语文古诗词默写清单', type: '教案', link: 'local://resource/1', note: '可用于早读默写' },
    { id: uid('rs'), title: '一元一次方程精选习题', type: '练习', link: 'local://resource/2', note: '课堂练习用' },
    { id: uid('rs'), title: '班主任家校沟通话术手册', type: '文档', link: 'local://resource/3', note: '新教师参考' },
    { id: uid('rs'), title: '安全教育视频合集', type: '视频', link: 'local://resource/4', note: '班会课播放' }
  ];

  /* 背诵检查 6 条 */
  const recites = [];
  for (let i = 0; i < 6; i++) {
    const st = pick(curClass);
    recites.push({ id: uid('rc'), studentId: st.id, content: pick(['《春》全文背诵', '《观沧海》默写', '《论语》十二章', '古诗词十首']), status: pick(['已通过', '未通过', '待检查']), date: dateAdd(today, -rndInt(0, 10)) });
  }

  /* 倒数日 */
  const countdowns = [
    { id: uid('cd'), name: '教师节', date: '2026-09-10', icon: '🍎' },
    { id: uid('cd'), name: '国庆节', date: '2026-10-01', icon: '🎉' },
    { id: uid('cd'), name: '元旦', date: '2027-01-01', icon: '🎊' }
  ];

  /* 座位：6 行 8 列 */
  const seat = { rows: 6, cols: 8, stage: 'top', aisles: 1, layout: [] };
  let seatIdx = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      seat.layout.push({ seatId: 'seat_' + r + '_' + c, row: r, col: c, studentId: seatIdx < 48 ? curClass[seatIdx].id : '' });
      seatIdx++;
    }
  }

  /* 课表 */
  const schedule = {
    periods: [
      { name: '第1节', start: '08:00', end: '08:45' }, { name: '第2节', start: '08:55', end: '09:40' },
      { name: '第3节', start: '10:00', end: '10:45' }, { name: '第4节', start: '10:55', end: '11:40' },
      { name: '第5节', start: '14:30', end: '15:15' }, { name: '第6节', start: '15:25', end: '16:10' },
      { name: '第7节', start: '16:20', end: '17:05' }, { name: '第8节', start: '17:15', end: '18:00' }
    ],
    grid: {
      1: [{ subject: '语文', teacher: '郑老师' }, { subject: '数学', teacher: '刘老师' }, { subject: '英语', teacher: '王老师' }, { subject: '物理', teacher: '赵老师' }, { subject: '化学', teacher: '孙老师' }, { subject: '体育', teacher: '周老师' }, { subject: '班会', teacher: '郑老师' }, { subject: '自习', teacher: '郑老师' }],
      2: [{ subject: '数学', teacher: '刘老师' }, { subject: '语文', teacher: '郑老师' }, { subject: '政治', teacher: '吴老师' }, { subject: '英语', teacher: '王老师' }, { subject: '历史', teacher: '陈老师' }, { subject: '生物', teacher: '徐老师' }, { subject: '自习', teacher: '郑老师' }, { subject: '地理', teacher: '黄老师' }],
      3: [{ subject: '英语', teacher: '王老师' }, { subject: '数学', teacher: '刘老师' }, { subject: '语文', teacher: '郑老师' }, { subject: '物理', teacher: '赵老师' }, { subject: '地理', teacher: '黄老师' }, { subject: '化学', teacher: '孙老师' }, { subject: '自习', teacher: '郑老师' }, { subject: '体育', teacher: '周老师' }],
      4: [{ subject: '语文', teacher: '郑老师' }, { subject: '英语', teacher: '王老师' }, { subject: '数学', teacher: '刘老师' }, { subject: '生物', teacher: '徐老师' }, { subject: '政治', teacher: '吴老师' }, { subject: '历史', teacher: '陈老师' }, { subject: '自习', teacher: '郑老师' }, { subject: '音乐', teacher: '何老师' }],
      5: [{ subject: '数学', teacher: '刘老师' }, { subject: '语文', teacher: '郑老师' }, { subject: '英语', teacher: '王老师' }, { subject: '物理', teacher: '赵老师' }, { subject: '化学', teacher: '孙老师' }, { subject: '体育', teacher: '周老师' }, { subject: '自习', teacher: '郑老师' }, { subject: '班会', teacher: '郑老师' }]
    }
  };

  /* 值日 */
  const duties = {
    week: '第15周',
    days: [
      { day: '周一', students: curClass.slice(0, 6).map(s => s.name) },
      { day: '周二', students: curClass.slice(6, 12).map(s => s.name) },
      { day: '周三', students: curClass.slice(12, 18).map(s => s.name) },
      { day: '周四', students: curClass.slice(18, 24).map(s => s.name) },
      { day: '周五', students: curClass.slice(24, 30).map(s => s.name) }
    ],
    roomDuty: { cursor: 0, days: [
      { day: '周一', name: '' },
      { day: '周二', name: '' },
      { day: '周三', name: '' },
      { day: '周四', name: '' },
      { day: '周五', name: '' }
    ] }
  };

  /* 荣誉 */
  const honorsClass = [
    { id: uid('hc'), name: '优秀班集体', type: '集体荣誉', date: '2026-06-01' },
    { id: uid('hc'), name: '运动会团体总分二等奖', type: '活动荣誉', date: '2026-05-20' },
    { id: uid('hc'), name: '文明班级（连续三个月）', type: '日常评比', date: '2026-06-30' }
  ];
  const honorsTeacher = [
    { id: uid('ht'), name: '市级优秀班主任', type: '个人荣誉', date: '2026-05-10' },
    { id: uid('ht'), name: '教学质量先进个人', type: '教学荣誉', date: '2026-06-15' },
    { id: uid('ht'), name: '优质课评比一等奖', type: '教学荣誉', date: '2026-04-22' }
  ];

  /* 活动 */
  const activities = [
    { id: uid('ac'), name: '太原植物园研学活动', type: '研学', date: dateAdd(today, 12), status: '报名中', leader: '郑老师', students: curClass.slice(0, 20).map(s => s.id), summary: '' },
    { id: uid('ac'), name: '校园运动会', type: '运动会', date: dateAdd(today, -18), status: '已结束', leader: '周老师', students: curClass.slice(0, 30).map(s => s.id), summary: '获得团体总分第二名，同学们表现积极。' }
  ];

  /* 离校登记 */
  const departures = [
    { id: uid('dp'), studentId: 's8', date: dateAdd(today, -3), leaveTime: '16:50', backTime: '', confirmed: false },
    { id: uid('dp'), studentId: 's21', date: dateAdd(today, -3), leaveTime: '17:10', backTime: '20:30', confirmed: true }
  ];

  /* 五育评价、选科 */
  const fiveEval = {};
  const subjectChoices = {};
  const combos12 = ['物化生','物化政','物化地','物生政','物生地','物政地','史化生','史化政','史化地','史生政','史生地','史政地'];
  curClass.forEach(st => {
    fiveEval[st.id] = { moral: rndInt(70, 98), academic: rndInt(60, 95), physical: rndInt(65, 96), artistic: rndInt(60, 95), practice: rndInt(62, 96), note: '' };
    if (rnd() < 0.85) subjectChoices[st.id] = pick(combos12);
  });

  /* 自定义节假日 */
  const customHolidays = [
    { id: uid('ch'), name: '校运动会', date: dateAdd(today, 20), icon: '🏃' },
    { id: uid('ch'), name: '家长会', date: dateAdd(today, 6), icon: '📋' }
  ];

  /* 生涯规划 */
  const career = [
    { id: uid('cr'), studentId: 's3', type: '兴趣探索', content: '对航天科技感兴趣，推荐阅读科普读物', date: dateAdd(today, -8) },
    { id: uid('cr'), studentId: 's15', type: '职业启蒙', content: '喜欢绘画，建议参加美术社团', date: dateAdd(today, -5) },
    { id: uid('cr'), studentId: 's28', type: '学习规划', content: '目标高中：太原市重点中学', date: dateAdd(today, -2) }
  ];

  /* 安全特殊台账 */
  const safety = {
    physical: [
      { id: uid('sf'), studentId: 's11', note: '过敏性哮喘，体育课需注意', date: '2026-03-10' },
      { id: uid('sf'), studentId: 's25', note: '近视 400 度，建议前排座位', date: '2026-04-02' }
    ],
    retention: [
      { id: uid('sr'), studentId: 's38', note: '家庭困难有辍学风险，已家访并申请补助', date: dateAdd(today, -7) }
    ],
    safetyLedger: [
      { id: uid('sl'), studentId: 's2', note: '课间摔伤手肘，已处理并通知家长', date: dateAdd(today, -4) },
      { id: uid('sl'), studentId: 's40', note: '楼道追逐，已批评教育', date: dateAdd(today, -9) }
    ],
    mental: [
      { id: uid('sm'), studentId: 's16', note: '情绪波动较大，已与心理老师对接', date: dateAdd(today, -5) },
      { id: uid('sm'), studentId: 's29', note: '近期压力大，重点关注', date: dateAdd(today, -3) }
    ]
  };

  /* 备课资料 */
  const lessons = [
    { id: uid('ls'), title: '《春》第二课时教学设计', subject: '语文', content: '导入—朗读品味—修辞赏析—仿写练习', date: dateAdd(today, -5) },
    { id: uid('ls'), title: '一元一次方程应用题精讲', subject: '数学', content: '设未知数—列方程—解方程—检验作答', date: dateAdd(today, -3) },
    { id: uid('ls'), title: '英语一般过去时专项', subject: '英语', content: '规则变化—不规则变化—句型转换—练习', date: dateAdd(today, -2) }
  ];
  return {
    version: DB_VERSION,
    settings,
    classes,
    students,
    exams,
    scores,
    attendance,
    leaves,
    points,
    violations,
    homeworks,
    contacts,
    notices,
    aids,
    todos,
    logs,
    talks,
    meetings,
    resources,
    recites,
    countdowns,
    seat,
    schedule,
    duties,
    honorsClass,
    honorsTeacher,
    activities,
    departures,
    fiveEval,
    subjectChoices,
    customHolidays,
    career,
    safety,
    comments: {},
    lessons,
    labelLibrary: []
  };
}

/* ================= 存储与迁移 ================= */
const DB = {
  data: null,
  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) { console.warn('保存失败', e); }
  },
  load() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.data = this.normalize(parsed);
      } catch (e) {
        console.warn('本地数据损坏，重新生成演示数据');
        this.data = demoData();
      }
    } else {
      this.data = demoData();
    }
    this.save();
  },
  normalize(d) {
    const base = demoData();
    const out = Object.assign({}, base, d || {});
    out.settings = Object.assign(base.settings, d && d.settings ? d.settings : {});
    out.version = DB_VERSION;
    ['classes', 'students', 'exams', 'scores', 'attendance', 'leaves', 'points', 'violations', 'homeworks',
     'contacts', 'notices', 'aids', 'todos', 'logs', 'talks', 'meetings', 'resources', 'recites',
     'countdowns', 'honorsClass', 'honorsTeacher', 'activities', 'departures', 'customHolidays', 'career']
      .forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
    if (!out.seat || typeof out.seat !== 'object') out.seat = { rows: 6, cols: 8, stage: 'top', aisles: 1, layout: [] };
    if (!out.schedule || !out.schedule.grid) out.schedule = { periods: [], grid: {} };
    if (!out.schedule.periods) out.schedule.periods = [];
    if (!out.schedule.grid) out.schedule.grid = {};
    if (!out.duties || !out.duties.days) out.duties = { week: '第1周', days: [] };
    if (!out.duties.roomDuty || !out.duties.roomDuty.days) out.duties.roomDuty = { days: (out.duties.days || []).map(x => ({ day: x.day || '', name: '' })) };
    if (typeof out.duties.roomDuty.cursor !== 'number') out.duties.roomDuty.cursor = 0;
    if (!out.fiveEval || typeof out.fiveEval !== 'object') out.fiveEval = {};
    if (!out.subjectChoices || typeof out.subjectChoices !== 'object') out.subjectChoices = {};
    if (!out.safety || typeof out.safety !== 'object') out.safety = { physical: [], retention: [], safetyLedger: [], mental: [] };
    if (!out.labelLibrary) out.labelLibrary = [];
    if (!out.comments || typeof out.comments !== 'object') out.comments = {};
    if (!Array.isArray(out.lessons)) out.lessons = [];
    return out;
  },
  resetDemo() {
    this.data = demoData();
    this.save();
  },
  clearAll() {
    const empty = demoData();
    ['classes', 'students', 'exams', 'scores', 'attendance', 'leaves', 'points', 'violations', 'homeworks',
     'contacts', 'notices', 'aids', 'todos', 'logs', 'talks', 'meetings', 'resources', 'recites',
     'countdowns', 'honorsClass', 'honorsTeacher', 'activities', 'departures', 'customHolidays', 'career']
      .forEach(k => { empty[k] = []; });
    empty.fiveEval = {}; empty.subjectChoices = {}; empty.safety = { physical: [], retention: [], safetyLedger: [], mental: [] }; empty.comments = {}; empty.lessons = [];
    this.data = empty;
    this.save();
  }
};



/* ================= 农历与节气 ================= */
const lunarInfo = [
0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
0x0d520
];
const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

function leapMonth(y) { return lunarInfo[y - 1900] & 0xf; }
function leapDays(y) { return leapMonth(y) ? ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29) : 0; }
function monthDays(y, m) { return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
function lYearDays(y) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
  return sum + leapDays(y);
}

function solar2lunar(y, m, d) {
  const baseDate = Date.UTC(1900, 0, 31);
  const objDate = Date.UTC(y, m - 1, d);
  let offset = Math.floor((objDate - baseDate) / 86400000);
  let temp = 0, i;
  for (i = 1900; i < 2101 && offset > 0; i++) { temp = lYearDays(i); offset -= temp; }
  if (offset < 0) { offset += temp; i--; }
  const year = i;
  const leap = leapMonth(year);
  let isLeap = false;
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) { --i; isLeap = true; temp = leapDays(year); }
    else { temp = monthDays(year, i); }
    if (isLeap && i === (leap + 1)) isLeap = false;
    offset -= temp;
  }
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) isLeap = false; else { isLeap = true; --i; }
  }
  if (offset < 0) { offset += temp; --i; }
  const month = i, day = offset + 1;
  return {
    lYear: year, lMonth: month, lDay: day, isLeap,
    monthName: (isLeap ? '闰' : '') + LUNAR_MONTHS[month - 1] + '月',
    dayName: LUNAR_DAYS[day - 1]
  };
}

function lunar2solar(y, m, d, isLeap) {
  const baseDate = Date.UTC(1900, 0, 31);
  let offset = 0;
  for (let i = 1900; i < y; i++) offset += lYearDays(i);
  const leap = leapMonth(y);
  let isAdd = false;
  for (let i = 1; i < m; i++) {
    if (leap > 0 && i === leap + 1 && !isAdd) { offset += leapDays(y); isAdd = true; }
    offset += monthDays(y, i);
  }
  if (leap > 0 && m === leap + 1 && !isAdd) offset += leapDays(y);
  if (isLeap) offset += leapDays(y);
  else if (leap > 0 && m === leap + 1) offset += leapDays(y);
  offset += d - 1;
  return new Date(baseDate + offset * 86400000);
}
function lunarDateStr(y, m, d, isLeap) {
  const dt = lunar2solar(y, m, d, isLeap);
  return fmtDate(dt);
}

/* 二十四节气 */
const sTermInfo = [0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
const TERM_NAMES = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
function termDay(y, n) {
  const off = new Date((31556925974.7 * (y - 1900) + sTermInfo[n] * 60000) + Date.UTC(1900, 0, 6, 2, 5));
  return off.getUTCDate();
}
function termOfDate(y, m, d) {
  const idx = (m - 1) * 2;
  if (d === termDay(y, idx)) return TERM_NAMES[idx];
  if (d === termDay(y, idx + 1)) return TERM_NAMES[idx + 1];
  return '';
}

/* ================= 节日体系 ================= */
const LEGAL_ICONS = { '元旦': '🎊', '春节': '🧧', '清明节': '🌿', '劳动节': '🔧', '端午节': '🚣', '中秋节': '🥮', '国庆节': '🎆' };

function fixedHolidays(y) {
  return [
    { name: '元旦', date: y + '-01-01', type: 'legal' },
    { name: '春节', date: lunarDateStr(y, 1, 1), type: 'legal' },
    { name: '清明节', date: y + '-' + String(4).padStart(2, '0') + '-' + String(termDay(y, 6)).padStart(2, '0'), type: 'legal' },
    { name: '劳动节', date: y + '-05-01', type: 'legal' },
    { name: '端午节', date: lunarDateStr(y, 5, 5), type: 'legal' },
    { name: '中秋节', date: lunarDateStr(y, 8, 15), type: 'legal' },
    { name: '国庆节', date: y + '-10-01', type: 'legal' }
  ];
}
function lunarFestivals(y) {
  return [
    { name: '元宵节', date: lunarDateStr(y, 1, 15), type: 'lunar' },
    { name: '七夕节', date: lunarDateStr(y, 7, 7), type: 'lunar' },
    { name: '重阳节', date: lunarDateStr(y, 9, 9), type: 'lunar' },
    { name: '腊八节', date: lunarDateStr(y, 12, 8), type: 'lunar' },
    { name: '除夕', date: lunarDateStr(y, 12, monthDays(y, 12)), type: 'lunar' }
  ];
}
function solarFestivals(y) {
  const secondSunday = function (month) {
    let d = new Date(y, month - 1, 1);
    let count = 0;
    while (true) {
      if (d.getDay() === 0) { count++; if (count === 2) break; }
      d.setDate(d.getDate() + 1);
    }
    return fmtDate(d);
  };
  const thirdSunday = function (month) {
    let d = new Date(y, month - 1, 1);
    let count = 0;
    while (true) {
      if (d.getDay() === 0) { count++; if (count === 3) break; }
      d.setDate(d.getDate() + 1);
    }
    return fmtDate(d);
  };
  return [
    { name: '情人节', date: y + '-02-14', type: 'festival' },
    { name: '妇女节', date: y + '-03-08', type: 'festival' },
    { name: '植树节', date: y + '-03-12', type: 'festival' },
    { name: '愚人节', date: y + '-04-01', type: 'festival' },
    { name: '青年节', date: y + '-05-04', type: 'festival' },
    { name: '母亲节', date: secondSunday(5), type: 'festival' },
    { name: '护士节', date: y + '-05-12', type: 'festival' },
    { name: '儿童节', date: y + '-06-01', type: 'festival' },
    { name: '父亲节', date: thirdSunday(6), type: 'festival' },
    { name: '建党节', date: y + '-07-01', type: 'festival' },
    { name: '建军节', date: y + '-08-01', type: 'festival' },
    { name: '光棍节', date: y + '-11-11', type: 'festival' },
    { name: '记者节', date: y + '-11-08', type: 'festival' },
    { name: '国际志愿者日', date: y + '-12-05', type: 'festival' },
    { name: '平安夜', date: y + '-12-24', type: 'festival' },
    { name: '圣诞节', date: y + '-12-25', type: 'festival' }
  ];
}
function memorialDays(y) {
  const thirdSundayMay = (function () {
    let d = new Date(y, 4, 1);
    let count = 0;
    while (true) {
      if (d.getDay() === 0) { count++; if (count === 3) break; }
      d.setDate(d.getDate() + 1);
    }
    return fmtDate(d);
  })();
  return [
    { name: '学雷锋日', date: y + '-03-05', type: 'memorial' },
    { name: '国家安全教育日', date: y + '-04-15', type: 'memorial' },
    { name: '全国助残日', date: thirdSundayMay, type: 'memorial' },
    { name: '国际禁毒日', date: y + '-06-26', type: 'memorial' },
    { name: '七七事变', date: y + '-07-07', type: 'memorial' },
    { name: '抗战胜利纪念日', date: y + '-09-03', type: 'memorial' },
    { name: '九一八事变', date: y + '-09-18', type: 'memorial' },
    { name: '烈士纪念日', date: y + '-09-30', type: 'memorial' },
    { name: '一二九运动', date: y + '-12-09', type: 'memorial' },
    { name: '国家公祭日', date: y + '-12-13', type: 'memorial' },
    { name: '世界艾滋病日', date: y + '-12-01', type: 'memorial' }
  ];
}

/* 某日标签（日历用） */
function dayTags(dateStr) {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(5, 7), 10);
  const d = parseInt(dateStr.slice(8, 10), 10);
  const tags = [];
  const pushByPriority = function (name, type) {
    const order = { legal: 0, lunar: 1, festival: 2, memorial: 3 };
    const existing = tags.find(t => t.type === 'legal' || t.type === 'lunar' || t.type === 'festival' || t.type === 'memorial');
    if (!existing) { tags.push({ name, type }); return; }
    if (order[type] < order[existing.type]) { existing.name = name; existing.type = type; }
  };
  fixedHolidays(y).forEach(h => { if (h.date === dateStr) pushByPriority(h.name, h.type); });
  lunarFestivals(y).forEach(h => { if (h.date === dateStr) pushByPriority(h.name, h.type); });
  solarFestivals(y).forEach(h => { if (h.date === dateStr) pushByPriority(h.name, h.type); });
  memorialDays(y).forEach(h => { if (h.date === dateStr) pushByPriority(h.name, h.type); });
  const term = termOfDate(y, m, d);
  return { tags, term };
}

/* 下一个假期 */
function nextHoliday(fromDate) {
  const y = parseInt(fromDate.slice(0, 4), 10);
  const list = [];
  [fixedHolidays(y), fixedHolidays(y + 1)].forEach(arr => arr.forEach(h => list.push(h)));
  (DB.data ? DB.data.customHolidays : []).forEach(h => list.push({ name: h.name, date: h.date, type: 'legal', icon: h.icon }));
  list.sort((a, b) => a.date < b.date ? -1 : 1);
  const item = list.find(h => h.date >= fromDate);
  if (!item) return null;
  return {
    name: item.name,
    date: item.date,
    days: daysBetween(fromDate, item.date),
    icon: item.icon || LEGAL_ICONS[item.name] || '📅'
  };
}

/* 学期进度 */
function termProgress() {
  const s = DB.data.settings;
  const total = daysBetween(s.termStart, s.termEnd);
  const passed = daysBetween(s.termStart, todayStr());
  const pct = total > 0 ? Math.min(1, Math.max(0, passed / total)) : 0;
  return { pct: Math.round(pct * 100), passed: Math.min(Math.max(0, total), Math.max(0, passed)), total: Math.max(0, total) };
}

/* 寒暑假倒计时状态 */
function vacationStatus() {
  const s = DB.data.settings;
  const today = todayStr();
  const w = { start: s.winterStart, end: s.winterEnd };
  const su = { start: s.summerStart, end: s.summerEnd };
  const all = [w, su];
  const hasSet = all.every(v => v.start && v.end);
  if (!hasSet) return { status: '未设置', text: '未设置假期' };
  for (const v of all) {
    if (today >= v.start && today <= v.end) {
      return { status: 'on', text: '已放假，还有 ' + Math.max(0, daysBetween(today, v.end)) + ' 天开学', end: v.end };
    }
  }
  const next = all.map(v => ({ v, d: daysBetween(today, v.start) })).filter(x => x.d > 0).sort((a, b) => a.d - b.d)[0];
  if (next) return { status: 'off', text: '还有 ' + next.d + ' 天放假', start: next.v.start };
  return { status: 'end', text: '假期已结束' };
}


/* ================= UI 工具 ================= */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function toast(msg, type) {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'ok');
  const ico = type === 'err' ? '⚠️' : type === 'warn' ? '💡' : '✅';
  el.innerHTML = '<span>' + ico + '</span><span>' + esc(msg) + '</span>';
  wrap.appendChild(el);
  setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2200);
  setTimeout(function () { el.remove(); }, 2600);
}
function confirmBox(opts) {
  openModal(
    '<div class="modal-title">' + esc(opts.title || '确认操作') + '</div>' +
    '<div style="padding:6px 0 2px;color:var(--text2);font-size:13.5px;line-height:1.7">' + esc(opts.message || '确定要继续吗？') + '</div>',
    { noPad: true }
  );
  const foot = document.createElement('div');
  foot.className = 'modal-foot';
  foot.innerHTML = '<button class="btn" data-action="closeModal">取消</button><button class="btn ' + (opts.danger ? 'danger-solid' : 'primary') + '" id="confirmOkBtn">' + esc(opts.okText || '确定') + '</button>';
  document.getElementById('modalBox').appendChild(foot);
  document.getElementById('confirmOkBtn').onclick = function () {
    closeModal();
    if (opts.onOk) opts.onOk();
  };
}
function openModal(html, opts) {
  opts = opts || {};
  const mask = document.getElementById('modalMask');
  const box = document.getElementById('modalBox');
  box.className = 'modal' + (opts.wide ? ' wide' : '');
  if (opts.noPad) {
    box.innerHTML = '<div class="modal-head"><div></div><button class="modal-x" data-action="closeModal">✕</button></div><div class="modal-body" style="padding-top:6px">' + html + '</div>';
  } else {
    box.innerHTML = '<div class="modal-head"><div class="modal-title">' + (opts.title || '') + '</div><button class="modal-x" data-action="closeModal">✕</button></div><div class="modal-body">' + html + '</div>';
  }
  mask.classList.add('show');
  mask._onClose = opts.onClose || null;
  const first = box.querySelector('input,select,textarea');
  if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 30);
}
function closeModal() {
  const mask = document.getElementById('modalMask');
  if (mask._onClose) { const fn = mask._onClose; mask._onClose = null; fn(); }
  mask.classList.remove('show');
}
function openDrawer(title, html, footHtml) {
  document.getElementById('drawerTitle').textContent = title;
  document.getElementById('drawerBody').innerHTML = html;
  const foot = document.getElementById('drawerFoot');
  if (footHtml) { foot.style.display = 'flex'; foot.innerHTML = footHtml; }
  else { foot.style.display = 'none'; foot.innerHTML = ''; }
  document.getElementById('drawerMask').classList.add('show');
  document.getElementById('drawerBox').classList.add('show');
}
function closeDrawer() {
  document.getElementById('drawerMask').classList.remove('show');
  document.getElementById('drawerBox').classList.remove('show');
}
/* 读取弹窗表单 data-field 值 */
function readFields(prefix) {
  const mask = document.getElementById('modalMask');
  const root = (mask && mask.classList.contains('show')) ? document.getElementById('modalBox') : document;
  const out = {};
  const nodes = root.querySelectorAll('[data-field]');
  nodes.forEach(function (el) {
    const name = el.getAttribute('data-field');
    if (el.type === 'checkbox') out[name] = el.checked;
    else out[name] = el.value.trim();
  });
  if (prefix) {
    const p = document.getElementById(prefix);
    if (p) {
      p.querySelectorAll('[data-field]').forEach(function (el) {
        const name = el.getAttribute('data-field');
        if (el.type === 'checkbox') out[name] = el.checked;
        else out[name] = el.value.trim();
      });
    }
  }
  return out;
}
function field(name, label, value, type, extra, options) {
  extra = extra || '';
  const val = esc(value == null ? '' : value);
  if (type === 'select') return '<div class="field"><label>' + label + '</label><select data-field="' + name + '" ' + extra + '>' + (options || value) + '</select></div>';
  if (type === 'textarea') return '<div class="field ' + (extra.indexOf('full') >= 0 ? 'full' : '') + '"><label>' + label + '</label><textarea data-field="' + name + '" ' + extra + '>' + val + '</textarea></div>';
  if (type === 'checkbox') return '<div class="field"><label class="hint"><input type="checkbox" data-field="' + name + '" ' + (val === 'true' || val === 'on' || value ? 'checked' : '') + ' ' + extra + '> ' + label + '</label></div>';
  return '<div class="field ' + (extra.indexOf('full') >= 0 ? 'full' : '') + '"><label>' + label + '</label><input type="' + (type || 'text') + '" data-field="' + name + '" value="' + val + '" ' + extra + '></div>';
}
function optionsHtml(items, selected) {
  return items.map(function (it) {
    const v = typeof it === 'object' ? it.value : it;
    const t = typeof it === 'object' ? it.label : it;
    return '<option value="' + esc(v) + '"' + (String(v) === String(selected) ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');
}
function chipsHtml(items, selectedArr, cls) {
  return items.map(function (it) {
    const on = selectedArr.indexOf(it) >= 0;
    return '<span class="chip ' + (on ? 'on' : '') + ' ' + (cls || '') + '" data-chip="' + esc(it) + '">' + esc(it) + '</span>';
  }).join('');
}
function avatarHtml(stu, cls) {
  if (stu && stu.avatar) return '<div class="stu-avatar ' + (cls || '') + '"><img src="' + esc(stu.avatar) + '" alt=""></div>';
  return '<div class="stu-avatar ' + (cls || '') + '">' + esc(stu ? stu.name.charAt(0) : '?') + '</div>';
}
function maskPhone(p) {
  if (!p) return '—';
  if (!DB.data.settings.maskPhone) return p;
  return p.length >= 11 ? p.slice(0, 3) + '****' + p.slice(7) : p;
}
function getStudent(id) { return DB.data.students.find(function (s) { return s.id === id; }) || null; }
function getClass(id) { return DB.data.classes.find(function (c) { return c.id === id; }) || null; }
function currentClass() { return getClass(DB.data.settings.currentClassId) || DB.data.classes[0] || null; }
function currentStudents() {
  const cc = currentClass();
  return cc ? DB.data.students.filter(function (s) { return s.classId === cc.id; }) : [];
}
function subjectColor(sub) {
  const c = DB.data.settings.subjectColors[sub];
  return c || '#94A3B8';
}
function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 100);
}
function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toCSV(rows) { return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'); }
function parseCSV(text) {
  const rows = []; let row = []; let cur = ''; let inQ = false;
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row); }
  return rows.filter(function (r) { return r.length > 1 || (r.length === 1 && r[0].trim() !== ''); });
}
function readFile(input, cb) {
  const f = input.files && input.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = function () { cb(reader.result, f.name); };
  reader.readAsText(f);
}
function daysText(dateStr, today) {
  const t = today || todayStr();
  const diff = daysBetween(t, dateStr);
  if (diff > 0) return '还有 <b>' + diff + '</b> 天';
  if (diff === 0) return '<b>就是今天</b>';
  return '已完成 <b>' + Math.abs(diff) + '</b> 天';
}
function daysClass(dateStr, today) {
  const diff = daysBetween(today || todayStr(), dateStr);
  return diff < 0 ? 'past' : '';
}
/* 矢量折线图 */
function lineChartSVG(points, opts) {
  opts = opts || {};
  const W = 400, H = 150, padL = 34, padR = 14, padT = 12, padB = 26;
  if (!points || points.length === 0) return '<div class="empty">暂无数据</div>';
  const vals = points.map(function (p) { return p.value; });
  let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  if (min === max) { min -= 5; max += 5; }
  const span = max - min;
  const x = function (i) { return points.length === 1 ? (W - padL - padR) / 2 + padL : padL + i * (W - padL - padR) / (points.length - 1); };
  const y = function (v) { return padT + (1 - (v - min) / span) * (H - padT - padB); };
  let path = '', area = '';
  points.forEach(function (p, i) {
    const px = x(i).toFixed(1), py = y(p.value).toFixed(1);
    path += (i === 0 ? 'M' : 'L') + px + ',' + py + ' ';
    area += (i === 0 ? 'M' : 'L') + px + ',' + py + ' ';
  });
  area += 'L' + x(points.length - 1).toFixed(1) + ',' + (H - padB) + ' L' + x(0).toFixed(1) + ',' + (H - padB) + ' Z';
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  svg += '<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity="0.25"/><stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>';
  const gridLines = 4;
  for (let g = 0; g <= gridLines; g++) {
    const gy = padT + g * (H - padT - padB) / gridLines;
    const gv = Math.round(max - g * span / gridLines);
    svg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="#EEF2F8" stroke-width="1"/>';
    svg += '<text x="' + (padL - 6) + '" y="' + (gy + 4) + '" font-size="9" fill="#8A94A6" text-anchor="end">' + gv + '</text>';
  }
  svg += '<path d="' + area + '" fill="url(#chartGrad)"/>';
  svg += '<path d="' + path + '" fill="none" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
  points.forEach(function (p, i) {
    svg += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.value).toFixed(1) + '" r="3.6" fill="#fff" stroke="var(--primary)" stroke-width="2"/>';
  });
  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  points.forEach(function (p, i) {
    if (i % labelStep === 0 || i === points.length - 1) {
      const txt = (opts.shortLabel && p.label.length > 4 ? p.label.slice(0, 4) : p.label);
      svg += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" font-size="9.5" fill="#8A94A6" text-anchor="middle">' + esc(txt) + '</text>';
    }
  });
  svg += '</svg>';
  return svg;
}
/* 统计卡 */
function statCard(color, title, num, sub, unit, action, target) {
  const act = action ? ' data-action="' + action + '" data-target="' + target + '" style="cursor:pointer"' : '';
  return '<div class="stat-card"' + act + '><span class="stat-dot" style="background:' + color + '"></span><div class="stat-body"><div class="stat-title">' + esc(title) + '</div><div class="stat-num">' + num + (unit ? '<span class="u">' + esc(unit) + '</span>' : '') + '</div><div class="stat-sub">' + esc(sub) + '</div></div></div>';
}
/* 空状态 */
function emptyHtml(text, ico) {
  return '<div class="empty"><div class="e-ico">' + (ico || '📭') + '</div>' + esc(text || '暂无数据') + '</div>';
}
/* 导航数据 */
const NAV_GROUPS = [
  { name: '总览', items: [
    { id: 'dashboard', label: '仪表盘', ico: '📊' },
    { id: 'classes', label: '班级管理', ico: '🏫' },
    { id: 'students', label: '学生管理', ico: '👥' },
    { id: 'calendar', label: '日历假期', ico: '📅' }
  ]},
  { name: '教学', items: [
    { id: 'grades', label: '成绩管理', ico: '📝' },
    { id: 'attendance', label: '考勤管理', ico: '✅' },
    { id: 'homework', label: '作业管理', ico: '📚' },
    { id: 'leave', label: '请假管理', ico: '📄' }
  ]},
  { name: '班级', items: [
    { id: 'affairs', label: '班级事务', ico: '🗂️' },
    { id: 'moral', label: '德育活动', ico: '🏅' }
  ]},
  { name: '家校', items: [
    { id: 'contact', label: '家校沟通', ico: '📞' },
    { id: 'evaluation', label: '学生评价', ico: '⭐' }
  ]},
  { name: '工作', items: [
    { id: 'work', label: '工作管理', ico: '📌' },
    { id: 'safety', label: '安全特殊', ico: '🛡️' }
  ]},
  { name: '智能', items: [
    { id: 'assistant', label: '智能助手', ico: '🤖', special: true },
    { id: 'subjecttools', label: '学科工具', ico: '🧮' }
  ]},
  { name: '系统', items: [
    { id: 'datamgr', label: '数据管理', ico: '💾' },
    { id: 'profile', label: '个人资料修改', ico: '👤' }
  ]}
];
/* ================= 模块：仪表盘 ================= */
function renderDashboard() {
  const d = DB.data, s = d.settings;
  const stu = currentStudents();
  const cc = currentClass();
  const today = todayStr();
  const boys = stu.filter(x => x.gender === '男').length;
  const girls = stu.length - boys;
  const boarding = stu.filter(x => x.boarding).length;
  const attDates = d.attendance.map(a => a.date).filter((v, i, arr) => arr.indexOf(v) === i).sort();
  const attDate = attDates[attDates.length - 1] || today;
  const attRows = d.attendance.filter(a => a.date === attDate);
  const present = attRows.filter(a => a.status === '出勤').length;
  const late = attRows.filter(a => a.status === '迟到').length;
  const absent = attRows.filter(a => a.status === '缺勤').length;
  const onLeave = attRows.filter(a => a.status === '请假').length;
  const attRate = attRows.length ? Math.round((present / attRows.length) * 1000) / 10 : 0;
  const weekAgo = dateAdd(today, -7);
  const weekVio = d.violations.filter(v => v.date >= weekAgo && v.date <= today).length;
  const todoOpen = d.todos.filter(t => !t.done);
  const todoOverdue = todoOpen.filter(t => t.due && t.due < today).length;
  const clsId = cc ? cc.id : '';
  const hwAll = d.homeworks.filter(h => !clsId || h.classId === clsId);
  let hwSubmit = 0, hwTotal = 0, hwMissing = 0;
  hwAll.forEach(h => {
    const clsStu = stu.map(x => x.id);
    hwTotal += clsStu.length;
    hwSubmit += (h.submitted || []).filter(id => clsStu.indexOf(id) >= 0).length;
    hwMissing += clsStu.filter(id => (h.submitted || []).indexOf(id) < 0 && (h.late || []).indexOf(id) < 0).length;
  });
  const hwRate = hwTotal ? Math.round((hwSubmit / hwTotal) * 1000) / 10 : 0;
  const scores = d.scores.filter(sc => d.exams.some(e => e.id === sc.examId) && stu.some(x => x.id === sc.studentId));
  const latestExam = d.exams.filter(e => d.scores.some(sc => sc.examId === e.id)).sort((a, b) => a.date > b.date ? 1 : -1)[0];
  const latestScores = latestExam ? scores.filter(sc => sc.examId === latestExam.id) : [];
  const avg = latestScores.length ? Math.round(latestScores.reduce((a, b) => a + b.total, 0) / latestScores.length) : 0;
  const max = latestScores.length ? Math.max.apply(null, latestScores.map(x => x.total)) : 0;
  const min = latestScores.length ? Math.min.apply(null, latestScores.map(x => x.total)) : 0;
  const contactsCount = d.contacts.length;
  const noticeCount = d.notices.length;
  const logsHours = d.logs.reduce((a, b) => a + (parseFloat(b.hours) || 0), 0);
  const choices = Object.keys(d.subjectChoices).filter(id => stu.some(x => x.id === id));
  const comboSet = new Set(choices.map(id => d.subjectChoices[id]));
  const highLine = latestScores.filter(sc => sc.total >= 600).length;
  const highRate = latestScores.length ? Math.round((highLine / latestScores.length) * 1000) / 10 : 0;

  const stat = [
    statCard('var(--primary)', '当前班级', stu.length, '人 · 右上角可切换班级', '', 'statJump', 'classes'),
    statCard('var(--info)', '班级基础', boys + ' 男 / ' + girls + ' 女', '住校 ' + boarding + ' 人', '', 'statJump', 'students'),
    statCard('var(--teal)', '当日考勤', present + '/' + attRows.length, '出勤率 ' + attRate + '% · 请假 ' + onLeave + ' 人', '', 'statJump', 'attendance:daily'),
    statCard('var(--danger)', '本周违纪', weekVio, '条 · 近 7 天', '', 'statJump', 'affairs:vio'),
    statCard('var(--warn)', '待办事项', todoOpen.length, '逾期 ' + todoOverdue + ' 项', '', 'statJump', 'work:todo'),
    statCard('var(--ok)', '作业收缴', hwRate + '%', '未交 ' + hwMissing + ' 人次', '', 'statJump', 'homework:list'),
    statCard('var(--purple)', '考试学情', avg, '最高 ' + max + ' · 最低 ' + min + ' 分', '', 'statJump', 'grades:analysis'),
    statCard('var(--info)', '家校沟通', contactsCount, '次 · 通知 ' + noticeCount + ' 条', '', 'statJump', 'contact:book'),
    statCard('var(--teal)', '工作留痕', d.logs.length, '条 · 累计 ' + logsHours + ' 小时', '', 'statJump', 'work:log'),
    statCard('var(--primary)', '选科组合', choices.length + ' 人', comboSet.size + ' 种组合', '', 'statJump', 'subjecttools:subject'),
    statCard('var(--warn)', '特高线（600分）', highLine + ' 人', '上线率 ' + highRate + '%', '', 'statJump', 'grades:analysis')
  ].join('');

  /* 红线预警 */
  const alerts = [];
  stu.forEach(x => { (x.warningTags || []).forEach(w => alerts.push({ tag: w, text: x.name + ' 带有预警标签「' + w + '」', mod: 'students', id: x.id })); });
  d.leaves.forEach(l => { if (l.status === '待审批') { const st = getStudent(l.studentId); alerts.push({ tag: '请假待审批', text: (st ? st.name : '学生') + ' 的' + l.type + '待审批', mod: 'leave', id: l.id }); } });
  d.departures.forEach(dp => { if (!dp.confirmed) { const st = getStudent(dp.studentId); alerts.push({ tag: '未确认返校', text: (st ? st.name : '学生') + ' 周末离校未确认返校', mod: 'attendance', id: dp.id }); } });
  const alertHtml = alerts.length ? alerts.map(a =>
    '<div class="alert-item" data-action="jump" data-mod="' + a.mod + '" data-id="' + a.id + '"><span class="a-ico">🚨</span><span class="a-tag"><span class="badge red">' + esc(a.tag) + '</span></span><span class="a-text">' + esc(a.text) + '</span><span class="a-ico" style="font-size:12px">›</span></div>'
  ).join('') : '<div class="empty" style="padding:18px">🎉 暂无红线预警</div>';

  /* 快捷操作 */
  const quicks = [
    { ico: '👤', label: '新增学生', act: 'students', p: 'add' },
    { ico: '📝', label: '成绩录入', act: 'grades', p: 'score' },
    { ico: '📚', label: '布置作业', act: 'homework', p: 'add' },
    { ico: '📄', label: '请假登记', act: 'leave', p: 'add' },
    { ico: '⚠️', label: '记违纪', act: 'affairs', p: 'vio' },
    { ico: '💬', label: '写评语', act: 'evaluation', p: 'comment' },
    { ico: '📢', label: '发通知', act: 'contact', p: 'notice' },
    { ico: '📌', label: '加待办', act: 'work', p: 'todo' },
    { ico: '🤖', label: '智能助手', act: 'assistant', p: '' }
  ].map(q => '<div class="quick-item" data-action="quick" data-mod="' + q.act + '" data-p="' + q.p + '"><span class="q-ico">' + q.ico + '</span><span>' + q.label + '</span></div>').join('');

  /* 今日待办 */
  const todayTodos = d.todos.filter(t => t.due === today).concat(todoOpen.filter(t => t.due && t.due < today)).slice(0, 6);
  const todoHtml = todayTodos.length ? todayTodos.map(t =>
    '<div class="todo-item"><span class="todo-check ' + (t.done ? 'done' : '') + '" data-action="toggleTodo" data-id="' + t.id + '">' + (t.done ? '✓' : '') + '</span><span class="todo-text ' + (t.done ? 'done' : '') + '">' + esc(t.content) + '</span><span class="badge ' + (t.priority === '高' ? 'red' : t.priority === '中' ? 'amber' : 'green') + '">' + esc(t.priority) + '</span></div>'
  ).join('') : '<div class="empty" style="padding:16px">今天暂无待办 🎉</div>';

  /* 今日课程 */
  const wd = weekdayIndex(today);
  const grid = d.schedule.grid[wd] || [];
  const courseHtml = grid.length ? '<table class="tbl" style="min-width:0"><tbody>' + grid.map((c, i) =>
    '<tr><td class="center" style="width:70px;color:var(--text3);font-size:12px">' + esc((d.schedule.periods[i] || {}).name || ('第' + (i + 1) + '节')) + '</td><td><span style="display:inline-block;padding:4px 12px;border-radius:8px;color:#fff;background:' + subjectColor(c.subject) + ';font-weight:600">' + esc(c.subject) + '</span></td><td>' + esc(c.teacher) + (c.teacher === s.teacherName || (c.subject === '自习' || c.subject === '班会') ? ' <span class="badge primary">本人任教</span>' : '') + '</td></tr>'
  ).join('') + '</tbody></table>' : '<div class="empty" style="padding:16px">今天没有课程安排</div>';

  /* 积分前五 */
  const top5 = stu.slice().sort((a, b) => b.score - a.score).slice(0, 5);
  const medals = ['gold', 'silver', 'bronze'];
  const podium = '<div class="podium">' + top5.slice(0, 3).map((x, i) =>
    '<div class="p-item"><div class="p-avatar ' + medals[i] + '">' + esc(x.name.charAt(0)) + '</div><div class="p-name">' + esc(x.name) + '</div><div class="p-score">' + x.score + ' 分</div></div>'
  ).join('') + '</div><div style="display:flex;justify-content:center;gap:20px;font-size:12px;color:var(--text2);margin-top:10px">' + top5.slice(3).map(x => '4️⃣' + esc(x.name) + ' ' + x.score + '分 · ' + '5️⃣' + esc(top5[4] ? top5[4].name : '')).join('') + '</div>';

  /* 倒计时 */
  const countItems = [];
  d.countdowns.forEach(c => countItems.push({ name: c.name, date: c.date, icon: c.icon || '⏰' }));
  d.exams.forEach(e => countItems.push({ name: e.name, date: e.date, icon: '📝' }));
  countItems.sort((a, b) => a.date < b.date ? -1 : 1);
  const cdHtml = countItems.slice(0, 5).map(c => {
    const diff = daysBetween(today, c.date);
    const pct = diff > 0 ? Math.max(8, Math.min(95, 100 - diff)) : 100;
    return '<div class="cd-item"><div class="cd-top"><span class="cd-name">' + c.icon + ' ' + esc(c.name) + '</span><span class="cd-days ' + (diff < 0 ? 'past' : '') + '">' + daysText(c.date, today) + '</span></div><div class="cd-bar"><i style="width:' + pct + '%"></i></div></div>';
  }).join('');

  /* 最新通知 */
  const noticeHtml = d.notices.slice().sort((a, b) => a.date > b.date ? -1 : 1).slice(0, 3).map(n =>
    '<div class="list-line"><div class="ll-main"><div class="ll-title">' + esc(n.title) + '</div><div class="ll-sub">' + esc(n.date) + ' · ' + esc(n.type) + '</div></div><span class="badge blue">' + esc(n.type) + '</span></div>'
  ).join('') || emptyHtml('暂无通知', '📢');

  const retire = s.retireDate ? daysBetween(today, s.retireDate) : null;

  return '' +
    '<div class="greet-row"><div class="greet">' + esc(s.teacherName) + '好，今天也要努力哟 💪<small>' + esc(today) + ' · ' + esc(cc ? cc.name : '') + '</small></div>' +
    (retire != null ? '<span class="badge amber" title="距离退休">🕰️ 距离退休还有 ' + retire + ' 天</span>' : '') + '</div>' +
    '<div class="stat-grid">' + stat + '</div>' +
    '<div class="card"><div class="card-title">🚨 红线预警</div>' + alertHtml + '</div>' +
    '<div class="card"><div class="card-title">⚡ 快捷操作</div><div class="quick-grid">' + quicks + '</div></div>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-title">📌 今日待办<span class="ct-sub">点击圆圈勾选完成</span><button class="btn ghost small" data-action="quick" data-mod="work" data-p="todo" style="margin-left:auto">查看全部 ›</button></div>' + todoHtml + '</div>' +
      '<div class="card"><div class="card-title">📖 今日课程<span class="ct-sub">自习与班会课标记本人任教</span></div>' + courseHtml + '</div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-title">🏆 量化积分前五名</div>' + podium + '</div>' +
      '<div class="card"><div class="card-title">⏳ 重要事项倒计时</div><div class="countdown-list">' + cdHtml + '</div></div>' +
    '</div>' +
    '<div class="card"><div class="card-title">📢 最新通知</div>' + noticeHtml + '</div>';
}

/* ================= 模块：班级管理 ================= */
function renderClasses() {
  const d = DB.data;
  const cards = d.classes.map(c => {
    const cnt = d.students.filter(s => s.classId === c.id).length;
    return '<div class="class-card' + (c.id === d.settings.currentClassId ? ' current' : '') + '" data-action="openClass" data-id="' + c.id + '">' +
      (c.id === d.settings.currentClassId ? '<span class="cc-cur">仪表盘班级</span>' : '') +
      '<div class="cc-top"><div class="cc-name">' + esc(c.name) + '</div><span class="badge primary">' + esc(c.grade) + '</span></div>' +
      '<div class="cc-info"><span>🏠 教室：' + esc(c.room || '未设置') + '</span><span>👥 学生：' + cnt + ' 人 · 班主任：' + esc(c.headTeacher) + '</span></div>' +
      '<div class="cc-roles">' + (c.roles || []).map(r => '<span class="badge gray">' + esc(r) + '</span>').join('') + '</div>' +
      '<div class="cc-actions">' +
        (c.id !== d.settings.currentClassId ? '<button class="btn small primary" data-action="setCurClass" data-id="' + c.id + '">设为仪表盘班级</button>' : '') +
        '<button class="btn small" data-action="editClass" data-id="' + c.id + '">编辑</button>' +
        '<button class="btn small danger" data-action="delClass" data-id="' + c.id + '">删除</button>' +
      '</div></div>';
  }).join('');
  return '<div class="page-title">🏫 班级管理</div><div class="page-sub">管理班级信息，设置仪表盘使用的当前班级</div>' +
    '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addClass">＋ 添加班级</button></div>' +
    (cards ? '<div class="class-cards">' + cards + '</div>' : emptyHtml('暂无班级，请先添加', '🏫'));
}

function classFormModal(cls) {
  cls = cls || {};
  const roles = (cls.roles || []).join('\n');
  openModal(
    '<div class="form-grid">' +
    field('name', '班级名称 *', cls.name || '', 'text', 'placeholder="如：七年级（3）班"') +
    field('grade', '年级', cls.grade || '七年级', 'select', '', optionsHtml(['七年级', '八年级', '九年级'], cls.grade)) +
    field('headTeacher', '班主任', cls.headTeacher || DB.data.settings.teacherName, 'text') +
    field('room', '教室', cls.room || '', 'text', 'placeholder="如：教学楼A栋 302"') +
    field('roles', '角色列表（每行一条）', roles, 'textarea', 'full placeholder="班主任：郑老师&#10;语文：郑老师&#10;数学：刘老师"') +
    '</div>',
    { title: cls.id ? '编辑班级' : '添加班级' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveClass" data-id="' + (cls.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function modalFootHtml(btnHtml) {
  return '<div class="modal-foot"><button class="btn" data-action="closeModal">取消</button>' + btnHtml + '</div>';
}
function saveClass(id) {
  const v = readFields();
  if (!v.name) { toast('请填写班级名称', 'err'); return; }
  const d = DB.data;
  if (id) {
    const c = getClass(id);
    if (c) { Object.assign(c, { name: v.name, grade: v.grade, headTeacher: v.headTeacher, room: v.room, roles: v.roles.split('\n').map(x => x.trim()).filter(Boolean) }); }
    toast('班级已更新');
  } else {
    const c = { id: uid('c'), name: v.name, grade: v.grade, headTeacher: v.headTeacher, room: v.room, roles: v.roles.split('\n').map(x => x.trim()).filter(Boolean) };
    d.classes.push(c);
    if (!d.settings.currentClassId) d.settings.currentClassId = c.id;
    toast('班级已添加');
  }
  DB.save(); closeModal(); render();
}

/* ================= 模块：学生管理 ================= */
function studentSortArrow(key) {
  const ss = state.studentSort || {};
  if (ss.key === key) return ss.dir === 1 ? ' ▲' : ' ▼';
  return ' ⇅';
}
function renderStudents() {
  const cc = currentClass();
  const q = (state.studentQuery || '').toLowerCase();
  let list = currentStudents();
  if (q) list = list.filter(s => s.name.toLowerCase().indexOf(q) >= 0 || String(s.no).indexOf(q) >= 0);
  const ss = state.studentSort || {};
  if (ss.key) {
    const dir = ss.dir;
    list = list.slice().sort(function (a, b) {
      const va = a[ss.key], vb = b[ss.key];
      const na = (va == null || va === '' || va === '—') ? null : va;
      const nb = (vb == null || vb === '' || vb === '—') ? null : vb;
      if (na == null && nb == null) return 0;
      if (na == null) return 1;
      if (nb == null) return -1;
      return (na - nb) * dir;
    });
  }
  const rows = list.map(s => {
    const warn = (s.warningTags || []).slice(0, 2).map(w => '<span class="badge red">' + esc(w) + '</span>').join(' ');
    const tags = (s.tags || []).slice(0, 3).map(t => '<span class="badge gray">' + esc(t) + '</span>').join(' ');
    const rate = Math.round((s.attendanceRate || 0) * 100);
    const pcls = rate >= 95 ? '' : rate >= 90 ? 'warn' : 'danger';
    return '<tr data-action="openStudent" data-id="' + s.id + '" style="cursor:pointer">' +
      '<td><div class="stu-cell">' + avatarHtml(s) + '<div><div class="stu-name">' + esc(s.name) + '</div><div class="stu-no">' + esc(s.no) + '</div></div></div></td>' +
      '<td>' + esc(s.gender) + (s.boarding ? ' / 住校' : ' / 走读') + '</td>' +
      '<td style="min-width:110px"><div class="progress ' + pcls + '"><i style="width:' + rate + '%"></i></div><div style="font-size:11px;color:var(--text3)">' + rate + '% · 迟到 ' + s.lateCount + ' · 缺勤 ' + s.absentCount + '</div></td>' +
      '<td class="num">' + (s.totalScore || '—') + '</td>' +
      '<td class="num">' + (s.classRank || '—') + '</td>' +
      '<td class="num" style="color:' + (s.score >= 80 ? 'var(--ok)' : s.score >= 40 ? 'var(--warn)' : 'var(--danger)') + ';font-weight:700">' + s.score + '</td>' +
      '<td>' + (warn || '<span class="badge green">正常</span>') + '</td>' +
      '<td>' + (tags || '—') + '</td>' +
      '<td class="actions"><button class="btn btn-ico" data-action="editStudent" data-id="' + s.id + '" title="编辑">✏️</button><button class="btn btn-ico danger" data-action="delStudent" data-id="' + s.id + '" title="删除">🗑️</button></td>' +
      '</tr>';
  }).join('');
  const th = function (key, label) {
    return '<th class="sortable' + (ss.key === key ? ' on' : '') + '" data-action="sortStudents" data-key="' + key + '" title="点击切换升降序">' + label + studentSortArrow(key) + '</th>';
  };
  return '<div class="page-title">👥 学生管理</div><div class="page-sub">当前班级：' + esc(cc ? cc.name : '—') + ' · 共 ' + currentStudents().length + ' 名学生</div>' +
    '<div class="toolbar">' +
      '<span class="badge primary" style="font-size:12.5px">' + esc(cc ? cc.name : '') + '</span>' +
      '<div class="search"><span class="s-ico">🔍</span><input type="text" id="studentSearch" placeholder="按姓名或学号搜索…" value="' + esc(state.studentQuery || '') + '"></div>' +
      '<button class="btn outline" data-action="importStudents">导入 CSV</button>' +
      '<button class="btn outline" data-action="exportStudents">导出 CSV</button>' +
      '<button class="btn primary" data-action="addStudent">＋ 新增学生</button>' +
    '</div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>性别 / 住走</th>' + th('attendanceRate', '考勤率') + th('totalScore', '成绩') + th('classRank', '排名') + th('score', '积分') + '<th>预警</th><th>标签</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="9">' + emptyHtml('未找到学生', '🔍') + '</td></tr>') + '</tbody></table></div>';
}

function saveStudent(id) {
  const v = readFields();
  if (!v.name) { toast('请填写姓名', 'err'); return; }
  const d = DB.data;
  const tags = [];
  const warns = [];
  document.querySelectorAll('#modalBox [data-chipgroup="tags"] .chip.on').forEach(el => tags.push(el.getAttribute('data-chip')));
  document.querySelectorAll('#modalBox [data-chipgroup="warns"] .chip.on').forEach(el => warns.push(el.getAttribute('data-chip')));
  const payload = {
    name: v.name, no: v.no, gender: v.gender, phone: v.phone,
    boarding: v.boarding === '是', position: v.position, family: v.family,
    parentName: v.parentName, guardian: v.guardian, groupId: parseInt(v.groupId || '1', 10) || 1,
    admitDate: v.admitDate, tags: tags, warningTags: warns
  };
  if (id) {
    const st = getStudent(id);
    Object.assign(st, payload);
    if (st.classId !== d.settings.currentClassId) st.classId = d.settings.currentClassId;
    toast('学生信息已更新');
  } else {
    const cc = currentClass();
    const st = Object.assign({ id: uid('s'), classId: cc ? cc.id : (d.classes[0] || {}).id, attendanceRate: 1, lateCount: 0, absentCount: 0, totalScore: 0, behaviorScore: 80, classRank: 0, score: 0 }, payload);
    d.students.push(st);
    toast('学生已添加');
  }
  DB.save(); closeModal(); render();
}
function openStudentDrawer(id) {
  const st = getStudent(id);
  if (!st) return;
  const d = DB.data;
  const warns = (st.warningTags || []).length ? (st.warningTags || []).map(w => '<span class="badge red">' + esc(w) + '</span>').join(' ') : '<span class="badge green">无</span>';
  const tags = (st.tags || []).map(t => '<span class="badge gray">' + esc(t) + '</span>').join(' ') || '—';
  const exams = d.exams.filter(e => d.scores.some(sc => sc.examId === e.id)).sort((a, b) => a.date > b.date ? 1 : -1);
  const chart = lineChartSVG(exams.map(e => {
    const sc = d.scores.find(s => s.examId === e.id && s.studentId === id);
    return { label: e.name, value: sc ? sc.total : 0 };
  }).filter(p => p.value > 0), { shortLabel: true });
  const pointRows = d.points.filter(p => p.studentId === id).sort((a, b) => a.date > b.date ? -1 : 1).slice(0, 12);
  const contactRows = d.contacts.filter(c => c.studentId === id).sort((a, b) => a.date > b.date ? -1 : 1).slice(0, 6);
  const vioRows = d.violations.filter(v => v.studentId === id).sort((a, b) => a.date > b.date ? -1 : 1).slice(0, 6);
  const todoRows = d.todos.filter(t => t.content.indexOf(st.name) >= 0);
  const total = st.totalScore || '—';
  const html = '' +
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">' + avatarHtml(st, 'lg') +
      '<div><div style="font-size:19px;font-weight:800">' + esc(st.name) + ' <span style="font-size:12px;color:var(--text3);font-weight:400">' + esc(st.no) + '</span></div>' +
      '<div style="font-size:12.5px;color:var(--text2);margin-top:2px">' + esc(st.gender) + ' · ' + (st.boarding ? '住校' : '走读') + ' · 第' + (st.groupId || 1) + '组</div></div></div>' +
    '<div class="drawer-section"><div class="ds-title">基本信息</div><div class="kv-list">' +
      '<div class="kv"><b>手机号</b><span>' + esc(maskPhone(st.phone)) + '</span></div><div class="kv"><b>家长</b><span>' + esc(st.parentName || '—') + '</span></div>' +
      '<div class="kv"><b>监护人</b><span>' + esc(st.guardian || '—') + '</span></div><div class="kv"><b>家庭情况</b><span>' + esc(st.family || '正常') + '</span></div>' +
      '<div class="kv"><b>职务</b><span>' + esc(st.position || '—') + '</span></div><div class="kv"><b>入学日期</b><span>' + esc(st.admitDate || '—') + '</span></div>' +
      '<div class="kv"><b>考勤率</b><span>' + Math.round((st.attendanceRate || 0) * 100) + '%</span></div><div class="kv"><b>综合成绩</b><span>' + total + ' 分 · 第 ' + (st.classRank || '—') + ' 名</span></div>' +
      '<div class="kv"><b>行为分</b><span>' + (st.behaviorScore || '—') + '</span></div><div class="kv"><b>量化积分</b><span style="color:var(--warn);font-weight:700">' + (st.score || 0) + ' 分</span></div>' +
    '</div></div>' +
    '<div class="drawer-section"><div class="ds-title">预警与标签</div><div style="display:flex;gap:6px;flex-wrap:wrap">' + warns + '</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + tags + '</div></div>' +
    '<div class="drawer-section"><div class="ds-title">成绩趋势</div><div class="chart-box">' + chart + '</div></div>' +
    '<div class="drawer-section"><div class="ds-title">量化积分流水</div>' + (pointRows.length ? pointRows.map(p => '<div class="list-line"><div class="ll-main"><div class="ll-title">' + esc(p.reason) + '</div><div class="ll-sub">' + esc(p.date) + ' · ' + esc(p.type) + '</div></div><span style="font-weight:800;color:' + (p.value > 0 ? 'var(--ok)' : 'var(--danger)') + '">' + (p.value > 0 ? '+' : '') + p.value + '</span></div>').join('') : emptyHtml('暂无积分记录')) + '</div>' +
    '<div class="drawer-section"><div class="ds-title">家校沟通记录</div>' + (contactRows.length ? contactRows.map(c => '<div class="list-line"><div class="ll-main"><div class="ll-title">' + esc(c.method) + ' · ' + esc(c.date) + '</div><div class="ll-sub">' + esc(c.content) + '</div></div><span class="badge ' + (c.status === '已完成' ? 'green' : 'amber') + '">' + esc(c.status) + '</span></div>').join('') : emptyHtml('暂无记录')) + '</div>' +
    '<div class="drawer-section"><div class="ds-title">违纪记录</div>' + (vioRows.length ? vioRows.map(v => '<div class="list-line"><div class="ll-main"><div class="ll-title">' + esc(v.type) + ' · ' + esc(v.date) + '</div><div class="ll-sub">' + esc(v.desc) + '</div></div><span class="badge red">' + esc(v.handle) + '</span></div>').join('') : emptyHtml('暂无违纪记录')) + '</div>' +
    '<div class="drawer-section"><div class="ds-title">待办事项</div>' + (todoRows.length ? todoRows.map(t => '<div class="list-line"><div class="ll-main"><div class="ll-title">' + esc(t.content) + '</div><div class="ll-sub">' + esc(t.due || '无截止时间') + '</div></div><span class="badge ' + (t.done ? 'green' : 'amber') + '">' + (t.done ? '已完成' : '进行中') + '</span></div>').join('') : emptyHtml('暂无待办')) + '</div>';
  openDrawer('学生档案 · ' + st.name, html, '<button class="btn" data-action="closeDrawer">关闭</button><button class="btn primary" data-action="editStudent" data-id="' + st.id + '">编辑资料</button>');
}

/* ================= 模块：成绩管理 ================= */
function renderGrades() {
  const tab = state.gradeTab || 'entry';
  const tabs = [
    ['entry', '成绩录入'], ['compare', '成绩对比'], ['personal', '个人成绩'], ['analysis', '学情分析']
  ].map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="gradeTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'entry' ? gradeEntryHtml() : tab === 'compare' ? gradeCompareHtml() : tab === 'personal' ? gradePersonalHtml() : gradeAnalysisHtml();
  return '<div class="page-title">📝 成绩管理</div><div class="page-sub">' + esc(currentClass() ? currentClass().name : '') + ' · 录入、对比与分析成绩</div><div class="tabs">' + tabs + '</div>' + body;
}
function gradeEntryHtml() {
  const d = DB.data;
  const exams = d.exams.slice().sort((a, b) => a.date > b.date ? 1 : -1);
  const cards = exams.map(e => {
    const cnt = d.scores.filter(s => s.examId === e.id).length;
    return '<div class="card" style="margin:0 0 14px"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:200px"><div style="font-weight:700;font-size:14.5px">' + esc(e.name) + '</div><div style="font-size:12px;color:var(--text3)">' + esc(e.date) + ' · ' + e.subjects.length + ' 科 · 总分 ' + e.total + ' · 已录 ' + cnt + ' 人</div></div>' +
      '<div class="btn-row"><button class="btn small primary" data-action="enterScore" data-id="' + e.id + '">' + (cnt ? '录入/查看成绩' : '开始录入') + '</button>' +
      '<button class="btn small" data-action="editExam" data-id="' + e.id + '">编辑</button>' +
      '<button class="btn small danger" data-action="delExam" data-id="' + e.id + '">删除</button></div></div>' +
      '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' + e.subjects.map(s => '<span class="badge" style="background:' + subjectColor(s.name) + '22;color:' + subjectColor(s.name) + '">' + esc(s.name) + ' ' + s.full + '分</span>').join('') + '</div></div>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addExam">＋ 新建考试</button></div>' + (cards || emptyHtml('暂无考试，点击上方新建', '📝'));
}
function examFormModal(exam) {
  exam = exam || {};
  const subj = (exam.subjects || []).map(s => s.name).join(',');
  openModal(
    '<div class="form-grid">' +
    field('name', '考试名称 *', exam.name || '', 'text', 'placeholder="如：第一次月考"') +
    field('date', '考试日期', exam.date || todayStr(), 'date') +
    field('subjects', '科目（逗号分隔，可写“科目:满分”如 语文:120,数学:120）', subj || '语文:120,数学:120,英语:120,物理,化学,生物,政治,历史,地理', 'text', 'full placeholder="如：语文:120,数学:120,英语（默认100分）"') +
    field('total', '总分（自动计算可不填）', exam.total || '', 'number', '') +
    '</div>',
    { title: exam.id ? '编辑考试' : '新建考试' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveExam" data-id="' + (exam.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveExam(id) {
  const v = readFields();
  if (!v.name) { toast('请填写考试名称', 'err'); return; }
  const d = DB.data;
  const subjects = v.subjects.split(/[,，]/).map(x => x.trim()).filter(Boolean).map(tok => {
    const m = tok.match(/^(.+?)[:：/](\d+)$/);
    if (m) return { name: m[1].trim(), full: parseInt(m[2], 10) || 100 };
    return { name: tok, full: 100 };
  });
  if (!subjects.length) { toast('请填写至少一个科目', 'err'); return; }
  const total = parseInt(v.total || '0', 10) || subjects.reduce((a, b) => a + b.full, 0);
  if (id) {
    const e = d.exams.find(x => x.id === id);
    if (e) { e.name = v.name; e.date = v.date; e.subjects = subjects; e.total = total; }
    toast('考试已更新');
  } else {
    d.exams.push({ id: uid('e'), name: v.name, date: v.date, subjects, total });
    toast('考试已创建，请录入成绩');
  }
  DB.save(); closeModal(); render();
}
function enterScoreModal(examId) {
  const d = DB.data;
  const exam = d.exams.find(e => e.id === examId);
  if (!exam) return;
  const stu = currentStudents().slice().sort((a, b) => (a.classRank || 999) - (b.classRank || 999));
  const existing = {};
  d.scores.filter(s => s.examId === examId).forEach(s => { existing[s.studentId] = s; });
  const head = '<tr><th style="min-width:130px">学生</th>' + exam.subjects.map(s => '<th data-subject="' + esc(s.name) + '">' + esc(s.name) + '<br><small class="full-label" style="font-weight:400">' + s.full + '分</small></th>').join('') + '<th>总分</th><th>排名</th></tr>';
  const rows = stu.map(s => {
    const sc = existing[s.studentId];
    const inputs = exam.subjects.map(sub => {
      const val = sc ? ((sc.subjects.find(x => x.name === sub.name) || {}).score || '') : '';
      return '<td><input class="score-input' + (val !== '' ? ' done' : '') + '" type="number" min="0" max="' + sub.full + '" data-subject="' + esc(sub.name) + '" value="' + esc(val) + '" placeholder="—"></td>';
    }).join('');
    const total = sc ? sc.total : '';
    const rank = sc ? sc.rank : '';
    return '<tr data-sid="' + s.id + '"><td class="stu-nm">' + esc(s.name) + ' <small style="color:var(--text3);font-weight:400">' + esc(s.no) + '</small></td>' + inputs + '<td class="row-total">' + total + '</td><td class="row-rank">' + rank + '</td></tr>';
  }).join('');
  const fullRow = '<div class="full-score-row" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;align-items:flex-end">' +
    exam.subjects.map(sub => '<div class="field" style="margin:0"><label>' + esc(sub.name) + ' 满分</label><input type="number" class="full-score-input" data-subject="' + esc(sub.name) + '" value="' + sub.full + '" min="1" max="500" style="width:84px"></div>').join('') +
    '<span class="hint" style="font-size:12px;color:var(--text3);padding-bottom:6px">修改满分后失焦/回车即生效（如初中数学120、高中数学150）</span></div>';
  openModal(
    '<div style="font-size:13px;color:var(--text2);margin-bottom:10px">' + esc(exam.name) + ' · ' + esc(exam.date) + ' · 填写各科成绩后保存，自动计算总分与班级排名</div>' +
    fullRow + '<div class="table-wrap" style="max-height:62vh;overflow:auto"><table class="enter-table"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>',
    { title: '成绩录入 · ' + exam.name, wide: true }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveScores" data-id="' + examId + '">保存成绩</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
  document.getElementById('modalBox').querySelectorAll('.score-input').forEach(function (inp) {
    inp.addEventListener('input', function () {
      const tr = inp.closest('tr');
      if (!tr) return;
      inp.classList.add('done');
      let sum = 0, has = 0;
      tr.querySelectorAll('.score-input').forEach(function (x) { const v = parseFloat(x.value); if (!isNaN(v)) { sum += v; has++; } });
      tr.querySelector('.row-total').textContent = has ? sum : '';
      tr.querySelector('.row-rank').textContent = '';
    });
  });
  document.getElementById('modalBox').querySelectorAll('.full-score-input').forEach(function (inp) {
    inp.addEventListener('change', function () {
      const nm = inp.getAttribute('data-subject');
      let v = parseInt(inp.value, 10);
      if (isNaN(v) || v < 1) v = 100;
      const sub = exam.subjects.find(s => s.name === nm);
      if (sub) sub.full = v;
      inp.value = v;
      const lbl = document.querySelector('#modalBox th[data-subject="' + nm + '"] .full-label');
      if (lbl) lbl.textContent = v + '分';
      document.querySelectorAll('#modalBox .score-input[data-subject="' + nm + '"]').forEach(function (x) { x.max = v; });
      DB.save();
      toast('已修改' + nm + '满分为 ' + v + ' 分');
    });
  });
}
function saveScores(examId) {
  const d = DB.data;
  const exam = d.exams.find(e => e.id === examId);
  if (!exam) return;
  const rows = [];
  document.querySelectorAll('#modalBox .enter-table tbody tr').forEach(function (tr) {
    const sid = tr.getAttribute('data-sid');
    const subjects = [];
    let total = 0;
    tr.querySelectorAll('.score-input').forEach(function (inp) {
      const v = parseFloat(inp.value);
      const name = inp.getAttribute('data-subject');
      if (!isNaN(v)) { subjects.push({ name, score: v }); total += v; }
      else subjects.push({ name, score: null });
    });
    rows.push({ sid, total, subjects });
  });
  d.scores = d.scores.filter(s => s.examId !== examId);
  rows.forEach(function (r) {
    if (r.subjects.some(x => x.score != null)) {
      d.scores.push({ id: uid('sc'), examId, studentId: r.sid, total: r.total, rank: 0, subjects: r.subjects });
    }
  });
  const list = d.scores.filter(s => s.examId === examId).sort((a, b) => b.total - a.total);
  list.forEach((s, i) => { s.rank = i + 1; });
  /* 同步学生综合成绩与排名（取最近一次考试） */
  const latest = d.exams.filter(e => d.scores.some(s => s.examId === e.id)).sort((a, b) => a.date > b.date ? 1 : -1)[0];
  if (latest) {
    d.scores.filter(s => s.examId === latest.id).forEach(s => {
      const st = getStudent(s.studentId);
      if (st) { st.totalScore = s.total; st.classRank = s.rank; }
    });
  }
  DB.save(); closeModal(); render();
  toast('成绩已保存，总分与排名已自动计算');
}
function gradeCompareHtml() {
  const d = DB.data;
  const exams = d.exams.filter(e => d.scores.some(s => s.examId === e.id)).sort((a, b) => a.date > b.date ? 1 : -1);
  if (exams.length < 1) return '<div class="card">' + emptyHtml('暂无成绩数据，请先录入成绩', '📝') + '</div>';
  const a = (state.cmpA && exams.find(e => e.id === state.cmpA)) || exams[exams.length - 1];
  const b = (state.cmpB && exams.find(e => e.id === state.cmpB)) || (exams.length > 1 ? exams[exams.length - 2] : null);
  const selectA = '<select id="cmpA" style="border:1px solid var(--border);border-radius:10px;padding:7px 10px">' + exams.map(e => '<option value="' + e.id + '"' + (e.id === a.id ? ' selected' : '') + '>' + esc(e.name) + '</option>').join('') + '</select>';
  const selectB = '<select id="cmpB" style="border:1px solid var(--border);border-radius:10px;padding:7px 10px"><option value="">— 无 —</option>' + exams.map(e => '<option value="' + e.id + '"' + (b && e.id === b.id ? ' selected' : '') + '>' + esc(e.name) + '</option>').join('') + '</select>';
  const rows = currentStudents().slice().sort((x, y) => (x.classRank || 999) - (y.classRank || 999)).map(st => {
    const sa = d.scores.find(s => s.examId === a.id && s.studentId === st.id);
    const sb = b ? d.scores.find(s => s.examId === b.id && s.studentId === st.id) : null;
    const diff = sa && sb ? sa.total - sb.total : null;
    const rankDiff = sa && sb ? sb.rank - sa.rank : null;
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st.name) + '</div><div class="stu-no">' + esc(st.no) + '</div></div></div></td>' +
      '<td class="num">' + (sa ? sa.total : '—') + '</td><td class="num">' + (sa ? sa.rank : '—') + '</td>' +
      '<td class="num">' + (sb ? sb.total : '—') + '</td><td class="num">' + (sb ? sb.rank : '—') + '</td>' +
      '<td class="num" style="color:' + (diff == null ? 'var(--text3)' : diff > 0 ? 'var(--ok)' : diff < 0 ? 'var(--danger)' : 'var(--text3)') + ';font-weight:700">' + (diff == null ? '—' : (diff > 0 ? '+' : '') + diff) + '</td>' +
      '<td class="num" style="color:' + (rankDiff == null ? 'var(--text3)' : rankDiff > 0 ? 'var(--ok)' : rankDiff < 0 ? 'var(--danger)' : 'var(--text3)') + ';font-weight:700">' + (rankDiff == null ? '—' : (rankDiff > 0 ? '↑' : rankDiff < 0 ? '↓' : '—') + Math.abs(rankDiff)) + '</td></tr>';
  }).join('');
  return '<div class="card"><div class="card-title">成绩对比</div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">' + selectA + '<span>对比</span>' + selectB + '<button class="btn small primary" data-action="doCompare">对比</button></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>' + esc(a.name) + ' 总分</th><th>排名</th><th>对比考试总分</th><th>排名</th><th>总分差</th><th>名次变化</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}
function gradePersonalHtml() {
  const d = DB.data;
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const selId = state.personalStuId || (stu[0] ? stu[0].id : '');
  const sel = '<select id="personalStu" style="border:1px solid var(--border);border-radius:10px;padding:8px 12px;min-width:200px">' + stu.map(s => '<option value="' + s.id + '"' + (s.id === selId ? ' selected' : '') + '>' + esc(s.name) + '（' + esc(s.no) + '）</option>').join('') + '</select>';
  const id = selId;
  const st = getStudent(id);
  const exams = d.exams.filter(e => d.scores.some(s => s.examId === e.id)).sort((a, b) => a.date > b.date ? 1 : -1);
  const chart = st ? lineChartSVG(exams.map(e => {
    const sc = d.scores.find(s => s.examId === e.id && s.studentId === id);
    return { label: e.name, value: sc ? sc.total : 0 };
  }).filter(p => p.value > 0), { shortLabel: true }) : emptyHtml('请选择学生');
  const rows = exams.map(e => {
    const sc = d.scores.find(s => s.examId === e.id && s.studentId === id);
    return '<tr><td>' + esc(e.name) + '</td><td class="center">' + esc(e.date) + '</td><td class="num">' + (sc ? sc.total : '—') + '</td><td class="num">' + (sc ? sc.rank : '—') + '</td><td class="num">' + (sc && e.total ? Math.round((sc.total / e.total) * 1000) / 10 : '—') + '%</td></tr>';
  }).join('');
  return '<div class="card"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' + sel + '<button class="btn small primary" data-action="setPersonalStu">查询</button><button class="btn small outline" data-action="genAnalysis" data-id="' + (st ? st.id : '') + '">生成学情分析</button></div>' +
    '<div class="chart-box">' + chart + '</div>' +
    '<div class="table-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>考试</th><th>日期</th><th>总分</th><th>班级排名</th><th>得分率</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">' + emptyHtml('暂无成绩') + '</td></tr>') + '</tbody></table></div></div>';
}
function gradeAnalysisHtml() {
  const d = DB.data;
  const latest = d.exams.filter(e => d.scores.some(s => s.examId === e.id)).sort((a, b) => a.date > b.date ? 1 : -1)[0];
  if (!latest) return '<div class="card">' + emptyHtml('暂无成绩数据，请先录入成绩', '📝') + '</div>';
  const list = d.scores.filter(s => s.examId === latest.id);
  const stu = currentStudents();
  const cnt = list.length;
  const avg = cnt ? Math.round(list.reduce((a, b) => a + b.total, 0) / cnt) : 0;
  const max = cnt ? Math.max.apply(null, list.map(x => x.total)) : 0;
  const min = cnt ? Math.min.apply(null, list.map(x => x.total)) : 0;
  const pass = list.filter(s => s.total >= latest.total * 0.6).length;
  const good = list.filter(s => s.total >= latest.total * 0.85).length;
  const passRate = cnt ? Math.round(pass / cnt * 1000) / 10 : 0;
  const goodRate = cnt ? Math.round(good / cnt * 1000) / 10 : 0;
  const segs = [
    { label: '90-100%', from: latest.total * 0.9, color: '#22C55E' },
    { label: '75-89%', from: latest.total * 0.75, color: '#3B82F6' },
    { label: '60-74%', from: latest.total * 0.6, color: '#F59E0B' },
    { label: '60% 以下', from: 0, color: '#EF4444' }
  ];
  const dist = segs.map(function (seg, idx) {
    const nextFrom = idx < segs.length - 1 ? segs[idx + 1].from : -1;
    return { label: seg.label, color: seg.color, n: list.filter(s => s.total >= seg.from && s.total < (nextFrom < 0 ? Infinity : nextFrom)).length };
  });
  const topN = Math.max(1, Math.round(stu.length * (d.settings.topPercent / 100)));
  const critN = Math.max(1, Math.round(stu.length * (d.settings.criticalPercent / 100)));
  const sorted = list.slice().sort((a, b) => b.total - a.total);
  const topStu = sorted.slice(0, topN).map(s => getStudent(s.studentId)).filter(Boolean);
  const critStu = sorted.slice(topN, critN).map(s => getStudent(s.studentId)).filter(Boolean);
  const weakStu = stu.filter(s => (s.warningTags || []).indexOf('学困生') >= 0 || (s.totalScore || 0) < latest.total * 0.6);
  const distBar = '<div class="dist-bar">' + dist.map(seg => '<i style="width:' + (cnt ? (seg.n / cnt * 100).toFixed(1) : 0) + '%;background:' + seg.color + '" title="' + seg.label + ' ' + seg.n + '人"></i>').join('') + '</div>' +
    '<div class="dist-legend">' + dist.map(seg => '<span class="lg"><i style="background:' + seg.color + '"></i>' + seg.label + '：' + seg.n + ' 人（' + (cnt ? Math.round(seg.n / cnt * 1000) / 10 : 0) + '%）</span>').join('') + '</div>';
  const nameList = function (arr) { return arr.map(s => '<span class="badge gray" style="margin:2px">' + esc(s.name) + '</span>').join('') || '<span style="color:var(--text3)">暂无</span>'; };
  return '<div class="stat-grid" style="margin-bottom:16px">' +
    statCard('var(--primary)', '参考人数', cnt, '人') +
    statCard('var(--info)', '平均分', avg, '分') +
    statCard('var(--ok)', '最高分', max, '分') +
    statCard('var(--danger)', '最低分', min, '分') +
    statCard('var(--teal)', '及格率', passRate + '%', '及格 ' + pass + ' 人') +
    statCard('var(--purple)', '优秀率', goodRate + '%', '优秀 ' + good + ' 人') +
    '</div>' +
    '<div class="card"><div class="card-title">分数段分布 · ' + esc(latest.name) + '</div>' + distBar + '</div>' +
    '<div class="grid-3"><div class="card"><div class="card-title">🎯 尖子生（前 ' + d.settings.topPercent + '%）</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + nameList(topStu) + '</div></div>' +
    '<div class="card"><div class="card-title">🔍 临界生（前 ' + d.settings.criticalPercent + '%）</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + nameList(critStu) + '</div></div>' +
    '<div class="card"><div class="card-title">⚠️ 学困生</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + nameList(weakStu) + '</div></div></div>';
}

/* ================= 模块：考勤管理 ================= */
function renderAttendance() {
  const tab = state.attTab || 'daily';
  const tabs = [['daily', '日常点名'], ['depart', '离校登记'], ['stats', '考勤统计']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="attTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'daily' ? attDailyHtml() : tab === 'depart' ? attDepartHtml() : attStatsHtml();
  return '<div class="page-title">✅ 考勤管理</div><div class="page-sub">' + esc(currentClass() ? currentClass().name : '') + ' · 日常点名与离校登记</div><div class="tabs">' + tabs + '</div>' + body;
}
function attDailyHtml() {
  const date = state.attDate || todayStr();
  const rows = currentStudents().slice().sort((a, b) => (a.classRank || 999) - (b.classRank || 999)).map(st => {
    const rec = DB.data.attendance.find(a => a.studentId === st.id && a.date === date);
    const status = rec ? rec.status : '出勤';
    const opts = ['出勤', '迟到', '缺勤', '请假'].map(o => '<option value="' + o + '"' + (o === status ? ' selected' : '') + '>' + o + '</option>').join('');
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st.name) + '</div><div class="stu-no">' + esc(st.no) + '</div></div></div></td>' +
      '<td class="center">' + (st.boarding ? '<span class="badge blue">住校</span>' : '<span class="badge gray">走读</span>') + '</td>' +
      '<td class="center"><select data-att-select data-sid="' + st.id + '" style="border:1px solid var(--border);border-radius:8px;padding:5px 8px">' + opts + '</select></td></tr>';
  }).join('');
  return '<div class="card"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
    '<span class="badge primary">📅 日期</span><input type="date" id="attDate" value="' + esc(date) + '" style="border:1px solid var(--border);border-radius:10px;padding:7px 10px">' +
    '<button class="btn small primary" data-action="setAttDate">加载</button><button class="btn small outline" data-action="saveAttAll">保存全部点名</button></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>住走</th><th>点名状态</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}
function attDepartHtml() {
  const d = DB.data;
  const rows = d.departures.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(dp => {
    const st = getStudent(dp.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div><div class="stu-no">' + esc(st ? st.no : '') + '</div></div></div></td>' +
      '<td class="center">' + esc(dp.date) + '</td><td class="center">' + esc(dp.leaveTime || '—') + '</td><td class="center">' + esc(dp.backTime || '—') + '</td>' +
      '<td class="center">' + (dp.confirmed ? '<span class="badge green">已确认返校</span>' : '<span class="badge red">未确认返校</span>') + '</td>' +
      '<td class="actions">' + (!dp.confirmed ? '<button class="btn small primary" data-action="confirmBack" data-id="' + dp.id + '">确认返校</button>' : '') +
      '<button class="btn btn-ico danger" data-action="delDepart" data-id="' + dp.id + '" title="删除">🗑️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addDepart">＋ 登记离校</button></div>' +
    '<div class="card"><div class="card-title">离校登记（寄宿生周末离校）</div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>离校日期</th><th>离校时间</th><th>返校时间</th><th>状态</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6">' + emptyHtml('暂无离校登记') + '</td></tr>') + '</tbody></table></div></div>';
}
function attStatsHtml() {
  const d = DB.data;
  const rows = currentStudents().map(st => {
    const recs = d.attendance.filter(a => a.studentId === st.id);
    const p = recs.filter(a => a.status === '出勤').length;
    const l = recs.filter(a => a.status === '迟到').length;
    const ab = recs.filter(a => a.status === '缺勤').length;
    const lv = recs.filter(a => a.status === '请假').length;
    const rate = recs.length ? Math.round((p / recs.length) * 1000) / 10 : 0;
    const cls = rate >= 95 ? '' : rate >= 90 ? 'warn' : 'danger';
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st.name) + '</div><div class="stu-no">' + esc(st.no) + '</div></div></div></td>' +
      '<td class="center">' + p + '</td><td class="center" style="color:var(--warn)">' + l + '</td><td class="center" style="color:var(--danger)">' + ab + '</td><td class="center">' + lv + '</td>' +
      '<td style="min-width:120px"><div class="progress ' + cls + '"><i style="width:' + rate + '%"></i></div><div style="font-size:11px;color:var(--text3)">' + rate + '%</div></td></tr>';
  }).join('');
  const total = d.attendance.filter(a => currentStudents().some(s => s.id === a.studentId));
  const allP = total.filter(a => a.status === '出勤').length;
  const allRate = total.length ? Math.round(allP / total.length * 1000) / 10 : 0;
  return '<div class="card"><div class="card-title">班级考勤汇总 <span class="ct-sub">总出勤率 ' + allRate + '%</span></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>出勤</th><th>迟到</th><th>缺勤</th><th>请假</th><th>出勤率</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

/* ================= 模块：作业管理 ================= */
function renderHomework() {
  const tab = state.hwTab || 'list';
  const tabs = [['list', '收缴记录'], ['tools', '提效工具']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="hwTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'list' ? hwListHtml() : hwToolsHtml();
  return '<div class="page-title">📚 作业管理</div><div class="page-sub">' + esc(currentClass() ? currentClass().name : '') + ' · 布置与收缴作业</div><div class="tabs">' + tabs + '</div>' + body;
}
function hwListHtml() {
  const d = DB.data;
  const cc = currentClass();
  const rows = d.homeworks.filter(h => cc && h.classId === cc.id).slice().sort((a, b) => a.dueDate > b.dueDate ? -1 : 1).map(h => {
    const stu = currentStudents();
    const sub = (h.submitted || []).filter(id => stu.some(s => s.id === id));
    const late = (h.late || []).filter(id => stu.some(s => s.id === id));
    const not = stu.filter(s => (h.submitted || []).indexOf(s.id) < 0 && (h.late || []).indexOf(s.id) < 0);
    const rate = stu.length ? Math.round((sub.length / stu.length) * 1000) / 10 : 0;
    const due = daysBetween(todayStr(), h.dueDate);
    const dueBadge = due < 0 ? '<span class="badge red">已截止</span>' : due === 0 ? '<span class="badge amber">今天截止</span>' : '<span class="badge green">还有 ' + due + ' 天</span>';
    const detail = '<div style="margin-top:12px;border-top:1px dashed var(--border);padding-top:10px">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' +
      '<div><div class="card-title" style="font-size:13px">✅ 已交（' + sub.length + '）</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + (sub.length ? sub.map(s => '<span class="badge green" style="cursor:pointer" data-action="toggleHwStatus" data-hw="' + h.id + '" data-sid="' + s.id + '" data-to="late">' + esc(s.name) + ' →迟交</span>').join('') : '—') + '</div></div>' +
      '<div><div class="card-title" style="font-size:13px">🕐 迟交（' + late.length + '）</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + (late.length ? late.map(s => '<span class="badge amber" style="cursor:pointer" data-action="toggleHwStatus" data-hw="' + h.id + '" data-sid="' + s.id + '" data-to="submit">' + esc(s.name) + ' →已交</span>').join('') : '—') + '</div></div>' +
      '<div><div class="card-title" style="font-size:13px">❌ 未交（' + not.length + '）</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + (not.length ? not.map(s => '<span class="badge red" style="cursor:pointer" data-action="toggleHwStatus" data-hw="' + h.id + '" data-sid="' + s.id + '" data-to="submit">' + esc(s.name) + ' →已交</span>').join('') : '—') + '</div></div>' +
      '</div></div>';
    return '<div class="card" style="margin:0 0 14px"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:220px"><div style="font-weight:700">' + esc(h.title) + '</div><div style="font-size:12px;color:var(--text3)">' + esc(h.subject) + ' · ' + esc(h.assignDate) + ' 布置 · ' + esc(h.dueDate) + ' 截止 · 收缴率 ' + rate + '%</div></div>' +
      dueBadge + '<div class="btn-row"><button class="btn small" data-action="editHomework" data-id="' + h.id + '">编辑</button><button class="btn small danger" data-action="delHomework" data-id="' + h.id + '">删除</button></div></div>' + detail + '</div>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addHomework">＋ 布置作业</button></div>' + (rows || emptyHtml('暂无作业，点击上方布置', '📚'));
}
function homeworkFormModal(hw) {
  hw = hw || {};
  const d = DB.data;
  const subjectOpts = Object.keys(d.settings.subjectColors).map(s => '<option value="' + s + '"' + (s === hw.subject ? ' selected' : '') + '>' + s + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    field('title', '作业标题 *', hw.title || '', 'text') +
    '<div class="field"><label>科目</label><select data-field="subject">' + subjectOpts + '</select></div>' +
    field('assignDate', '布置日期', hw.assignDate || todayStr(), 'date') +
    field('dueDate', '截止日期', hw.dueDate || dateAdd(todayStr(), 2), 'date') +
    '</div>',
    { title: hw.id ? '编辑作业' : '布置作业' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveHomework" data-id="' + (hw.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveHomework(id) {
  const v = readFields();
  if (!v.title) { toast('请填写作业标题', 'err'); return; }
  const d = DB.data;
  if (id) {
    const h = d.homeworks.find(x => x.id === id);
    if (h) { h.title = v.title; h.subject = v.subject; h.assignDate = v.assignDate; h.dueDate = v.dueDate; }
    toast('作业已更新');
  } else {
    d.homeworks.push({ id: uid('hw'), title: v.title, subject: v.subject, classId: currentClass().id, assignDate: v.assignDate, dueDate: v.dueDate, submitted: [], late: [] });
    toast('作业已布置');
  }
  DB.save(); closeModal(); render();
}
function hwToolsHtml() {
  const stu = currentStudents();
  return '<div class="grid-2">' +
    '<div class="card"><div class="card-title">📖 背诵默写模板</div><div style="font-size:13px;color:var(--text2);margin-bottom:10px">选择内容与范围，一键生成全班背诵检查记录。</div>' +
      '<div class="field" style="margin-bottom:10px"><label>背诵内容</label><input type="text" id="reciteContent" value="《春》全文背诵" style="width:100%;border:1px solid var(--border);border-radius:10px;padding:8px 10px"></div>' +
      '<button class="btn primary small" data-action="genRecite">生成全班背诵检查记录</button></div>' +
    '<div class="card"><div class="card-title">✍️ 作文评语批量导出</div><div style="font-size:13px;color:var(--text2);margin-bottom:10px">按学生成绩分层生成评语并导出 CSV（共 ' + stu.length + ' 名学生）。</div>' +
      '<button class="btn primary small" data-action="exportComments">导出评语 CSV</button></div>' +
    '</div>';
}

/* ================= 模块：请假管理 ================= */
function renderLeave() {
  const d = DB.data;
  const filter = state.leaveFilter || '全部';
  let list = d.leaves.slice().sort((a, b) => a.start > b.start ? -1 : 1);
  if (filter !== '全部') list = list.filter(l => l.status === filter);
  const rows = list.map(l => {
    const st = getStudent(l.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div><div class="stu-no">' + esc(st ? st.no : '') + '</div></div></div></td>' +
      '<td class="center"><span class="badge ' + (l.type === '病假' ? 'blue' : 'amber') + '">' + esc(l.type) + '</span></td>' +
      '<td class="center">' + esc(l.start) + ' ~ ' + esc(l.end) + '</td><td class="center">' + l.days + ' 天</td>' +
      '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(l.reason) + '">' + esc(l.reason) + '</td>' +
      '<td class="center">' + (l.status === '已批准' ? '<span class="badge green">已批准</span>' : l.status === '已驳回' ? '<span class="badge gray">已驳回</span>' : '<span class="badge amber">待审批</span>') + '</td>' +
      '<td class="actions">' + (l.status === '待审批' ? '<button class="btn small primary" data-action="approveLeave" data-id="' + l.id + '" data-ok="1">批准</button><button class="btn small danger" data-action="approveLeave" data-id="' + l.id + '" data-ok="0">驳回</button>' : '') +
      '<button class="btn btn-ico" data-action="editLeave" data-id="' + l.id + '" title="编辑">✏️</button>' +
      '<button class="btn btn-ico danger" data-action="delLeave" data-id="' + l.id + '" title="删除">🗑️</button></td></tr>';
  }).join('');
  return '<div class="page-title">📄 请假管理</div><div class="page-sub">学生请假申请与审批</div>' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px"><div class="seg">' + ['全部', '待审批', '已批准', '已驳回'].map(f => '<button class="' + (filter === f ? 'on' : '') + '" data-action="leaveFilter" data-f="' + f + '">' + f + '</button>').join('') + '</div><button class="btn primary" data-action="addLeave">＋ 新增请假</button></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>类型</th><th>起止日期</th><th>时长</th><th>事由</th><th>审批状态</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7">' + emptyHtml('暂无请假记录') + '</td></tr>') + '</tbody></table></div>';
}
function leaveFormModal(leave) {
  leave = leave || {};
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = stu.map(s => '<option value="' + s.id + '"' + (s.id === leave.studentId ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('type', '请假类型', leave.type || '病假', 'select', '', optionsHtml(['病假', '事假', '其他'], leave.type)) +
    '<div class="field"><label>开始日期</label><input type="date" data-field="start" value="' + esc(leave.start || todayStr()) + '"></div>' +
    '<div class="field"><label>结束日期</label><input type="date" data-field="end" value="' + esc(leave.end || todayStr()) + '"></div>' +
    field('days', '时长（天）', leave.days || 1, 'number', 'min="1"') +
    field('reason', '事由', leave.reason || '', 'textarea', 'full') +
    '</div>',
    { title: leave.id ? '编辑请假' : '新增请假' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveLeave" data-id="' + (leave.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveLeave(id) {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  const d = DB.data;
  const payload = { studentId: v.studentId, type: v.type, start: v.start, end: v.end, days: parseInt(v.days || '1', 10) || 1, reason: v.reason, status: '待审批' };
  if (id) {
    const l = d.leaves.find(x => x.id === id);
    if (l) Object.assign(l, payload);
    toast('请假已更新');
  } else {
    d.leaves.push(Object.assign({ id: uid('lv') }, payload));
    toast('请假申请已提交');
  }
  DB.save(); closeModal(); render();
}



/* ================= 模块：班级事务（6 页签） ================= */
function renderAffairs() {
  const tab = state.affTab || 'point';
  const tabs = [['point', '积分'], ['vio', '违纪'], ['duty', '值日'], ['seat', '座位'], ['schedule', '课表'], ['meeting', '班会']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="affTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'point' ? affPointHtml() : tab === 'vio' ? affVioHtml() : tab === 'duty' ? affDutyHtml() : tab === 'seat' ? affSeatHtml() : tab === 'schedule' ? affScheduleHtml() : affMeetingHtml();
  return '<div class="page-title">🗂️ 班级事务</div><div class="page-sub">' + esc(currentClass() ? currentClass().name : '') + ' · 积分、违纪、值日、座位、课表与班会</div><div class="tabs">' + tabs + '</div>' + body;
}
function affPointHtml() {
  const d = DB.data;
  const stu = currentStudents().slice().sort((a, b) => b.score - a.score);
  const rank = stu.map((s, i) =>
    '<tr><td class="num" style="font-weight:700;color:' + (i === 0 ? 'var(--warn)' : 'var(--text2)') + '">' + (i + 1) + '</td>' +
    '<td><div class="stu-cell">' + avatarHtml(s) + '<div><div class="stu-name">' + esc(s.name) + '</div><div class="stu-no">' + esc(s.no) + '</div></div></div></td>' +
    '<td class="num" style="font-weight:800;color:var(--warn)">' + s.score + '</td></tr>').join('');
  const rows = d.points.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(p => {
    const st = getStudent(p.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div></div></div></td>' +
      '<td class="num" style="color:' + (p.value > 0 ? 'var(--ok)' : 'var(--danger)') + ';font-weight:800">' + (p.value > 0 ? '+' : '') + p.value + '</td>' +
      '<td>' + esc(p.reason) + '</td><td class="center">' + esc(p.date) + '</td><td class="center"><span class="badge ' + (p.type === '加分' ? 'green' : 'red') + '">' + esc(p.type) + '</span></td>' +
      '<td class="actions"><button class="btn btn-ico danger" data-action="delPoint" data-id="' + p.id + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="grid-2"><div class="card"><div class="card-title">🏆 全班量化积分榜</div><div class="table-wrap" style="max-height:460px;overflow:auto"><table class="tbl"><thead><tr><th>名次</th><th>学生</th><th>积分</th></tr></thead><tbody>' + rank + '</tbody></table></div></div>' +
    '<div class="card"><div class="card-title">📈 加减分记录</div><div class="btn-row" style="margin-bottom:10px"><button class="btn primary small" data-action="addPoint">＋ 记一条积分</button></div><div class="table-wrap" style="max-height:420px;overflow:auto"><table class="tbl"><thead><tr><th>学生</th><th>分值</th><th>原因</th><th>日期</th><th>类型</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6">' + emptyHtml('暂无积分记录') + '</td></tr>') + '</tbody></table></div></div></div>';
}
function pointFormModal() {
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = stu.map(s => '<option value="' + s.id + '">' + esc(s.name) + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('value', '分值（正为加分，负为扣分）', '2', 'number') +
    field('type', '类型', '加分', 'select', '', optionsHtml(['加分', '扣分'], '加分')) +
    field('date', '日期', todayStr(), 'date') +
    field('reason', '原因 *', '', 'text', 'full') +
    '</div>',
    { title: '记一条积分' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="savePoint">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function savePoint() {
  const v = readFields();
  if (!v.studentId || !v.reason) { toast('请选择学生并填写原因', 'err'); return; }
  const val = parseInt(v.value || '0', 10);
  const d = DB.data;
  d.points.push({ id: uid('pt'), studentId: v.studentId, value: val, reason: v.reason, date: v.date || todayStr(), type: val >= 0 ? '加分' : '扣分' });
  const st = getStudent(v.studentId);
  if (st) st.score = (st.score || 0) + val;
  DB.save(); closeModal(); render();
  toast('积分已记录');
}
function affVioHtml() {
  const d = DB.data;
  const rows = d.violations.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(v => {
    const st = getStudent(v.studentId);
    return '<tr><td><div class="stu-cell">' + avatarHtml(st) + '<div><div class="stu-name">' + esc(st ? st.name : '未知') + '</div></div></div></td>' +
      '<td class="center"><span class="badge red">' + esc(v.type) + '</span></td><td>' + esc(v.desc) + '</td><td>' + esc(v.handle) + '</td><td class="center">' + esc(v.date) + '</td>' +
      '<td class="actions"><button class="btn btn-ico" data-action="editVio" data-id="' + v.id + '">✏️</button><button class="btn btn-ico danger" data-action="delVio" data-id="' + v.id + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addVio">＋ 记违纪</button></div>' +
    '<div class="card"><div class="card-title">⚠️ 违纪记录</div><div class="table-wrap"><table class="tbl"><thead><tr><th>学生</th><th>类型</th><th>描述</th><th>处理方式</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6">' + emptyHtml('暂无违纪记录') + '</td></tr>') + '</tbody></table></div></div>';
}
function vioFormModal(vio) {
  vio = vio || {};
  const stu = currentStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = stu.map(s => '<option value="' + s.id + '"' + (s.id === vio.studentId ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field full"><label>学生 *</label><select data-field="studentId">' + opt + '</select></div>' +
    field('type', '类型', vio.type || '上课说话', 'text') +
    field('date', '日期', vio.date || todayStr(), 'date') +
    field('desc', '描述', vio.desc || '', 'textarea', 'full') +
    field('handle', '处理方式', vio.handle || '口头批评教育', 'text', 'full') +
    '</div>',
    { title: vio.id ? '编辑违纪' : '记违纪' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveVio" data-id="' + (vio.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveVio(id) {
  const v = readFields();
  if (!v.studentId) { toast('请选择学生', 'err'); return; }
  const d = DB.data;
  const payload = { studentId: v.studentId, type: v.type, date: v.date || todayStr(), desc: v.desc, handle: v.handle };
  if (id) { const x = d.violations.find(o => o.id === id); if (x) Object.assign(x, payload); toast('违纪已更新'); }
  else { d.violations.push(Object.assign({ id: uid('vi') }, payload)); toast('违纪已记录'); }
  DB.save(); closeModal(); render();
}
function affDutyHtml() {
  const d = DB.data;
  const days = d.duties.days || [];
  const cols = days.map(day => '<td><div style="font-weight:700;margin-bottom:6px">' + esc(day.day) + '</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + (day.students || []).map(n => '<span class="badge gray">' + esc(n) + '</span>').join('') + '</div></td>').join('');
  const rdDays = (d.duties.roomDuty && d.duties.roomDuty.days) || [];
  const rdCols = days.map((day, i) => {
    const rd = rdDays[i];
    const name = rd ? rd.name : '';
    const overlap = !!name && (day.students || []).indexOf(name) >= 0;
    return '<td class="center">' + (name
      ? '<span class="badge ' + (overlap ? 'red' : 'primary') + '" title="' + (overlap ? '与当日值日小组重合' : '教室值日') + '">' + esc(name) + (overlap ? ' ⚠️' : '') + '</span>'
      : '<span class="hint" style="font-size:12px">—</span>') + '</td>';
  }).join('');
  return '<div class="card"><div class="card-title">🧹 每日值日安排 <span class="ct-sub">' + esc(d.duties.week || '') + '</span></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th style="width:120px">安排</th>' + days.map(x => '<th class="center">' + esc(x.day) + '</th>').join('') + '</tr></thead><tbody>' +
    '<tr><td style="font-weight:600">值日小组</td>' + cols + '</tr>' +
    '<tr><td style="font-weight:600">教室值日</td>' + rdCols + '</tr>' +
    '</tbody></table></div>' +
    '<div class="btn-row" style="margin-top:12px;flex-wrap:wrap">' +
    '<button class="btn small primary" data-action="editDuty">编辑值日表</button>' +
    '<button class="btn small primary" data-action="rotateDuty">🔁 一键轮换（整组顺延一天）</button>' +
    '<button class="btn small primary" data-action="autoRoomDuty">✨ 一键生成教室值日（避开当日小组）</button>' +
    '</div>' +
    '<div style="margin-top:8px;font-size:12px;color:var(--text3)">教室值日：负责课室卫生（黑板擦、讲台等），单人，按全班学号顺序循环轮值，全部同学轮完后自动重新开始；自动生成时会避开当天的值日小组人员，可点击“编辑值日表”手动修改。</div></div>';
}
function roomOrder() {
  return currentStudents().slice().sort(function (a, b) {
    return (parseInt(a.no, 10) || 0) - (parseInt(b.no, 10) || 0) || a.name.localeCompare(b.name, 'zh');
  });
}
function buildRoomWeek(startIdx) {
  const days = DB.data.duties.days || [];
  const order = roomOrder();
  const n = order.length;
  if (!n) return [];
  let cursor = startIdx || 0;
  const result = [];
  days.forEach(function (day) {
    const group = new Set(day.students || []);
    let pick = null;
    for (let k = 0; k < n; k++) {
      const idx = (cursor + k) % n;
      if (!group.has(order[idx].name)) { pick = order[idx]; break; }
    }
    if (!pick) pick = order[cursor % n];
    result.push(pick.name);
    cursor = (cursor + 1) % n;
  });
  return result;
}
function rotateDuty() {
  confirmBox({
    title: '一键轮换值日',
    message: '将每个“值日小组”整组顺延到下一天（周一→周二，…，周五→周一）？教室值日也会按全班学号顺序轮到下一位同学。',
    okText: '轮换',
    onOk: function () {
      const d = DB.data;
      const days = d.duties.days || [];
      if (!days.length) { toast('暂无值日安排', 'err'); return; }
      const groups = days.map(x => (x.students || []).slice());
      days.forEach((x, i) => { x.students = groups[(i + 1) % groups.length]; });
      const rd = d.duties.roomDuty = d.duties.roomDuty || { days: [] };
      const order = roomOrder();
      if (order.length) {
        rd.cursor = ((rd.cursor || 0) + 1) % order.length;
        const names = buildRoomWeek(rd.cursor);
        rd.days = days.map((day, i) => ({ day: day.day, name: names[i] || '' }));
      }
      DB.save(); render();
      toast('值日已轮换（教室值日轮到下一位同学）');
    }
  });
}
function autoRoomDuty() {
  const d = DB.data;
  const days = d.duties.days || [];
  const order = roomOrder();
  if (!order.length) { toast('当前班级暂无学生', 'err'); return; }
  if (!days.length) { toast('请先设置值日表', 'err'); return; }
  const rd = d.duties.roomDuty = d.duties.roomDuty || { days: [] };
  const start = rd.cursor || 0;
  const names = buildRoomWeek(start);
  rd.days = days.map((day, i) => ({ day: day.day, name: names[i] || '' }));
  rd.cursor = (start + days.length) % order.length;
  DB.save(); render();
  toast('已按全班学号循环生成教室值日（轮完自动重新开始）');
}
function dutyFormModal() {
  const d = DB.data;
  const rdDays = (d.duties.roomDuty && d.duties.roomDuty.days) || [];
  openModal(
    '<div class="form-grid">' +
    field('week', '周次', d.duties.week || '第1周', 'text') +
    (d.duties.days || []).map((day, i) => field('day_' + i, day.day + '（姓名用顿号分隔）', (day.students || []).join('、'), 'text', 'full')).join('') +
    (d.duties.days || []).map((day, i) => field('room_' + i, '教室值日 · ' + day.day + '（单人）', (rdDays[i] && rdDays[i].name) || '', 'text', 'full')).join('') +
    '</div>',
    { title: '编辑值日表' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveDuty">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveDuty() {
  const v = readFields();
  const d = DB.data;
  d.duties.week = v.week || d.duties.week;
  (d.duties.days || []).forEach((day, i) => {
    const txt = v['day_' + i] || '';
    day.students = txt.split(/[、,，]/).map(x => x.trim()).filter(Boolean);
  });
  d.duties.roomDuty = d.duties.roomDuty || { days: [] };
  (d.duties.days || []).forEach((day, i) => {
    const nm = (v['room_' + i] || '').trim();
    if (!d.duties.roomDuty.days[i]) d.duties.roomDuty.days[i] = { day: day.day, name: '' };
    d.duties.roomDuty.days[i].name = nm;
    d.duties.roomDuty.days[i].day = day.day;
  });
  DB.save(); closeModal(); render();
  toast('值日表已更新');
}
function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}
function seatCellHtml(cell, stuMap) {
  const st = cell && cell.studentId ? stuMap[cell.studentId] : null;
  return '<div class="seat-cell ' + (st ? '' : 'empty') + '" data-action="setSeat" data-row="' + (cell ? cell.row : '') + '" data-col="' + (cell ? cell.col : '') + '" title="点击安排学生">' +
    (st ? '<div class="sc-name">' + esc(st.name) + '</div><div class="sc-no">' + esc(st.no) + '</div>' : '空') + '</div>';
}
function affSeatHtml() {
  const d = DB.data;
  const seat = d.seat;
  const stuMap = {};
  currentStudents().forEach(s => { stuMap[s.id] = s; });
  const rowsHtml = [];
  for (let r = 0; r < (seat.rows || 6); r++) {
    const desks = [];
    for (let c = 0; c < (seat.cols || 8); c += 2) {
      const a = (seat.layout || []).find(x => x.row === r && x.col === c);
      const b = (seat.layout || []).find(x => x.row === r && x.col === c + 1);
      if (!a) break;
      desks.push('<div class="seat-desk">' + seatCellHtml(a, stuMap) + (b ? seatCellHtml(b, stuMap) : '') + '</div>');
    }
    rowsHtml.push('<div class="seat-row">' + desks.join('') + '</div>');
  }
  return '<div class="card"><div class="card-title">💺 座位表 <span class="ct-sub">两人一桌（同桌），点击桌位可自由修改</span></div>' +
    (seat.stage === 'top' ? '<div class="seat-stage">讲 台</div>' : '') +
    '<div class="seat-rows">' + rowsHtml.join('') + '</div>' +
    (seat.stage !== 'top' ? '<div class="seat-stage" style="margin-top:12px">讲 台</div>' : '') +
    '<div class="btn-row" style="margin-top:12px;flex-wrap:wrap">' +
    '<button class="btn small primary" data-action="randomSeats">🎲 随机分配（同桌优先男男/女女）</button>' +
    '<button class="btn small primary" data-action="seatSettings">座位设置</button>' +
    '<button class="btn small danger" data-action="clearSeats">清空座位</button></div></div>';
}
function randomSeats() {
  const d = DB.data;
  const seat = d.seat;
  const stu = currentStudents().slice();
  if (!stu.length) { toast('当前班级暂无学生', 'err'); return; }
  const twoSeat = [];
  const oneSeat = [];
  for (let r = 0; r < (seat.rows || 6); r++) {
    for (let c = 0; c < (seat.cols || 8); c += 2) {
      const a = (seat.layout || []).find(x => x.row === r && x.col === c);
      const b = (seat.layout || []).find(x => x.row === r && x.col === c + 1);
      if (a) { (b ? twoSeat : oneSeat).push([a, b || null]); }
    }
  }
  const capacity = twoSeat.length * 2 + oneSeat.length;
  if (stu.length > capacity) { toast('座位不够：当前 ' + stu.length + ' 人，座位仅 ' + capacity + ' 个，请先调整行列数', 'err'); return; }
  const boys = shuffleArr(stu.filter(s => s.gender === '男'));
  const girls = shuffleArr(stu.filter(s => s.gender === '女'));
  const pairs = [];
  while (boys.length >= 2) pairs.push([boys.pop(), boys.pop()]);
  while (girls.length >= 2) pairs.push([girls.pop(), girls.pop()]);
  const rest = boys.concat(girls);
  if (rest.length === 2) pairs.push([rest[0], rest[1]]);
  else if (rest.length === 1) pairs.push([rest[0]]);
  const twoPairs = pairs.filter(p => p.length === 2);
  const onePairs = pairs.filter(p => p.length === 1);
  if (twoPairs.length > twoSeat.length) { toast('双人桌不够：请把“列数”设为偶数或增加行数', 'err'); return; }
  seat.layout.forEach(x => { x.studentId = ''; });
  const twoOrder = shuffleArr(twoSeat);
  const oneOrder = shuffleArr(oneSeat);
  let mixed = 0;
  twoPairs.forEach((pair, i) => {
    const desk = twoOrder[i];
    if (!desk) return;
    if (pair[0].gender !== pair[1].gender) mixed++;
    desk[0].studentId = pair[0].id;
    if (desk[1]) desk[1].studentId = pair[1].id;
  });
  onePairs.forEach((pair, i) => {
    const desk = oneOrder[i];
    if (desk) desk[0].studentId = pair[0].id;
  });
  DB.save(); render();
  toast(mixed ? '已随机分配：含 ' + mixed + ' 组男女同桌（性别不平衡），可点击桌位手动修改' : '已随机分配：同桌均为同性别，可点击桌位手动修改');
}
function seatSettingsModal() {
  const seat = DB.data.seat;
  openModal(
    '<div class="form-grid">' +
    field('rows', '行数', seat.rows || 6, 'number', 'min="1" max="12"') +
    field('cols', '列数', seat.cols || 8, 'number', 'min="1" max="12"') +
    field('stage', '讲台位置', seat.stage || 'top', 'select', '', optionsHtml(['top', 'bottom'], seat.stage).replace('>top<', '>上方<').replace('>bottom<', '>下方<')) +
    field('aisles', '走道数量', seat.aisles || 1, 'number', 'min="0" max="4"') +
    '</div>',
    { title: '座位设置' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveSeatSettings">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveSeatSettings() {
  const v = readFields();
  const d = DB.data;
  const rows = parseInt(v.rows || '6', 10), cols = parseInt(v.cols || '8', 10);
  const seat = d.seat;
  seat.rows = Math.min(12, Math.max(1, rows));
  seat.cols = Math.min(12, Math.max(1, cols));
  seat.stage = v.stage;
  seat.aisles = parseInt(v.aisles || '1', 10) || 1;
  const kept = (seat.layout || []).filter(x => x.row < seat.rows && x.col < seat.cols);
  for (let r = 0; r < seat.rows; r++) {
    for (let c = 0; c < seat.cols; c++) {
      if (!kept.some(x => x.row === r && x.col === c)) kept.push({ seatId: 'seat_' + r + '_' + c, row: r, col: c, studentId: '' });
    }
  }
  seat.layout = kept.sort((a, b) => (a.row - b.row) || (a.col - b.col));
  DB.save(); closeModal(); render();
  toast('座位设置已保存');
}
function seatAssignModal(row, col) {
  const d = DB.data;
  const cell = d.seat.layout.find(x => x.row === row && x.col === col);
  const occupied = d.seat.layout.filter(x => x.studentId).map(x => x.studentId);
  const free = currentStudents().filter(s => occupied.indexOf(s.id) < 0 || s.id === (cell || {}).studentId).sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const opt = '<option value="">（空）</option>' + free.map(s => '<option value="' + s.id + '"' + (cell && cell.studentId === s.id ? ' selected' : '') + '>' + esc(s.name) + '（' + esc(s.no) + '）</option>').join('');
  openModal(
    '<div class="field"><label>选择学生（第' + (row + 1) + '行 第' + (col + 1) + '列）</label><select data-field="studentId">' + opt + '</select></div>',
    { title: '安排座位' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveSeatAssign" data-row="' + row + '" data-col="' + col + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveSeatAssign(row, col) {
  const v = readFields();
  const d = DB.data;
  const cell = d.seat.layout.find(x => x.row === row && x.col === col);
  if (cell) {
    const oldCell = d.seat.layout.find(x => x.studentId === v.studentId && v.studentId);
    if (oldCell) oldCell.studentId = '';
    cell.studentId = v.studentId || '';
  }
  DB.save(); closeModal(); render();
  toast('座位已安排');
}
function affScheduleHtml() {
  const d = DB.data;
  const periods = d.schedule.periods || [];
  const days = ['周一', '周二', '周三', '周四', '周五'];
  const head = '<th style="min-width:110px">节次</th>' + days.map(x => '<th>' + x + '</th>').join('') + '<th style="width:60px">操作</th>';
  const rows = periods.map((p, i) => {
    const tds = days.map((_, di) => {
      const cell = (d.schedule.grid[di + 1] || [])[i] || { subject: '', teacher: '' };
      if (!cell.subject) return '<td class="center" style="color:var(--text3);cursor:pointer" data-action="setCell" data-day="' + (di + 1) + '" data-per="' + i + '">＋</td>';
      return '<td class="center" style="cursor:pointer" data-action="setCell" data-day="' + (di + 1) + '" data-per="' + i + '"><span class="s-cell" style="background:' + subjectColor(cell.subject) + '22;color:' + subjectColor(cell.subject) + '"><span class="s-sub">' + esc(cell.subject) + '</span><span class="s-tea">' + esc(cell.teacher) + '</span></span></td>';
    }).join('');
    return '<tr><td><div style="font-weight:700">' + esc(p.name) + '</div><div class="period">' + esc(p.start) + ' - ' + esc(p.end) + '</div></td>' + tds +
      '<td class="actions"><button class="btn btn-ico" data-action="editPeriod" data-id="' + i + '">✏️</button><button class="btn btn-ico danger" data-action="delPeriod" data-id="' + i + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary small" data-action="addPeriod">＋ 添加节次</button></div>' +
    '<div class="card"><div class="card-title">📖 课程表 <span class="ct-sub">点击课程格设置科目与教师</span></div>' +
    '<div class="table-wrap"><table class="schedule-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}
function periodFormModal(idx) {
  const d = DB.data;
  const p = (d.schedule.periods || [])[idx] || {};
  openModal(
    '<div class="form-grid">' +
    field('name', '节次名', p.name || '', 'text') +
    field('start', '开始时间', p.start || '08:00', 'time') +
    field('end', '结束时间', p.end || '08:45', 'time') +
    '</div>',
    { title: idx != null ? '编辑节次' : '添加节次' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="savePeriod" data-idx="' + (idx == null ? '' : idx) + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function savePeriod(idx) {
  const v = readFields();
  const d = DB.data;
  if (!d.schedule.periods) d.schedule.periods = [];
  if (idx !== '') {
    d.schedule.periods[parseInt(idx, 10)] = { name: v.name, start: v.start, end: v.end };
    toast('节次已更新');
  } else {
    d.schedule.periods.push({ name: v.name, start: v.start, end: v.end });
    toast('节次已添加');
  }
  DB.save(); closeModal(); render();
}
function cellFormModal(day, per) {
  const d = DB.data;
  const cell = ((d.schedule.grid[day] || [])[per]) || {};
  const subjectOpts = Object.keys(d.settings.subjectColors).map(s => '<option value="' + s + '"' + (s === cell.subject ? ' selected' : '') + '>' + s + '</option>').join('');
  openModal(
    '<div class="form-grid">' +
    '<div class="field"><label>科目</label><select data-field="subject">' + subjectOpts + '</select></div>' +
    field('teacher', '教师', cell.teacher || DB.data.settings.teacherName, 'text') +
    '</div>',
    { title: '设置课程：周' + '一二三四五'[day - 1] + ' ' + esc((d.schedule.periods[per] || {}).name || ('第' + (per + 1) + '节')) }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveCell" data-day="' + day + '" data-per="' + per + '">保存</button><button class="btn danger" data-action="clearCell" data-day="' + day + '" data-per="' + per + '">清空</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveCell(day, per) {
  const v = readFields();
  const d = DB.data;
  if (!d.schedule.grid[day]) d.schedule.grid[day] = [];
  d.schedule.grid[day][per] = { subject: v.subject, teacher: v.teacher };
  DB.save(); closeModal(); render();
  toast('课程已设置');
}
function affMeetingHtml() {
  const d = DB.data;
  const rows = d.meetings.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(m =>
    '<tr><td style="font-weight:600">' + esc(m.theme) + '</td><td class="center">' + esc(m.date) + '</td><td>' + esc(m.outline) + '</td>' +
    '<td class="actions"><button class="btn btn-ico" data-action="editMeeting" data-id="' + m.id + '">✏️</button><button class="btn btn-ico danger" data-action="delMeeting" data-id="' + m.id + '">🗑️</button></td></tr>').join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addMeeting">＋ 添加班会记录</button></div>' +
    '<div class="card"><div class="card-title">📋 班会记录</div><div class="table-wrap"><table class="tbl"><thead><tr><th>主题</th><th>日期</th><th>提纲</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">' + emptyHtml('暂无班会记录') + '</td></tr>') + '</tbody></table></div></div>';
}
function meetingFormModal(m) {
  m = m || {};
  openModal(
    '<div class="form-grid">' +
    field('theme', '主题 *', m.theme || '', 'text', 'full') +
    field('date', '日期', m.date || todayStr(), 'date') +
    field('outline', '提纲', m.outline || '', 'textarea', 'full placeholder="每行一条：&#10;1. 事项一&#10;2. 事项二"') +
    '</div>',
    { title: m.id ? '编辑班会记录' : '添加班会记录' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveMeeting" data-id="' + (m.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveMeeting(id) {
  const v = readFields();
  if (!v.theme) { toast('请填写主题', 'err'); return; }
  const d = DB.data;
  if (id) { const x = d.meetings.find(o => o.id === id); if (x) Object.assign(x, { theme: v.theme, date: v.date, outline: v.outline }); toast('班会已更新'); }
  else { d.meetings.push({ id: uid('mt'), theme: v.theme, date: v.date, outline: v.outline }); toast('班会已添加'); }
  DB.save(); closeModal(); render();
}

/* ================= 模块：德育活动 ================= */
function renderMoral() {
  const tab = state.moralTab || 'class';
  const tabs = [['class', '班级荣誉墙'], ['teacher', '教师荣誉墙'], ['activity', '周末研学']]
    .map(t => '<button class="tab' + (tab === t[0] ? ' active' : '') + '" data-action="moralTab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
  const body = tab === 'class' ? honorWallHtml('class') : tab === 'teacher' ? honorWallHtml('teacher') : activityHtml();
  return '<div class="page-title">🏅 德育活动</div><div class="page-sub">荣誉墙与周末研学活动管理</div><div class="tabs">' + tabs + '</div>' + body;
}
function honorWallHtml(kind) {
  const d = DB.data;
  const list = kind === 'class' ? d.honorsClass : d.honorsTeacher;
  const icons = { '集体荣誉': '🏆', '活动荣誉': '🎖️', '日常评比': '⭐', '个人荣誉': '🥇', '教学荣誉': '📜' };
  const cards = list.map(h => '<div class="honor-card"><button class="h-del" data-action="delHonor" data-kind="' + kind + '" data-id="' + h.id + '">✕</button><div class="h-ico">' + (icons[h.type] || '🏆') + '</div><div class="h-name">' + esc(h.name) + '</div><div class="h-type">' + esc(h.type) + '</div><div class="h-date">' + esc(h.date) + '</div></div>').join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addHonor" data-kind="' + kind + '">＋ 添加荣誉</button></div>' +
    (cards ? '<div class="honor-grid">' + cards + '</div>' : emptyHtml('暂无荣誉，点击上方添加', '🏆'));
}
function honorFormModal(kind) {
  openModal(
    '<div class="form-grid">' +
    field('name', '荣誉名称 *', '', 'text', 'full') +
    field('type', '类型', '集体荣誉', 'select', '', optionsHtml(kind === 'class' ? ['集体荣誉', '活动荣誉', '日常评比'] : ['个人荣誉', '教学荣誉', '其他'], '')) +
    field('date', '获得日期', todayStr(), 'date') +
    '</div>',
    { title: kind === 'class' ? '添加班级荣誉' : '添加教师荣誉' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveHonor" data-kind="' + kind + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveHonor(kind) {
  const v = readFields();
  if (!v.name) { toast('请填写荣誉名称', 'err'); return; }
  const d = DB.data;
  (kind === 'class' ? d.honorsClass : d.honorsTeacher).push({ id: uid('h'), name: v.name, type: v.type, date: v.date });
  DB.save(); closeModal(); render();
  toast('荣誉已添加');
}
function activityHtml() {
  const d = DB.data;
  const statusCls = { '报名中': 'amber', '进行中': 'blue', '已结束': 'green', '已取消': 'gray' };
  const rows = d.activities.slice().sort((a, b) => a.date > b.date ? -1 : 1).map(a => {
    const sts = (a.students || []).map(id => getStudent(id)).filter(Boolean);
    return '<tr><td style="font-weight:600">' + esc(a.name) + '</td><td class="center"><span class="badge ' + (statusCls[a.status] || 'gray') + '">' + esc(a.status) + '</span></td>' +
      '<td class="center">' + esc(a.date) + '</td><td class="center">' + esc(a.leader || '—') + '</td>' +
      '<td style="max-width:220px">' + (sts.length ? sts.slice(0, 6).map(s => '<span class="badge gray" style="margin:1px">' + esc(s.name) + '</span>').join('') + (sts.length > 6 ? '…' : '') : '—') + '</td>' +
      '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(a.summary) + '">' + esc(a.summary || '—') + '</td>' +
      '<td class="actions"><button class="btn btn-ico" data-action="editActivity" data-id="' + a.id + '">✏️</button><button class="btn btn-ico danger" data-action="delActivity" data-id="' + a.id + '">🗑️</button></td></tr>';
  }).join('');
  return '<div class="btn-row" style="margin-bottom:14px"><button class="btn primary" data-action="addActivity">＋ 新建研学活动</button></div>' +
    '<div class="card"><div class="card-title">🎒 周末研学活动</div><div class="table-wrap"><table class="tbl"><thead><tr><th>活动名称</th><th>状态</th><th>日期</th><th>带队老师</th><th>报名学生</th><th>总结</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7">' + emptyHtml('暂无活动') + '</td></tr>') + '</tbody></table></div></div>';
}
function activityFormModal(a) {
  a = a || {};
  const stu = currentStudents().slice().sort((x, y) => x.name.localeCompare(y.name, 'zh'));
  const selected = a.students || [];
  const chips = stu.map(s => '<span class="chip ' + (selected.indexOf(s.id) >= 0 ? 'on' : '') + '" data-chip="' + s.id + '">' + esc(s.name) + '</span>').join('');
  openModal(
    '<div class="form-grid">' +
    field('name', '活动名称 *', a.name || '', 'text', 'full') +
    field('type', '类型', a.type || '研学', 'select', '', optionsHtml(['研学', '运动会', '社会实践', '文艺汇演', '其他'], a.type)) +
    field('date', '日期', a.date || todayStr(), 'date') +
    field('status', '状态', a.status || '报名中', 'select', '', optionsHtml(['报名中', '进行中', '已结束', '已取消'], a.status)) +
    field('leader', '带队老师', a.leader || DB.data.settings.teacherName, 'text') +
    '<div class="field full"><label>报名学生（点击选择）</label><div class="chip-row" data-chipgroup="activityStu">' + chips + '</div></div>' +
    field('summary', '活动总结', a.summary || '', 'textarea', 'full') +
    '</div>',
    { title: a.id ? '编辑活动' : '新建研学活动' }
  );
  const foot = modalFootHtml('<button class="btn primary" data-action="saveActivity" data-id="' + (a.id || '') + '">保存</button>');
  document.getElementById('modalBox').insertAdjacentHTML('beforeend', foot);
}
function saveActivity(id) {
  const v = readFields();
  if (!v.name) { toast('请填写活动名称', 'err'); return; }
  const students = [];
  document.querySelectorAll('#modalBox [data-chipgroup="activityStu"] .chip.on').forEach(el => students.push(el.getAttribute('data-chip')));
  const d = DB.data;
  const payload = { name: v.name, type: v.type, date: v.date, status: v.status, leader: v.leader, students, summary: v.summary };
  if (id) { const x = d.activities.find(o => o.id === id); if (x) Object.assign(x, payload); toast('活动已更新'); }
  else { d.activities.push(Object.assign({ id: uid('ac') }, payload)); toast('活动已创建'); }
  DB.save(); closeModal(); render();
}

