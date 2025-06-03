/**
 * battle-main-adapter.js
 * 适配器文件，提供战斗主模块的测试版本，用于Jest测试
 */

// 导入依赖
const { battleState } = require('./battle-state-adapter');
const { battleUI } = require('./battle-ui-adapter');
const { battleActions } = require('./battle-actions-adapter');

/**
 * 战斗主模块适配器
 * 提供战斗初始化和协调功能的测试版本
 */
const battleMain = {
  // 战斗状态
  battleState: null,
  turnSystem: null,
  battleUI: null,
  battleLog: [],
  isPlayerTurn: true,
  isBattleActive: false,
  
  /**
   * 初始化战斗系统
   * @param {Object} battleState - 战斗状态对象
   * @param {Object} turnSystem - 回合系统对象
   * @param {Object} battleUI - 战斗UI对象
   * @returns {Object} - 初始化后的战斗系统状态
   */
  initialize(battleState, turnSystem, battleUI) {
    this.battleState = battleState;
    this.turnSystem = turnSystem;
    this.battleUI = battleUI;
    this.battleLog = [];
    this.isPlayerTurn = true;
    this.isBattleActive = false;
    
    return {
      battleState: this.battleState,
      turnSystem: this.turnSystem,
      battleUI: this.battleUI,
      isInitialized: true
    };
  },
  
  /**
   * 开始战斗
   * @param {Array} playerCards - 玩家卡牌数组
   * @param {Array} enemyCards - 敌方卡牌数组
   * @returns {Object} - 战斗开始后的状态
   */
  startBattle(playerCards, enemyCards) {
    if (!this.battleState || !this.turnSystem || !this.battleUI) {
      throw new Error('战斗系统未初始化');
    }
    
    // 设置战斗状态
    const cardCount = this.battleState.setupBattle(playerCards, enemyCards);
    
    // 初始化回合系统
    const turnInfo = this.turnSystem.initialize(playerCards, enemyCards);
    this.isPlayerTurn = turnInfo.currentTurn === 'player';
    
    // 初始化UI
    this.battleUI.setupBattleUI(playerCards, enemyCards);
    
    // 记录战斗开始
    this.logEvent('战斗开始', { playerCards, enemyCards, firstTurn: turnInfo.currentTurn });
    
    // 激活战斗
    this.isBattleActive = true;
    this.battleState.startBattle();
    
    return {
      cardCount,
      turnInfo,
      isActive: this.isBattleActive,
      currentTurn: this.isPlayerTurn ? 'player' : 'enemy'
    };
  },
  
  /**
   * 执行技能
   * @param {Object} card - 使用技能的卡牌
   * @param {Object} skill - 使用的技能
   * @param {Object} target - 技能目标
   * @returns {Object} - 技能执行结果
   */
  executeSkill(card, skill, target) {
    if (!this.isBattleActive) {
      throw new Error('战斗未激活');
    }
    
    // 检查是否是当前回合方的卡牌
    const cardSide = this.battleState.getPlayerCards().includes(card) ? 'player' : 'enemy';
    if ((this.isPlayerTurn && cardSide !== 'player') || (!this.isPlayerTurn && cardSide !== 'enemy')) {
      throw new Error('不是当前回合方的卡牌');
    }
    
    // 检查卡牌是否有足够能量
    if (card.currentNRG < skill.cost) {
      throw new Error('能量不足');
    }
    
    // 执行技能
    const result = this.battleActions.executeSkill(card, skill, target);
    
    // 更新UI
    this.battleUI.updateCardStatus(card);
    this.battleUI.updateCardStatus(target);
    
    // 记录技能使用
    this.logEvent('技能使用', { card: card.name, skill: skill.name, target: target.name, result });
    
    // 标记卡牌已行动
    this.turnSystem.markCardAsActed(card);
    
    // 检查战斗结果
    const battleResult = this.checkBattleResult();
    if (battleResult !== 'ongoing') {
      this.endBattle(battleResult);
      return { ...result, battleResult };
    }
    
    return result;
  },
  
  /**
   * 结束当前回合
   * @returns {Object} - 回合结束后的状态
   */
  endCurrentTurn() {
    if (!this.isBattleActive) {
      throw new Error('战斗未激活');
    }
    
    // 结束当前回合
    const turnResult = this.turnSystem.endTurn();
    
    // 更新当前回合方
    this.isPlayerTurn = turnResult.currentTurn === 'player';
    
    // 更新UI
    this.battleUI.updateTurnIndicator(this.isPlayerTurn);
    
    // 记录回合结束
    this.logEvent('回合结束', { 
      previousTurn: turnResult.previousTurn, 
      currentTurn: turnResult.currentTurn,
      playerTurnCount: turnResult.playerTurnCount,
      enemyTurnCount: turnResult.enemyTurnCount
    });
    
    // 如果是AI回合，执行AI行动
    if (!this.isPlayerTurn) {
      this.executeAITurn();
    }
    
    return turnResult;
  },
  
  /**
   * 执行AI回合
   * @returns {Array} - AI行动结果数组
   */
  executeAITurn() {
    if (!this.isBattleActive || this.isPlayerTurn) {
      return [];
    }
    
    const results = [];
    const enemyCards = this.battleState.getEnemyCards().filter(card => card.currentHP > 0);
    const playerCards = this.battleState.getPlayerCards().filter(card => card.currentHP > 0);
    
    // 对每张未行动的敌方卡牌执行AI行动
    for (const card of enemyCards) {
      if (this.turnSystem.hasCardActed(card)) {
        continue;
      }
      
      // 简单AI：随机选择技能和目标
      if (card.skills && card.skills.length > 0) {
        // 过滤出可用的技能（能量足够）
        const availableSkills = card.skills.filter(skill => card.currentNRG >= skill.cost);
        
        if (availableSkills.length > 0) {
          // 随机选择一个技能
          const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
          
          // 选择目标（假设所有技能都以敌方为目标）
          if (playerCards.length > 0) {
            const target = playerCards[Math.floor(Math.random() * playerCards.length)];
            
            // 执行技能
            const result = this.executeSkill(card, skill, target);
            results.push(result);
            
            // 检查战斗是否结束
            if (result.battleResult && result.battleResult !== 'ongoing') {
              break;
            }
          }
        }
      }
    }
    
    // 结束AI回合
    this.endCurrentTurn();
    
    return results;
  },
  
  /**
   * 检查战斗结果
   * @returns {string} - 战斗结果：'player_win', 'enemy_win', 'ongoing'
   */
  checkBattleResult() {
    if (!this.isBattleActive) {
      return 'not_started';
    }
    
    return this.battleState.checkBattleResult();
  },
  
  /**
   * 结束战斗
   * @param {string} result - 战斗结果
   * @returns {Object} - 战斗结束状态
   */
  endBattle(result) {
    if (!this.isBattleActive) {
      throw new Error('战斗未激活');
    }
    
    // 设置战斗为非激活状态
    this.isBattleActive = false;
    
    // 结束战斗状态
    const battleResult = this.battleState.endBattle(result);
    
    // 更新UI
    this.battleUI.showBattleResult(result);
    
    // 记录战斗结束
    this.logEvent('战斗结束', { result, battleState: this.getBattleState() });
    
    return {
      result,
      playerCards: this.battleState.getPlayerCards(),
      enemyCards: this.battleState.getEnemyCards(),
      turnCount: {
        player: this.turnSystem.getPlayerTurnCount(),
        enemy: this.turnSystem.getEnemyTurnCount()
      },
      log: this.getBattleLog()
    };
  },
  
  /**
   * 记录事件
   * @param {string} type - 事件类型
   * @param {Object} data - 事件数据
   */
  logEvent(type, data) {
    this.battleLog.push({
      type,
      timestamp: new Date().getTime(),
      data
    });
  },
  
  /**
   * 获取战斗日志
   * @returns {Array} - 战斗日志数组
   */
  getBattleLog() {
    return [...this.battleLog];
  },
  
  /**
   * 获取战斗状态
   * @returns {Object} - 当前战斗状态
   */
  getBattleState() {
    return {
      isActive: this.isBattleActive,
      currentTurn: this.isPlayerTurn ? 'player' : 'enemy',
      playerCards: this.battleState ? this.battleState.getPlayerCards() : [],
      enemyCards: this.battleState ? this.battleState.getEnemyCards() : [],
      turnCount: this.turnSystem ? {
        player: this.turnSystem.getPlayerTurnCount(),
        enemy: this.turnSystem.getEnemyTurnCount()
      } : { player: 0, enemy: 0 }
    };
  },
  
  /**
   * 重置战斗系统
   */
  reset() {
    this.battleState = null;
    this.turnSystem = null;
    this.battleUI = null;
    this.battleLog = [];
    this.isPlayerTurn = true;
    this.isBattleActive = false;
  }
};

