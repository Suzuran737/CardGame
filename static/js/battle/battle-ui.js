/**
 * battle-ui.js
 * 处理UI显示和交互
 */

import BattleState from './battle-state.js';
import BattleActions from './battle-actions.js';
import BattleCards from './battle-cards.js';

/**
 * 显示玩家和敌方卡牌
 */
function displayCards() {
    const playerCardsContainer = document.getElementById('playerCards');
    const enemyCardsContainer = document.getElementById('enemyCards');
    
    // 清空容器
    playerCardsContainer.innerHTML = '';
    enemyCardsContainer.innerHTML = '';
    
    // 显示玩家卡牌
    BattleState.state.playerCards.forEach((card, index) => {
        const cardElement = BattleCards.createCardElement(card);
        cardElement.dataset.index = index;
        cardElement.dataset.side = 'player';
        if (card.currentHP <= 0) cardElement.classList.add('dead');
        // 为存活的玩家卡牌添加点击事件(仅在玩家回合)
        if (card.currentHP > 0 && BattleState.state.currentTurn === 'player' && !BattleState.state.actedCards.has(card.uuid)) {
            cardElement.classList.add('selectable');
            cardElement.addEventListener('click', () => {
                const cardUUID = card.uuid || cardElement.dataset.uuid;
                const isSelected = document.querySelector(`.card[data-uuid="${cardUUID}"]`).classList.contains('selected');
                if (isSelected) {
                    // 如果已选中，则取消选择
                    cardElement.classList.remove('selected');
                    updateActionPanel("请选择要行动的卡牌");
                } else {
                    // 否则显示操作
                    showCardActions(card);
                }
            });
        } else if (BattleState.state.actedCards.has(card.uuid)) {
            // 已行动过的卡牌添加特殊样式
            cardElement.classList.add('acted');
        }
        playerCardsContainer.appendChild(cardElement);
    });
    
    // 显示敌方卡牌
    BattleState.state.enemyCards.forEach((card, index) => {
        const cardElement = BattleCards.createCardElement(card);
        cardElement.dataset.index = index;
        cardElement.dataset.side = 'enemy';
        if (card.currentHP <= 0) cardElement.classList.add('dead');
        enemyCardsContainer.appendChild(cardElement);
    });
}

/**
 * 更新回合显示
 */
function updateTurnDisplay() {
    const turnDisplay = document.getElementById('currentTurn');
    const currentSide = BattleState.state.currentTurn === 'player' ? '玩家' : '敌方';
    const totalTurns = BattleState.state.playerTurnCount + BattleState.state.enemyTurnCount;
    turnDisplay.textContent = `当前回合：${currentSide}回合（总回合数：${totalTurns}）`;
}

/**
 * 更新行动面板
 * @param {string} message - 显示的消息
 */
function updateActionPanel(message) {
    const actionOptions = document.getElementById('actionOptions');
    actionOptions.innerHTML = '';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'action-message';
    messageElement.textContent = message;
    actionOptions.appendChild(messageElement);
}

/**
 * 显示卡牌行动选项
 * @param {Object} card - 卡牌对象
 */
