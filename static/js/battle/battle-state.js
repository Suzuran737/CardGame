/**
 * battle-state.js
 * 管理战斗状态和相关操作
 */

// 导入相关模块
import BattleCards from './battle-cards.js';

// 战斗状态对象
const battleState = {
    playerCards: [],
    enemyCards: [],
    currentTurn: 'player', // 'player' 或 'enemy'
    currentPhase: 'prepare', // 'prepare', 'action', 'end'
    selectedCard: null,
    selectedAction: null,
    battleLog: [],
    playerTurnCount: 0, // 玩家回合计数
    enemyTurnCount: 0,   // 敌方回合计数
    actedCards: new Set() // 记录本回合已行动的卡牌
};

/**
 * 加载玩家卡牌数据
 * @returns {boolean} 加载是否成功
 */
function loadPlayerCards() {
    const playerDeck = JSON.parse(localStorage.getItem('battleDeck'));
    if (!playerDeck || playerDeck.length !== 3) {
        return false;
    }
    
    // 转换卡牌数据结构
    battleState.playerCards = playerDeck.map((card, index) => ({
        id: card.id,
        uuid: `player-${card.id}-${index}`, // 添加唯一ID
        name: card.name,
        element: card.element,
        stats: {
            HP: card.hp,
            ATK: card.atk,
            DEF: card.def,
            SPD: card.spd,
            CRI: card.cri,
            NRG: card.nrg
        },
        skills: card.skills,
        description: card.description,
        currentHP: card.hp,
        currentNRG: card.nrg,
        statusEffects: []
    }));
    
    return true;
}

/**
 * 加载敌方卡牌数据
 * @returns {Promise} 包含加载结果的Promise
 */
function loadEnemyCards() {
    return fetch('/api/cards')
        .then(response => response.json())
        .then(data => {
            // 获取玩家卡牌ID列表，用于排除这些卡牌
            const playerCardIds = battleState.playerCards.map(card => card.id);
            
            // 从所有卡牌中排除玩家已选卡牌
            const availableCards = data.cards.filter(card => !playerCardIds.includes(card.id));
            
            // 如果可用卡牌不足3张，记录警告并使用所有可用卡牌
            if (availableCards.length < 3) {
                console.warn('可用的敌方卡牌不足3张，将使用所有可用卡牌');
            }
            
            // 随机选择3张卡牌作为敌方卡牌(或尽可能多的可用卡牌)
            const randomCards = [...availableCards]
                .sort(() => Math.random() - 0.5)
                .slice(0, Math.min(3, availableCards.length));
            
            // 如果随机卡牌不足3张，从所有卡牌(包括玩家卡牌)中随机选择剩余需要的卡牌数量
            if (randomCards.length < 3) {
                console.warn(`可用卡牌不足，需要从所有卡牌中选择剩余的${3 - randomCards.length}张`);
                
                // 从所有卡牌中排除已选的敌方卡牌
                const remainingCards = data.cards.filter(card => 
                    !randomCards.some(selected => selected.id === card.id)
                );
                
                // 随机选择剩余需要的卡牌
                const additionalCards = [...remainingCards]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3 - randomCards.length);
                
                // 合并卡牌列表
                randomCards.push(...additionalCards);
            }
            
            battleState.enemyCards = randomCards.map((card, index) => ({
                ...card,
                uuid: `enemy-${card.id}-${index}`, // 添加唯一ID
                currentHP: card.stats.HP,
                currentNRG: card.stats.NRG,
                statusEffects: []
            }));
            
            return true;
        })
        .catch(error => {
            console.error('加载敌方卡牌失败:', error);
            return false;
        });
}

/**
 * 更新卡牌的能量值
 * @param {string} side - 'player' 或 'enemy'
 */
function updateEnergy(side) {
    const cards = side === 'player' ? battleState.playerCards : battleState.enemyCards;
    cards.forEach(card => {
        if (card.currentHP > 0) {
            card.currentNRG = Math.min(card.currentNRG + 1, 5);
        }
    });
}

/**
 * 检查战斗是否结束
 * @returns {boolean} 战斗是否结束
 */
function checkBattleEnd() {
    const playerAlive = battleState.playerCards.some(card => card.currentHP > 0);
    const enemyAlive = battleState.enemyCards.some(card => card.currentHP > 0);
    
    // 如果一方全部阵亡，战斗结束
    if (!playerAlive || !enemyAlive) {
        return true;
    }
    
    // 检查当前回合是否所有卡牌都已行动
    const allCardsActed = checkAllCardsActed();
    if (!allCardsActed) {
        return false;
    }
    
    // 如果所有卡牌都已行动，且双方都有卡牌存活，则继续战斗
    return false;
}

