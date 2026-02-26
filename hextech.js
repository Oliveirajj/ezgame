/**
 * 海克斯模式系统 - 独立模块
 * 包含：随机Buff、天气系统、随机事件、掉落物品、每日规则等
 */

// ==================== 海克斯Buff系统 ====================
// 12.1 随机Buff系统 - 每局随机3选1 Buff
const HEXTECH_BUFFS = [
    { id: 'academic_burst', name: '学术爆发', desc: '接下来5次合并分数x2', icon: '📚', rarity: 'common', duration: 0, stack: 5 },
    { id: 'time_slow', name: '时间延缓', desc: '下落时间增加50%', icon: '⏰', rarity: 'common', duration: 15000 },
    { id: 'merge_speed', name: '合并加速', desc: '物品下落速度+30%', icon: '🚀', rarity: 'common', duration: 15000 },
    { id: 'lucky_star', name: '幸运星', desc: '消球时30%概率额外获得分数', icon: '⭐', rarity: 'uncommon', duration: 20000 },
    { id: 'gravity_reverse', name: '重力反转', desc: '3秒内所有物品向上飘', icon: '🔄', rarity: 'rare', duration: 3000 },
    { id: 'doctor_aura', name: '博士光环', desc: '场上所有物品等级+1', icon: '🎓', rarity: 'epic', duration: 0 },
    { id: 'time_freeze', name: '时间静止', desc: '5秒内时间暂停', icon: '❄️', rarity: 'legendary', duration: 5000 },
    { id: 'gold_rush', name: '金币风暴', desc: '接下来10次合并必定掉落金币', icon: '💰', rarity: 'uncommon', duration: 0, stack: 10 },
    { id: 'shield_wave', name: '护盾波', desc: '10秒内所有掉落物品获得护盾', icon: '🛡️', rarity: 'rare', duration: 10000 },
    { id: 'combo_rain', name: '连击雨', desc: '连击触发概率翻倍', icon: '🌧️', rarity: 'uncommon', duration: 15000 }
];

// ==================== 天气系统 ====================
// 12.1 随机天气/环境 - 每60秒随机切换
const WEATHER_TYPES = [
    { id: 'normal', name: '晴朗', icon: '☀️', desc: '正常游戏环境', gravity: 1.0 },
    { id: 'rain', name: '下雨', icon: '🌧️', desc: '物品下落速度略微减慢', gravity: 0.9 },
    { id: 'storm', name: '风暴', icon: '⛈️', desc: '物品会受到随机风力', gravity: 1.1, wind: true },
    { id: 'snow', name: '下雪', icon: '❄️', desc: '摩擦力增加，物品更容易堆积', gravity: 0.8, friction: 1.5 },
    { id: 'fog', name: '大雾', icon: '🌫️', desc: '视野受限', visibility: 0.5 }
];

// ==================== 随机事件 ====================
// 12.3 随机事件系统
const RANDOM_EVENTS = [
    { id: 'size_up', name: '物体膨胀', icon: '🔵', desc: '所有球变大50%', duration: 10000, scale: 1.5 },
    { id: 'size_down', name: '物体缩小', icon: '🔴', desc: '所有球变小50%', duration: 10000, scale: 0.5 },
    { id: 'gravity_reverse', name: '重力反转', icon: '🔄', desc: '重力方向反转', duration: 5000, gravity: -1 },
    { id: 'speed_demon', name: '速度恶魔', icon: '💨', desc: '所有物品速度翻倍', duration: 8000, speed: 2 },
    { id: 'combo_fever', name: '连击狂热', icon: '🔥', desc: '连击倍数翻倍', duration: 12000, comboMult: 2 },
    { id: 'score_rain', name: '分数雨', icon: '💎', desc: '每2秒自动获得50分', duration: 15000, autoScore: 50 }
];

// ==================== 每日特殊规则 ====================
// 12.4 随机难度修饰符
const DAILY_MODIFIERS = [
    { id: 'double_score', name: '双倍分数', icon: '✨', desc: '所有分数翻倍', apply: (state) => { /* 分数计算时乘2 */ } },
    { id: 'fast_pace', name: '快节奏', icon: '⚡', desc: '时间限制减少30%', apply: (state) => { state.timeLimit *= 0.7; } },
    { id: 'obstacle', name: '障碍物', icon: '🧱', desc: '游戏开始时带有3个障碍物', apply: (state) => { state.obstacleCount = 3; } },
    { id: 'big_ball', name: '大球模式', icon: '🎱', desc: '所有物品体积增大30%', apply: (state) => { /* 物品尺寸乘1.3 */ } },
    { id: 'lucky', name: '幸运模式', icon: '🍀', desc: '掉落奖励概率翻倍', apply: (state) => { /* 奖励概率翻倍 */ } }
];