function showCardActions(card) {
    // 重置已选择的卡牌样式
    document.querySelectorAll('.card.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 设置当前卡牌为选中状态
    const cardUUID = card.uuid || `card-${card.id}-${BattleState.state.playerCards.indexOf(card)}`;
    const cardElement = document.querySelector(`.card[data-uuid="${cardUUID}"]`);
    if (cardElement) {
        cardElement.classList.add('selected');
    }
    
    // 显示行动选项
    const actionOptions = document.getElementById('actionOptions');
    actionOptions.innerHTML = '';
    
    const cardActions = document.createElement('div');
    cardActions.className = 'card-actions';
    
    // 显示卡牌信息
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';
    cardInfo.innerHTML = `
        <div class="card-name">${card.name}</div>
        <div class="card-element element-${card.element.toLowerCase()}">${card.element}</div>
        <div class="card-energy">能量: ${card.currentNRG}/5</div>
    `;
    actionOptions.appendChild(cardInfo);
    
    // 普通攻击按钮
    const attackBtn = document.createElement('button');
    attackBtn.className = 'btn primary';
    attackBtn.textContent = `普通攻击`;
    attackBtn.onclick = () => BattleActions.selectAction(card, 'attack');
    cardActions.appendChild(attackBtn);
    
    // 技能按钮
    card.skills.forEach(skill => {
        const skillBtn = document.createElement('button');
        skillBtn.className = 'btn secondary';
        skillBtn.textContent = `${skill.name}`;
        
        if (card.currentNRG >= skill.cost) {
            skillBtn.onclick = () => BattleActions.selectAction(card, 'skill', skill);
        } else {
            skillBtn.disabled = true;
            skillBtn.classList.add('disabled');
        }
        
        // 技能描述
        const skillDescription = document.createElement('div');
        skillDescription.className = 'skill-description';
        skillDescription.textContent = `消耗: ${skill.cost}`;
        skillBtn.appendChild(skillDescription);
        
        cardActions.appendChild(skillBtn);
    });
    
    actionOptions.appendChild(cardActions);
}

/**
 * 显示可选目标
 */
function showTargets() {
    const targets = BattleState.state.currentTurn === 'player' ? 
        BattleState.state.enemyCards : BattleState.state.playerCards;
    
    targets.forEach((card, index) => {
        if (card.currentHP > 0) {
            const cardUUID = card.uuid || `card-${card.id}-${index}`;
            const targetSide = BattleState.state.currentTurn === 'player' ? 'enemy' : 'player';
            const cardElement = document.querySelector(`.card[data-side="${targetSide}"][data-uuid="${cardUUID}"]`) || 
                                document.querySelector(`.card[data-side="${targetSide}"][data-index="${index}"]`);
            
            if (cardElement) {
                cardElement.classList.add('targetable');
                cardElement.onclick = () => BattleActions.performAction(card);
            }
        }
    });
}

/**
 * 清理UI中的选择状态
 */
function clearSelectionUI() {
    // 移除所有卡牌的样式
    document.querySelectorAll('.card.targetable').forEach(card => {
        card.classList.remove('targetable');
        card.onclick = null; // 移除点击事件
    });
    
    document.querySelectorAll('.card.selected').forEach(card => {
        card.classList.remove('selected');
    });
}

/**
 * 添加战斗日志
 * @param {string} message - 日志消息
 */
function addToBattleLog(message) {
    const battleLog = document.getElementById('battleLog');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    // 步骤1: 解析消息，判断攻击者和目标
    let attacker = null;
    let target = null;
    
    // 判断是攻击、技能使用或受到伤害的消息
    const attackerMatch = message.match(/^([^\s]+)(?:\s使用|\s对)/);
    if (attackerMatch) {
        attacker = attackerMatch[1];
    }
    
    const targetMatch = message.match(/对\s+([^\s]+)\s+(?:造成|使用|施加)/);
    if (targetMatch) {
        target = targetMatch[1];
    }
    
    // 步骤2: 将原始消息拆分成单词和标点符号
    let parts = [];
    let current = '';
    let inTag = false;
    
    // 按字符遍历
    for (let i = 0; i < message.length; i++) {
        const char = message[i];
        
        if (char === '<') {
            inTag = true;
            if (current.length > 0) {
                parts.push({ text: current, type: 'text' });
                current = '';
            }
            current += char;
        } else if (char === '>') {
            inTag = false;
            current += char;
            parts.push({ text: current, type: 'tag' });
            current = '';
        } else if (inTag) {
            current += char;
        } else if (/[\s，。！？；：]/.test(char)) {
            if (current.length > 0) {
                parts.push({ text: current, type: 'text' });
                current = '';
            }
            parts.push({ text: char, type: 'punctuation' });
        } else {
            current += char;
        }
    }
    
    if (current.length > 0) {
        parts.push({ text: current, type: 'text' });
    }
    
    // 步骤3: 检查每个文本部分是否是卡牌名称
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (part.type === 'text') {
            // 检查是否是"玩家"或"敌方"
            if (part.text === '玩家') {
                part.text = '<span class="player-card">玩家</span>';
                part.type = 'colored';
                continue;
            } else if (part.text === '敌方') {
                part.text = '<span class="enemy-card">敌方</span>';
                part.type = 'colored';
                continue;
            }
            
            // 检查是否是玩家卡牌
            const isPlayerCard = BattleState.state.playerCards.some(card => card.name === part.text);
            // 检查是否是敌方卡牌
            const isEnemyCard = BattleState.state.enemyCards.some(card => card.name === part.text);
            
            // 如果是同名卡牌（既是玩家卡牌又是敌方卡牌），需要基于上下文判断
            if (isPlayerCard && isEnemyCard) {
                // 作为攻击者
                if (attacker === part.text) {
                    // 检查消息上下文判断是玩家还是敌方
                    if (message.includes('玩家') || BattleState.state.currentTurn === 'player') {
                        part.text = `<span class="player-card">${part.text}</span>`;
                    } else {
                        part.text = `<span class="enemy-card">${part.text}</span>`;
                    }
                } 
                // 作为目标
                else if (target === part.text) {
                    // 检查攻击者是谁来判断
                    if (message.includes('玩家') || BattleState.state.currentTurn === 'player') {
                        // 玩家攻击，目标是敌方
                        part.text = `<span class="enemy-card">${part.text}</span>`;
                    } else {
                        // 敌方攻击，目标是玩家
                        part.text = `<span class="player-card">${part.text}</span>`;
                    }
                }
                // 其他情况，直接显示不带颜色
                else {
                    part.text = part.text;
                }
            } 
            // 单纯的玩家卡牌
            else if (isPlayerCard) {
                part.text = `<span class="player-card">${part.text}</span>`;
            } 
            // 单纯的敌方卡牌
            else if (isEnemyCard) {
                part.text = `<span class="enemy-card">${part.text}</span>`;
            }
            
            part.type = 'colored';
        }
    }
    
    // 步骤4: 重新组合所有部分
    let processedMessage = parts.map(part => part.text).join('');
    
    // 使用innerHTML而不是textContent以支持HTML标签
    logEntry.innerHTML = processedMessage;
    battleLog.appendChild(logEntry);
    battleLog.scrollTop = battleLog.scrollHeight;
}