/**
 * 判断胜利方
 * @returns {string} 'player'表示玩家胜利，'enemy'表示敌方胜利
 */
function getWinner() {
    const playerAlive = battleState.playerCards.some(card => card.currentHP > 0);
    const enemyAlive = battleState.enemyCards.some(card => card.currentHP > 0);
    
    if (playerAlive && !enemyAlive) {
        return 'player';
    } else if (!playerAlive) {
        return 'enemy';
    }
    
    // 如果程序运行到这里，意味着双方都还有卡牌存活
    // 但为了确保没有平局，默认敌方获胜
    // 实际上，如果双方都有卡存活，这段代码不应该被调用
    console.warn('战斗未结束但调用了getWinner()');
    return 'enemy';
}

/**
 * 切换回合
 * @returns {string} 当前回合方 'player' 或 'enemy'
 */
function switchTurn() {
    console.log(`切换回合: 从 ${battleState.currentTurn} 到 ${battleState.currentTurn === 'player' ? 'enemy' : 'player'}`);
    console.log(`切换前: 已行动卡牌数量 ${battleState.actedCards.size}, UUIDs:`, Array.from(battleState.actedCards));
    
    battleState.currentTurn = battleState.currentTurn === 'player' ? 'enemy' : 'player';
    
    // 增加对应方的回合计数
    if (battleState.currentTurn === 'player') {
        battleState.playerTurnCount++;
        console.log(`玩家回合计数增加到: ${battleState.playerTurnCount}`);
    } else {
        battleState.enemyTurnCount++;
        console.log(`敌方回合计数增加到: ${battleState.enemyTurnCount}`);
    }
    
    // 清空已行动卡牌记录
    battleState.actedCards.clear();
    console.log("已行动卡牌记录已清空");
    
    return battleState.currentTurn;
}

/**
 * 检查当前回合是否所有卡牌都已行动
 * @returns {boolean} 是否所有卡牌都已行动
 */
function checkAllCardsActed() {
    const currentCards = battleState.currentTurn === 'player' ? 
        battleState.playerCards : 
        battleState.enemyCards;
    
    // 计算存活的卡牌数量
    const aliveCards = currentCards.filter(card => card.currentHP > 0);
    const aliveCount = aliveCards.length;
    
    // 输出已行动卡牌的UUID列表
    console.log(`检查卡牌行动状态: ${battleState.currentTurn}回合, 存活卡牌数量: ${aliveCount}, 已行动卡牌数量: ${battleState.actedCards.size}`);
    console.log("存活卡牌:", aliveCards.map(card => card.name));
    console.log("已行动卡牌UUIDs:", Array.from(battleState.actedCards));
    
    // 检查已行动的卡牌数量是否等于存活的卡牌数量
    return battleState.actedCards.size >= aliveCount;
}

/**
 * 记录卡牌已行动
 * @param {Object} card - 已行动的卡牌
 */
function markCardActed(card) {
    battleState.actedCards.add(card.uuid);
}

/**
 * 确定战斗先手
 * @returns {string} 先手方 'player' 或 'enemy'
 */
function determineFirstTurn() {
    // 计算考虑状态效果后的总速度值
    const playerSPD = battleState.playerCards.reduce((sum, card) => {
        if (card.currentHP <= 0) return sum; // 跳过已死亡的卡牌
        return sum + BattleCards.calculateCurrentStat(card, 'SPD');
    }, 0);
    
    const enemySPD = battleState.enemyCards.reduce((sum, card) => {
        if (card.currentHP <= 0) return sum; // 跳过已死亡的卡牌
        return sum + BattleCards.calculateCurrentStat(card, 'SPD');
    }, 0);
    
    console.log(`先攻判断 - 玩家速度总和: ${playerSPD}, 敌方速度总和: ${enemySPD}`);
    
    battleState.currentTurn = playerSPD >= enemySPD ? 'player' : 'enemy';
    return battleState.currentTurn;
}

/**
 * 设置选中的卡牌和行动
 * @param {Object} card - 选中的卡牌
 * @param {string} actionType - 行动类型
 * @param {Object} skill - 技能对象（如果使用技能）
 */
function setSelectedAction(card, actionType, skill = null) {
    battleState.selectedCard = card;
    battleState.selectedAction = { type: actionType, skill };
}

/**
 * 清除选中状态
 */
function clearSelection() {
    battleState.selectedCard = null;
    battleState.selectedAction = null;
}

// 导出模块
export default {
    state: battleState,
    loadPlayerCards,
    loadEnemyCards,
    updateEnergy,
    checkBattleEnd,
    getWinner,
    switchTurn,
    determineFirstTurn,
    setSelectedAction,
    clearSelection,
    checkAllCardsActed,
    markCardActed
}; 