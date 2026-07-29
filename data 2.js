/* ===== 阳光计划 数据层 ===== */
const SunshinePlan = {
  data: null,

  // 默认数据
  defaults() {
    return {
      sunshine: 0,           // 阳光总数
      history: [],           // 阳光获得记录
      checkins: {},          // 打卡记录 { '2026-07-29': { recitation:true, math:true, english:true, guzheng:true } }
      errors: [],            // 错题本
      rewards: [],           // 已兑换奖励
      memorandums: [],       // 备忘录
      recitationIndex: 0,    // 当前背书进度
      usedSunshine: 0,       // 已花费阳光
    };
  },

  load() {
    try {
      const raw = localStorage.getItem('sunshine_plan_v1');
      if (raw) {
        this.data = JSON.parse(raw);
        // 合并默认字段
        const d = this.defaults();
        for (const k in d) {
          if (!(k in this.data)) this.data[k] = d[k];
        }
      } else {
        this.data = this.defaults();
      }
    } catch(e) {
      this.data = this.defaults();
    }
    return this.data;
  },

  save() {
    localStorage.setItem('sunshine_plan_v1', JSON.stringify(this.data));
  },

  addSunshine(amount, reason) {
    this.data.sunshine += amount;
    this.data.history.unshift({ amount, reason, date: Utils.today() });
    if (this.data.history.length > 200) this.data.history.pop();
    this.save();
  },

  spendSunshine(amount) {
    if (this.data.sunshine < amount) return false;
    this.data.sunshine -= amount;
    this.data.usedSunshine += amount;
    this.save();
    return true;
  },

  todayCheckin() {
    const t = Utils.today();
    if (!this.data.checkins[t]) this.data.checkins[t] = {};
    return this.data.checkins[t];
  },

  // 统计打卡天数
  stats() {
    const keys = Object.keys(this.data.checkins);
    const totalDays = keys.length;
    let fullDays = 0;
    let partialDays = 0;
    const tasks = ['recitation','math','english','guzheng'];
    for (const k of keys) {
      const c = this.data.checkins[k];
      const done = tasks.filter(t => c[t]).length;
      if (done === tasks.length) fullDays++;
      else if (done > 0) partialDays++;
    }
    // 连续全勤
    let streak = 0;
    const sorted = keys.sort();
    for (let i = sorted.length - 1; i >= 0; i--) {
      const c = this.data.checkins[sorted[i]];
      const done = tasks.filter(t => c[t]).length;
      if (done === tasks.length) streak++;
      else break;
    }
    return { totalDays, fullDays, partialDays, streak, missed: partialDays };
  }
};

/* ===== 工具函数 ===== */
const Utils = {
  today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }
};