/**
 * 显示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型
 */
function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

/**
 * 显示战斗结果
 * @param {boolean} playerWon - 玩家是否获胜
 */
function showBattleResult(playerWon) {
    // 创建结果弹窗
    const resultOverlay = document.createElement('div');
    resultOverlay.className = 'battle-result-overlay';
    
    const resultContainer = document.createElement('div');
    resultContainer.className = 'battle-result-container';
    
    const resultTitle = document.createElement('h2');
    resultTitle.className = playerWon ? 'victory-title' : 'defeat-title';
    resultTitle.textContent = playerWon ? '战斗胜利！' : '战斗失败';
    
    const resultMessage = document.createElement('p');
    resultMessage.textContent = playerWon 
        ? '你成功击败了所有敌人！' 
        : '你的所有卡牌都被击败了...';
    
    const returnButton = document.createElement('button');
    returnButton.className = 'btn primary';
    returnButton.textContent = '返回主页';
    returnButton.onclick = () => window.location.href = '/';
    
    const retryButton = document.createElement('button');
    retryButton.className = 'btn secondary';
    retryButton.textContent = '重新战斗';
    retryButton.onclick = () => window.location.href = '/prepare';
    
    resultContainer.appendChild(resultTitle);
    resultContainer.appendChild(resultMessage);
    resultContainer.appendChild(returnButton);
    resultContainer.appendChild(retryButton);
    
    resultOverlay.appendChild(resultContainer);
    document.body.appendChild(resultOverlay);
    
    // 禁用所有其他交互
    document.querySelectorAll('.card').forEach(card => {
        card.style.pointerEvents = 'none';
    });
    document.getElementById('actionOptions').innerHTML = '';
}

/**
 * 初始化战斗UI
 */
function initializeBattleUI() {
    // 在actionPanel中创建下一回合按钮
    const actionPanel = document.getElementById('actionPanel');
    if (actionPanel) {
        // 创建下一回合按钮
        const nextTurnBtn = document.createElement('button');
        nextTurnBtn.id = 'next-turn-btn';
        nextTurnBtn.className = 'btn primary';
        nextTurnBtn.textContent = '下一回合';
        nextTurnBtn.style.display = 'none'; // 默认隐藏
        nextTurnBtn.addEventListener('click', () => {
            if (BattleState.state.currentTurn === 'player') {
                BattleActions.nextTurn();
            }
        });
        actionPanel.appendChild(nextTurnBtn);
    }
}

/**
 * 调试所有卡牌的状态效果
 */
function debugStatusEffects() {
    addToBattleLog('--- 调试信息 ---');
    addToBattleLog('玩家卡牌效果:');
    
    BattleState.state.playerCards.forEach(card => {
        if (!card.statusEffects || card.statusEffects.length === 0) {
            addToBattleLog(`${card.name}: 无效果`);
            return;
        }
        
        addToBattleLog(`${card.name}的效果:`);
        card.statusEffects.forEach(effect => {
            const type = BattleCards.getEffectType(effect);
            const name = effect.name || type;
            addToBattleLog(`  - ${name}: 持续${effect.duration}回合, 来源:${effect.source || '未知'}`);
        });
    });
    
    addToBattleLog('敌方卡牌效果:');
    BattleState.state.enemyCards.forEach(card => {
        if (!card.statusEffects || card.statusEffects.length === 0) {
            addToBattleLog(`${card.name}: 无效果`);
            return;
        }
        
        addToBattleLog(`${card.name}的效果:`);
        card.statusEffects.forEach(effect => {
            const type = BattleCards.getEffectType(effect);
            const name = effect.name || type;
            addToBattleLog(`  - ${name}: 持续${effect.duration}回合, 来源:${effect.source || '未知'}`);
        });
    });
    
    // 特别检查海妖歌姬效果
    const hasMermaidsEffect = checkMermaidsEffect();
    addToBattleLog(`海妖歌姬效果检测: ${hasMermaidsEffect ? '发现异常' : '正常'}`);
    
    addToBattleLog('--- 调试结束 ---');
}

