// 战斗状态
const battleState = {
    playerCards: [],
    enemyCards: [],
    currentTurn: 'player', // 'player' 或 'enemy'
    currentPhase: 'prepare', // 'prepare', 'action', 'end'
    selectedCard: null,
    selectedAction: null,
    battleLog: []
};

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    initializeBattle();
});

// 初始化战斗
function initializeBattle() {
    // 加载玩家卡牌
    const playerDeck = JSON.parse(localStorage.getItem('battleDeck'));
    if (!playerDeck || playerDeck.length !== 3) {
        showMessage('卡牌数据错误，请重新选择卡牌', 'error');
        setTimeout(() => window.location.href = '/prepare', 2000);
        return;
    }
    
    battleState.playerCards = playerDeck.map(card => ({
        ...card,
        currentHP: card.stats.HP,
        currentNRG: card.stats.NRG,
        statusEffects: []
    }));
    
    // 生成敌方卡牌
    generateEnemyCards();
    
    // 显示卡牌
    displayCards();
    
    // 开始战斗
    startBattle();
}

// 生成敌方卡牌
function generateEnemyCards() {
    fetch('/api/cards')
        .then(response => response.json())
        .then(data => {
            // 随机选择3张卡牌作为敌方卡牌
            const randomCards = [...data.cards]
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            
            battleState.enemyCards = randomCards.map(card => ({
                ...card,
                currentHP: card.stats.HP,
                currentNRG: card.stats.NRG,
                statusEffects: []
            }));
            
            displayCards();
        });
}

// 显示卡牌
function displayCards() {
    const playerCardsContainer = document.getElementById('playerCards');
    const enemyCardsContainer = document.getElementById('enemyCards');
    
    // 清空容器
    playerCardsContainer.innerHTML = '';
    enemyCardsContainer.innerHTML = '';
    
    // 显示玩家卡牌
    battleState.playerCards.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.dataset.index = index;
        cardElement.dataset.side = 'player';
        if (card.currentHP <= 0) cardElement.classList.add('dead');
        playerCardsContainer.appendChild(cardElement);
    });
    
    // 显示敌方卡牌
    battleState.enemyCards.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.dataset.index = index;
        cardElement.dataset.side = 'enemy';
        if (card.currentHP <= 0) cardElement.classList.add('dead');
        enemyCardsContainer.appendChild(cardElement);
    });
}

// 开始战斗
function startBattle() {
    // 决定先手
    const playerSPD = battleState.playerCards.reduce((sum, card) => sum + card.stats.SPD, 0);
    const enemySPD = battleState.enemyCards.reduce((sum, card) => sum + card.stats.SPD, 0);
    
    battleState.currentTurn = playerSPD >= enemySPD ? 'player' : 'enemy';
    updateTurnDisplay();
    
    if (battleState.currentTurn === 'player') {
        startPlayerTurn();
    } else {
        startEnemyTurn();
    }
}

// 更新回合显示
function updateTurnDisplay() {
    const turnDisplay = document.getElementById('currentTurn');
    turnDisplay.textContent = `当前回合：${battleState.currentTurn === 'player' ? '玩家' : '敌方'}回合`;
}

// 开始玩家回合
function startPlayerTurn() {
    // 更新能量
    battleState.playerCards.forEach(card => {
        if (card.currentHP > 0) {
            card.currentNRG = Math.min(card.currentNRG + 1, 5);
        }
    });
    
    // 显示行动选项
    showActionOptions();
}

// 开始敌方回合
function startEnemyTurn() {
    // 更新能量
    battleState.enemyCards.forEach(card => {
        if (card.currentHP > 0) {
            card.currentNRG = Math.min(card.currentNRG + 1, 5);
        }
    });
    
    // AI行动
    performAIAction();
}

// 显示行动选项
function showActionOptions() {
    const actionOptions = document.getElementById('actionOptions');
    actionOptions.innerHTML = '';
    
    // 为每个存活的卡牌创建行动选项
    battleState.playerCards.forEach((card, index) => {
        if (card.currentHP > 0) {
            const cardActions = document.createElement('div');
            cardActions.className = 'card-actions';
            
            // 普通攻击按钮
            const attackBtn = document.createElement('button');
            attackBtn.className = 'btn primary';
            attackBtn.textContent = `${card.name} - 普通攻击`;
            attackBtn.onclick = () => selectAction(card, 'attack');
            cardActions.appendChild(attackBtn);
            
            // 技能按钮
            card.skills.forEach(skill => {
                if (card.currentNRG >= skill.cost) {
                    const skillBtn = document.createElement('button');
                    skillBtn.className = 'btn secondary';
                    skillBtn.textContent = `${card.name} - ${skill.name}`;
                    skillBtn.onclick = () => selectAction(card, 'skill', skill);
                    cardActions.appendChild(skillBtn);
                }
            });
            
            actionOptions.appendChild(cardActions);
        }
    });
}