/* ===== 学习内容数据 ===== */
const Curriculum = {
  // 背书篇目（40篇，上册+下册）
  recitation: [
    // 上册
    { title:'《暮江吟》白居易', cat:'古诗', term:'上册', content:'一道残阳铺水中，半江瑟瑟半江红。可怜九月初三夜，露似真珠月似弓。' },
    { title:'《题西林壁》苏轼', cat:'古诗', term:'上册', content:'横看成岭侧成峰，远近高低各不同。不识庐山真面目，只缘身在此山中。' },
    { title:'《雪梅》卢梅坡', cat:'古诗', term:'上册', content:'梅雪争春未肯降，骚人阁笔费评章。梅须逊雪三分白，雪却输梅一段香。' },
    { title:'《出塞》王昌龄', cat:'古诗', term:'上册', content:'秦时明月汉时关，万里长征人未还。但使龙城飞将在，不教胡马度阴山。' },
    { title:'《凉州词》王翰', cat:'古诗', term:'上册', content:'葡萄美酒夜光杯，欲饮琵琶马上催。醉卧沙场君莫笑，古来征战几人回。' },
    { title:'《夏日绝句》李清照', cat:'古诗', term:'上册', content:'生当作人杰，死亦为鬼雄。至今思项羽，不肯过江东。' },
    { title:'《鹿柴》王维', cat:'日积月累', term:'上册', content:'空山不见人，但闻人语响。返景入深林，复照青苔上。' },
    { title:'《嫦娥》李商隐', cat:'日积月累', term:'上册', content:'云母屏风烛影深，长河渐落晓星沉。嫦娥应悔偷灵药，碧海青天夜夜心。' },
    { title:'《别董大》高适', cat:'日积月累', term:'上册', content:'千里黄云白日曛，北风吹雁雪纷纷。莫愁前路无知己，天下谁人不识君。' },
    { title:'《精卫填海》', cat:'文言文', term:'上册', content:'炎帝之少女，名曰女娃。女娃游于东海，溺而不返，故为精卫，常衔西山之木石，以堙于东海。' },
    { title:'《王戎不取道旁李》', cat:'文言文', term:'上册', content:'王戎七岁，尝与诸小儿游。看道边李树多子折枝，诸儿竞走取之，唯戎不动。人问之，答曰："树在道边而多子，此必苦李。"取之，信然。' },
    { title:'《观潮》第3-4自然段', cat:'课文', term:'上册', content:'午后一点左右，从远处传来隆隆的响声，好像闷雷滚动……那条白线很快地向我们移来，逐渐拉长，变粗，横贯江面。' },
    { title:'《走月亮》第4自然段', cat:'课文', term:'上册', content:'细细的溪水，流着山草和野花的香味，流着月光……' },
    { title:'问学名言（日积月累）', cat:'日积月累', term:'上册', content:'智能之士，不学不成，不问不知。——王充 / 敏而好学，不耻下问。——《论语》' },
    { title:'立秋农谚（日积月累）', cat:'日积月累', term:'上册', content:'立了秋，把扇丢。二八月，乱穿衣。夏雨少，秋霜早。' },
    // 下册
    { title:'《宿新市徐公店》杨万里', cat:'古诗', term:'下册', content:'篱落疏疏一径深，树头新绿未成阴。儿童急走追黄蝶，飞入菜花无处寻。' },
    { title:'《四时田园杂兴》范成大', cat:'古诗', term:'下册', content:'昼出耘田夜绩麻，村庄儿女各当家。童孙未解供耕织，也傍桑阴学种瓜。' },
    { title:'《清平乐·村居》辛弃疾', cat:'古诗', term:'下册', content:'茅檐低小，溪上青青草。醉里吴音相媚好，白发谁家翁媪？大儿锄豆溪东，中儿正织鸡笼。最喜小儿亡赖，溪头卧剥莲蓬。' },
    { title:'《芙蓉楼送辛渐》王昌龄', cat:'古诗', term:'下册', content:'寒雨连江夜入吴，平明送客楚山孤。洛阳亲友如相问，一片冰心在玉壶。' },
    { title:'《塞下曲》卢纶', cat:'古诗', term:'下册', content:'月黑雁飞高，单于夜遁逃。欲将轻骑逐，大雪满弓刀。' },
    { title:'《墨梅》王冕', cat:'古诗', term:'下册', content:'我家洗砚池头树，朵朵花开淡墨痕。不要人夸好颜色，只留清气满乾坤。' },
    { title:'《囊萤夜读》', cat:'文言文', term:'下册', content:'胤恭勤不倦，博学多通。家贫不常得油，夏月则练囊盛数十萤火以照书，以夜继日焉。' },
    { title:'《铁杵成针》', cat:'文言文', term:'下册', content:'磨针溪，在象耳山下。世传李太白读书山中，未成，弃去。过是溪，逢老媪方磨铁杵。问之，曰："欲作针。"太白感其意，还卒业。' },
    { title:'《蜂》罗隐', cat:'日积月累', term:'下册', content:'不论平地与山尖，无限风光尽被占。采得百花成蜜后，为谁辛苦为谁甜？' },
    { title:'《卜算子·咏梅》毛泽东', cat:'日积月累', term:'下册', content:'风雨送春归，飞雪迎春到。已是悬崖百丈冰，犹有花枝俏。俏也不争春，只把春来报。待到山花烂漫时，她在丛中笑。' },
    { title:'《繁星》七一', cat:'现代诗', term:'下册', content:'这些事——是永不漫灭的回忆：月明的园中，藤萝的叶下，母亲的膝上。' },
    { title:'《繁星》一三一', cat:'现代诗', term:'下册', content:'大海啊！哪一颗星没有光？哪一朵花没有香？哪一次我的思潮里没有你波涛的清响？' },
    { title:'《繁星》一五九', cat:'现代诗', term:'下册', content:'母亲啊！天上的风雨来了，鸟儿躲到它的巢里；心中的风雨来了，我只躲到你的怀里。' },
    { title:'《绿》艾青（节选）', cat:'现代诗', term:'下册', content:'好像绿色的墨水瓶倒翻了，到处是绿的……' },
    { title:'《白桦》叶赛宁（节选）', cat:'现代诗', term:'下册', content:'在我的窗前，有一棵白桦，仿佛涂上银霜，披了一身雪花。' },
    { title:'名言警句（日积月累）', cat:'日积月累', term:'下册', content:'天行健，君子以自强不息。——《周易》 / 胜人者有力，自胜者强。——《老子》' },
    { title:'习作：推荐一个好地方', cat:'同步作文', term:'上册', content:'练习写一个你喜欢的、值得推荐的地方，写出它的特别之处。' },
    { title:'习作：写观察日记', cat:'同步作文', term:'上册', content:'记录你连续观察某事物的发现，格式正确，内容真实。' },
    { title:'习作：小小"动物园"', cat:'同步作文', term:'上册', content:'把家人想象成动物，写出每个人和某种动物的相似之处。' },
    { title:'习作：我和____过一天', cat:'同步作文', term:'上册', content:'选择一个神话或童话人物，展开想象写一个故事。' },
    { title:'习作：游____', cat:'同步作文', term:'下册', content:'按游览顺序写一处景物，突出重点，条理清楚。' },
    { title:'习作：我学会了____', cat:'同步作文', term:'下册', content:'写学会做某件事的过程，把遇到的困难和学习体会写清楚。' },
    { title:'习作：我的"自画像"', cat:'同步作文', term:'下册', content:'向别人介绍自己，写出外貌、性格、爱好等方面的特点。' },
    { title:'习作：故事新编', cat:'同步作文', term:'下册', content:'选择一个熟悉的故事，发挥想象重新编写，赋予新意。' },
    { title:'习作：生活万花筒', cat:'同步作文', term:'上册', content:'写一件印象深刻的事，把事情的经过和自己的感受写清楚。' },
  ],

  // 数学题型
  math: {
    oralTypes: [
      '三位数除以两位数', '两位数乘两位数', '整数四则混合运算',
      '三位数乘两位数', '多位数读写', '简便运算（运算律）',
      '小数加减法', '量与计量换算'
    ],
    thinkingTypes: [
      '周期规律问题', '合理安排策略问题', '可能性大小判断',
      '一亿有多大', '多边形内角和', '数字编码问题',
      '图形变换综合题', '植树问题', '鸡兔同笼', '年龄问题'
    ],
    // 生成口算题
    generateOral(count) {
      const problems = [];
      const types = [
        () => { // 三位数除以两位数
          const a = 100 + Math.floor(Math.random()*900);
          const b = 10 + Math.floor(Math.random()*90);
          return { q:`${a} ÷ ${b} = ?`, a:(a/b).toFixed(2) };
        },
        () => { // 两位数乘两位数
          const a = 10 + Math.floor(Math.random()*90);
          const b = 10 + Math.floor(Math.random()*90);
          return { q:`${a} × ${b} = ?`, a:String(a*b) };
        },
        () => { // 三位数乘两位数
          const a = 100 + Math.floor(Math.random()*900);
          const b = 10 + Math.floor(Math.random()*90);
          return { q:`${a} × ${b} = ?`, a:String(a*b) };
        },
        () => { // 混合运算
          const a = 20 + Math.floor(Math.random()*80);
          const b = 10 + Math.floor(Math.random()*30);
          const c = 2 + Math.floor(Math.random()*8);
          return { q:`${a} + ${b} × ${c} = ?`, a:String(a+b*c) };
        },
        () => { // 简便运算
          const a = 25 * (1+Math.floor(Math.random()*4));
          const b = 4 * (1+Math.floor(Math.random()*25));
          return { q:`${a} × ${b} = ?（简便计算）`, a:String(a*b) };
        },
      ];
      for (let i = 0; i < count; i++) {
        const fn = types[Math.floor(Math.random()*types.length)];
        problems.push(fn());
      }
      return problems;
    },
    // 思维题示例
    thinkingExamples: [
      { q:'鸡兔同笼，共35个头，94只脚，鸡兔各几只？', a:'鸡23只，兔12只。23×2+12×4=46+48=94 ✓' },
      { q:'一条路长100米，每隔5米种一棵树（两端都种），共种几棵？', a:'100÷5+1=21棵' },
      { q:'小明今年8岁，爸爸今年32岁，几年后爸爸年龄是小明的3倍？', a:'设x年后：32+x=3(8+x)，解得x=4年' },
      { q:'一个数列：1,1,2,3,5,8,? 下一个数是？', a:'13（斐波那契数列，前两数之和）' },
      { q:'用0,2,4,6能组成多少个没有重复数字的三位数？', a:'百位3选（2/4/6），十位3选（含0），个位2选，共3×3×2=18个' },
    ]
  },

  // 英语词汇与句型
  english: {
    words: [
      { word:'subject', cn:'科目', sentence:'What subjects do you like?' },
      { word:'Chinese', cn:'语文', sentence:'I like Chinese and Maths.' },
      { word:'Maths', cn:'数学', sentence:'Maths is fun and useful.' },
      { word:'English', cn:'英语', sentence:'I practice English every day.' },
      { word:'Music', cn:'音乐', sentence:'We have Music on Friday.' },
      { word:'Art', cn:'美术', sentence:'I like drawing in Art class.' },
      { word:'after school', cn:'放学后', sentence:'What do you do after school?' },
      { word:'play football', cn:'踢足球', sentence:'I play football after school.' },
      { word:'draw pictures', cn:'画画', sentence:'She likes drawing pictures.' },
      { word:'every day', cn:'每天', sentence:'I read books every day.' },
      { word:'morning', cn:'早上', sentence:'When do you get up in the morning?' },
      { word:'usually', cn:'通常', sentence:'I usually go to school at seven.' },
      { word:'park', cn:'公园', sentence:'I can draw in the park.' },
      { word:'flower', cn:'花', sentence:'I can see some flowers.' },
      { word:'river', cn:'河', sentence:'Can you see the river?' },
      { word:'season', cn:'季节', sentence:'What season do you like?' },
      { word:'spring', cn:'春天', sentence:'Spring is warm and green.' },
      { word:'summer', cn:'夏天', sentence:'Summer is hot and sunny.' },
      { word:'autumn', cn:'秋天', sentence:'Autumn is cool and golden.' },
      { word:'winter', cn:'冬天', sentence:'Winter is cold and white.' },
      { word:'dress', cn:'连衣裙', sentence:'Whose dress is this?' },
      { word:'trousers', cn:'裤子', sentence:'These trousers are too short.' },
      { word:'matter', cn:'事情/问题', sentence:"What's the matter?" },
      { word:'thirsty', cn:'口渴的', sentence:"I'm thirsty. I want some water." },
      { word:'hungry', cn:'饥饿的', sentence:'Are you hungry? Have some bread.' },
      { word:'fine', cn:'好的', sentence:'How are you? I\'m fine, thank you.' },
      { word:'tired', cn:'疲倦的', sentence:"I'm tired. Let me rest." },
      { word:'ill', cn:'生病的', sentence:"I'm ill. I can't go to school." },
      { word:'homework', cn:'作业', sentence:'I finish my homework every day.' },
      { word:'breakfast', cn:'早餐', sentence:'I have breakfast at seven.' },
    ],
    sentences: [
      'What subjects do you like? — I like Chinese and Maths.',
      'What do you do after school? — I play football.',
      'When do you get up? — I get up at six thirty.',
      'What can you see in the park? — I can see some flowers.',
      'What season do you like? — I like spring.',
      "Whose dress is this? — It's my sister's.",
      "What's the matter? — I'm thirsty.",
      'How are you? — I\'m fine, thank you.',
      'Can you play basketball? — Yes, I can.',
      'How much is it? — It\'s twenty yuan.',
    ],
    // 每日情景对话
    dailyDialog: [
      { scene:'早晨起床', a:'Good morning! Time to get up.', b:'Good morning, Mom. I\'m awake.' },
      { scene:'吃早餐', a:'What would you like for breakfast?', b:'I\'d like some milk and bread, please.' },
      { scene:'上学路上', a:'Let\'s go to school. Are you ready?', b:'Yes! I have my bag and my lunch box.' },
      { scene:'课堂问候', a:'Good morning, class! How are you today?', b:'We are fine, thank you, teacher!' },
      { scene:'课间玩耍', a:'Let\'s play together! What can you do?', b:'I can run fast and jump high!' },
      { scene:'午餐时间', a:'What do you have for lunch?', b:'I have rice, fish and vegetables.' },
      { scene:'放学回家', a:'How was school today?', b:'It was great! I learned a lot.' },
      { scene:'晚间阅读', a:'What book are you reading?', b:"I'm reading a story about the sun." },
      { scene:'睡前', a:'Time for bed. Did you finish your homework?', b:'Yes, I did. Good night!' },
      { scene:'周末计划', a:'What shall we do this weekend?', b:'Let\'s go to the park and fly a kite!' },
    ]
  },

  // 思维智力题
  brainTeasers: [
    { q:'什么东西早上四条腿，中午两条腿，晚上三条腿？', a:'人（婴儿爬行、成人直立、老人拄拐杖）' },
    { q:'一个池塘里有荷花，每天面积翻倍，30天长满整个池塘。问第几天长满一半？', a:'第29天（因为每天翻倍，前一天是一半）' },
    { q:'有3个开关，3盏灯。你在门外看不到里面的灯。只允许进去一次，如何确定每个开关对应哪盏灯？', a:'先开1号开关5分钟，关掉。再开2号开关进去：亮的对应2号，热但不亮的对应1号，不亮不热的对应3号。' },
    { q:'用6根火柴拼出4个等边三角形（不能折断）', a:'拼成四面体（三棱锥），立体图形' },
    { q:'一个人要带一条狗、一只鸡、一袋米过河。船每次只能带一样。狗会咬鸡，鸡会吃米。怎么过？', a:'带鸡过去→空手回→带狗过去→带回鸡→带米过去→空手回→带鸡过去' },
    { q:'一杯水里放一块冰，水面刚好满。冰融化后水会溢出来吗？', a:'不会。冰排开水的体积等于冰融化后的水的体积（阿基米德原理）。' },
    { q:'10棵树种5行，每行4棵，怎么种？', a:'种成五角星形状，每个交点种一棵' },
    { q:'有一口井深7米，一只蜗牛白天爬3米，晚上滑下2米，几天能爬出？', a:'5天。前4天每天净爬1米到4米处，第5天爬3米到7米出井。' },
  ]
};

