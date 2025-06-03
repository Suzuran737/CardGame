/**
 * battle-system-adapter.js
 * 战斗系统适配器，用于Jest测试
 */

const { battleCards } = require('./battle-cards-adapter');
const { turnSystem } = require('./turn-system-adapter');

/**
 * 战斗系统适配器
 */
const battleSystem = {
  /**
   * 战斗状态
   */
  state: {
    playerCards: [],
    enemyCards: [],
    isActive: false,
    currentPhase: 'preparation', // preparation, battle, result
    winner: null,
    turnCount: 0,
    log: []
  },

  /**
   * 初始化战斗系统
   * @param {Array} playerCardData 玩家卡牌数据
   * @param {Array} enemyCardData 敌方卡牌数据
   */
  initialize(playerCardData, enemyCardData) {
    // 重置状态
    this.state = {
      playerCards: [],
      enemyCards: [],
      isActive: false,
      currentPhase: 'preparation',
      winner: null,
      turnCount: 0,
      log: []
    };

    // 创建玩家卡牌
    if (Array.isArray(playerCardData)) {
      this.state.playerCards = playerCardData.map((data, index) => 
        battleCards.createCard(data, 'player', index)
      ).filter(Boolean);
    }

    // 创建敌方卡牌
    if (Array.isArray(enemyCardData)) {
      this.state.enemyCards = enemyCardData.map((data, index) => 
        battleCards.createCard(data, 'enemy', index)
      ).filter(Boolean);
    }

    // 初始化回合系统
    turnSystem.initialize({
      playerCards: this.state.playerCards,
      enemyCards: this.state.enemyCards
    });

    return this.state;
  },

  /**
   * 开始战斗
   */
  startBattle() {
    if (this.state.isActive) return false;
    
    this.state.isActive = true;
    this.state.currentPhase = 'battle';
    this.state.turnCount = 0;
    
    // 开始第一个回合
    turnSystem.startTurn();
    
    this.logEvent('Battle started');
    return true;
  },

  /**
   * 结束战斗
   * @param {string} winner 胜利方 ('player' 或 'enemy' 或 'draw')
   */
  endBattle(winner) {
    if (!this.state.isActive) return false;
    
    this.state.isActive = false;
    this.state.currentPhase = 'result';
    this.state.winner = winner || this.checkWinner();
    
    this.logEvent(`Battle ended. Winner: ${this.state.winner}`);
    return true;
  },

  /**
   * 执行技能
   * @param {Object} sourceCard 使用技能的卡牌
   * @param {number} skillIndex 技能索引
   * @param {Object} targetCard 目标卡牌
   * @returns {Object|null} 技能执行结果
   */
  executeSkill(sourceCard, skillIndex, targetCard) {
    if (!this.state.isActive || !sourceCard || !targetCard) return null;

    // 检查是否是当前活跃卡牌的回合
    const activeCard = turnSystem.getActivePlayer();
    if (sourceCard !== activeCard) {
      this.logEvent('Not this card\'s turn');
      return null;
    }

    // 使用技能
    const skillEffect = battleCards.useSkill(sourceCard, skillIndex);
    if (!skillEffect) {
      this.logEvent(`${sourceCard.name} failed to use skill`);
      return null;
    }

    // 处理技能效果
    const result = this.processSkillEffect(skillEffect, sourceCard, targetCard);
    
    this.logEvent(`${sourceCard.name} used skill on ${targetCard.name}`);
    
    // 检查战斗是否结束
    this.checkBattleEnd();
    
    return result;
  },

  /**
   * 处理技能效果
   * @param {Object} effect 技能效果
   * @param {Object} source 源卡牌
   * @param {Object} target 目标卡牌
   * @returns {Object} 处理结果
   */
  processSkillEffect(effect, source, target) {
    if (!effect) return null;

    const result = {
      damage: 0,
      healing: 0,
      statusEffects: []
    };

    // 处理伤害
    if (effect.damage) {
      // 简单的伤害计算，实际游戏中可能更复杂
      const baseDamage = effect.damage;
      const attackMultiplier = effect.attackMultiplier || 1;
      const calculatedDamage = Math.floor(baseDamage + (source.stats.ATK * attackMultiplier));
      
      // 应用防御减免
      const defenseReduction = target.stats.DEF / 100;
      const finalDamage = Math.max(1, Math.floor(calculatedDamage * (1 - defenseReduction)));
      
      result.damage = battleCards.damageCard(target, finalDamage);
      this.logEvent(`${source.name} dealt ${result.damage} damage to ${target.name}`);
    }

    // 处理治疗
    if (effect.healing) {
      const healing = effect.healing;
      result.healing = battleCards.healCard(target, healing);
      this.logEvent(`${source.name} healed ${target.name} for ${result.healing} HP`);
    }

    // 处理状态效果
    if (effect.statusEffect) {
      battleCards.addStatusEffect(target, effect.statusEffect);
      result.statusEffects.push(effect.statusEffect);
      this.logEvent(`${source.name} applied ${effect.statusEffect.name} to ${target.name}`);
    }

    return result;
  },

  /**
   * 结束当前回合
   */
  endCurrentTurn() {
    if (!this.state.isActive) return false;
    
    // 处理回合结束时的状态效果
    const activeCard = turnSystem.getActivePlayer();
    if (activeCard) {
      this.processEndTurnEffects(activeCard);
    }
    
    // 结束当前回合
    turnSystem.endTurn();
    
    // 开始新回合
    turnSystem.startTurn();
    
    this.state.turnCount++;
    this.logEvent(`Turn ${this.state.turnCount} started`);
    
    // 检查战斗是否结束
    this.checkBattleEnd();
    
    return true;
  },

  /**
   * 处理回合结束时的状态效果
   * @param {Object} card 卡牌
   */
  processEndTurnEffects(card) {
    if (!card || !card.statusEffects) return;
    
    // 处理持续伤害等效果
    card.statusEffects.forEach((effect, index) => {
      if (effect.type === 'dot') {  // Damage over time
        const damage = battleCards.damageCard(card, effect.value);
        this.logEvent(`${card.name} took ${damage} damage from ${effect.name}`);
      }
      
      // 减少持续时间
      if (effect.duration) {
        effect.duration--;
        
        // 移除已过期的效果
        if (effect.duration <= 0) {
          battleCards.removeStatusEffect(card, index);
          this.logEvent(`${effect.name} effect expired on ${card.name}`);
        }
      }
    });
    
    // 恢复一些能量
    const energyRestored = battleCards.restoreEnergy(card, 1);
    if (energyRestored > 0) {
      this.logEvent(`${card.name} restored ${energyRestored} energy`);
    }
  },

  /**
   * 检查战斗是否结束
   * @returns {boolean} 战斗是否结束
   */
  checkBattleEnd() {
    if (!this.state.isActive) return false;
    
    const playerAlive = this.state.playerCards.some(card => battleCards.isCardAlive(card));
    const enemyAlive = this.state.enemyCards.some(card => battleCards.isCardAlive(card));
    
    if (!playerAlive && !enemyAlive) {
      this.endBattle('draw');
      return true;
    } else if (!playerAlive) {
      this.endBattle('enemy');
      return true;
    } else if (!enemyAlive) {
      this.endBattle('player');
      return true;
    }
    
    return false;
  },

  /**
   * 检查胜利方
   * @returns {string} 胜利方 ('player', 'enemy', 'draw', 或 null)
   */
  checkWinner() {
    const playerAlive = this.state.playerCards.some(card => battleCards.isCardAlive(card));
    const enemyAlive = this.state.enemyCards.some(card => battleCards.isCardAlive(card));
    
    if (!playerAlive && !enemyAlive) {
      return 'draw';
    } else if (!playerAlive) {
      return 'enemy';
    } else if (!enemyAlive) {
      return 'player';
    }
    
    return null;
  },

  /**
   * 记录事件
   * @param {string} message 事件消息
   */
  logEvent(message) {
    if (!message) return;
    
    this.state.log.push({
      turn: this.state.turnCount,
      message: message,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * 获取战斗日志
   * @returns {Array} 战斗日志
   */
  getBattleLog() {
    return [...this.state.log];
  },

  /**
   * 获取战斗状态
   * @returns {Object} 战斗状态
   */
  getBattleState() {
    return { ...this.state };
  },

  /**
   * 获取卡牌
   * @param {string} side 所属方 ('player' 或 'enemy')
   * @param {number} index 卡牌索引
   * @returns {Object|null} 卡牌对象
   */
  getCard(side, index) {
    if (side === 'player') {
      return this.state.playerCards[index] || null;
    } else if (side === 'enemy') {
      return this.state.enemyCards[index] || null;
    }
    return null;
  },

  /**
   * 获取所有玩家卡牌
   * @returns {Array} 玩家卡牌数组
   */
  getPlayerCards() {
    return [...this.state.playerCards];
  },

  /**
   * 获取所有敌方卡牌
   * @returns {Array} 敌方卡牌数组
   */
  getEnemyCards() {
    return [...this.state.enemyCards];
  }
};

// 导出战斗系统适配器
module.exports = { battleSystem }; 