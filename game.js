/**
 * 学术合成大作战 - 游戏核心逻辑
 * 基于 Matter.js 物理引擎
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    // 画布尺寸（竖向长方形）- 扩大到红色线
    canvasWidth: 360,
    canvasHeight: 700,
    
    // 边界厚度
    wallThickness: 20,
    
    // 物品半径（不同等级有不同大小）
    baseRadius: 22,
    radiusIncrement: 2.5,
    
    // 物理引擎参数
    gravity: 1.2,
    restitution: 0.3,  // 弹性
    friction: 0.5,     // 摩擦力
    
    // 生成位置
    spawnY: 50,
    
    // 游戏区域边界 - 扩大到红色线
    gameLeft: 20,
    gameRight: 340,
    gameTop: 80,
    gameBottom: 680
};

// ==================== 学术Title数据 ====================
const ACADEMIC_TITLES = [
    { level: 1,  name: '本科生',     icon: '🎓', color: '#95a5a6', score: 0 },
    { level: 2,  name: '硕士生',     icon: '📚', color: '#3498db', score: 10 },
    { level: 3,  name: '博士生',     icon: '🎒', color: '#9b59b6', score: 30 },
    { level: 4,  name: '博士后',     icon: '🔬', color: '#e67e22', score: 60 },
    { level: 5,  name: '讲师',       icon: '📖', color: '#1abc9c', score: 100 },
    { level: 6,  name: '副教授',     icon: '🏛️', color: '#16a085', score: 180 },
    { level: 7,  name: '教授/博导',  icon: '👔', color: '#f39c12', score: 300 },
    { level: 8,  name: '长江学者',   icon: '🌟', color: '#d35400', score: 500 },
    { level: 9,  name: '杰青',       icon: '💎', color: '#c0392b', score: 800 },
    { level: 10, name: '院士',       icon: '👑', color: '#8e44ad', score: 1500 },
    { level: 11, name: '诺贝尔奖',   icon: '🏆', color: '#ffd700', score: 3000 }
];

// ==================== 游戏状态 ====================
let gameState = {
    score: 0,
    highestLevel: 1,
    isGameOver: false,
    isPaused: false,        // 游戏暂停状态
    currentItem: null,      // 当前控制的物品
    nextItemLevel: 1,       // 下一个物品的等级
    isDropping: false,      // 是否正在下落
    canSpawn: true,         // 是否可以生成新物品
    comboCount: 0,          // 连击计数
    lastMergeTime: 0,       // 上次合并时间
    comboMultiplier: 1,     // 连击倍数
    totalMerges: 0,         // 总合并次数
    currentStreak: 0,       // 当前连续合并次数
    currentReward: null,     // 当前获得的奖励
    // 难度曲线系统
    difficultyLevel: 1,     // 当前难度等级
    timeLimit: 15000,       // 当前时间限制（毫秒）
    timeRemaining: 15000,    // 剩余时间
    lastDropTime: 0,        // 上次自动下落时间
    isTimeLimitMode: false, // 是否启用时间限制模式
    // 每日任务
    dailyTasks: [],          // 今日任务
    lastDailyDate: '',      // 上次登录日期
    dailyCompleted: false,   // 今日任务是否完成
    // 游戏模式
    gameMode: 'normal'       // 'normal' 或 'hextech'
};

// ==================== 难度等级配置 ====================
const DIFFICULTY_LEVELS = [
    { level: 1, name: '入门', timeLimit: 10000, minScore: 0, speed: 1.0 },
    { level: 2, name: '简单', timeLimit: 5000, minScore: 500, speed: 1.0 },
    { level: 3, name: '普通', timeLimit: 3000, minScore: 1500, speed: 1.1 },
    { level: 4, name: '困难', timeLimit: 2000, minScore: 3000, speed: 1.2 },
    { level: 5, name: '专家', timeLimit: 1000, minScore: 5000, speed: 1.3 },
    { level: 6, name: '大师', timeLimit: 500, minScore: 8000, speed: 1.4 },
    { level: 7, name: '王者', timeLimit: 250, minScore: 12000, speed: 1.5 }
];

// ==================== 每日任务配置 ====================
const DAILY_TASKS = [
    { id: 'task_merge_5', name: '合并5次', target: 5, type: 'merge', reward: 50, icon: '🔄' },
    { id: 'task_merge_10', name: '合并10次', target: 10, type: 'merge', reward: 100, icon: '🔄' },
    { id: 'task_score_200', name: '获得200分', target: 200, type: 'score', reward: 80, icon: '📝' },
    { id: 'task_score_500', name: '获得500分', target: 500, type: 'score', reward: 150, icon: '📝' },
    { id: 'task_level_3', name: '升级到3级', target: 3, type: 'level', reward: 200, icon: '⬆️' },
    { id: 'task_combo_3', name: '3连击', target: 3, type: 'combo', reward: 100, icon: '🔥' }
];

// ==================== 成就系统 ====================
const ACHIEVEMENTS = [
    { id: 'first_merge', name: '初次合并', desc: '完成第一次合并', condition: (state) => state.totalMerges >= 1, icon: '🌟', unlocked: false },
    { id: 'merge_10', name: '小试牛刀', desc: '完成10次合并', condition: (state) => state.totalMerges >= 10, icon: '⭐', unlocked: false },
    { id: 'merge_50', name: '合并达人', desc: '完成50次合并', condition: (state) => state.totalMerges >= 50, icon: '💫', unlocked: false },
    { id: 'merge_100', name: '合并大师', desc: '完成100次合并', condition: (state) => state.totalMerges >= 100, icon: '🏆', unlocked: false },
    { id: 'level_5', name: '硕士毕业', desc: '升级到5级', condition: (state) => state.highestLevel >= 5, icon: '🎓', unlocked: false },
    { id: 'level_8', name: '长江学者', desc: '升级到8级', condition: (state) => state.highestLevel >= 8, icon: '🌊', unlocked: false },
    { id: 'level_10', name: '学术巅峰', desc: '升级到10级', icon: '👑', condition: (state) => state.highestLevel >= 10, unlocked: false },
    { id: 'combo_3', name: '三连击', desc: '3次连击', condition: (state) => state.comboCount >= 3, icon: '🔥', unlocked: false },
    { id: 'combo_5', name: '五连击', desc: '5次连击', condition: (state) => state.comboCount >= 5, icon: '💥', unlocked: false },
    { id: 'score_1000', name: '初露头角', desc: '获得1000分', condition: (state) => state.score >= 1000, icon: '📈', unlocked: false },
    { id: 'score_5000', name: '学富五车', desc: '获得5000分', condition: (state) => state.score >= 5000, icon: '📚', unlocked: false },
    { id: 'score_10000', name: '著作等身', desc: '获得10000分', condition: (state) => state.score >= 10000, icon: '📖', unlocked: false },
    // 海克斯模式专属成就
    { id: 'hextech_first', name: '海克斯初体验', desc: '首次选择海克斯模式', condition: (state) => state.gameMode === 'hextech', icon: '⚡', unlocked: false },
    { id: 'collector_5', name: '海克斯收藏家', desc: '收集5种不同Buff', condition: () => { const combos = JSON.parse(localStorage.getItem('hextech_combos') || '[]'); return combos.length >= 5; }, icon: '🎁', unlocked: false },
    { id: 'collector_all', name: '海克斯大师', desc: '收集所有Buff', condition: () => { const combos = JSON.parse(localStorage.getItem('hextech_combos') || '[]'); return combos.length >= HEXTECH_BUFFS.length; }, icon: '👑', unlocked: false },
    { id: 'boss_slayer', name: '屠龙者', desc: '击败Boss', condition: (state) => state.bossSpawned, icon: '👹', unlocked: false },
    { id: 'coin_100', name: '小富翁', desc: '累计获得100金币', condition: (state) => state.coinCount >= 100, icon: '🪙', unlocked: false },
    { id: 'coin_500', name: '金币大亨', desc: '累计获得500金币', condition: (state) => state.coinCount >= 500, icon: '💰', unlocked: false }
];

// ==================== 随机奖励类型 ====================
const REWARDS = [
    { type: 'double_score', name: '双倍分数', desc: '下次合并分数x2', probability: 0.15, icon: '✨', duration: 10000 },
    { type: 'slow_down', name: '减速', desc: '物品下落速度降低50%', probability: 0.1, icon: '🐢', duration: 8000 },
    { type: 'extra_points', name: '额外加分', desc: '直接获得100分', probability: 0.2, icon: '💯', duration: 0 },
    { type: 'shield', name: '护盾', desc: '3秒内不会因堆积结束游戏', probability: 0.05, icon: '🛡️', duration: 3000 }
];

// ==================== Matter.js 模块 ====================
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Body = Matter.Body,
      Vector = Matter.Vector;

// ==================== 全局变量 ====================
let engine, render, runner;
let items = [];  // 所有物品的数组
let audioContext = null;  // 音频上下文
let isMuted = false;  // 静音状态
let bestScore = 0;  // 历史最高分
let gameOverCheckCount = 0;  // 游戏结束检查计数器

// ==================== 分数存储系统 ====================
function initScoreStorage() {
    // 从localStorage加载历史最高分
    const saved = localStorage.getItem('academicGame_bestScore');
    if (saved) {
        bestScore = parseInt(saved, 10);
    }
}

function saveBestScore() {
    if (gameState.score > bestScore) {
        bestScore = gameState.score;
        localStorage.setItem('academicGame_bestScore', bestScore.toString());
    }
}

function getBestScore() {
    return bestScore;
}

// ==================== 音效系统 ====================
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('浏览器不支持Web Audio API');
    }
}

function playSound(type, level = 1) {
    if (!audioContext || isMuted) return;
    
    // 恢复音频上下文（浏览器要求用户交互后才能播放）
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 根据音效类型设置不同的频率
    switch(type) {
        case 'drop':
            // 下落音效 - 快速下降的音调
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
            
        case 'merge':
            // 合并音效 - 根据等级有不同的音调
            const baseFreq = 300 + level * 100;
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 2, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
            
        case 'gameover':
            // 游戏结束音效
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
            
        case 'unlock':
            // 解锁新Title音效
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
            
        case 'combo':
            // 连击音效 - 根据连击数有不同的音调
            const combo = level || 1;
            const comboFreq = 400 + combo * 50;
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(comboFreq, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(comboFreq * 1.5, audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(comboFreq * 2, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.25);
            break;
    }
}

function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

// ==================== 初始化游戏 ====================
function initGame() {
    console.log('🎮 初始化游戏...');
    
    // 动态设置游戏尺寸（移动端全屏）
    adjustGameSize();
    
    // 初始化音频和分数存储
    initAudio();
    initScoreStorage();
    
    // 加载成就系统
    loadAchievements();
    
    // 初始化每日任务
    initDailyTasks();
    
    // 创建物理引擎
    engine = Engine.create();
    engine.gravity.y = CONFIG.gravity;
    
    // 获取画布元素
    const canvas = document.getElementById('game-canvas');
    
    // 创建渲染器
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: CONFIG.canvasWidth,
            height: CONFIG.canvasHeight,
            wireframes: false,  // 显示实际颜色
            background: '#2c3e50',
            pixelRatio: window.devicePixelRatio || 1
        }
    });
    
    // 设置 canvas 元素的实际像素尺寸
    canvas.width = CONFIG.canvasWidth;
    canvas.height = CONFIG.canvasHeight;
    
    // 启动物理引擎（必须在渲染器创建之后）
    runner = Runner.create();
    Runner.run(runner, engine);
    
    // 禁用Matter.js默认渲染，使用自定义渲染
    Render.stop(render);
    
    // 设置画布实际尺寸（适配屏幕）
    const wrapper = document.getElementById('canvas-wrapper');
    
    // 移动端：全屏显示
    if (window.innerWidth < 480) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        // 锁定 wrapper 高度，防止滚动
        wrapper.style.height = CONFIG.canvasHeight + 'px';
    } else {
        // 桌面端：保持原有缩放逻辑
        const scale = wrapper.clientWidth / CONFIG.canvasWidth;
        canvas.style.width = '100%';
        canvas.style.height = CONFIG.canvasHeight * scale + 'px';
    }
    
    // 创建边界
    createWalls();
    
    // 初始化Title图鉴
    initTitleLegend();
    
    // 初始化第一个物品
    generateNextItem();
    spawnNewItem();
    
    // 设置碰撞检测事件
    setupCollisionDetection();
    
    // 设置鼠标/触摸控制
    setupControls();
    
    // 初始化屏幕适配
    setupResponsive();
    
    console.log('✅ 游戏初始化完成');
}

// ==================== 动态调整游戏尺寸 ====================
function adjustGameSize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 移动端：根据可见高度来计算
    if (windowWidth < 480) {
        // 获取 canvas-wrapper 的位置，计算可见高度
        const wrapper = document.getElementById('canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        const visibleHeight = windowHeight - rect.top;
        
        // 游戏物理尺寸：宽度=屏幕宽度，高度=可见高度
        CONFIG.canvasWidth = windowWidth;
        CONFIG.canvasHeight = visibleHeight;
        
        // 游戏区域边界
        CONFIG.gameLeft = 10;
        CONFIG.gameRight = windowWidth - 10;
        CONFIG.gameTop = 50;
        CONFIG.gameBottom = visibleHeight - 10;
        CONFIG.spawnY = 35;
        
        // 物品大小也根据屏幕调整
        CONFIG.baseRadius = Math.max(16, windowWidth / 22);
        CONFIG.radiusIncrement = CONFIG.baseRadius * 0.12;
    } else {
        // 桌面端：使用固定尺寸
        CONFIG.canvasWidth = 360;
        CONFIG.canvasHeight = 700;
        CONFIG.gameLeft = 20;
        CONFIG.gameRight = 340;
        CONFIG.gameTop = 80;
        CONFIG.gameBottom = 680;
        CONFIG.spawnY = 50;
        CONFIG.baseRadius = 22;
        CONFIG.radiusIncrement = 2.5;
    }
}

// ==================== 屏幕适配 ====================
function setupResponsive() {
    const wrapper = document.getElementById('canvas-wrapper');
    const container = document.getElementById('game-container');
    
    function adjustSize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 移动端全屏适配
        if (windowWidth < 480) {
            // 计算可见高度
            const rect = wrapper.getBoundingClientRect();
            const visibleHeight = windowHeight - rect.top;
            
            // 全屏模式
            wrapper.style.width = '100%';
            wrapper.style.height = visibleHeight + 'px';
            wrapper.style.maxWidth = 'none';
            
            // 调整 canvas 样式
            const canvas = document.getElementById('game-canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            // 更新物理引擎的渲染尺寸
            if (render) {
                render.canvas.width = CONFIG.canvasWidth;
                render.canvas.height = CONFIG.canvasHeight;
                render.options.width = CONFIG.canvasWidth;
                render.options.height = CONFIG.canvasHeight;
            }
            
            // 容器全屏
            container.style.maxWidth = '100%';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.borderRadius = '0';
            container.style.padding = '0';
        } else {
            // 桌面端保持原有样式
            wrapper.style.width = '';
            wrapper.style.maxWidth = '320px';
            wrapper.style.aspectRatio = '320 / 600';
            wrapper.style.height = '';
        }
    }
    
    window.addEventListener('resize', adjustSize);
    adjustSize();
}

// ==================== 创建边界 ====================
function createWalls() {
    const wallOptions = {
        isStatic: true,
        render: { visible: false },
        friction: 0.1
    };
    
    // 地面
    const ground = Bodies.rectangle(
        CONFIG.canvasWidth / 2,
        CONFIG.canvasHeight + CONFIG.wallThickness / 2,
        CONFIG.canvasWidth,
        CONFIG.wallThickness,
        wallOptions
    );
    
    // 左墙
    const leftWall = Bodies.rectangle(
        -CONFIG.wallThickness / 2,
        CONFIG.canvasHeight / 2,
        CONFIG.wallThickness,
        CONFIG.canvasHeight * 2,
        wallOptions
    );
    
    // 右墙
    const rightWall = Bodies.rectangle(
        CONFIG.canvasWidth + CONFIG.wallThickness / 2,
        CONFIG.canvasHeight / 2,
        CONFIG.wallThickness,
        CONFIG.canvasHeight * 2,
        wallOptions
    );
    
    // 顶部边界（用于游戏结束判定）
    const topBoundary = Bodies.rectangle(
        CONFIG.canvasWidth / 2,
        CONFIG.gameTop - 20,
        CONFIG.canvasWidth,
        10,
        {
            isStatic: true,
            isSensor: true,  
            render: { visible: false },
            label: 'topBoundary'
        }
    );
    
    Composite.add(engine.world, [ground, leftWall, rightWall, topBoundary]);
}

// ==================== 初始化Title图鉴 ====================
function initTitleLegend() {
    const titleList = document.getElementById('title-list');
    titleList.innerHTML = '';
    
    ACADEMIC_TITLES.forEach((title, index) => {
        const item = document.createElement('div');
        item.className = 'title-item';
        item.id = `title-${title.level}`;
        item.innerHTML = `
            <span class="icon">${title.icon}</span>
            <span class="name">${title.name}</span>
        `;
        titleList.appendChild(item);
    });
    
    // 解锁第一个
    document.getElementById('title-1').classList.add('unlocked');
}

// ==================== 生成下一个物品 ====================
function generateNextItem() {
    // 随机生成1-4级的物品（避免直接生成高级物品）
    gameState.nextItemLevel = Math.floor(Math.random() * 4) + 1;
    
    // 更新预览显示
    const nextItemEl = document.getElementById('next-item');
    const title = ACADEMIC_TITLES[gameState.nextItemLevel - 1];
    nextItemEl.textContent = title.icon;
}

// ==================== 生成新物品 ====================
function spawnNewItem() {
    if (gameState.isGameOver || !gameState.canSpawn) return;
    
    const level = gameState.nextItemLevel;
    const title = ACADEMIC_TITLES[level - 1];
    const radius = getRadiusForLevel(level);
    
    // 创建圆形物体
    const item = Bodies.circle(
        CONFIG.canvasWidth / 2,  // 居中
        CONFIG.spawnY,
        radius,
        {
            restitution: CONFIG.restitution,
            friction: CONFIG.friction,
            frictionAir: 0.01,
            label: `item_${level}`,
            render: {
                fillStyle: title.color,
                strokeStyle: '#fff',
                lineWidth: 2
            }
        }
    );
    
    // 附加自定义属性
    item.gameLevel = level;
    item.gameTitle = title.name;
    item.gameIcon = title.icon;
    item.isMerged = false;
    item.createdAt = Date.now();  // 创建时间用于动画
    
    // 设置为静态（等待玩家释放）
    Body.setStatic(item, true);
    
    gameState.currentItem = item;
    gameState.isDropping = false;
    items.push(item);
    Composite.add(engine.world, item);
    
    // 生成下一个
    generateNextItem();
}

// ==================== 获取等级对应的半径 ====================
function getRadiusForLevel(level) {
    return CONFIG.baseRadius + (level - 1) * CONFIG.radiusIncrement;
}

// ==================== 设置碰撞检测 ====================
function setupCollisionDetection() {
    Events.on(engine, 'collisionStart', function(event) {
        const pairs = event.pairs;
        
        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;
            
            // 检查是否是两个物品碰撞
            if (bodyA.label && bodyB.label && 
                bodyA.label.startsWith('item_') && bodyB.label.startsWith('item_')) {
                
                // TODO: 处理物品合并
                handleItemCollision(bodyA, bodyB);
            }
        }
    });
}

// ==================== 处理物品碰撞 ====================
function handleItemCollision(bodyA, bodyB) {
    // 检查是否相同等级且未被合并
    if (bodyA.gameLevel === bodyB.gameLevel && 
        !bodyA.isMerged && !bodyB.isMerged &&
        bodyA.gameLevel < ACADEMIC_TITLES.length) {  // 不是最高级
        
        console.log(`🔄 检测到合并: ${bodyA.gameTitle} + ${bodyB.gameTitle}`);
        
        // 标记为已合并，防止重复处理
        bodyA.isMerged = true;
        bodyB.isMerged = true;
        
        // 计算合并后的位置（两者的中间）
        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;
        
        // 移除旧物品
        Composite.remove(engine.world, bodyA);
        Composite.remove(engine.world, bodyB);
        items = items.filter(item => item !== bodyA && item !== bodyB);
        
        // 创建新物品（等级+1）
        const newLevel = bodyA.gameLevel + 1;
        createMergedItem(midX, midY, newLevel);
        
        // 添加合并分数（应用连击倍数）
        const title = ACADEMIC_TITLES[newLevel - 1];
        let scoreToAdd = title.score;
        
        // 应用连击倍数
        scoreToAdd = Math.floor(scoreToAdd * gameState.comboMultiplier);
        
        // 应用双倍分数奖励
        if (gameState.currentReward && gameState.currentReward.type === 'double_score') {
            scoreToAdd *= 2;
            // 移除奖励
            removeReward(gameState.currentReward);
        }
        
        updateScore(scoreToAdd);
        
        // 更新总合并次数
        gameState.totalMerges++;
        
        // 更新每日任务进度
        updateDailyProgress('merge', 1);
        updateDailyProgress('score', scoreToAdd);
        updateDailyProgress('level', newLevel);
        
        // 播放合并音效
        playSound('merge', newLevel);
        
        // 更新最高等级
        updateHighestTitle(newLevel);
        
        // 播放合并特效
        createMergeEffect(midX, midY, title);
        
        // 创建粒子特效
        createMergeParticles(midX, midY, title.color);
        
        // 检查连击
        checkCombo();
        
        // 尝试生成随机奖励
        trySpawnReward();

        // 海克斯模式合并处理
        if (typeof HextechSystem !== 'undefined') {
            HextechSystem.onMerge(bodyA, bodyB, newLevel);

            // 海克斯模式：合并时降低水位
            if (gameState.gameMode === 'hextech' && typeof HextechSystem.lowerWater === 'function') {
                HextechSystem.lowerWater(HextechSystem.WATER_CONFIG.dropOnMerge);
            }
        }

        // 更新里程碑提示
        showMilestoneHint();
    }
}

// ==================== 创建合并后的物品 ====================
function createMergedItem(x, y, level) {
    const title = ACADEMIC_TITLES[level - 1];
    const radius = getRadiusForLevel(level);
    
    const item = Bodies.circle(x, y, radius, {
        restitution: CONFIG.restitution,
        friction: CONFIG.friction,
        frictionAir: 0.01,
        label: `item_${level}`,
        render: {
            fillStyle: title.color,
            strokeStyle: '#fff',
            lineWidth: 2
        }
    });
    
    item.gameLevel = level;
    item.gameTitle = title.name;
    item.gameIcon = title.icon;
    item.isMerged = false;
    item.createdAt = Date.now();  // 创建时间
    item.mergeAnimationEnd = Date.now() + 300;  // 合并动画结束时间
    
    items.push(item);
    Composite.add(engine.world, item);
}

// ==================== 创建合并特效 ====================
function createMergeEffect(x, y, title) {
    // 创建特效元素
    const effect = document.createElement('div');
    effect.className = 'merge-effect';
    effect.innerHTML = `
        <span class="effect-icon">${title.icon}</span>
        <span class="effect-text">+${title.score}</span>
    `;
    
    // 设置位置
    const wrapper = document.getElementById('canvas-wrapper');
    const rect = wrapper.getBoundingClientRect();
    const scale = CONFIG.canvasWidth / rect.width;
    
    effect.style.cssText = `
        position: absolute;
        left: ${x / scale}px;
        top: ${y / scale}px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 50;
        animation: mergeEffect 0.8s ease-out forwards;
    `;
    
    wrapper.appendChild(effect);
    
    // 动画结束后移除
    setTimeout(() => {
        effect.remove();
    }, 800);
    
    // 添加大数字飘字
    createScorePopup(x, y, title.score);
}

// 大数字飘字
function createScorePopup(x, y, score) {
    const wrapper = document.getElementById('canvas-wrapper');
    const rect = wrapper.getBoundingClientRect();
    const scale = CONFIG.canvasWidth / rect.width;
    
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${score}`;
    popup.style.cssText = `
        position: absolute;
        left: ${x / scale}px;
        top: ${y / scale - 30}px;
        transform: translate(-50%, -50%);
        font-size: 2rem;
        font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.5);
        pointer-events: none;
        z-index: 60;
        animation: scorePopup 1s ease-out forwards;
    `;
    
    wrapper.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

// ==================== 设置鼠标/触摸控制 ====================
function setupControls() {
    const wrapper = document.getElementById('canvas-wrapper');
    const canvas = document.getElementById('game-canvas');
    
    // 获取canvas在wrapper中的位置
    function getCanvasCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = CONFIG.canvasWidth / rect.width;
        const scaleY = CONFIG.canvasHeight / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    // 鼠标移动
    wrapper.addEventListener('mousemove', function(e) {
        if (gameState.currentItem && !gameState.isDropping && !gameState.isPaused) {
            const coords = getCanvasCoords(e.clientX, e.clientY);
            const radius = getRadiusForLevel(gameState.currentItem.gameLevel);
            const clampedX = Math.max(
                CONFIG.gameLeft + radius,
                Math.min(coords.x, CONFIG.gameRight - radius)
            );
            Body.setPosition(gameState.currentItem, {
                x: clampedX,
                y: CONFIG.spawnY
            });
        }
    });
    
    // 鼠标点击 - 释放物品（在wrapper上监听更可靠）
    wrapper.addEventListener('click', function(e) {
        // 忽略预览区域的点击
        if (e.target.closest('#next-preview')) return;
        
        if (gameState.currentItem && !gameState.isDropping && !gameState.isPaused) {
            dropItem();
        }
    });
    
    // 触摸开始 - 立即更新位置（更灵敏）
    wrapper.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (gameState.currentItem && !gameState.isDropping && !gameState.isPaused) {
            const touch = e.touches[0];
            const coords = getCanvasCoords(touch.clientX, touch.clientY);
            const radius = getRadiusForLevel(gameState.currentItem.gameLevel);
            const clampedX = Math.max(
                CONFIG.gameLeft + radius,
                Math.min(coords.x, CONFIG.gameRight - radius)
            );
            Body.setPosition(gameState.currentItem, {
                x: clampedX,
                y: CONFIG.spawnY
            });
        }
    }, { passive: false });
    
    // 触摸移动
    wrapper.addEventListener('touchmove', function(e) {
        e.preventDefault(); // 防止页面滚动
        if (gameState.currentItem && !gameState.isDropping && !gameState.isPaused) {
            const touch = e.touches[0];
            const coords = getCanvasCoords(touch.clientX, touch.clientY);
            const radius = getRadiusForLevel(gameState.currentItem.gameLevel);
            const clampedX = Math.max(
                CONFIG.gameLeft + radius,
                Math.min(coords.x, CONFIG.gameRight - radius)
            );
            Body.setPosition(gameState.currentItem, {
                x: clampedX,
                y: CONFIG.spawnY
            });
        }
    }, { passive: false });
    
    // 触摸结束 - 释放物品
    wrapper.addEventListener('touchend', function(e) {
        if (gameState.currentItem && !gameState.isDropping && !gameState.isPaused) {
            dropItem();
        }
    });
    
    // 阻止页面默认的触摸滚动行为
    document.body.addEventListener('touchmove', function(e) {
        if (e.target.closest('#canvas-wrapper')) {
            e.preventDefault();
        }
    }, { passive: false });
}

// ==================== 释放物品下落 ====================
function dropItem() {
    if (!gameState.currentItem || gameState.isDropping || gameState.isPaused) return;
    
    gameState.isDropping = true;
    Body.setStatic(gameState.currentItem, false);
    
    // 播放下落音效
    playSound('drop');
    
    // 用户手动下落球后，刷新时间限制
    if (gameState.isTimeLimitMode) {
        gameState.timeRemaining = gameState.timeLimit;
        gameState.lastDropTime = Date.now();
        updateTimeLimitDisplay();
    }
    
    // 立即生成下一个物品（用户可以快速点击）
    setTimeout(() => {
        if (!gameState.isGameOver && !gameState.isPaused) {
            spawnNewItem();
        }
    }, 200);  // 缩短为200ms，让玩家可以快速连续点击
}

// ==================== 更新分数显示 ====================
function updateScore(points) {
    gameState.score += points;
    document.getElementById('score').textContent = gameState.score;
}

// ==================== 更新最高Title显示 ====================
function updateHighestTitle(level) {
    if (level > gameState.highestLevel) {
        gameState.highestLevel = level;
        const title = ACADEMIC_TITLES[level - 1];
        document.getElementById('highest-title').textContent = title.name;
        
        // 解锁图鉴
        const titleEl = document.getElementById(`title-${level}`);
        if (titleEl) {
            titleEl.classList.add('unlocked');
        }
        
        // 播放解锁音效
        playSound('unlock');
    }
}

// ==================== 游戏结束 ====================
function gameOver() {
    gameState.isGameOver = true;

    // 保存最高分
    saveBestScore();

    // 播放游戏结束音效
    playSound('gameover');

    // 清理海克斯模式
    if (typeof HextechSystem !== 'undefined') {
        HextechSystem.cleanup();
    }

    // 更新排行榜
    updateLeaderboard(gameState.score);

    // 显示排行榜
    showLeaderboard();

    document.getElementById('final-title').textContent =
        ACADEMIC_TITLES[gameState.highestLevel - 1].name;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('best-score').textContent = getBestScore();
    document.getElementById('game-over').classList.remove('hidden');
}

// 触发游戏结束（供外部调用）
function triggerGameOver() {
    gameOver();
}

// ==================== 排行榜系统 ====================
function updateLeaderboard(score) {
    // 获取现有排行榜
    let leaderboard = JSON.parse(localStorage.getItem('academicGame_leaderboard') || '[]');
    
    // 添加新分数
    leaderboard.push({
        score: score,
        date: new Date().toLocaleDateString(),
        level: gameState.highestLevel
    });
    
    // 按分数排序
    leaderboard.sort((a, b) => b.score - a.score);
    
    // 只保留前10名
    leaderboard = leaderboard.slice(0, 10);
    
    // 保存
    localStorage.setItem('academicGame_leaderboard', JSON.stringify(leaderboard));
}

function showLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('academicGame_leaderboard') || '[]');
    
    // 获取游戏结束面板
    const gameOverPanel = document.getElementById('game-over');
    let leaderboardEl = document.getElementById('leaderboard-display');
    
    if (!leaderboardEl) {
        leaderboardEl = document.createElement('div');
        leaderboardEl.id = 'leaderboard-display';
        gameOverPanel.appendChild(leaderboardEl);
    }
    
    if (leaderboard.length === 0) {
        leaderboardEl.innerHTML = '';
        return;
    }
    
    leaderboardEl.innerHTML = `
        <h4 style="margin: 15px 0 10px; color: #ffd700; text-align: center;">🏆 排行榜</h4>
        <div style="background: rgba(0,0,0,0.3); border-radius: 10px; padding: 10px; max-height: 150px; overflow-y: auto;">
            ${leaderboard.map((entry, index) => `
                <div style="display: flex; justify-content: space-between; padding: 5px 10px; margin: 3px 0; background: ${entry.score === gameState.score ? 'rgba(255,215,0,0.3)' : 'transparent'}; border-radius: 5px;">
                    <span style="color: ${index < 3 ? '#ffd700' : '#aaa'};">${index + 1}. ${entry.score}分</span>
                    <span style="color: #888; font-size: 0.8rem;">Lv.${entry.level}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ==================== 重新开始 ====================
function restartGame() {
    // 清除所有物品
    items.forEach(item => {
        Composite.remove(engine.world, item);
    });
    items = [];

    // 保存当前游戏模式
    const currentMode = gameState.gameMode;
    const currentHextechBuffs = gameState.currentHextechBuffs;
    const selectedHextechBuff = gameState.selectedHextechBuff;
    const coinCount = gameState.coinCount;
    const treasureBoxProgress = gameState.treasureBoxProgress;
    const currentWeather = gameState.currentWeather;
    const currentEvent = gameState.currentEvent;
    const bossSpawned = gameState.bossSpawned;
    const dailyModifier = gameState.dailyModifier;
    const activeBuffs = gameState.activeBuffs;

    // 重置游戏状态
    gameState = {
        score: 0,
        highestLevel: 1,
        isGameOver: false,
        currentItem: null,
        nextItemLevel: 1,
        isDropping: false,
        canSpawn: true,
        comboCount: 0,
        lastMergeTime: 0,
        comboMultiplier: 1,
        totalMerges: 0,
        currentStreak: 0,
        currentReward: null,
        difficultyLevel: 1,
        timeLimit: 15000,
        timeRemaining: 15000,
        lastDropTime: 0,
        isTimeLimitMode: false,
        dailyTasks: [],
        lastDailyDate: '',
        dailyCompleted: false,
        gameMode: currentMode,  // 保持当前游戏模式
        // 海克斯特有状态
        activeBuffs: activeBuffs,
        currentHextechBuffs: currentHextechBuffs,
        selectedHextechBuff: selectedHextechBuff,
        coinCount: coinCount,
        treasureBoxProgress: treasureBoxProgress,
        currentWeather: currentWeather,
        currentEvent: currentEvent,
        bossSpawned: bossSpawned,
        dailyModifier: dailyModifier,
        obstacleCount: 0
    };

    // 重置游戏结束检查计数器
    gameOverCheckCount = 0;
    
    // 重置UI
    document.getElementById('score').textContent = '0';
    document.getElementById('highest-title').textContent = '本科生';
    document.getElementById('game-over').classList.add('hidden');
    
    // 重置图鉴
    document.querySelectorAll('.title-item').forEach(el => {
        el.classList.remove('unlocked');
    });
    document.getElementById('title-1').classList.add('unlocked');
    
    // 重新生成
    generateNextItem();
    spawnNewItem();
    
    // 显示模式指示器
    const modeIndicator = document.getElementById('mode-indicator');
    const modeBadge = document.getElementById('mode-badge');
    if (modeIndicator && modeBadge) {
        modeIndicator.classList.remove('hidden');
        if (currentMode === 'hextech') {
            modeBadge.className = 'mode-badge hextech';
            modeBadge.textContent = '⚡ 海克斯模式';
        } else {
            modeBadge.className = 'mode-badge normal';
            modeBadge.textContent = '📖 普通模式';
        }
    }
    
    // 重新初始化难度系统
    if (gameState.gameMode === 'hextech') {
        // 海克斯模式初始化
        initDifficultySystem();
    }
}

// ==================== 游戏主循环（用于自定义渲染）====================
function gameLoop() {
    if (!gameState.isPaused) {
        // 自定义渲染：在物品上绘制图标和文字
        customRender();

        // 更新粒子
        updateParticles();

        // 检查游戏结束
        checkGameOver();

        // 难度曲线系统 - 时间限制检查
        if (gameState.isTimeLimitMode && !gameState.isGameOver) {
            updateTimeLimit();
        }

        // 海克斯模式更新
        if (gameState.gameMode === 'hextech' && !gameState.isGameOver && typeof HextechSystem !== 'undefined') {
            HextechSystem.update();
        }
    }

    requestAnimationFrame(gameLoop);
}

// ==================== 自定义渲染 ====================
function customRender() {
    const ctx = render.context;
    const now = Date.now();
    
    // 清空画布
    ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    
    // 绘制背景
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    
    // 绘制水位（海克斯模式）- 在物品下方绘制，这样物品会浮在水面上
    if (gameState.gameMode === 'hextech' && typeof renderWater === 'function') {
        renderWater(ctx);
    }
    
    // 绘制红色警戒线（游戏结束线-顶部边界）
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CONFIG.gameLeft, CONFIG.gameTop + 20);
    ctx.lineTo(CONFIG.gameRight, CONFIG.gameTop + 20);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 遍历所有物品，绘制自定义内容
    items.forEach(item => {
        if (!item.gameLevel) return;
        
        const title = ACADEMIC_TITLES[item.gameLevel - 1];
        const baseRadius = getRadiusForLevel(item.gameLevel);
        
        // 计算动画缩放
        let scale = 1;
        
        // 出现动画 - 创建后0.3秒内从0放大到正常大小
        if (item.createdAt) {
            const age = now - item.createdAt;
            if (age < 300) {
                scale = age / 300;
                // 弹性效果
                scale = 1 + Math.sin(scale * Math.PI) * 0.2;
            }
        }
        
        // 合并动画 - 被合并时放大
        if (item.mergeAnimationEnd && now < item.mergeAnimationEnd) {
            const progress = (item.mergeAnimationEnd - now) / 300;
            scale = 1 + progress * 0.3;
        }
        
        const radius = baseRadius * scale;
        const x = item.position.x;
        const y = item.position.y;
        const angle = item.angle;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // 绘制圆形背景
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = title.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制边框发光效果（高等级物品发光更强）
        const glowIntensity = Math.min(item.gameLevel * 2, 20);
        ctx.shadowColor = title.color;
        ctx.shadowBlur = glowIntensity;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // 绘制图标
        ctx.font = `${radius * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title.icon, 0, -radius * 0.15);
        
        // 绘制等级文字
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${radius * 0.5}px Microsoft YaHei`;
          ctx.fillText(title.name, 0, radius * 0.35);
  
          ctx.restore();
      });
  }
  
  // ==================== 检查游戏结束 ====================

function checkGameOver() {
    if (gameState.isGameOver) return;
    
    // 等待一些物品积累后再检查
    if (items.length < 3) return;
    
    let isOverTop = false;
    
    // 检查是否有物品超过顶部边界
    for (let item of items) {
        // 跳过正在下落的物品和当前控制的物品
        if (item === gameState.currentItem || item.isStatic) continue;
        
        // 检查速度（只有静止的物品才算）
        const speed = Math.sqrt(item.velocity.x ** 2 + item.velocity.y ** 2);
        
        // 如果物品在顶部区域且几乎静止
        if (item.position.y < CONFIG.gameTop + 20 && speed < 0.5) {
            gameOverCheckCount++;
            
            // 连续检查60帧（约1秒）都满足条件才判定游戏结束
            if (gameOverCheckCount > 60) {
                isOverTop = true;
                break;
            }
        } else {
            gameOverCheckCount = 0;
        }
    }
    
    if (isOverTop) {
        gameOver();
    }
}

// ==================== 连击系统 ====================
function checkCombo() {
    const now = Date.now();
    const comboTimeWindow = 2000; // 2秒内的合并算连击
    
    if (now - gameState.lastMergeTime < comboTimeWindow) {
        gameState.comboCount++;
        gameState.currentStreak++;
        if (gameState.comboCount >= 2) {
            showComboEffect(gameState.comboCount);
            updateComboMultiplier();
            // 播放连击音效
            playSound('combo', gameState.comboCount);
            // 更新每日任务进度
            updateDailyProgress('combo', 1);
        }
    } else {
        gameState.comboCount = 1;
        gameState.currentStreak = 1;
    }
    gameState.lastMergeTime = now;
    
    // 检查连击相关成就
    checkAchievements();
}

// 更新连击倍数
function updateComboMultiplier() {
    if (gameState.comboCount >= 10) {
        gameState.comboMultiplier = 3.0;
    } else if (gameState.comboCount >= 5) {
        gameState.comboMultiplier = 2.0;
    } else if (gameState.comboCount >= 3) {
        gameState.comboMultiplier = 1.5;
    } else {
        gameState.comboMultiplier = 1.0;
    }
    
    // 更新UI显示
    updateComboDisplay();
}

// 显示连击特效
function showComboEffect(combo) {
    const wrapper = document.getElementById('canvas-wrapper');
    const comboEl = document.createElement('div');
    comboEl.className = 'combo-effect';
    
    const comboTexts = ['', '', '双连击!', '三连击!', '四连击!', '五连击!', '六连击!', '七星连珠!', '八仙过海!', '九转功成!', '十全十美!'];
    const text = comboTexts[Math.min(combo, 10)] || `${combo}连击!`;
    
    comboEl.innerHTML = `<span>${text}</span>`;
    comboEl.style.cssText = `
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.5rem;
        font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.5);
        pointer-events: none;
        z-index: 60;
        animation: comboAnimation 1s ease-out forwards;
    `;
    
    wrapper.appendChild(comboEl);
    setTimeout(() => comboEl.remove(), 1000);
}

// 更新连击倍数显示
function updateComboDisplay() {
    let comboDisplay = document.getElementById('combo-display');
    if (!comboDisplay) {
        const scoreBoard = document.getElementById('score-board');
        comboDisplay = document.createElement('div');
        comboDisplay.id = 'combo-display';
        comboDisplay.className = 'combo-display';
        comboDisplay.style.cssText = `
            font-size: 0.9rem;
            color: #e74c3c;
            font-weight: bold;
            margin-top: 5px;
        `;
        scoreBoard.appendChild(comboDisplay);
    }
    
    if (gameState.comboMultiplier > 1) {
        comboDisplay.textContent = `🔥 ${gameState.comboMultiplier}x 连击`;
        comboDisplay.style.display = 'block';
    } else {
        comboDisplay.style.display = 'none';
    }
}

// ==================== 随机奖励系统 ====================
function trySpawnReward() {
    // 只有在游戏中且没有当前奖励时尝试生成
    if (gameState.isGameOver || gameState.isPaused || gameState.currentReward) return;
    
    // 随机决定是否生成奖励
    const random = Math.random();
    const totalProbability = REWARDS.reduce((sum, r) => sum + r.probability, 0);
    
    if (random < totalProbability) {
        // 随机选择一种奖励
        let rand = Math.random() * totalProbability;
        let selectedReward = REWARDS[0];
        
        for (const reward of REWARDS) {
            rand -= reward.probability;
            if (rand <= 0) {
                selectedReward = reward;
                break;
            }
        }
        
        // 应用奖励
        applyReward(selectedReward);
    }
}

// 应用奖励效果
function applyReward(reward) {
    gameState.currentReward = reward;
    
    // 显示奖励获得提示
    showRewardEffect(reward);
    
    // 根据奖励类型应用效果
    switch (reward.type) {
        case 'double_score':
            // 下次合并分数翻倍 - 通过状态变量处理
            break;
        case 'slow_down':
            // 减速效果在物理引擎中处理
            engine.gravity.y = CONFIG.gravity * 0.5;
            break;
        case 'extra_points':
            // 直接加分
            updateScore(100);
            break;
        case 'shield':
            // 护盾效果
            break;
    }
    
    // 如果有持续时间，设置定时器移除效果
    if (reward.duration > 0) {
        setTimeout(() => {
            removeReward(reward);
        }, reward.duration);
    }
}

// 移除奖励效果
function removeReward(reward) {
    if (gameState.currentReward && gameState.currentReward.type === reward.type) {
        gameState.currentReward = null;
        
        // 恢复物理引擎重力
        if (reward.type === 'slow_down') {
            engine.gravity.y = CONFIG.gravity;
        }
    }
}

// 显示奖励获得特效
function showRewardEffect(reward) {
    const wrapper = document.getElementById('canvas-wrapper');
    const rewardEl = document.createElement('div');
    rewardEl.className = 'reward-effect';
    rewardEl.innerHTML = `
        <span class="reward-icon">${reward.icon}</span>
        <span class="reward-text">${reward.name}</span>
    `;
    
    rewardEl.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 20px;
        font-size: 1.2rem;
        font-weight: bold;
        color: #ffd700;
        pointer-events: none;
        z-index: 60;
        animation: rewardPop 1.5s ease-out forwards;
    `;
    
    wrapper.appendChild(rewardEl);
    setTimeout(() => rewardEl.remove(), 1500);
}

// ==================== 成就系统 ====================
function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
        if (!achievement.unlocked && achievement.condition(gameState)) {
            unlockAchievement(achievement);
        }
    });
}

// 解锁成就
function unlockAchievement(achievement) {
    achievement.unlocked = true;
    
    // 显示成就解锁特效
    showAchievementEffect(achievement);
    
    // 保存到 localStorage
    saveAchievements();
}

// 显示成就解锁特效
function showAchievementEffect(achievement) {
    const wrapper = document.getElementById('canvas-wrapper');
    const achievementEl = document.createElement('div');
    achievementEl.className = 'achievement-effect';
    achievementEl.innerHTML = `
        <span class="achievement-icon">${achievement.icon}</span>
        <div class="achievement-info">
            <span class="achievement-title">成就解锁!</span>
            <span class="achievement-name">${achievement.name}</span>
            <span class="achievement-desc">${achievement.desc}</span>
        </div>
    `;
    
    achievementEl.style.cssText = `
        position: absolute;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px 25px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 15px;
        box-shadow: 0 0 30px rgba(102, 126, 234, 0.8);
        pointer-events: none;
        z-index: 70;
        animation: achievementPop 2s ease-out forwards;
    `;
    
    wrapper.appendChild(achievementEl);
    setTimeout(() => achievementEl.remove(), 2000);
    
    // 播放成就解锁音效
    playSound('unlock');
}

// 保存成就到 localStorage
function saveAchievements() {
    const unlockedIds = ACHIEVEMENTS.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('academicGame_achievements', JSON.stringify(unlockedIds));
}

// 加载成就
function loadAchievements() {
    const saved = localStorage.getItem('academicGame_achievements');
    if (saved) {
        const unlockedIds = JSON.parse(saved);
        ACHIEVEMENTS.forEach(a => {
            if (unlockedIds.includes(a.id)) {
                a.unlocked = true;
            }
        });
    }
}

// ==================== 里程碑提示 ====================
let milestoneHideTimer = null;
let lastMilestoneProgress = 0;

function showMilestoneHint() {
    // 找到最近的一个未解锁成就
    const nextAchievement = ACHIEVEMENTS.find(a => !a.unlocked);
    if (!nextAchievement) return;
    
    // 计算进度
    let progress = 0;
    let target = 0;
    let current = 0;
    
    if (nextAchievement.id.includes('merge')) {
        current = gameState.totalMerges;
        target = parseInt(nextAchievement.id.split('_')[1]) || 10;
        progress = (current / target) * 100;
    } else if (nextAchievement.id.includes('level')) {
        current = gameState.highestLevel;
        target = parseInt(nextAchievement.id.split('_')[1]) || 5;
        progress = (current / target) * 100;
    } else if (nextAchievement.id.includes('score')) {
        current = gameState.score;
        target = parseInt(nextAchievement.id.split('_')[1]) || 1000;
        progress = (current / target) * 100;
    } else if (nextAchievement.id.includes('combo')) {
        current = gameState.comboCount;
        target = parseInt(nextAchievement.id.split('_')[1]) || 3;
        progress = (current / target) * 100;
    }
    
    // 只有进度变化时才显示
    const progressKey = `${nextAchievement.id}:${current}`;
    if (progressKey === lastMilestoneProgress) return;
    lastMilestoneProgress = progressKey;
    
    // 显示里程碑提示
    const wrapper = document.getElementById('canvas-wrapper');
    let milestoneEl = document.getElementById('milestone-hint');
    
    if (!milestoneEl) {
        milestoneEl = document.createElement('div');
        milestoneEl.id = 'milestone-hint';
        milestoneEl.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 15px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            font-size: 0.75rem;
            color: #fff;
            text-align: center;
            pointer-events: none;
            z-index: 50;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        wrapper.appendChild(milestoneEl);
    }
    
    milestoneEl.innerHTML = `
        <div>${nextAchievement.icon} ${nextAchievement.name}</div>
        <div style="margin-top: 5px; width: 100px; height: 6px; background: #333; border-radius: 3px; overflow: hidden;">
            <div style="width: ${Math.min(progress, 100)}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2);"></div>
        </div>
        <div style="margin-top: 3px; font-size: 0.7rem; color: #aaa;">${current}/${target}</div>
    `;
    
    // 显示并3秒后隐藏
    milestoneEl.style.opacity = '1';
    
    if (milestoneHideTimer) clearTimeout(milestoneHideTimer);
    milestoneHideTimer = setTimeout(() => {
        milestoneEl.style.opacity = '0';
    }, 3000);
}

// ==================== 难度曲线系统 ====================
function initDifficultySystem() {
    gameState.difficultyLevel = 1;
    gameState.timeLimit = DIFFICULTY_LEVELS[0].timeLimit;
    gameState.timeRemaining = gameState.timeLimit;
    gameState.lastDropTime = Date.now();
    gameState.isTimeLimitMode = true;
    
    // 创建时间限制显示
    createTimeLimitDisplay();
    
    // 启用时间限制模式
    startTimeLimitMode();
}

// 创建时间限制显示
function createTimeLimitDisplay() {
    const statusTips = document.getElementById('status-tips');
    let timeDisplay = document.getElementById('time-limit-display');
    
    if (!timeDisplay) {
        timeDisplay = document.createElement('div');
        timeDisplay.id = 'time-limit-display';
        timeDisplay.className = 'status-badge';
        timeDisplay.style.cssText = `
            padding: 5px 15px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: bold;
            color: #fff;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        `;
        statusTips.appendChild(timeDisplay);
    }
}

// 启动时间限制模式
function startTimeLimitMode() {
    gameState.isTimeLimitMode = true;
    gameState.lastDropTime = Date.now();
    updateTimeLimitDisplay();
}

// 更新剩余时间
function updateTimeLimit() {
    if (!gameState.isTimeLimitMode || gameState.isPaused || gameState.isGameOver) return;
    
    const now = Date.now();
    const deltaTime = now - gameState.lastDropTime;
    
    // 更新难度等级
    updateDifficultyLevel();
    
    // 更新剩余时间
    gameState.timeRemaining -= deltaTime;
    gameState.lastDropTime = now;
    
    // 更新显示
    updateTimeLimitDisplay();
    
    // 检查时间是否用完
    if (gameState.timeRemaining <= 0) {
        // 时间到，自动下落当前物品
        autoDropItem();
        // 重置时间
        gameState.timeRemaining = gameState.timeLimit;
    }
}

// 更新难度等级
function updateDifficultyLevel() {
    for (let i = DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
        if (gameState.score >= DIFFICULTY_LEVELS[i].minScore) {
            if (gameState.difficultyLevel !== DIFFICULTY_LEVELS[i].level) {
                gameState.difficultyLevel = DIFFICULTY_LEVELS[i].level;
                gameState.timeLimit = DIFFICULTY_LEVELS[i].timeLimit;
                showDifficultyChange();
            }
            break;
        }
    }
}

// 显示难度变化提示
function showDifficultyChange() {
    const diff = DIFFICULTY_LEVELS.find(d => d.level === gameState.difficultyLevel);
    if (!diff) return;
    
    const wrapper = document.getElementById('canvas-wrapper');
    const diffEl = document.createElement('div');
    diffEl.className = 'difficulty-change';
    diffEl.innerHTML = `
        <span>⚡ 难度升级: ${diff.name}</span>
        <span style="font-size: 0.8rem; color: #ffd700;">时间: ${diff.timeLimit/1000}秒</span>
    `;
    
    diffEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 15px 30px;
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border-radius: 15px;
        text-align: center;
        color: white;
        font-weight: bold;
        z-index: 60;
        animation: difficultyPop 1.5s ease-out forwards;
    `;
    
    wrapper.appendChild(diffEl);
    setTimeout(() => diffEl.remove(), 1500);
    
    // 播放难度提升音效
    playSound('unlock');
}

// 更新剩余时间显示
function updateTimeLimitDisplay() {
    const timeDisplay = document.getElementById('time-limit-display');
    if (!timeDisplay) return;
    
    const seconds = Math.ceil(gameState.timeRemaining / 1000);
    const diff = DIFFICULTY_LEVELS.find(d => d.level === gameState.difficultyLevel);
    
    // 颜色变化 - 时间紧迫时变红
    let color = '#fff';
    if (seconds <= 3) {
        color = '#e74c3c';
    } else if (seconds <= 5) {
        color = '#f39c12';
    }
    
    timeDisplay.innerHTML = `
        <span>⏱️</span>
        <span style="color: ${color};">${seconds}秒</span>
        <span style="font-size: 0.7rem; color: #aaa;">| ${diff.name}</span>
    `;
    
    // 时间紧迫时添加警告动画
    if (seconds <= 3) {
        timeDisplay.style.animation = 'timeWarning 0.5s infinite';
    } else {
        timeDisplay.style.animation = 'none';
    }
}

// 自动下落物品
function autoDropItem() {
    if (gameState.currentItem && !gameState.isDropping) {
        dropItem();
    }
}

// ==================== 每日任务系统 ====================
function initDailyTasks() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('academicGame_lastDate');
    
    if (lastDate !== today) {
        // 新的一天，重置任务
        gameState.lastDailyDate = today;
        gameState.dailyCompleted = false;
        generateDailyTasks();
        localStorage.setItem('academicGame_lastDate', today);
        localStorage.setItem('academicGame_dailyTasks', JSON.stringify(gameState.dailyTasks));
        
        // 显示每日任务
        showDailyTasks();
    } else {
        // 读取保存的任务
        const saved = localStorage.getItem('academicGame_dailyTasks');
        if (saved) {
            gameState.dailyTasks = JSON.parse(saved);
        } else {
            generateDailyTasks();
        }
        
        // 启动时间限制模式
        initDifficultySystem();
    }
}

// 生成每日任务
function generateDailyTasks() {
    // 随机选择3个任务
    const shuffled = [...DAILY_TASKS].sort(() => Math.random() - 0.5);
    gameState.dailyTasks = shuffled.slice(0, 3).map(task => ({
        ...task,
        progress: 0,
        completed: false
    }));
}

// 显示每日任务面板
function showDailyTasks() {
    // 创建任务面板
    const container = document.getElementById('game-container');
    let taskPanel = document.getElementById('daily-task-panel');
    
    if (!taskPanel) {
        taskPanel = document.createElement('div');
        taskPanel.id = 'daily-task-panel';
        taskPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 15px;
            z-index: 200;
            min-width: 280px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '开始游戏';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-top: 15px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
        `;
        closeBtn.onclick = () => {
            taskPanel.style.display = 'none';
            initDifficultySystem();
        };
        
        taskPanel.appendChild(closeBtn);
        container.appendChild(taskPanel);
    }
    
    taskPanel.innerHTML = `
        <h3 style="margin-bottom: 15px; text-align: center; color: #333;">🎯 今日任务</h3>
        ${gameState.dailyTasks.map(task => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; margin: 8px 0; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">${task.icon}</span>
                    <div>
                        <div style="font-weight: bold; color: #333;">${task.name}</div>
                        <div style="font-size: 0.75rem; color: #666;">奖励: ${task.reward}分</div>
                    </div>
                </div>
                <div style="font-size: 0.8rem; color: #888;">0/${task.target}</div>
            </div>
        `).join('')}
        <button id="start-game-btn" style="width: 100%; padding: 12px; margin-top: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">开始游戏</button>
    `;
    
    document.getElementById('start-game-btn').onclick = () => {
        taskPanel.style.display = 'none';
        initDifficultySystem();
    };
    
    taskPanel.style.display = 'block';
}

// 更新每日任务进度
function updateDailyProgress(type, amount) {
    gameState.dailyTasks.forEach(task => {
        if (task.type === type && !task.completed) {
            task.progress += amount;
            if (task.progress >= task.target) {
                task.completed = true;
                // 发放奖励
                updateScore(task.reward);
                showTaskComplete(task);
            }
            // 保存进度
            localStorage.setItem('academicGame_dailyTasks', JSON.stringify(gameState.dailyTasks));
        }
    });
}

// 显示任务完成提示
function showTaskComplete(task) {
    const wrapper = document.getElementById('canvas-wrapper');
    const completeEl = document.createElement('div');
    completeEl.innerHTML = `
        <span>${task.icon}</span>
        <span>任务完成! +${task.reward}分</span>
    `;
    
    completeEl.style.cssText = `
        position: absolute;
        top: 60%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        background: rgba(39, 174, 96, 0.9);
        border-radius: 20px;
        color: white;
        font-weight: bold;
        z-index: 60;
        animation: taskComplete 1.5s ease-out forwards;
    `;
    
    wrapper.appendChild(completeEl);
    setTimeout(() => completeEl.remove(), 1500);
}

// ==================== 粒子系统 ====================
let particles = [];

function createParticle(x, y, color) {
    const wrapper = document.getElementById('canvas-wrapper');
    const rect = wrapper.getBoundingClientRect();
    const scale = CONFIG.canvasWidth / rect.width;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = 50 + Math.random() * 100;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    particle.style.cssText = `
        position: absolute;
        left: ${x / scale}px;
        top: ${y / scale}px;
        width: 8px;
        height: 8px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 40;
    `;
    
    wrapper.appendChild(particle);
    
    particles.push({
        element: particle,
        x: x / scale,
        y: y / scale,
        vx: vx,
        vy: vy,
        life: 1
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy += 200 * 0.016; // 重力
        p.life -= 0.02;
        
        if (p.life <= 0) {
            p.element.remove();
            particles.splice(i, 1);
        } else {
            p.element.style.left = p.x + 'px';
            p.element.style.top = p.y + 'px';
            p.element.style.opacity = p.life;
            p.element.style.transform = `scale(${p.life})`;
        }
    }
}

function createMergeParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        createParticle(x, y, color);
    }
}

// ==================== 暂停功能 ====================
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseBtn = document.getElementById('pause-btn');
    
    if (gameState.isPaused) {
        // 暂停游戏
        Runner.stop(runner);
        pauseOverlay.classList.remove('hidden');
        pauseBtn.textContent = '▶️';
    } else {
        // 继续游戏
        Runner.run(runner, engine);
        pauseOverlay.classList.add('hidden');
        pauseBtn.textContent = '⏸️';
    }
}

// ==================== 页面加载完成后初始化 ====================
window.onload = function() {
    console.log('🎮 页面加载完成，初始化按钮事件...');
    
    // 绑定模式选择按钮
    const normalModeBtn = document.getElementById('normal-mode-btn');
    const hextechModeBtn = document.getElementById('hextech-mode-btn');
    
    console.log('普通模式按钮:', normalModeBtn);
    console.log('海克斯模式按钮:', hextechModeBtn);
    
    if (normalModeBtn && hextechModeBtn) {
        console.log('✅ 找到按钮，绑定点击事件...');
        
        // 普通模式按钮点击
        normalModeBtn.addEventListener('click', function() {
            console.log('🖱️ 点击了普通模式按钮');
            startGame('normal');
        });
        
        // 海克斯模式按钮点击
        hextechModeBtn.addEventListener('click', function() {
            console.log('🖱️ 点击了海克斯模式按钮');
            startGame('hextech');
        });
        
        console.log('✅ 事件绑定完成');
    } else {
        console.error('❌ 未找到模式选择按钮！');
    }
    
    // 绑定重新开始按钮
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    // 绑定暂停界面的重新开始按钮
    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    if (pauseRestartBtn) {
        pauseRestartBtn.addEventListener('click', function() {
            togglePause(); // 先解除暂停
            restartGame();
        });
    }
    
    // 绑定静音按钮
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', function() {
        const muted = toggleMute();
        muteBtn.textContent = muted ? '🔇' : '🔊';
        muteBtn.classList.toggle('muted', muted);
    });
    
    // 绑定暂停按钮
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
    
    // 绑定继续按钮（暂停界面）
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', togglePause);
    }
    
    // 绑定快捷重开按钮
    const quickRestartBtn = document.getElementById('quick-restart-btn');
    if (quickRestartBtn) {
        quickRestartBtn.addEventListener('click', function() {
            if (!gameState.isGameOver && !gameState.isPaused) {
                // 确认是否要重来
                if (confirm('确定要重新开始吗？')) {
                    restartGame();
                }
            }
        });
    }
    
    console.log('🚀 游戏已就绪！');
};

// ==================== 开始游戏 ====================
function startGame(mode) {
    try {
        console.log('🎮 开始游戏，模式:', mode);
        
        // 设置游戏模式
        gameState.gameMode = mode;
        console.log('✅ 1. 游戏模式已设置');

        // 隐藏启动画面
        const startScreen = document.getElementById('start-screen');
        console.log('📺 start-screen 元素:', startScreen);
        if (startScreen) {
            startScreen.style.opacity = '0';
            setTimeout(() => {
                startScreen.style.display = 'none';
            }, 300);
            console.log('✅ 2. 启动画面已隐藏');
        }

        // 显示模式指示器
        const modeIndicator = document.getElementById('mode-indicator');
        const modeBadge = document.getElementById('mode-badge');
        console.log('🎯 mode-indicator:', modeIndicator, 'mode-badge:', modeBadge);
        if (modeIndicator && modeBadge) {
            modeIndicator.classList.remove('hidden');
            if (mode === 'hextech') {
                modeBadge.className = 'mode-badge hextech';
                modeBadge.textContent = '⚡ 海克斯模式';
            } else {
                modeBadge.className = 'mode-badge normal';
                modeBadge.textContent = '📖 普通模式';
            }
            console.log('✅ 3. 模式指示器已显示');
        }

        // 初始化游戏
        console.log('🔄 准备调用 initGame()...');
        initGame();
        console.log('✅ 4. 游戏初始化完成');

        // 根据模式显示不同的提示 (要在 gameLoop 之前调用)
        if (mode === 'hextech' && typeof HextechSystem !== 'undefined') {
            HextechSystem.init();
            HextechSystem.showIntro();
        }

        // 启动游戏循环
        console.log('🔁 准备调用 gameLoop()...');
        gameLoop();
        console.log('✅ 5. 游戏循环已启动');
        
        console.log('✅ 游戏启动完成');
    } catch (error) {
        console.error('❌ 启动游戏时出错:', error);
        console.error('错误堆栈:', error.stack);
        alert('启动游戏时出错: ' + error.message);
    }
}

// ==================== 海克斯模式介绍 ====================
function showHextechModeIntro() {
    const wrapper = document.getElementById('canvas-wrapper');
    const introEl = document.createElement('div');
    introEl.className = 'hextech-intro';
    introEl.innerHTML = `
        <span class="hextech-icon">⚡</span>
        <span class="hextech-text">海克斯模式已激活!</span>
    `;
    
    introEl.style.cssText = `
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 20px 30px;
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(22, 33, 62, 0.98));
        border: 2px solid #e94560;
        border-radius: 20px;
        z-index: 60;
        animation: hextechIntro 3s ease-out forwards;
    `;
    
    // 确保文字颜色正确
    const textEl = introEl.querySelector('.hextech-text');
    if (textEl) {
        textEl.style.color = '#ffffff';
        textEl.style.textShadow = '0 0 10px rgba(233, 69, 96, 0.8), 0 0 20px rgba(233, 69, 96, 0.5)';
    }
    
    wrapper.appendChild(introEl);
    setTimeout(() => introEl.remove(), 3000);

    // 初始化海克斯模式
    initHextechMode();
}

// ==================== 初始化海克斯模式 ====================
function initHextechMode() {
    if (gameState.gameMode !== 'hextech') return;

    // 初始化海克斯特有状态
    gameState.activeBuffs = [];
    gameState.currentHextechBuffs = [];
    gameState.selectedHextechBuff = null;
    gameState.coinCount = 0;
    gameState.treasureBoxProgress = 0;
    gameState.currentWeather = 'normal';
    gameState.currentEvent = null;
    gameState.bossSpawned = false;

    // 应用每日特殊规则
    applyDailyModifier();

    // 生成随机Buff选择（3选1）
    generateRandomBuffs();

    // 开始天气循环
    startWeatherCycle();

    // 开始随机事件循环
    startRandomEventCycle();

    // 更新UI显示
    updateHextechUI();
}

// ==================== 生成随机Buff选择（3选1）====================
function generateRandomBuffs() {
    // 从Buff池中随机选择3个不同的Buff
    const shuffled = [...HEXTECH_BUFFS].sort(() => Math.random() - 0.5);
    gameState.currentHextechBuffs = shuffled.slice(0, 3);

    // 显示Buff选择界面
    showBuffSelection();
}

// ==================== 显示Buff选择界面 ====================
function showBuffSelection() {
    const container = document.getElementById('game-container');
    let buffPanel = document.getElementById('buff-selection-panel');

    if (!buffPanel) {
        buffPanel = document.createElement('div');
        buffPanel.id = 'buff-selection-panel';
        container.appendChild(buffPanel);
    }

    // 稀有度颜色
    const rarityColors = {
        common: '#95a5a6',
        uncommon: '#2ecc71',
        rare: '#3498db',
        epic: '#9b59b6',
        legendary: '#f39c12'
    };

    buffPanel.innerHTML = `
        <div class="buff-selection-overlay">
            <div class="buff-selection-content">
                <h2>⚡ 选择你的海克斯强化!</h2>
                <p class="buff-hint">从以下3个Buff中选择一个</p>
                <div class="buff-options">
                    ${gameState.currentHextechBuffs.map((buff, index) => `
                        <div class="buff-option" data-buff-id="${buff.id}" style="border-color: ${rarityColors[buff.rarity]}">
                            <div class="buff-icon">${buff.icon}</div>
                            <div class="buff-name">${buff.name}</div>
                            <div class="buff-desc">${buff.desc}</div>
                            <div class="buff-rarity" style="color: ${rarityColors[buff.rarity]}">${buff.rarity}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // 绑定点击事件
    document.querySelectorAll('.buff-option').forEach(option => {
        option.addEventListener('click', function() {
            const buffId = this.dataset.buffId;
            selectBuff(buffId);
        });
    });

    // 显示面板
    buffPanel.style.display = 'flex';
}

// ==================== 选择Buff ====================
function selectBuff(buffId) {
    const buff = HEXTECH_BUFFS.find(b => b.id === buffId);
    if (!buff) return;

    gameState.selectedHextechBuff = buff;

    // 应用Buff效果
    applyHextechBuff(buff);

    // 隐藏选择界面
    const buffPanel = document.getElementById('buff-selection-panel');
    if (buffPanel) {
        buffPanel.style.display = 'none';
    }

    // 显示获得Buff提示
    showBuffObtained(buff);

    // 保存已选择的Buff组合用于成就
    saveHextechCombo(buffId);
}

// ==================== 应用Buff效果 ====================
function applyHextechBuff(buff) {
    gameState.activeBuffs.push({
        ...buff,
        activatedAt: Date.now(),
        remainingStacks: buff.stack || 0
    });

    // 根据Buff类型应用不同效果
    switch (buff.id) {
        case 'time_slow':
            // 减少重力，让物品下落更慢
            engine.gravity.y = CONFIG.gravity * 0.5;
            break;
        case 'merge_speed':
            // 增加物品下落速度（通过减少空气阻力）
            items.forEach(item => {
                item.frictionAir = 0.005;
            });
            break;
        case 'gravity_reverse':
            // 暂时反转重力（在随机事件中处理）
            break;
        case 'time_freeze':
            // 时间暂停效果（稍后处理）
            break;
    }
}

// ==================== 显示获得Buff提示 ====================
function showBuffObtained(buff) {
    const wrapper = document.getElementById('canvas-wrapper');
    const obtainedEl = document.createElement('div');
    obtainedEl.className = 'buff-obtained';
    obtainedEl.innerHTML = `
        <div class="buff-icon-large">${buff.icon}</div>
        <div class="buff-info">
            <span class="buff-title">获得增益!</span>
            <span class="buff-name">${buff.name}</span>
            <span class="buff-desc">${buff.desc}</span>
        </div>
    `;

    obtainedEl.style.cssText = `
        position: absolute;
        top: 25%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px 25px;
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
        border: 2px solid #e94560;
        border-radius: 15px;
        z-index: 70;
        animation: buffObtained 2s ease-out forwards;
    `;

    wrapper.appendChild(obtainedEl);
    setTimeout(() => obtainedEl.remove(), 2000);
}

// ==================== 更新活跃Buff状态 ====================
function updateHextechBuffs() {
    if (gameState.gameMode !== 'hextech') return;

    const now = Date.now();

    // 检查有持续时间的Buff
    gameState.activeBuffs = gameState.activeBuffs.filter(buff => {
        if (buff.duration > 0) {
            const elapsed = now - buff.activatedAt;
            if (elapsed >= buff.duration) {
                // Buff时间到，恢复正常
                removeBuffEffect(buff);
                return false;
            }
        }
        return true;
    });

    // 更新Buff显示
    updateBuffDisplay();
}

// ==================== 移除Buff效果 ====================
function removeBuffEffect(buff) {
    switch (buff.id) {
        case 'time_slow':
            engine.gravity.y = CONFIG.gravity;
            break;
        case 'merge_speed':
            items.forEach(item => {
                item.frictionAir = 0.01;
            });
            break;
        case 'gravity_reverse':
            engine.gravity.y = Math.abs(engine.gravity.y);
            break;
    }
}

// ==================== 更新Buff显示 ====================
function updateBuffDisplay() {
    let buffContainer = document.getElementById('active-buffs');
    if (!buffContainer) {
        const scoreBoard = document.getElementById('score-board');
        buffContainer = document.createElement('div');
        buffContainer.id = 'active-buffs';
        buffContainer.style.cssText = `
            display: flex;
            gap: 5px;
            margin-top: 5px;
            flex-wrap: wrap;
            justify-content: center;
        `;
        scoreBoard.appendChild(buffContainer);
    }

    buffContainer.innerHTML = gameState.activeBuffs.map(buff => `
        <span class="active-buff" title="${buff.name}: ${buff.desc}">${buff.icon}</span>
    `).join('');
}

// ==================== 海克斯UI更新 ====================
function updateHextechUI() {
    if (gameState.gameMode !== 'hextech') return;

    // 添加金币显示
    let coinDisplay = document.getElementById('coin-display');
    if (!coinDisplay) {
        const scoreBoard = document.getElementById('score-board');
        coinDisplay = document.createElement('div');
        coinDisplay.id = 'coin-display';
        coinDisplay.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9rem;
            color: #f39c12;
            margin-left: 10px;
        `;
        scoreBoard.appendChild(coinDisplay);
    }
    coinDisplay.innerHTML = `<span>🪙</span><span>${gameState.coinCount}</span>`;

    // 添加天气显示
    let weatherDisplay = document.getElementById('weather-display');
    if (!weatherDisplay) {
        const wrapper = document.getElementById('canvas-wrapper');
        weatherDisplay = document.createElement('div');
        weatherDisplay.id = 'weather-display';
        weatherDisplay.style.cssText = `
            position: absolute;
            top: 50px;
            right: 10px;
            padding: 5px 10px;
            background: rgba(0,0,0,0.5);
            border-radius: 10px;
            font-size: 1.2rem;
            z-index: 40;
        `;
        wrapper.appendChild(weatherDisplay);
    }

    const weather = WEATHER_TYPES.find(w => w.id === gameState.currentWeather);
    if (weather) {
        weatherDisplay.innerHTML = weather.icon;
        weatherDisplay.title = weather.name + ': ' + weather.desc;
    }
}

// ==================== 天气系统循环 ====================
let gameWeatherInterval = null;

function startWeatherCycle() {
    if (gameWeatherInterval) clearInterval(gameWeatherInterval);

    // 每60秒切换天气
    gameWeatherInterval = setInterval(() => {
        if (gameState.isGameOver || gameState.isPaused) return;
        changeWeather();
    }, 60000);
}

function changeWeather() {
    const weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
    gameState.currentWeather = weather.id;

    // 应用天气效果
    applyWeatherEffect(weather);

    // 显示天气变化提示
    showWeatherChange(weather);

    // 更新UI
    updateHextechUI();
}

function applyWeatherEffect(weather) {
    // 恢复默认重力
    engine.gravity.y = CONFIG.gravity;

    if (weather.gravity) {
        engine.gravity.y = CONFIG.gravity * weather.gravity;
    }
}

function showWeatherChange(weather) {
    const wrapper = document.getElementById('canvas-wrapper');
    const weatherEl = document.createElement('div');
    weatherEl.className = 'weather-change';
    weatherEl.innerHTML = `
        <span class="weather-icon">${weather.icon}</span>
        <span class="weather-name">${weather.name}</span>
        <span class="weather-desc">${weather.desc}</span>
    `;

    weatherEl.style.cssText = `
        position: absolute;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 15px 25px;
        background: rgba(0,0,0,0.8);
        border-radius: 15px;
        z-index: 60;
        animation: weatherChange 3s ease-out forwards;
    `;

    wrapper.appendChild(weatherEl);
    setTimeout(() => weatherEl.remove(), 3000);
}

// ==================== 随机事件系统 ====================
let gameEventInterval = null;

function startRandomEventCycle() {
    if (gameEventInterval) clearInterval(gameEventInterval);

    // 每30-60秒随机触发事件
    const randomInterval = () => {
        const delay = 30000 + Math.random() * 30000;
        return setTimeout(() => {
            if (!gameState.isGameOver && !gameState.isPaused && gameState.gameMode === 'hextech') {
                triggerRandomEvent();
            }
            randomInterval();
        }, delay);
    };
    randomInterval();
}

function triggerRandomEvent() {
    // 20%概率触发事件
    if (Math.random() > 0.2) return;

    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    gameState.currentEvent = event;

    // 应用事件效果
    applyEventEffect(event);

    // 显示事件提示
    showRandomEvent(event);

    // 事件结束后清理
    setTimeout(() => {
        removeEventEffect(event);
        gameState.currentEvent = null;
    }, event.duration);
}

function applyEventEffect(event) {
    switch (event.id) {
        case 'size_up':
            items.forEach(item => {
                const currentRadius = item.circleRadius;
                Matter.Body.scale(item, 1.5, 1.5);
            });
            break;
        case 'size_down':
            items.forEach(item => {
                Matter.Body.scale(item, 0.5, 0.5);
            });
            break;
        case 'gravity_reverse':
            engine.gravity.y = -Math.abs(engine.gravity.y);
            break;
        case 'speed_demon':
            items.forEach(item => {
                item.frictionAir = 0.001;
            });
            break;
        case 'combo_fever':
            gameState.comboMultiplier *= 2;
            break;
    }
}

function removeEventEffect(event) {
    switch (event.id) {
        case 'size_up':
        case 'size_down':
            // 恢复物品大小需要重新创建，这里简化处理
            break;
        case 'gravity_reverse':
            engine.gravity.y = Math.abs(engine.gravity.y);
            break;
        case 'speed_demon':
            items.forEach(item => {
                item.frictionAir = 0.01;
            });
            break;
        case 'combo_fever':
            gameState.comboMultiplier /= 2;
            break;
    }
}

function showRandomEvent(event) {
    const wrapper = document.getElementById('canvas-wrapper');
    const eventEl = document.createElement('div');
    eventEl.className = 'random-event';
    eventEl.innerHTML = `
        <div class="event-icon">${event.icon}</div>
        <div class="event-info">
            <span class="event-name">${event.name}</span>
            <span class="event-desc">${event.desc}</span>
        </div>
    `;

    eventEl.style.cssText = `
        position: absolute;
        top: 15%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px 25px;
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border-radius: 15px;
        z-index: 70;
        animation: randomEvent 3s ease-out forwards;
    `;

    wrapper.appendChild(eventEl);
    setTimeout(() => eventEl.remove(), 3000);
}

// ==================== 掉落系统 ====================
// 12.2 掉落型随机奖励 - 消球随机掉落
function trySpawnDropItem(x, y) {
    if (gameState.gameMode !== 'hextech') return;

    // 检查是否有金币风暴Buff
    const hasGoldRush = gameState.activeBuffs.some(b => b.id === 'gold_rush' && b.remainingStacks > 0);
    const dropChance = hasGoldRush ? 0.8 : 0.3;

    if (Math.random() > dropChance) return;

    // 随机选择掉落物品
    const rand = Math.random();
    let accumulated = 0;
    let selectedDrop = DROP_ITEMS[0];

    for (const drop of DROP_ITEMS) {
        accumulated += drop.probability;
        if (rand <= accumulated) {
            selectedDrop = drop;
            break;
        }
    }

    spawnDropItem(x, y, selectedDrop);
}

function spawnDropItem(x, y, dropType) {
    const wrapper = document.getElementById('canvas-wrapper');
    const rect = wrapper.getBoundingClientRect();
    const scale = CONFIG.canvasWidth / rect.width;

    const dropEl = document.createElement('div');
    dropEl.className = 'drop-item';
    dropEl.innerHTML = dropType.icon;
    dropEl.style.cssText = `
        position: absolute;
        left: ${x / scale}px;
        top: ${y / scale}px;
        font-size: 1.5rem;
        pointer-events: none;
        z-index: 45;
        animation: dropItemFall 2s ease-out forwards;
    `;

    // 点击收集
    dropEl.addEventListener('click', function() {
        collectDropItem(dropType);
        dropEl.remove();
    });

    wrapper.appendChild(dropEl);

    // 2秒后自动消失
    setTimeout(() => {
        if (dropEl.parentNode) dropEl.remove();
    }, 2000);
}

function collectDropItem(dropType) {
    switch (dropType.type) {
        case 'coin':
            gameState.coinCount += dropType.value;
            updateScore(dropType.value);
            showCollectEffect(dropType.icon, `+${dropType.value}金币`);
            break;
        case 'gem':
            gameState.coinCount += dropType.value;
            updateScore(dropType.value * 5);
            showCollectEffect(dropType.icon, `+${dropType.value}宝石`);
            break;
        case 'chest':
            gameState.treasureBoxProgress += 100;
            checkTreasureBox();
            showCollectEffect(dropType.icon, '宝箱进度+100');
            break;
        case 'mystery':
            openMysteryGift();
            break;
    }

    updateHextechUI();
}

function showCollectEffect(icon, text) {
    const wrapper = document.getElementById('canvas-wrapper');
    const collectEl = document.createElement('div');
    collectEl.className = 'collect-effect';
    collectEl.innerHTML = `
        <span>${icon}</span>
        <span>${text}</span>
    `;

    collectEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        background: rgba(0,0,0,0.8);
        border-radius: 15px;
        color: #ffd700;
        font-weight: bold;
        z-index: 60;
        animation: collectEffect 1s ease-out forwards;
    `;

    wrapper.appendChild(collectEl);
    setTimeout(() => collectEl.remove(), 1000);
}

// ==================== 宝箱系统 ====================
// 12.2 开宝箱机制 - 累计一定分数后开启宝箱
function checkTreasureBox() {
    if (gameState.treasureBoxProgress >= 500) {
        showTreasureBox();
        gameState.treasureBoxProgress = 0;
    }
}

function showTreasureBox() {
    const wrapper = document.getElementById('canvas-wrapper');
    const chestEl = document.createElement('div');
    chestEl.className = 'treasure-box';

    // 随机奖励
    const rewards = [
        { type: 'score', value: 200, icon: '📝', name: '200分' },
        { type: 'score', value: 500, icon: '📚', name: '500分' },
        { type: 'buff', icon: '✨', name: '随机Buff' },
        { type: 'coin', value: 50, icon: '🪙', name: '50金币' }
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    chestEl.innerHTML = `
        <div class="chest-icon">📦</div>
        <div class="chest-reward">${reward.icon} ${reward.name}</div>
    `;

    chestEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 20px 30px;
        background: linear-gradient(135deg, #f39c12, #e67e22);
        border-radius: 15px;
        z-index: 80;
        animation: treasureBox 2s ease-out forwards;
    `;

    // 应用奖励
    setTimeout(() => {
        if (reward.type === 'score') {
            updateScore(reward.value);
        } else if (reward.type === 'coin') {
            gameState.coinCount += reward.value;
            updateScore(reward.value);
        } else if (reward.type === 'buff') {
            const randomBuff = HEXTECH_BUFFS[Math.floor(Math.random() * HEXTECH_BUFFS.length)];
            applyHextechBuff(randomBuff);
        }
    }, 1500);

    wrapper.appendChild(chestEl);
    setTimeout(() => chestEl.remove(), 2000);
}

// ==================== 神秘礼包 ====================
// 12.2 神秘礼包 - 随机时间出现的神秘礼包
function openMysteryGift() {
    const wrapper = document.getElementById('canvas-wrapper');
    const giftEl = document.createElement('div');
    giftEl.className = 'mystery-gift';

    // 随机效果
    const effects = [
        { name: '超级分数', value: 300, icon: '💯' },
        { name: '连击翻倍', icon: '🔥', effect: 'combo' },
        { name: '时间延长', icon: '⏰', effect: 'time' },
        { name: '全屏清除', icon: '💥', effect: 'clear' }
    ];
    const effect = effects[Math.floor(Math.random() * effects.length)];

    giftEl.innerHTML = `
        <div class="gift-icon">🎁</div>
        <div class="gift-effect">${effect.icon} ${effect.name}</div>
    `;

    giftEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 20px 30px;
        background: linear-gradient(135deg, #9b59b6, #8e44ad);
        border-radius: 15px;
        z-index: 80;
        animation: mysteryGift 2s ease-out forwards;
    `;

    // 应用效果
    setTimeout(() => {
        switch (effect.effect) {
            case 'combo':
                gameState.comboMultiplier *= 2;
                break;
            case 'time':
                gameState.timeRemaining += 5000;
                break;
            case 'clear':
                // 移除一半物品
                const toRemove = Math.floor(items.length / 2);
                for (let i = 0; i < toRemove; i++) {
                    Composite.remove(engine.world, items[i]);
                }
                items = items.slice(toRemove);
                break;
            default:
                if (effect.value) {
                    updateScore(effect.value);
                }
        }
    }, 1500);

    wrapper.appendChild(giftEl);
    setTimeout(() => giftEl.remove(), 2000);
}

// ==================== 每日特殊规则 ====================
// 12.4 随机难度修饰符
function applyDailyModifier() {
    // 使用日期作为随机种子，确保每天固定
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const modifierIndex = seed % DAILY_MODIFIERS.length;
    const modifier = DAILY_MODIFIERS[modifierIndex];

    gameState.dailyModifier = modifier;

    // 应用修饰符效果
    modifier.apply(gameState);

    // 显示每日规则
    showDailyModifier(modifier);
}

function showDailyModifier(modifier) {
    const wrapper = document.getElementById('canvas-wrapper');
    const modEl = document.createElement('div');
    modEl.className = 'daily-modifier';
    modEl.innerHTML = `
        <span class="mod-icon">${modifier.icon}</span>
        <span class="mod-name">${modifier.name}</span>
        <span class="mod-desc">${modifier.desc}</span>
    `;

    modEl.style.cssText = `
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 15px;
        background: rgba(0,0,0,0.7);
        border-radius: 20px;
        font-size: 0.8rem;
        z-index: 50;
    `;

    wrapper.appendChild(modEl);
}

// ==================== Boss系统 ====================
// 12.3 Boss出现 - 随机出现大球，吞噬后获得巨额分数
function trySpawnBoss() {
    if (gameState.gameMode !== 'hextech') return;
    if (gameState.bossSpawned) return;
    if (gameState.score < 500) return; // 需要500分才能触发

    // 5%概率触发
    if (Math.random() > 0.05) return;

    spawnBoss();
}

function spawnBoss() {
    gameState.bossSpawned = true;

    const title = ACADEMIC_TITLES[10]; // 诺贝尔奖
    const radius = getRadiusForLevel(11) * 1.5;

    const boss = Bodies.circle(
        CONFIG.canvasWidth / 2,
        CONFIG.spawnY,
        radius,
        {
            restitution: CONFIG.restitution,
            friction: CONFIG.friction,
            frictionAir: 0.01,
            label: 'boss',
            render: {
                fillStyle: '#ffd700',
                strokeStyle: '#ff0000',
                lineWidth: 5
            }
        }
    );

    boss.gameLevel = 11;
    boss.gameTitle = title.name;
    boss.gameIcon = title.icon;
    boss.isBoss = true;

    Body.setStatic(boss, true);

    items.push(boss);
    Composite.add(engine.world, boss);

    // 显示Boss提示
    showBossWarning();
}

function showBossWarning() {
    const wrapper = document.getElementById('canvas-wrapper');
    const warningEl = document.createElement('div');
    warningEl.className = 'boss-warning';
    warningEl.innerHTML = `
        <span>👹 Boss来袭!</span>
        <span style="font-size: 0.8rem;">合并它获得巨额分数!</span>
    `;

    warningEl.style.cssText = `
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px 25px;
        background: linear-gradient(135deg, #c0392b, #e74c3c);
        border-radius: 15px;
        font-size: 1.2rem;
        font-weight: bold;
        z-index: 70;
        animation: bossWarning 2s ease-out forwards;
    `;

    wrapper.appendChild(warningEl);
    setTimeout(() => warningEl.remove(), 2000);
}

// ==================== 保存海克斯组合 ====================
// 12.5 随机收藏要素 - 图鉴收集
function saveHextechCombo(buffId) {
    if (gameState.gameMode !== 'hextech') return;

    let combos = JSON.parse(localStorage.getItem('hextech_combos') || '[]');
    if (!combos.includes(buffId)) {
        combos.push(buffId);
        localStorage.setItem('hextech_combos', JSON.stringify(combos));

        // 检查成就
        checkHextechAchievements(buffId);
    }
}

function checkHextechAchievements(buffId) {
    const combos = JSON.parse(localStorage.getItem('hextech_combos') || '[]');

    // 收集5个不同Buff解锁成就
    if (combos.length >= 5) {
        unlockHextechAchievement('collector_5', '海克斯收藏家', '收集5种不同Buff');
    }

    // 收集所有Buff解锁成就
    if (combos.length >= HEXTECH_BUFFS.length) {
        unlockHextechAchievement('collector_all', '海克斯大师', '收集所有Buff');
    }
}

function unlockHextechAchievement(id, name, desc) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        saveAchievements();
        showAchievementEffect(achievement);
    }
}

// ==================== 海克斯模式合并处理增强 ====================
function handleHextechMerge(bodyA, bodyB, newLevel) {
    if (gameState.gameMode !== 'hextech') return;

    // 尝试掉落物品
    trySpawnDropItem((bodyA.position.x + bodyB.position.x) / 2, (bodyA.position.y + bodyB.position.y) / 2);

    // 检查Buff堆叠
    gameState.activeBuffs.forEach(buff => {
        if (buff.remainingStacks !== undefined && buff.remainingStacks > 0) {
            buff.remainingStacks--;
        }
    });

    // 尝试生成Boss
    trySpawnBoss();

    // 触发随机事件（低概率）
    if (Math.random() < 0.1) {
        triggerRandomEvent();
    }
}

// ==================== 运气统计 ====================
// 12.5 运气统计 - 记录玩家每局的"运气值"
function calculateLuckValue() {
    let luck = 0;

    // 统计掉落物品数量
    luck += gameState.coinCount / 10;

    // 统计连击次数
    luck += gameState.comboCount * 5;

    // 统计触发的随机事件
    if (gameState.currentEvent) {
        luck += 20;
    }

    return Math.floor(luck);
}

function saveLuckStat() {
    const luck = calculateLuckValue();
    let stats = JSON.parse(localStorage.getItem('luck_stats') || '[]');

    stats.push({
        date: new Date().toLocaleDateString(),
        score: gameState.score,
        luck: luck,
        mode: 'hextech'
    });

    // 只保留最近30条记录
    stats = stats.slice(-30);
    localStorage.setItem('luck_stats', JSON.stringify(stats));
}