/**
 * 检查是否存在海妖歌姬的异常效果
 * @returns {boolean} 是否存在异常
 */
function checkMermaidsEffect() {
    let hasIssue = false;
    
    // 检查所有敌方卡牌
    BattleState.state.enemyCards.forEach(card => {
        if (!card.statusEffects) return;
        
        // 检查是否有海妖歌姬施加的效果，且持续时间异常
        const mermaidsEffects = card.statusEffects.filter(effect => 
            effect.source === 'player' && 
            effect.speed && 
            effect.duration > 5 // 通常减速效果不应该持续超过5回合
        );
        
        if (mermaidsEffects.length > 0) {
            addToBattleLog(`警告: ${card.name} 上存在异常持续的海妖歌姬减速效果!`);
            mermaidsEffects.forEach(effect => {
                addToBattleLog(`  - 减速值: ${effect.speed}, 持续时间: ${effect.duration}回合`);
            });
            hasIssue = true;
        }
    });
    
    return hasIssue;
}

/**
 * 调试卡牌属性
 */
function debugCardStats() {
    addToBattleLog('--- 调试卡牌属性 ---');
    
    addToBattleLog('玩家卡牌:');
    BattleState.state.playerCards.forEach(card => {
        const baseATK = card.stats.ATK;
        const baseDEF = card.stats.DEF;
        const baseSPD = card.stats.SPD;
        
        const currentATK = BattleCards.calculateCurrentStat(card, 'ATK');
        const currentDEF = BattleCards.calculateCurrentStat(card, 'DEF');
        const currentSPD = BattleCards.calculateCurrentStat(card, 'SPD');
        
        addToBattleLog(`${card.name}:`);
        addToBattleLog(`  - ATK: ${baseATK} -> ${currentATK} (${currentATK - baseATK >= 0 ? '+' : ''}${currentATK - baseATK})`);
        addToBattleLog(`  - DEF: ${baseDEF} -> ${currentDEF} (${currentDEF - baseDEF >= 0 ? '+' : ''}${currentDEF - baseDEF})`);
        addToBattleLog(`  - SPD: ${baseSPD} -> ${currentSPD} (${currentSPD - baseSPD >= 0 ? '+' : ''}${currentSPD - baseSPD})`);
        
        if (card.statusEffects && card.statusEffects.length > 0) {
            addToBattleLog(`  状态效果:`);
            card.statusEffects.forEach(effect => {
                const effectName = BattleCards.getEffectType(effect);
                addToBattleLog(`    - ${effectName}: ${JSON.stringify(effect)}`);
            });
        }
    });
    
    addToBattleLog('敌方卡牌:');
    BattleState.state.enemyCards.forEach(card => {
        const baseATK = card.stats.ATK;
        const baseDEF = card.stats.DEF;
        const baseSPD = card.stats.SPD;
        
        const currentATK = BattleCards.calculateCurrentStat(card, 'ATK');
        const currentDEF = BattleCards.calculateCurrentStat(card, 'DEF');
        const currentSPD = BattleCards.calculateCurrentStat(card, 'SPD');
        
        addToBattleLog(`${card.name}:`);
        addToBattleLog(`  - ATK: ${baseATK} -> ${currentATK} (${currentATK - baseATK >= 0 ? '+' : ''}${currentATK - baseATK})`);
        addToBattleLog(`  - DEF: ${baseDEF} -> ${currentDEF} (${currentDEF - baseDEF >= 0 ? '+' : ''}${currentDEF - baseDEF})`);
        addToBattleLog(`  - SPD: ${baseSPD} -> ${currentSPD} (${currentSPD - baseSPD >= 0 ? '+' : ''}${currentSPD - baseSPD})`);
        
        if (card.statusEffects && card.statusEffects.length > 0) {
            addToBattleLog(`  状态效果:`);
            card.statusEffects.forEach(effect => {
                const effectName = BattleCards.getEffectType(effect);
                addToBattleLog(`    - ${effectName}: ${JSON.stringify(effect)}`);
            });
        }
    });
    
    addToBattleLog('--- 调试结束 ---');
}

// 导出模块
export default {
    displayCards,
    updateTurnDisplay,
    updateActionPanel,
    showCardActions,
    showTargets,
    clearSelectionUI,
    addToBattleLog,
    showMessage,
    showBattleResult,
    initializeBattleUI,
    debugStatusEffects,
    checkMermaidsEffect,
    debugCardStats
}; 