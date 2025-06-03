/**
 * turn-system-adapter.js
 * 适配器文件，实现回合系统功能供测试使用
 */

// 导入战斗状态适配器
const { battleState } = require('./battle-state-adapter');

// 创建适配器对象，独立实现回合系统功能
const turnSystem = {
    // 状态数据
    currentTurn: 'player',
    playerTurnCount: 0,
    enemyTurnCount: 0,
    actedCards: new Set(),
    turnListeners: [],
    
    // 初始化回合系统
    initialize(options = {}) {
        const { playerCards = [], enemyCards = [] } = options;
        
        // 确定先手方
        this.currentTurn = this.determineFirstTurn(playerCards, enemyCards);
        this.playerTurnCount = this.currentTurn === 'player' ? 1 : 0;
        this.enemyTurnCount = this.currentTurn === 'enemy' ? 1 : 0;
        this.actedCards.clear();
        
        // 初始化战斗状态
        if (battleState) {
            // 复制卡牌并添加必要属性
            battleState.playerCards = playerCards.map((card, index) => {
                if (!card.uuid) {
                    card.uuid = `player-${card.id}-${index}`;
                }
                if (typeof card.currentHP === 'undefined') {
                    card.currentHP = card.stats.HP;
                }
                if (typeof card.currentNRG === 'undefined') {
                    card.currentNRG = card.stats.NRG || 3;
                }
                if (!card.statusEffects) {
                    card.statusEffects = [];
                }
                return card;
            });
            
            battleState.enemyCards = enemyCards.map((card, index) => {
                if (!card.uuid) {
                    card.uuid = `enemy-${card.id}-${index}`;
                }
                if (typeof card.currentHP === 'undefined') {
                    card.currentHP = card.stats.HP;
                }
                if (typeof card.currentNRG === 'undefined') {
                    card.currentNRG = card.stats.NRG || 2;
                }
                if (!card.statusEffects) {
                    card.statusEffects = [];
                }
                return card;
            });
            
            battleState.currentTurn = this.currentTurn;
            battleState.playerTurnCount = this.playerTurnCount;
            battleState.enemyTurnCount = this.enemyTurnCount;
            battleState.actedCards = this.actedCards;
        }
        
        return {
            currentTurn: this.currentTurn,
            playerTurnCount: this.playerTurnCount,
            enemyTurnCount: this.enemyTurnCount
        };
    },
    
    // 确定先手方
    determineFirstTurn(playerCards, enemyCards) {
        // 计算玩家卡牌总速度
        const playerSpeed = playerCards.reduce((total, card) => 
            total + (card.stats ? card.stats.SPD || 0 : 0), 0);
            
        // 计算敌方卡牌总速度
        const enemySpeed = enemyCards.reduce((total, card) => 
            total + (card.stats ? card.stats.SPD || 0 : 0), 0);
            
        // 速度高的一方先手，平局时玩家先手
        return playerSpeed >= enemySpeed ? 'player' : 'enemy';
    },
    
    // 开始回合
    startTurn() {
        const side = this.currentTurn;
        const cards = side === 'player' ? battleState.playerCards : battleState.enemyCards;
        const turnCount = side === 'player' ? this.playerTurnCount : this.enemyTurnCount;
        
        // 更新能量
        this.updateEnergy(side);
        
        // 处理回合开始时的状态效果
        this.processStatusEffects('turnStart');
        
        // 通知监听器
        this.notifyTurnListeners('turnStart', { side, turnCount, cards });
        
        return { side, turnCount, cards };
    },
    
    // 结束回合
    endTurn() {
        const previousTurn = this.currentTurn;
        
        // 处理回合结束时的状态效果
        this.processStatusEffects('turnEnd');
        
        // 切换回合
        const newTurn = this.switchTurn();
        
        // 在回合结束时立即移除所有过期效果
        const allCards = [...(battleState.playerCards || []), ...(battleState.enemyCards || [])];
        allCards.forEach(card => {
            if (card && card.statusEffects) {
                // 移除持续时间为0的效果
                card.statusEffects = card.statusEffects.filter(effect => 
                    effect.duration === undefined || effect.duration > 0
                );
            }
        });
        
        return {
            previousTurn,
            currentTurn: newTurn.currentTurn,
            playerTurnCount: this.playerTurnCount,
            enemyTurnCount: this.enemyTurnCount
        };
    },
    
    // 切换回合
    switchTurn() {
        this.actedCards.clear();
        
        const previousTurn = this.currentTurn;
        
        if (this.currentTurn === 'player') {
            this.currentTurn = 'enemy';
            this.enemyTurnCount++;
        } else {
            this.currentTurn = 'player';
            this.playerTurnCount++;
        }
        
        // 更新战斗状态
        if (battleState) {
            battleState.currentTurn = this.currentTurn;
            battleState.playerTurnCount = this.playerTurnCount;
            battleState.enemyTurnCount = this.enemyTurnCount;
        }
        
        // 通知监听器
        this.notifyTurnListeners('turnSwitch', {
            previousTurn,
            currentTurn: this.currentTurn,
            playerTurnCount: this.playerTurnCount,
            enemyTurnCount: this.enemyTurnCount
        });
        
        return {
            previousTurn,
            currentTurn: this.currentTurn,
            playerTurnCount: this.playerTurnCount,
            enemyTurnCount: this.enemyTurnCount
        };
    },
    
    // 标记卡牌已行动
    markCardActed(card) {
        if (card && card.uuid) {
            this.actedCards.add(card.uuid);
            
            // 更新战斗状态
            if (battleState && battleState.actedCards) {
                battleState.actedCards.add(card.uuid);
            }
            
            return true;
        }
        return false;
    },
    
    // 检查卡牌是否已行动
    hasCardActed(card) {
        return card && card.uuid && this.actedCards.has(card.uuid);
    },
    
    // 检查所有卡牌是否都已行动
    checkAllCardsActed() {
        const currentSideCards = this.currentTurn === 'player' 
            ? battleState.playerCards 
            : battleState.enemyCards;
            
        if (!currentSideCards || currentSideCards.length === 0) {
            return false; // 如果没有卡牌，返回false
        }
        
        // 检查所有存活的卡牌是否都已行动
        const aliveCards = currentSideCards.filter(card => card && card.currentHP > 0);
        
        // 如果没有存活的卡牌，返回false
        if (aliveCards.length === 0) {
            return false;
        }
        
        // 检查所有存活卡牌是否都已行动
        const allActed = aliveCards.every(card => this.hasCardActed(card));
        return allActed;
    },
    
    // 更新能量
    updateEnergy(side = null) {
        const targetSide = side || this.currentTurn;
        const cards = targetSide === 'player' ? battleState.playerCards : battleState.enemyCards;
        
        if (cards) {
            cards.forEach(card => {
                if (card && typeof card.currentNRG === 'number' && card.stats && card.stats.NRG) {
                    // 每回合恢复1点能量，但不超过最大能量
                    card.currentNRG = Math.min(card.stats.NRG, card.currentNRG + 1);
                }
            });
        }
    },
    
    // 添加状态效果
    addStatusEffect(card, effect) {
        if (card && effect) {
            if (!card.statusEffects) {
                card.statusEffects = [];
            }
            
            // 清除之前的同名效果
            card.statusEffects = card.statusEffects.filter(e => e.name !== effect.name);
            
            // 添加新效果
            card.statusEffects.push(effect);
            
            // 通知监听器
            this.notifyTurnListeners('statusEffectAdded', { card, effect });
            
            return true;
        }
        return false;
    },
    
    // 移除状态效果
    removeStatusEffect(card, effectIndex) {
        if (card && card.statusEffects) {
            // 如果传入的是索引
            if (typeof effectIndex === 'number' && effectIndex >= 0 && effectIndex < card.statusEffects.length) {
                const removedEffect = card.statusEffects[effectIndex];
                card.statusEffects.splice(effectIndex, 1);
                
                // 通知监听器
                this.notifyTurnListeners('statusEffectRemoved', { 
                    card, 
                    effect: removedEffect
                });
                
                return removedEffect;
            } 
            // 如果传入的是效果名称
            else if (typeof effectIndex === 'string') {
                const effectName = effectIndex;
                const index = card.statusEffects.findIndex(effect => effect.name === effectName);
                
                if (index !== -1) {
                    const removedEffect = card.statusEffects[index];
                    card.statusEffects.splice(index, 1);
                    
                    // 通知监听器
                    this.notifyTurnListeners('statusEffectRemoved', { 
                        card, 
                        effect: removedEffect
                    });
                    
                    return removedEffect;
                }
            }
        }
        return null;
    },
    
    // 处理状态效果
    processStatusEffects(phase = 'turnStart') {
        const allCards = [...(battleState.playerCards || []), ...(battleState.enemyCards || [])];
        
        allCards.forEach(card => {
            if (card && card.statusEffects && card.statusEffects.length > 0) {
                // 处理持续伤害效果
                if (phase === 'turnStart' && card.statusEffects.some(effect => effect.damage)) {
                    const damageEffects = card.statusEffects.filter(effect => effect.damage);
                    damageEffects.forEach(effect => {
                        if (card.currentHP > 0) {
                            const damage = effect.damage || 0;
                            card.currentHP = Math.max(0, card.currentHP - damage);
                            
                            // 在回合开始时将持续时间减1
                            if (effect.duration !== undefined) {
                                effect.duration--;
                            }
                            
                            // 通知监听器
                            this.notifyTurnListeners('statusEffectTriggered', { 
                                card, 
                                effect,
                                damage,
                                type: 'damage'
                            });
                        }
                    });
                }
                
                // 处理效果持续时间和移除过期效果
                if (phase === 'turnEnd') {
                    // 使用filter直接移除过期效果
                    const initialLength = card.statusEffects.length;
                    const expiredEffects = card.statusEffects.filter(effect => 
                        effect.duration !== undefined && effect.duration <= 0
                    );
                    
                    // 更新状态效果数组，保留未过期的效果
                    card.statusEffects = card.statusEffects.filter(effect => 
                        effect.duration === undefined || effect.duration > 0
                    );
                    
                    // 通知每个过期效果的移除
                    expiredEffects.forEach(effect => {
                        this.notifyTurnListeners('statusEffectRemoved', { 
                            card, 
                            effect
                        });
                    });
                }
            }
        });
    },
    
    // 获取当前回合方
    getCurrentTurn() {
        return this.currentTurn;
    },
    
    // 获取当前回合数
    getCurrentTurnNumber() {
        return this.currentTurn === 'player' ? this.playerTurnCount : this.enemyTurnCount;
    },
    
    // 获取总回合数
    getTurnCount() {
        return this.playerTurnCount + this.enemyTurnCount;
    },
    
    // 获取玩家回合数
    getPlayerTurnCount() {
        return this.playerTurnCount;
    },
    
    // 获取敌方回合数
    getEnemyTurnCount() {
        return this.enemyTurnCount;
    },
    
    // 获取当前活跃玩家
    getActivePlayer() {
        if (battleState && typeof battleState.getActiveCard === 'function') {
            return battleState.getActiveCard();
        }
        return null;
    },
    
    // 获取所有状态效果
    getAllStatusEffects() {
        const allEffects = [];
        const allCards = [...(battleState.playerCards || []), ...(battleState.enemyCards || [])];
        
        allCards.forEach(card => {
            if (card && card.statusEffects && card.statusEffects.length > 0) {
                card.statusEffects.forEach(effect => {
                    allEffects.push({
                        card,
                        cardId: card.id,
                        cardUuid: card.uuid,
                        effect
                    });
                });
            }
        });
        
        return allEffects;
    },
    
    // 添加回合监听器
    addTurnListener(listener) {
        if (typeof listener === 'function' && !this.turnListeners.includes(listener)) {
            this.turnListeners.push(listener);
            return true;
        }
        return false;
    },
    
    // 移除回合监听器
    removeTurnListener(listener) {
        const index = this.turnListeners.indexOf(listener);
        if (index !== -1) {
            this.turnListeners.splice(index, 1);
            return true;
        }
        return false;
    },
    
    // 通知所有回合监听器
    notifyTurnListeners(event, data) {
        this.turnListeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                console.error('Error in turn listener:', error);
            }
        });
    }
};

// 为测试提供getActiveCard方法
if (battleState && !battleState.getActiveCard) {
    battleState.getActiveCard = function() {
        return this.currentTurn === 'player' && this.playerCards && this.playerCards.length > 0
            ? this.playerCards[0]
            : this.enemyCards && this.enemyCards.length > 0
                ? this.enemyCards[0]
                : null;
    };
}

// 导出适配器对象，同时支持ES模块和CommonJS格式
if (typeof module !== 'undefined') {
    module.exports = {
        turnSystem
    };
}

if (typeof global !== 'undefined') {
    global.turnSystem = turnSystem;
}

export { turnSystem };