// ==================== 掉落物品类型 ====================
// 12.2 掉落型随机奖励
const DROP_ITEMS = [
    { type: 'coin', name: '金币', icon: '🪙', value: 10, probability: 0.6 },
    { type: 'gem', name: '宝石', icon: '💎', value: 50, probability: 0.25 },
    { type: 'chest', name: '宝箱', icon: '📦', value: 0, probability: 0.1 },
    { type: 'mystery', name: '神秘礼包', icon: '🎁', value: 0, probability: 0.05 }
];

// ==================== 海克斯模式定时器 ====================
let weatherInterval = null;
let eventInterval = null;

// ==================== 水位系统 ====================
// 水从底部上涨，到达警戒线游戏结束
const WATER_CONFIG = {
    baseRiseSpeed: 1.5,      // 基础上涨速度（像素/帧）- 调高以便测试
    speedIncreasePerLevel: 0.1, // 每级增加的速度
    dropOnMerge: 50,         // 每次合并水位下降
    maxLevel: 11,            // 最高等级
    warningThreshold: 150,   // 警告阈值（离顶部多少像素）
    startHeight: 50          // 初始水位（从底部开始）- 调高以便能看到
};

// ==================== 初始化海克斯模式 ====================
function initHextechMode() {
    // 初始化海克斯特有状态
    gameState.activeBuffs = [];
    gameState.currentHextechBuffs = [];
    gameState.selectedHextechBuff = null;
    gameState.coinCount = 0;
    gameState.treasureBoxProgress = 0;
    gameState.currentWeather = 'normal';
    gameState.currentEvent = null;
    gameState.bossSpawned = false;

    // 初始化水位系统
    gameState.waterLevel = WATER_CONFIG.startHeight;
    gameState.waterEnabled = true;

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
    updateWaterDisplay();
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
                    ${gameState.currentHextechBuffs.map((buff) => `
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
            if (typeof items !== 'undefined') {
                items.forEach(item => {
                    item.frictionAir = 0.005;
                });
            }
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

    // 更新水位系统
    if (gameState.waterEnabled && !gameState.isGameOver && !gameState.isPaused) {
        updateWaterLevel();
    }
}

// ==================== 水位系统 ====================
function updateWaterLevel() {
    if (!gameState.waterEnabled) {
        return;
    }
    
    if (gameState.waterLevel === undefined) {
        gameState.waterLevel = 0;
    }

    // 计算上涨速度（随最高等级增加）
    const speedMultiplier = 1 + (gameState.highestLevel - 1) * (WATER_CONFIG.speedIncreasePerLevel / WATER_CONFIG.baseRiseSpeed);
    const riseSpeed = WATER_CONFIG.baseRiseSpeed * speedMultiplier;

    // 水位上涨
    gameState.waterLevel += riseSpeed;

    // 检查是否到达警戒线
    const warningLine = CONFIG.gameTop + 20;
    if (gameState.waterLevel >= warningLine) {
        // 水位到达顶部，游戏结束
        triggerWaterGameOver();
    }

    // 更新水位显示
    updateWaterDisplay();
}

// 降低水位（合并时调用）
function lowerWaterLevel(amount) {
    if (!gameState.waterEnabled) return;

    gameState.waterLevel = Math.max(0, gameState.waterLevel - amount);

    // 显示水位下降特效
    showWaterLowerEffect(amount);

    updateWaterDisplay();
}

// 显示水位下降特效
function showWaterLowerEffect(amount) {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    const effect = document.createElement('div');
    effect.className = 'water-lower-effect';
    effect.innerHTML = `
        <span class="water-icon">💧</span>
        <span class="water-text">水位-${Math.round(amount)}</span>
    `;

    effect.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: rgba(52, 152, 219, 0.9);
        border-radius: 20px;
        color: #fff;
        font-weight: bold;
        font-size: 1.1rem;
        z-index: 65;
        animation: waterLower 1s ease-out forwards;
    `;

    wrapper.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

// 水位游戏结束
function triggerWaterGameOver() {
    if (typeof triggerGameOver === 'function') {
        triggerGameOver();
    }
}

// 更新水位显示
function updateWaterDisplay() {
    let waterDisplay = document.getElementById('water-level-display');
    if (!waterDisplay) {
        const wrapper = document.getElementById('canvas-wrapper');
        if (!wrapper) return;

        waterDisplay = document.createElement('div');
        waterDisplay.id = 'water-level-display';
        waterDisplay.style.cssText = `
            position: absolute;
            top: 60px;
            left: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            z-index: 45;
            pointer-events: none;
        `;
        wrapper.appendChild(waterDisplay);
    }

    const maxHeight = CONFIG.gameTop + 20;
    const percentage = Math.min(100, (gameState.waterLevel / maxHeight) * 100);
    const isWarning = gameState.waterLevel > maxHeight - WATER_CONFIG.warningThreshold;

    waterDisplay.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: ${isWarning ? '#e74c3c' : '#3498db'}; font-weight: bold; font-size: 1rem;">
            <span>🌊</span>
            <span>${Math.round(percentage)}%</span>
        </div>
        <div style="width: 80px; height: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;">
            <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #3498db, ${isWarning ? '#e74c3c' : '#2980b9'}); transition: width 0.3s;"></div>
        </div>
    `;
}

// 渲染水位（在水下时绘制）
function renderWater(ctx) {
    if (!gameState.waterEnabled || gameState.waterLevel <= 0) return;

    const waterY = CONFIG.canvasHeight - gameState.waterLevel;

    // 绘制水
    const gradient = ctx.createLinearGradient(0, waterY, 0, CONFIG.canvasHeight);
    gradient.addColorStop(0, 'rgba(52, 152, 219, 0.6)');
    gradient.addColorStop(1, 'rgba(41, 128, 185, 0.8)');

    ctx.fillStyle = gradient;
    ctx.fillRect(CONFIG.gameLeft, waterY, CONFIG.gameRight - CONFIG.gameLeft, gameState.waterLevel);

    // 绘制水面波纹
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const time = Date.now() / 500;
    for (let x = CONFIG.gameLeft; x <= CONFIG.gameRight; x += 10) {
        const waveY = waterY + Math.sin((x + time * 50) / 30) * 5;
        if (x === CONFIG.gameLeft) {
            ctx.moveTo(x, waveY);
        } else {
            ctx.lineTo(x, waveY);
        }
    }
    ctx.stroke();

    // 如果水位很高，绘制警告
    if (gameState.waterLevel > CONFIG.gameTop) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.fillRect(CONFIG.gameLeft, CONFIG.gameTop, CONFIG.gameRight - CONFIG.gameLeft, 20);
    }
}

// ==================== 移除Buff效果 ====================
function removeBuffEffect(buff) {
    switch (buff.id) {
        case 'time_slow':
            engine.gravity.y = CONFIG.gravity;
            break;
        case 'merge_speed':
            if (typeof items !== 'undefined') {
                items.forEach(item => {
                    item.frictionAir = 0.01;
                });
            }
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
        if (!scoreBoard) return;
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
        if (!scoreBoard) return;
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
        if (!wrapper) return;
        weatherDisplay = document.createElement('div');
        weatherDisplay.id = 'weather-display';
        weatherDisplay.style.cssText = `
            position: absolute;
            top: 50px;
            right: 10px;
            padding: 5px 10px;
            background: linear-gradient(135deg, rgba(231, 76, 60, 0.9), rgba(192, 57, 43, 0.9));
            border: 1px solid #e74c3c;
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
function startWeatherCycle() {
    if (weatherInterval) clearInterval(weatherInterval);

    // 每60秒切换天气
    weatherInterval = setInterval(() => {
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
    if (!wrapper) return;
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
        background: linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95));
        border: 2px solid #e74c3c;
        border-radius: 15px;
        z-index: 60;
        animation: weatherChange 3s ease-out forwards;
    `;

    wrapper.appendChild(weatherEl);
    setTimeout(() => weatherEl.remove(), 3000);
}

// ==================== 随机事件系统 ====================
function startRandomEventCycle() {
    if (eventInterval) clearInterval(eventInterval);

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
            if (typeof items !== 'undefined') {
                items.forEach(item => {
                    Matter.Body.scale(item, 1.5, 1.5);
                });
            }
            break;
        case 'size_down':
            if (typeof items !== 'undefined') {
                items.forEach(item => {
                    Matter.Body.scale(item, 0.5, 0.5);
                });
            }
            break;
        case 'gravity_reverse':
            engine.gravity.y = -Math.abs(engine.gravity.y);
            break;
        case 'speed_demon':
            if (typeof items !== 'undefined') {
                items.forEach(item => {
                    item.frictionAir = 0.001;
                });
            }
            break;
        case 'combo_fever':
            gameState.comboMultiplier *= 2;
            break;
    }
}

function removeEventEffect(event) {
    switch (event.id) {
        case 'gravity_reverse':
            engine.gravity.y = Math.abs(engine.gravity.y);
            break;
        case 'speed_demon':
            if (typeof items !== 'undefined') {
                items.forEach(item => {
                    item.frictionAir = 0.01;
                });
            }
            break;
        case 'combo_fever':
            gameState.comboMultiplier /= 2;
            break;
    }
}

function showRandomEvent(event) {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;
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
    if (!wrapper) return;
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
    if (!wrapper) return;
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
        background: rgba(0,0,0,0.9);
        border-radius: 15px;
        color: #ffd700;
        font-weight: bold;
        font-size: 1.1rem;
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
    if (!wrapper) return;
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
    if (!wrapper) return;
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
                if (typeof items !== 'undefined' && typeof Composite !== 'undefined') {
                    // 移除一半物品
                    const toRemove = Math.floor(items.length / 2);
                    for (let i = 0; i < toRemove; i++) {
                        Composite.remove(engine.world, items[i]);
                    }
                    items = items.slice(toRemove);
                }
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
    if (!wrapper) return;
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
        background: linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95));
        border: 2px solid #e74c3c;
        border-radius: 20px;
        font-size: 0.9rem;
        z-index: 50;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
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

    if (typeof ACADEMIC_TITLES === 'undefined' || typeof CONFIG === 'undefined') return;

    const title = ACADEMIC_TITLES[10]; // 诺贝尔奖
    const radius = CONFIG.baseRadius + 10 * CONFIG.radiusIncrement;

    const boss = Matter.Bodies.circle(
        CONFIG.canvasWidth / 2,
        CONFIG.spawnY,
        radius * 1.5,
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

    Matter.Body.setStatic(boss, true);

    if (typeof items !== 'undefined') {
        items.push(boss);
        Composite.add(engine.world, boss);
    }

    // 显示Boss提示
    showBossWarning();
}

function showBossWarning() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;
    const warningEl = document.createElement('div');
    warningEl.className = 'boss-warning';
    warningEl.innerHTML = `
        <span>👹 Boss来袭!</span>
        <span style="font-size: 0.9rem;">合并它获得巨额分数!</span>
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
        color: #fff;
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
    if (typeof ACHIEVEMENTS === 'undefined') return;
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        if (typeof saveAchievements === 'function') {
            saveAchievements();
        }
        if (typeof showAchievementEffect === 'function') {
            showAchievementEffect(achievement);
        }
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

// ==================== 显示海克斯模式介绍 ====================
function showHextechModeIntro() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;
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
    
    // 确保文字颜色正确，提高对比度
    const textEl = introEl.querySelector('.hextech-text');
    if (textEl) {
        textEl.style.color = '#ffffff';
        textEl.style.textShadow = '0 0 10px rgba(233, 69, 96, 0.8), 0 0 20px rgba(233, 69, 96, 0.5)';
    }

    wrapper.appendChild(introEl);
    setTimeout(() => introEl.remove(), 3000);
}

// ==================== 海克斯模式结束处理 ====================
function cleanupHextechMode() {
    // 清理定时器
    if (weatherInterval) {
        clearInterval(weatherInterval);
        weatherInterval = null;
    }
    if (eventInterval) {
        clearInterval(eventInterval);
        eventInterval = null;
    }

    // 重置重力
    if (typeof engine !== 'undefined' && engine.gravity) {
        engine.gravity.y = CONFIG.gravity;
    }

    // 保存运气统计
    if (gameState.gameMode === 'hextech' && gameState.score > 0) {
        saveLuckStat();
    }
}

// ==================== 导出接口 ====================
// 供 game.js 调用的接口
window.HextechSystem = {
    init: initHextechMode,
    update: updateHextechBuffs,
    onMerge: handleHextechMerge,
    showIntro: showHextechModeIntro,
    cleanup: cleanupHextechMode,
    updateUI: updateHextechUI,
    // 水位系统
    lowerWater: lowerWaterLevel,
    // 常量
    BUFFS: HEXTECH_BUFFS,
    WEATHER: WEATHER_TYPES,
    EVENTS: RANDOM_EVENTS,
    MODIFIERS: DAILY_MODIFIERS,
    DROPS: DROP_ITEMS,
    WATER_CONFIG: WATER_CONFIG
};