// 选择行动
function selectAction(card, actionType, skill = null) {
    battleState.selectedCard = card;
    battleState.selectedAction = { type: actionType, skill };
    
    // 显示可选目标
    showTargets();
}

// 显示可选目标
function showTargets() {
    const targets = battleState.currentTurn === 'player' ? 
        battleState.enemyCards : battleState.playerCards;
    
    targets.forEach((card, index) => {
        if (card.currentHP > 0) {
            const cardElement = document.querySelector(`.card[data-side="${battleState.currentTurn === 'player' ? 'enemy' : 'player'}"][data-index="${index}"]`);
            cardElement.classList.add('targetable');
            cardElement.onclick = () => performAction(card);
        }
    });
}

// 执行行动
function performAction(target) {
    const { selectedCard, selectedAction } = battleState;
    
    if (selectedAction.type === 'attack') {
        // 执行普通攻击
        const damage = calculateDamage(selectedCard, target);
        target.currentHP = Math.max(0, target.currentHP - damage);
        
        addToBattleLog(`${selectedCard.name} 对 ${target.name} 造成 ${damage} 点伤害`);
    } else if (selectedAction.type === 'skill') {
        // 执行技能
        const { skill } = selectedAction;
        selectedCard.currentNRG -= skill.cost;
        
        // 执行技能效果
        executeSkillEffect(selectedCard, target, skill);
    }
    
    // 清理选择状态
    clearSelection();
    
    // 检查战斗是否结束
    if (checkBattleEnd()) {
        endBattle();
    } else {
        // 切换到下一个回合
        nextTurn();
    }
}

// 计算伤害
function calculateDamage(attacker, defender) {
    const baseDamage = Math.max(1, attacker.stats.ATK - defender.stats.DEF);
    const critChance = attacker.stats.CRI / 100;
    const isCrit = Math.random() < critChance;
    
    let damage = baseDamage;
    if (isCrit) {
        damage *= 1.5;
        addToBattleLog('暴击！');
    }
    
    return Math.floor(damage);
}

// 执行技能效果
function executeSkillEffect(caster, target, skill) {
    // 根据技能效果执行相应的操作
    // 这里需要根据具体的技能效果来实现
    addToBattleLog(`${caster.name} 使用 ${skill.name}`);
}

// 清理选择状态
function clearSelection() {
    battleState.selectedCard = null;
    battleState.selectedAction = null;
    
    // 移除所有卡牌的可选状态
    document.querySelectorAll('.card.targetable').forEach(card => {
        card.classList.remove('targetable');
    });
}

// 检查战斗是否结束
function checkBattleEnd() {
    const playerAlive = battleState.playerCards.some(card => card.currentHP > 0);
    const enemyAlive = battleState.enemyCards.some(card => card.currentHP > 0);
    
    return !playerAlive || !enemyAlive;
}

// 下一个回合
function nextTurn() {
    battleState.currentTurn = battleState.currentTurn === 'player' ? 'enemy' : 'player';
    updateTurnDisplay();
    
    if (battleState.currentTurn === 'player') {
        startPlayerTurn();
    } else {
        startEnemyTurn();
    }
}

// AI行动
function performAIAction() {
    // 简单的AI逻辑：优先使用技能，否则普通攻击
    const aiCard = battleState.enemyCards.find(card => card.currentHP > 0);
    if (!aiCard) return;
    
    // 查找可用的技能
    const availableSkill = aiCard.skills.find(skill => aiCard.currentNRG >= skill.cost);
    
    if (availableSkill) {
        // 使用技能
        const target = battleState.playerCards.find(card => card.currentHP > 0);
        if (target) {
            selectAction(aiCard, 'skill', availableSkill);
            setTimeout(() => performAction(target), 1000);
        }
    } else {
        // 普通攻击
        const target = battleState.playerCards.find(card => card.currentHP > 0);
        if (target) {
            selectAction(aiCard, 'attack');
            setTimeout(() => performAction(target), 1000);
        }
    }
}

// 添加战斗日志
function addToBattleLog(message) {
    const battleLog = document.getElementById('battleLog');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;
    battleLog.appendChild(logEntry);
    battleLog.scrollTop = battleLog.scrollHeight;
}

// 结束战斗
function endBattle() {
    const playerWon = battleState.enemyCards.every(card => card.currentHP <= 0);
    const message = playerWon ? '战斗胜利！' : '战斗失败...';
    
    showMessage(message, playerWon ? 'success' : 'error');
    setTimeout(() => window.location.href = '/', 3000);
} 