/* ===== 奖励中心数据 ===== */
const Rewards = {
  items: [
    { id:'tv30', name:'看电视30分钟', cost:30, icon:'📺' },
    { id:'gift20', name:'20元左右小礼物', cost:50, icon:'🎁' },
    { id:'gift50', name:'50元左右礼物', cost:100, icon:'🎀' },
    { id:'playground', name:'游乐场畅玩', cost:300, icon:'🎢' },
    { id:'movie', name:'看一场电影', cost:150, icon:'🎬' },
    { id:'icecream', name:'冰淇淋一份', cost:20, icon:'🍦' },
    { id:'book', name:'一本喜欢的书', cost:80, icon:'📚' },
    { id:'park', name:'公园亲子游', cost:200, icon:'🌳' },
  ]
};

/* ===== 健身饮食数据 ===== */
const Health = {
  exercises: [
    { name:'跳绳', target:'200-300个', benefit:'促进骨骼生长，增强心肺' },
    { name:'摸高跳', target:'50次', benefit:'刺激生长板，帮助长高' },
    { name:'篮球', target:'30分钟', benefit:'拉伸运动，促进全身发育' },
    { name:'游泳', target:'30分钟', benefit:'全身运动，关节无负担' },
    { name:'拉伸运动', target:'10分钟', benefit:'放松肌肉，改善体态' },
  ],
  nutrition: [
    { food:'牛奶', freq:'每天1-2杯(250-500ml)', nutrient:'钙+蛋白质，骨骼生长必需' },
    { food:'鸡蛋', freq:'每天1-2个', nutrient:'优质蛋白，促进生长发育' },
    { food:'深海鱼', freq:'每周2-3次', nutrient:'DHA+维生素D，健脑助高' },
    { food:'绿叶蔬菜', freq:'每餐适量', nutrient:'钙、维生素K，骨骼健康' },
    { food:'豆制品', freq:'每周3-4次', nutrient:'植物蛋白+钙，营养均衡' },
    { food:'坚果', freq:'每天一小把', nutrient:'锌+镁，促进生长激素分泌' },
    { food:'水果', freq:'每天2份', nutrient:'维生素C，帮助钙吸收' },
  ],
  dailyTarget: {
    steps: '8000-10000步',
    exerciseTime: '60分钟中高强度运动',
    sleep: '9-10小时（晚9点前入睡）',
    outdoor: '至少1小时户外活动（补充维生素D）'
  }
};
