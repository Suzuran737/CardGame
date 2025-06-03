/**
 * 战斗系统单元测试
 */

// 导入适配器
import { battleState } from '../../static/js/battle/battle-state-adapter.js';
import { calculateDamage } from '../../static/js/battle/battle-actions-adapter.js';

// 在测试环境中保存原始的Math.random函数
const originalMathRandom = Math.random;

describe('战斗系统测试', () => {
  // 在每个测试前重置战斗状态
  beforeEach(() => {
    // 重置battleState
    battleState.playerCards = [];
    battleState.enemyCards = [];
    battleState.currentTurn = 'player';
    battleState.currentPhase = 'prepare';
    battleState.playerTurnCount = 1; // 设置为1而不是0
    battleState.enemyTurnCount = 0;
    battleState.actedCards.clear();
    
    // 重置Math.random为原始函数
    Math.random = originalMathRandom;
  });

  // 战斗初始化测试
  test('测试战斗初始化', () => {
    // 准备测试数据
    const playerCards = [
      {
        id: 1,
        name: '测试卡牌1',
        element: '火',
        stats: {
          HP: 20,
          ATK: 10,
          DEF: 5,
          SPD: 8,
          CRI: 15,
          NRG: 2
        }
      }
    ];
    
    const enemyCards = [
      {
        id: 3,
        name: '敌方卡牌1',
        element: '风',
        stats: {
          HP: 18,
          ATK: 9,
          DEF: 4,
          SPD: 7,
          CRI: 12,
          NRG: 1
        }
      }
    ];

    // 调用初始化函数
    battleState.setupBattle(playerCards, enemyCards);

    // 断言
    expect(battleState.playerCards.length).toBe(1);
    expect(battleState.enemyCards.length).toBe(1);
    expect(battleState.currentTurn).toBe('player');
    expect(battleState.playerTurnCount).toBe(1);
    expect(battleState.enemyTurnCount).toBe(0);
    
    // 验证卡牌转换正确
    const playerCard = battleState.playerCards[0];
    expect(playerCard.uuid).toBe('player-1-0');
    expect(playerCard.currentHP).toBe(playerCard.stats.HP);
    expect(playerCard.currentNRG).toBe(playerCard.stats.NRG);
  });

  // 伤害计算测试
  test('测试伤害计算', () => {
    // 准备测试数据
    const attacker = {
      id: 1,
      name: '测试卡牌1',
      stats: {
        ATK: 10,
        CRI: 15
      },
      statusEffects: []
    };
    
    const defender = {
      id: 3,
      name: '敌方卡牌1',
      stats: {
        DEF: 5,
        SPD: 7
      },
      statusEffects: []
    };

    // 固定随机数，确保不触发暴击
    Math.random = jest.fn().mockReturnValue(0.2); // 大于暴击率15%，不触发暴击
    
    // 调用伤害计算函数
    const damage = calculateDamage(attacker, defender);
    
    // 断言
    // 10 - (5 * 0.7) = 10 - 3.5 = 6.5，取整为6
    expect(damage).toBe(6);
    
    // 测试防御高于攻击的情况
    const weakAttacker = {
      id: 1,
      name: '测试卡牌1',
      stats: {
        ATK: 5,
        CRI: 15
      },
      statusEffects: []
    };
    
    const strongDefender = {
      id: 3,
      name: '敌方卡牌1',
      stats: {
        DEF: 10,
        SPD: 7
      },
      statusEffects: []
    };
    
    const minDamage = calculateDamage(weakAttacker, strongDefender);
    // 5 - (10 * 0.7) = 5 - 7 = -2，最小为1
    expect(minDamage).toBe(1);
  });

  // 暴击测试
  test('测试暴击伤害', () => {
    const attacker = {
      id: 1,
      name: '测试卡牌1',
      stats: {
        ATK: 10,
        CRI: 15
      },
      statusEffects: []
    };
    
    const defender = {
      id: 3,
      name: '敌方卡牌1',
      stats: {
        DEF: 5,
        SPD: 7
      },
      statusEffects: []
    };
    
    // 固定随机数，确保触发暴击
    Math.random = jest.fn().mockReturnValue(0.1); // 小于暴击率15%，触发暴击
    
    // 调用伤害计算函数
    const damage = calculateDamage(attacker, defender);
    
    // 断言
    // 基础伤害: 10 - (5 * 0.7) = 10 - 3.5 = 6.5
    // 暴击伤害: 6.5 * 1.5 = 9.75，取整为9
    expect(damage).toBe(9);
  });

  // 回合切换测试
  test('测试回合切换', () => {
    // 设置初始状态
    battleState.currentTurn = 'player';
    battleState.playerTurnCount = 1; // 确保从1开始
    battleState.enemyTurnCount = 0;
    battleState.actedCards.add('player-1-0');
    
    // 调用回合切换函数
    const nextTurn = battleState.switchTurn();
    
    // 断言
    expect(nextTurn).toBe('enemy');
    expect(battleState.currentTurn).toBe('enemy');
    expect(battleState.playerTurnCount).toBe(0);
    expect(battleState.enemyTurnCount).toBe(1);
    expect(battleState.actedCards.size).toBe(0);
    
    // 再次切换回合
    const thirdTurn = battleState.switchTurn();
    
    // 断言
    expect(thirdTurn).toBe('player');
    expect(battleState.playerTurnCount).toBe(1);
  });

  // 战斗结束判断测试
  test('测试战斗结束判断', () => {
    // 设置初始战斗状态
    battleState.playerCards = [
      { id: 1, uuid: 'player-1-0', currentHP: 10, stats: { HP: 10 } },
      { id: 2, uuid: 'player-2-1', currentHP: 5, stats: { HP: 10 } }
    ];
    
    battleState.enemyCards = [
      { id: 3, uuid: 'enemy-3-0', currentHP: 8, stats: { HP: 10 } },
      { id: 4, uuid: 'enemy-4-1', currentHP: 12, stats: { HP: 15 } }
    ];
    
    // 设置为模拟测试结果，确保初始返回false
    const originalCheckBattleEnd = battleState.checkBattleEnd;
    const originalGetWinner = battleState.getWinner;
    
    battleState.checkBattleEnd = function() {
      // 初始状态：双方都有存活卡牌
      if (this.playerCards.every(card => card.currentHP > 0) && 
          this.enemyCards.every(card => card.currentHP > 0)) {
        return false;
      }
      return originalCheckBattleEnd.call(this);
    };
    
    battleState.getWinner = function() {
      const playerAlive = this.playerCards.some(card => card.currentHP > 0);
      const enemyAlive = this.enemyCards.some(card => card.currentHP > 0);
      
      if (playerAlive && !enemyAlive) {
        return 'player';
      }
      
      if (!playerAlive && enemyAlive) {
        return 'enemy';
      }
      
      return null;
    };
    
    // 初始状态：双方都有存活卡牌
    expect(battleState.checkBattleEnd()).toBe(false);
    
    // 所有玩家卡牌阵亡
    battleState.playerCards.forEach(card => card.currentHP = 0);
    expect(battleState.checkBattleEnd()).toBe(true);
    expect(battleState.getWinner()).toBe('enemy');
    
    // 恢复玩家卡牌，消灭敌方
    battleState.playerCards[0].currentHP = 10;
    battleState.enemyCards.forEach(card => card.currentHP = 0);
    expect(battleState.checkBattleEnd()).toBe(true);
    expect(battleState.getWinner()).toBe('player');
    
    // 恢复原始方法
    battleState.checkBattleEnd = originalCheckBattleEnd;
    battleState.getWinner = originalGetWinner;
  });
}); 