// 战斗行动适配器（简化版，实际应该导入）
battleMain.battleActions = {
  executeSkill(card, skill, target) {
    // 消耗能量
    card.currentNRG -= skill.cost;
    
    let damage = 0;
    let healing = 0;
    let statusEffects = [];
    
    // 处理伤害
    if (skill.damage) {
      damage = this.calculateDamage(card, skill, target);
      target.currentHP = Math.max(0, target.currentHP - damage);
    }
    
    // 处理治疗
    if (skill.healing) {
      healing = this.calculateHealing(card, skill);
      card.currentHP = Math.min(card.stats.maxHP, card.currentHP + healing);
    }
    
    // 处理状态效果
    if (skill.statusEffects && skill.statusEffects.length > 0) {
      statusEffects = this.applyStatusEffects(card, skill, target);
    }
    
    return {
      caster: card.id,
      skill: skill.id,
      target: target.id,
      damage,
      healing,
      statusEffects,
      targetRemainingHP: target.currentHP,
      casterRemainingNRG: card.currentNRG
    };
  },
  
  calculateDamage(card, skill, target) {
    // 简化的伤害计算
    const baseDamage = skill.damage;
    const attackStat = card.stats.attack || 1;
    const defenseStat = target.stats.defense || 1;
    
    // 基础伤害 * 攻击力 / 防御力
    let damage = Math.round(baseDamage * attackStat / defenseStat);
    
    // 确保至少造成1点伤害
    return Math.max(1, damage);
  },
  
  calculateHealing(card, skill) {
    // 简化的治疗计算
    const baseHealing = skill.healing;
    const wisdomStat = card.stats.wisdom || 1;
    
    // 基础治疗 * 智慧
    return Math.round(baseHealing * wisdomStat);
  },
  
  applyStatusEffects(card, skill, target) {
    const appliedEffects = [];
    
    if (skill.statusEffects && skill.statusEffects.length > 0) {
      for (const effect of skill.statusEffects) {
        // 添加状态效果到目标
        const appliedEffect = {
          ...effect,
          source: card.id,
          remainingTurns: effect.duration
        };
        
        // 添加到目标的状态效果列表
        if (!target.statusEffects) {
          target.statusEffects = [];
        }
        
        target.statusEffects.push(appliedEffect);
        appliedEffects.push(appliedEffect);
      }
    }
    
    return appliedEffects;
  }
};

// 导出战斗主模块适配器
module.exports = { battleMain }; 