/* ===== 阳光计划 主应用 ===== */
const App = {
  calYear: 0,
  calMonth: 0,
  mathProblems: [],
  teasersShown: [],

  init() {
    SunshinePlan.load();
    const now = new Date();
    this.calYear = now.getFullYear();
    this.calMonth = now.getMonth();

    this.bindTabs();
    this.renderHeader();
    this.renderTasks();
    this.renderRecitation();
    this.renderMath();
    this.renderEnglish();
    this.renderErrors();
    this.renderBattle();
    this.renderRewards();
    this.renderCalendar();
    this.renderHealth();
    this.renderBrain();
    this.renderMemo();
    this.renderSuggestedMemos();
  },

  // ===== Tab 切换 =====
  bindTabs() {
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById('panel-' + t.dataset.panel).classList.add('active');
        window.scrollTo(0, 0);
      });
    });
  },

  // ===== 顶部 =====
  renderHeader() {
    document.getElementById('sunCount').textContent = SunshinePlan.data.sunshine;
    const d = new Date();
    const weekdays = ['日','一','二','三','四','五','六'];
    document.getElementById('headerDate').textContent =
      `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`;
  },

  // ===== Toast =====
  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
  },

  // 阳光飘动动画
  flySunshine(amount) {
    const el = document.createElement('div');
    el.className = 'sunshine-float';
    el.textContent = `☀️ +${amount}`;
    const badge = document.querySelector('.sunshine-badge');
    const rect = badge.getBoundingClientRect();
    el.style.left = (rect.left + rect.width/2) + 'px';
    el.style.top = (rect.top) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  },

  // ===== 第一栏：学习任务 =====
  renderTasks() {
    const c = SunshinePlan.todayCheckin();
    const tasks = [
      { key:'recitation', name:'背书打卡', detail:'完成今日篇目背诵', reward:5, done:c.recitation },
      { key:'math', name:'口算打卡', detail:'完成30道口算题', reward:5, done:c.math },
      { key:'english', name:'英语打卡', detail:'背单词+句型练习', reward:5, done:c.english },
      { key:'guzheng', name:'古筝练习', detail:'满30分钟', reward:10, done:c.guzheng },
    ];
    // 古筝单独渲染在卡片里，这里渲染前三个
    const html = tasks.slice(0,3).map(t => `
      <div class="task-item ${t.done?'done':''}" id="task-row-${t.key}">
        <div class="task-check ${t.done?'checked':''}" onclick="App.toggleTask('${t.key}', ${t.reward})">${t.done?'✓':''}</div>
        <div class="task-body">
          <div class="task-name">${t.name}</div>
          <div class="task-detail">${t.detail}</div>
        </div>
        <div class="task-reward">+${t.reward} ☀️</div>
      </div>
    `).join('');
    document.getElementById('taskList').innerHTML = html;

    // 古筝
    const gz = tasks[3];
    const gzEl = document.querySelector('#guzhengTask');
    gzEl.classList.toggle('done', gz.done);
    const gzCheck = gzEl.querySelector('.task-check');
    gzCheck.classList.toggle('checked', gz.done);
    gzCheck.textContent = gz.done ? '✓' : '';
  },

  toggleTask(key, reward) {
    const c = SunshinePlan.todayCheckin();
    if (c[key]) {
      this.toast('今天已完成，不能取消哦~');
      return;
    }
    c[key] = true;
    SunshinePlan.addSunshine(reward, `完成${this.taskName(key)}`);
    this.flySunshine(reward);
    this.toast(`🎉 完成${this.taskName(key)}！获得${reward}阳光`);
    this.renderTasks();
    this.renderHeader();
    this.renderBattle();
    this.renderCalendar();
    // 检查全勤
    this.checkAllDone();
  },

  taskName(key) {
    return { recitation:'背书', math:'口算', english:'英语', guzheng:'古筝' }[key];
  },

  checkAllDone() {
    const c = SunshinePlan.todayCheckin();
    const tasks = ['recitation','math','english','guzheng'];
    const done = tasks.filter(t => c[t]).length;
    if (done === tasks.length) {
      // 全勤额外奖励
      const bonusKey = '_bonus_' + Utils.today();
      if (!SunshinePlan.data.checkins[Utils.today()]._bonus) {
        SunshinePlan.data.checkins[Utils.today()]._bonus = true;
        SunshinePlan.addSunshine(10, '全勤额外奖励');
        this.flySunshine(10);
        setTimeout(() => this.toast('🌟 今日全勤！额外奖励10阳光！'), 500);
        this.renderHeader();
      }
    }
  },

  // ===== 背书 =====
  renderRecitation() {
    const idx = SunshinePlan.data.recitationIndex;
    const total = Curriculum.recitation.length;
    const done = idx; // 已完成数
    document.getElementById('recProgress').textContent = `${done}/${total}`;
    document.getElementById('recProgressBar').style.width = (done/total*100) + '%';

    // 当前篇目
    const cur = Curriculum.recitation[idx];
    if (cur) {
      document.getElementById('currentRec').innerHTML = `
        <div class="recitation-item current open" onclick="this.classList.toggle('open')">
          <div class="rec-title">第${idx+1}篇：${cur.title}</div>
          <div style="margin-top:4px">
            <span class="tag ${cur.term}">${cur.term}</span>
            <span class="tag ${cur.cat}">${cur.cat}</span>
          </div>
          <div class="rec-content">${cur.content}</div>
        </div>
      `;
    } else {
      document.getElementById('currentRec').innerHTML = `<div style="text-align:center;padding:20px;color:var(--leaf-3)">🎉 全部背书完成！太棒了！</div>`;
    }

    // 全部列表
    const html = Curriculum.recitation.map((r, i) => `
      <div class="recitation-item ${i<idx?'done':''} ${i===idx?'current':''}" onclick="this.classList.toggle('open')">
        <div class="rec-title">${i<idx?'✅ ':i===idx?'👉 ':''}${r.title}</div>
        <span class="tag ${r.term}">${r.term}</span>
        <span class="tag ${r.cat}">${r.cat}</span>
        <div class="rec-content">${r.content}</div>
      </div>
    `).join('');
    document.getElementById('allRec').innerHTML = html;
  },

  nextRecitation() {
    if (SunshinePlan.data.recitationIndex < Curriculum.recitation.length) {
      SunshinePlan.data.recitationIndex++;
      SunshinePlan.save();
      this.renderRecitation();
      this.toast('📚 切换到下一篇目');
    } else {
      this.toast('已经全部背完啦！');
    }
  },

  // ===== 数学 =====
  renderMath() {
    // 思维题
    const html = Curriculum.math.thinkingExamples.map((t,i) => `
      <div class="teaser-card" style="background:linear-gradient(135deg,#FFF3E0,#FFE0B2)" onclick="this.classList.toggle('open')">
        <div class="teaser-q">${i+1}. ${t.q}</div>
        <div class="teaser-a">💡 ${t.a}</div>
      </div>
    `).join('');
    document.getElementById('thinkingList').innerHTML = html;
  },

  genMath() {
    this.mathProblems = Curriculum.math.generateOral(30);
    const html = this.mathProblems.map((p, i) => `
      <div class="math-cell" id="math-${i}">
        ${p.q.replace('= ?','')}<br>
        = <input type="text" inputmode="numeric" data-idx="${i}" oninput="App.onMathInput(${i})">
      </div>
    `).join('');
    document.getElementById('mathGrid').innerHTML = html;
    document.getElementById('mathCheckBtn').style.display = 'block';
    this.toast('🎲 已生成30道口算题！');
  },

  onMathInput(i) {
    const cell = document.getElementById('math-'+i);
    cell.classList.remove('correct','wrong');
  },

  checkMath() {
    let correct = 0;
    this.mathProblems.forEach((p, i) => {
      const input = document.querySelector(`#math-${i} input`);
      const cell = document.getElementById('math-'+i);
      const val = (input.value || '').trim();
      if (val === p.a || parseFloat(val) === parseFloat(p.a)) {
        cell.classList.add('correct');
        correct++;
      } else {
        cell.classList.add('wrong');
      }
    });
    const score = Math.round(correct / this.mathProblems.length * 5);
    if (score > 0) {
      SunshinePlan.addSunshine(score, `口算正确${correct}题`);
      this.flySunshine(score);
      this.toast(`📊 正确${correct}/${this.mathProblems.length}题，获得${score}阳光`);
    } else {
      this.toast('加油，再试试！');
    }
    this.renderHeader();
  },

  // ===== 英语 =====
  renderEnglish() {
    // 每日取4个单词
    const dayOffset = Math.floor(Date.now() / 86400000);
    const words = [];
    for (let i = 0; i < 4; i++) {
      words.push(Curriculum.english.words[(dayOffset + i) % Curriculum.english.words.length]);
    }
    const whtml = words.map(w => `
      <div class="word-card">
        <div class="word-en">${w.word}</div>
        <div class="word-cn">📖 ${w.cn}</div>
        <div class="word-sentence">💬 ${w.sentence}</div>
      </div>
    `).join('');
    document.getElementById('wordList').innerHTML = whtml;

    // 句型
    const sentences = [];
    for (let i = 0; i < 3; i++) {
      sentences.push(Curriculum.english.sentences[(dayOffset + i) % Curriculum.english.sentences.length]);
    }
    const shtml = sentences.map(s => `<div class="sentence-card">${s}</div>`).join('');
    document.getElementById('sentenceList').innerHTML = shtml;
  },

  // ===== 第二栏：错题本 =====
  renderErrors() {
    const errors = SunshinePlan.data.errors;
    if (errors.length === 0) {
      document.getElementById('errorList').innerHTML = `
        <div class="card">
          <div class="empty-state">
            <span class="emoji">📝</span>
            还没有错题记录<br>
            点击上方按钮添加错题
          </div>
        </div>`;
      return;
    }
    const html = errors.map(e => `
      <div class="card" style="padding:14px">
        <div class="error-item" style="background:transparent;margin:0;padding:0;border-left:none">
          <span class="error-del" onclick="App.delError('${e.id}')">×</span>
          <span class="error-subject ${e.subject}">${e.subject}</span>
          <div class="error-q">${e.question}</div>
          <div class="error-a">✅ ${e.answer}</div>
          ${e.note ? `<div class="error-note">📌 ${e.note}</div>` : ''}
          <div class="error-date">${e.date}</div>
        </div>
      </div>
    `).join('');
    document.getElementById('errorList').innerHTML = html;
  },

  openErrorModal() {
    document.getElementById('errorModal').classList.add('show');
  },

  saveError() {
    const subject = document.getElementById('errSubject').value;
    const question = document.getElementById('errQuestion').value.trim();
    const answer = document.getElementById('errAnswer').value.trim();
    const note = document.getElementById('errNote').value.trim();
    if (!question || !answer) {
      this.toast('请填写题目和答案');
      return;
    }
    SunshinePlan.data.errors.unshift({
      id: Utils.uid(),
      subject, question, answer, note,
      date: Utils.today()
    });
    SunshinePlan.save();
    this.closeModal('errorModal');
    document.getElementById('errQuestion').value = '';
    document.getElementById('errAnswer').value = '';
    document.getElementById('errNote').value = '';
    this.renderErrors();
    this.toast('✅ 错题已保存');
  },

  delError(id) {
    SunshinePlan.data.errors = SunshinePlan.data.errors.filter(e => e.id !== id);
    SunshinePlan.save();
    this.renderErrors();
    this.toast('已删除');
  },

  // ===== 第三栏：基地保卫战 =====
  renderBattle() {
    const c = SunshinePlan.todayCheckin();
    const tasks = ['recitation','math','english','guzheng'];
    const done = tasks.filter(t => c[t]).length;
    const total = tasks.length;

    // 草坪：5x5
    const plants = ['🌻','🌶️','🥔','🌰','🍉'];
    let lawnHtml = '';
    for (let i = 0; i < 25; i++) {
      const row = Math.floor(i/5);
      const isPlanted = row < done;
      lawnHtml += `<div class="plant-slot ${isPlanted?'planted':''}">${isPlanted?plants[row%5]:''}</div>`;
    }
    document.getElementById('lawnGrid').innerHTML = lawnHtml;

    // 僵尸行
    let zombieHtml = '';
    const zombies = total - done;
    for (let i = 0; i < 5; i++) {
      if (i < zombies) {
        zombieHtml += `<span class="zombie">🧟</span>`;
      } else {
        zombieHtml += `<span style="opacity:0.2">🧟</span>`;
      }
    }
    document.getElementById('zombieRow').innerHTML = zombieHtml;

    // 信息
    const safe = done === total;
    const defensePercent = Math.round(done/total*100);
    document.getElementById('battleBar').style.width = defensePercent + '%';

    let statusText, statusColor;
    if (safe) {
      statusText = '🎉 基地安全！所有植物就位，僵尸被击退！';
      statusColor = 'var(--leaf-3)';
    } else if (done >= 2) {
      statusText = `⚠️ 基地防御中...已完成${done}/${total}，还有${zombies}只僵尸靠近！`;
      statusColor = 'var(--sun-3)';
    } else {
      statusText = `🚨 危险！${zombies}只僵尸正在逼近，快去完成任务！`;
      statusColor = 'var(--danger)';
    }

    document.getElementById('battleInfo').innerHTML = `
      <div style="color:${statusColor};font-weight:700;font-size:14px;margin-bottom:6px">${statusText}</div>
      <div style="font-size:12px;color:var(--text-light)">
        今日完成 ${done}/${total} 项任务 | 防御力 ${defensePercent}%
      </div>
    `;
  },

  // ===== 第四栏：奖励中心 =====
  renderRewards() {
    const sun = SunshinePlan.data.sunshine;
    document.getElementById('rewardSun').textContent = `☀️ ${sun}`;

    const html = Rewards.items.map(r => {
      const can = sun >= r.cost;
      return `
        <div class="reward-card ${can?'affordable':''}">
          <div class="reward-icon">${r.icon}</div>
          <div class="reward-name">${r.name}</div>
          <div class="reward-cost">${r.cost}</div>
          <button class="reward-btn ${can?'ready':'disabled'}" ${can?'':'disabled'} onclick="App.exchangeReward('${r.id}')">
            ${can?'兑换':'阳光不足'}
          </button>
        </div>
      `;
    }).join('');
    document.getElementById('rewardGrid').innerHTML = html;

    // 兑换记录
    const history = SunshinePlan.data.rewards;
    if (history.length === 0) {
      document.getElementById('rewardHistory').innerHTML = `<div style="text-align:center;color:var(--text-light);font-size:13px;padding:20px">还没有兑换记录</div>`;
    } else {
      document.getElementById('rewardHistory').innerHTML = history.slice(0,20).map(h => `
        <div class="history-item">
          <span class="h-reason">${h.name}</span>
          <span class="h-amount">-${h.cost} ☀️</span>
        </div>
      `).join('');
    }
  },

  exchangeReward(id) {
    const r = Rewards.items.find(x => x.id === id);
    if (!r) return;
    if (SunshinePlan.data.sunshine < r.cost) {
      this.toast('阳光不足哦~');
      return;
    }
    if (!confirm(`确定用${r.cost}阳光兑换「${r.name}」吗？`)) return;
    if (SunshinePlan.spendSunshine(r.cost)) {
      SunshinePlan.data.rewards.unshift({
        name: r.name,
        cost: r.cost,
        date: Utils.today()
      });
      SunshinePlan.save();
      this.renderRewards();
      this.renderHeader();
      this.toast(`🎉 兑换成功！${r.name}`);
    }
  },

  // ===== 第五栏：日历 =====
  renderCalendar() {
    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    document.getElementById('calMonth').textContent = `${this.calYear}年${monthNames[this.calMonth]}`;

    const weekdays = ['日','一','二','三','四','五','六'];
    let html = weekdays.map(w => `<div class="cal-weekday">${w}</div>`).join('');

    const firstDay = new Date(this.calYear, this.calMonth, 1).getDay();
    const daysInMonth = new Date(this.calYear, this.calMonth+1, 0).getDate();
    const today = Utils.today();
    const todayDate = new Date(today);

    // 空白
    for (let i = 0; i < firstDay; i++) html += '<div></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.calYear}-${String(this.calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const checkin = SunshinePlan.data.checkins[dateStr];
      let cls = 'cal-day has-day';
      if (checkin) {
        const tasks = ['recitation','math','english','guzheng'];
        const done = tasks.filter(t => checkin[t]).length;
        if (done === tasks.length) cls += ' full';
        else if (done > 0) cls += ' partial';
        else cls += ' missed';
      }
      if (dateStr === today) cls += ' today';
      const dateObj = new Date(this.calYear, this.calMonth, d);
      if (dateObj > todayDate && !checkin) cls = 'cal-day';
      html += `<div class="${cls}">${d}</div>`;
    }

    document.getElementById('calGrid').innerHTML = html;

    // 统计
    const s = SunshinePlan.stats();
    document.getElementById('calStats').innerHTML = `
      <div class="cal-stat">
        <div class="cal-stat-num">${s.fullDays}</div>
        <div class="cal-stat-label">全勤天数</div>
      </div>
      <div class="cal-stat">
        <div class="cal-stat-num">${s.partialDays}</div>
        <div class="cal-stat-label">漏打卡</div>
      </div>
      <div class="cal-stat">
        <div class="cal-stat-num">${s.streak}</div>
        <div class="cal-stat-label">连续全勤</div>
      </div>
    `;

    // 总结
    const totalSun = SunshinePlan.data.sunshine + SunshinePlan.data.usedSunshine;
    document.getElementById('calSummary').innerHTML = `
      <div style="font-size:14px;line-height:2;color:var(--text)">
        📅 总打卡天数：<b>${s.totalDays}</b> 天<br>
        🌟 全勤天数：<b style="color:var(--leaf-3)">${s.fullDays}</b> 天<br>
        ⚠️ 部分完成：<b style="color:var(--sun-3)">${s.partialDays}</b> 天<br>
        🔥 当前连续全勤：<b style="color:var(--danger)">${s.streak}</b> 天<br>
        ☀️ 累计获得阳光：<b style="color:var(--sun-3)">${totalSun}</b><br>
        💰 已兑换阳光：<b>${SunshinePlan.data.usedSunshine}</b><br>
        💎 剩余阳光：<b style="color:var(--sun-3)">${SunshinePlan.data.sunshine}</b>
      </div>
    `;
  },

  prevMonth() {
    this.calMonth--;
    if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
    this.renderCalendar();
  },

  nextMonth() {
    this.calMonth++;
    if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
    this.renderCalendar();
  },

  // ===== 第六栏：健康饮食 =====
  renderHealth() {
    const exHtml = Health.exercises.map(e => `
      <div class="health-item">
        <div class="health-icon">${this.exerciseIcon(e.name)}</div>
        <div>
          <div class="health-name">${e.name} <span style="font-size:12px;color:var(--sun-3);font-weight:600">${e.target}</span></div>
          <div class="health-detail">${e.benefit}</div>
        </div>
      </div>
    `).join('');
    document.getElementById('exerciseList').innerHTML = exHtml;

    const nuHtml = Health.nutrition.map(n => `
      <div class="health-item">
        <div class="health-icon">${this.foodIcon(n.food)}</div>
        <div style="flex:1">
          <div class="health-name">${n.food} <span style="font-size:12px;color:var(--leaf-3)">${n.freq}</span></div>
          <div class="health-detail">${n.nutrient}</div>
        </div>
      </div>
    `).join('');
    document.getElementById('nutritionList').innerHTML = nuHtml;
  },

  exerciseIcon(name) {
    const map = { '跳绳':'🪢', '摸高跳':'🦘', '篮球':'🏀', '游泳':'🏊', '拉伸运动':'🧘' };
    return map[name] || '💪';
  },

  foodIcon(food) {
    const map = { '牛奶':'🥛', '鸡蛋':'🥚', '深海鱼':'🐟', '绿叶蔬菜':'🥬', '豆制品':'🫘', '坚果':'🌰', '水果':'🍎' };
    return map[food] || '🍽️';
  },

  // ===== 第七栏：思维 =====
  renderBrain() {
    // 对话
    const dayOffset = Math.floor(Date.now() / 86400000);
    const dialogs = [];
    for (let i = 0; i < 5; i++) {
      dialogs.push(Curriculum.english.dailyDialog[(dayOffset + i) % Curriculum.english.dailyDialog.length]);
    }
    const dhtml = dialogs.map(d => `
      <div class="dialog-card">
        <div class="dialog-scene">🎬 ${d.scene}</div>
        <div class="dialog-line"><span class="speaker" style="color:var(--sun-3)">A:</span> ${d.a}</div>
        <div class="dialog-line"><span class="speaker" style="color:var(--leaf-3)">B:</span> ${d.b}</div>
      </div>
    `).join('');
    document.getElementById('dialogList').innerHTML = dhtml;

    // 智力题
    this.shuffleTeasers();
  },

  shuffleTeasers() {
    // 随机取5题
    const shuffled = [...Curriculum.brainTeasers].sort(() => Math.random() - 0.5);
    this.teasersShown = shuffled.slice(0, 5);
    const html = this.teasersShown.map((t, i) => `
      <div class="teaser-card" onclick="this.classList.toggle('open')">
        <div class="teaser-q">${i+1}. ${t.q}</div>
        <div class="teaser-a">💡 ${t.a}</div>
      </div>
    `).join('');
    document.getElementById('teaserList').innerHTML = html;
  },

  // ===== 第八栏：备忘录 =====
  renderMemo() {
    const memos = SunshinePlan.data.memorandums;
    if (memos.length === 0) {
      document.getElementById('memoList').innerHTML = `
        <div class="empty-state" style="padding:20px">
          <span class="emoji" style="font-size:36px">📋</span>
          还没有备忘录
        </div>`;
      return;
    }
    const html = memos.map(m => `
      <div class="memo-item">
        <span class="error-del" onclick="App.delMemo('${m.id}')">×</span>
        <span class="memo-cat ${m.cat}">${m.cat}</span>
        <span class="memo-title">${m.title}</span>
        <div class="memo-content">${m.content}</div>
      </div>
    `).join('');
    document.getElementById('memoList').innerHTML = html;
  },

  renderSuggestedMemos() {
    const suggestions = [
      { cat:'学习', title:'四年级上册重点', content:'语文：古诗背诵+阅读理解；数学：除法运算+解决问题策略；英语：动物/食物/数字主题词汇' },
      { cat:'学习', title:'四年级下册重点', content:'语文：现代诗+文言文；数学：运算律+三角形；英语：学科/季节/日常作息句型' },
      { cat:'生活', title:'作息时间表', content:'6:30起床 → 7:00早餐 → 7:30上学 → 16:00放学 → 17:00作业 → 18:00晚餐 → 19:00古筝 → 20:00阅读 → 21:00睡觉' },
      { cat:'心理', title:'抗挫折教育', content:'遇到困难时先深呼吸3次，告诉自己"我可以慢慢来"。犯错是学习的机会，不是失败。' },
      { cat:'心理', title:'情绪管理', content:'生气时可以用"我感觉...因为..."句式表达。每天记录3件开心的小事，培养积极心态。' },
      { cat:'历史', title:'中国朝代顺序', content:'夏→商→周→秦→汉→三国→晋→南北朝→隋→唐→五代→宋→元→明→清。可用口诀记忆。' },
      { cat:'历史', title:'世界文明古国', content:'古埃及（尼罗河）、古巴比伦（两河流域）、古印度（印度河）、古代中国（黄河长江）' },
      { cat:'地理', title:'中国地理常识', content:'中国位于亚洲东部，太平洋西岸。面积约960万平方公里。首都北京。长江是最长的河流，黄河是母亲河。' },
      { cat:'地理', title:'江苏无锡地理', content:'无锡位于江苏省南部，太湖之滨，被誉为"太湖明珠"。京杭大运河穿城而过，是吴文化发源地。' },
      { cat:'生活', title:'安全常识', content:'过马路看红绿灯；不跟陌生人走；遇到危险打110；火灾打119；急救打120' },
    ];
    const html = suggestions.map(s => `
      <div class="memo-item" style="cursor:pointer" onclick="App.addSuggestion('${s.cat}','${s.title.replace(/'/g,"\\'")}','${s.content.replace(/'/g,"\\'")}')">
        <span class="memo-cat ${s.cat}">${s.cat}</span>
        <span class="memo-title">${s.title}</span>
        <div class="memo-content">${s.content}</div>
        <div style="font-size:11px;color:var(--sun-3);margin-top:4px">👆 点击添加到我的备忘录</div>
      </div>
    `).join('');
    document.getElementById('suggestedMemos').innerHTML = html;
  },

  addSuggestion(cat, title, content) {
    SunshinePlan.data.memorandums.unshift({
      id: Utils.uid(),
      cat, title, content,
      date: Utils.today()
    });
    SunshinePlan.save();
    this.renderMemo();
    this.toast('已添加到备忘录');
  },

  openMemoModal() {
    document.getElementById('memoModal').classList.add('show');
  },

  saveMemo() {
    const cat = document.getElementById('memoCat').value;
    const title = document.getElementById('memoTitle').value.trim();
    const content = document.getElementById('memoContent').value.trim();
    if (!title || !content) {
      this.toast('请填写标题和内容');
      return;
    }
    SunshinePlan.data.memorandums.unshift({
      id: Utils.uid(),
      cat, title, content,
      date: Utils.today()
    });
    SunshinePlan.save();
    this.closeModal('memoModal');
    document.getElementById('memoTitle').value = '';
    document.getElementById('memoContent').value = '';
    this.renderMemo();
    this.toast('✅ 备忘已保存');
  },

  delMemo(id) {
    SunshinePlan.data.memorandums = SunshinePlan.data.memorandums.filter(m => m.id !== id);
    SunshinePlan.save();
    this.renderMemo();
    this.toast('已删除');
  },

  // ===== 弹窗 =====
  closeModal(id) {
    document.getElementById(id).classList.remove('show');
  },

  openQuickAdd() {
    document.getElementById('quickModal').classList.add('show');
  },

  // ===== PWA 安装引导 =====
  deferredPrompt: null,

  initPWA() {
    // 检测是否已安装/独立模式
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;

    if (isStandalone) {
      // 已安装，不再显示引导
      return;
    }

    // Android Chrome: 捕获 beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallGuide();
    });

    // iOS Safari 没有 beforeinstallprompt，直接显示引导
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setTimeout(() => this.showIOSGuide(), 1500);
    } else if (!isStandalone) {
      // 其他浏览器也显示通用引导
      setTimeout(() => this.showInstallGuide(), 2000);
    }

    // 已安装事件
    window.addEventListener('appinstalled', () => {
      this.hideInstallGuide();
      this.toast('🎉 安装成功！下次从主屏幕打开即可');
    });
  },

  showInstallGuide() {
    const existing = document.getElementById('installGuide');
    if (existing) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const guide = document.createElement('div');
    guide.id = 'installGuide';
    guide.style.cssText = `
      position:fixed; bottom:0; left:0; right:0; z-index:500;
      background:linear-gradient(135deg,#FFF8E1,#FFECB3);
      border-radius:20px 20px 0 0; padding:20px 16px 24px;
      box-shadow:0 -4px 20px rgba(255,143,0,0.2);
      animation: slide-up 0.4s ease;
    `;
    if (isIOS) {
      guide.innerHTML = `
        <div style="text-align:center;font-size:24px;margin-bottom:8px">📲</div>
        <div style="font-size:16px;font-weight:700;text-align:center;margin-bottom:12px;color:#3E2723">
          把阳光计划放到主屏幕
        </div>
        <div style="font-size:13px;color:#6D4C41;line-height:1.8;margin-bottom:16px">
          像小程序一样使用，全屏不显示地址栏：<br>
          <b>①</b> 点击 Safari 底部的 <b>分享按钮 <span style="font-size:18px">⬆️</span></b><br>
          <b>②</b> 选择 <b>"添加到主屏幕"</b><br>
          <b>③</b> 点击 <b>"添加"</b>，桌面就会出现图标
        </div>
        <button onclick="App.hideInstallGuide()" style="width:100%;padding:12px;border:none;border-radius:24px;background:#66BB6A;color:#fff;font-size:14px;font-weight:600;cursor:pointer">
          知道了
        </button>
      `;
    } else {
      guide.innerHTML = `
        <div style="text-align:center;font-size:24px;margin-bottom:8px">📲</div>
        <div style="font-size:16px;font-weight:700;text-align:center;margin-bottom:12px;color:#3E2723">
          把阳光计划放到主屏幕
        </div>
        <div style="font-size:13px;color:#6D4C41;line-height:1.8;margin-bottom:16px">
          像小程序一样使用，全屏不显示地址栏，<br>离线也能打开学习打卡
        </div>
        <button onclick="App.triggerInstall()" style="width:100%;padding:12px;border:none;border-radius:24px;background:#FFB74D;color:#fff;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px">
          ⬇️ 添加到主屏幕
        </button>
        <button onclick="App.hideInstallGuide()" style="width:100%;padding:10px;border:none;background:transparent;color:#9E9E9E;font-size:13px;cursor:pointer">
          以后再说
        </button>
      `;
    }
    document.body.appendChild(guide);
  },

  showIOSGuide() {
    this.showInstallGuide();
  },

  hideInstallGuide() {
    const g = document.getElementById('installGuide');
    if (g) {
      g.style.transition = 'transform 0.3s ease';
      g.style.transform = 'translateY(100%)';
      setTimeout(() => g.remove(), 300);
    }
  },

  triggerInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then(() => {
        this.deferredPrompt = null;
        this.hideInstallGuide();
      });
    } else {
      this.toast('请用浏览器菜单的"添加到主屏幕"功能');
      this.hideInstallGuide();
    }
  },
};

// 启动
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.initPWA();
});
