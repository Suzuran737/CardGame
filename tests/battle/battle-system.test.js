/**
 * battle-system.test.js
 * 战斗系统测试
 */

const { battleSystem } = require('../../static/js/battle/battle-system-adapter');
const { battleCards } = require('../../static/js/battle/battle-cards-adapter');
const { turnSystem } = require('../../static/js/battle/turn-system-adapter');

// 模拟卡牌数据
const mockPlayerCard = {
  id: 'p1',
  name: 'Player Card',
  element: 'fire',
  stats: {
    HP: 100,
    ATK: 20,
    DEF: 10,
    SPD: 15,
    CRI: 5,
    NRG: 3
  },
  skills: [
    {
      id: 'skill1',
      name: 'Attack',
      cost: 1,
      effect: {
        damage: 10,
        attackMultiplier: 1.5
      }
    },
    {
      id: 'skill2',
      name: 'Heal',
      cost: 2,
      effect: {
        healing: 20
      }
    }
  ]
};

const mockEnemyCard = {
  id: 'e1',
  name: 'Enemy Card',
  element: 'water',
  stats: {
    HP: 80,
    ATK: 15,
    DEF: 8,
    SPD: 12,
    CRI: 3,
    NRG: 3
  },
  skills: [
    {
      id: 'skill1',
      name: 'Attack',
      cost: 1,
      effect: {
        damage: 8,
        attackMultiplier: 1.2
      }
    },
    {
      id: 'skill2',
      name: 'Poison',
      cost: 2,
      effect: {
        damage: 5,
        statusEffect: {
          name: 'Poison',
          type: 'dot',
          damage: 5,
          duration: 3
        }
      }
    }
  ]
};

describe('战斗系统测试', () => {
  // 每个测试前重置战斗系统
  beforeEach(() => {
    battleSystem.initialize([mockPlayerCard], [mockEnemyCard]);
  });

  test('初始化战斗系统', () => {
    const state = battleSystem.initialize([mockPlayerCard], [mockEnemyCard]);
    
    // 验证初始状态
    expect(state).toBeDefined();
    expect(state.playerCards).toHaveLength(1);
    expect(state.enemyCards).toHaveLength(1);
    expect(state.isActive).toBe(false);
    expect(state.currentPhase).toBe('preparation');
    expect(state.winner).toBeNull();
  });

  test('开始战斗', () => {
    const result = battleSystem.startBattle();
    const state = battleSystem.getBattleState();
    
    expect(result).toBe(true);
    expect(state.isActive).toBe(true);
    expect(state.currentPhase).toBe('battle');
    expect(state.turnCount).toBe(0);
  });

  test('执行技能', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 获取玩家和敌人卡牌
    const playerCard = battleSystem.getPlayerCards()[0];
    const enemyCard = battleSystem.getEnemyCards()[0];
    
    // 模拟当前回合为玩家回合
    jest.spyOn(turnSystem, 'getActivePlayer').mockReturnValue(playerCard);
    
    // 执行攻击技能
    const result = battleSystem.executeSkill(playerCard, 0, enemyCard);
    
    // 验证技能效果
    expect(result).toBeDefined();
    expect(result.damage).toBeGreaterThan(0);
    expect(enemyCard.currentHP).toBeLessThan(enemyCard.stats.HP);
  });

  test('结束当前回合', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 结束当前回合
    const result = battleSystem.endCurrentTurn();
    
    expect(result).toBe(true);
    expect(battleSystem.getBattleState().turnCount).toBe(1);
  });

  test('检查战斗结束 - 玩家胜利', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 获取敌人卡牌并设置生命值为0
    const enemyCard = battleSystem.getEnemyCards()[0];
    battleCards.damageCard(enemyCard, enemyCard.currentHP);
    
    // 检查战斗是否结束
    const result = battleSystem.checkBattleEnd();
    
    expect(result).toBe(true);
    expect(battleSystem.getBattleState().winner).toBe('player');
    expect(battleSystem.getBattleState().isActive).toBe(false);
  });

  test('检查战斗结束 - 敌人胜利', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 获取玩家卡牌并设置生命值为0
    const playerCard = battleSystem.getPlayerCards()[0];
    battleCards.damageCard(playerCard, playerCard.currentHP);
    
    // 检查战斗是否结束
    const result = battleSystem.checkBattleEnd();
    
    expect(result).toBe(true);
    expect(battleSystem.getBattleState().winner).toBe('enemy');
    expect(battleSystem.getBattleState().isActive).toBe(false);
  });

  test('处理技能效果 - 伤害', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 获取玩家和敌人卡牌
    const playerCard = battleSystem.getPlayerCards()[0];
    const enemyCard = battleSystem.getEnemyCards()[0];
    
    // 处理伤害效果
    const effect = { damage: 10, attackMultiplier: 1.5 };
    const result = battleSystem.processSkillEffect(effect, playerCard, enemyCard);
    
    expect(result.damage).toBeGreaterThan(0);
    expect(enemyCard.currentHP).toBeLessThan(enemyCard.stats.HP);
  });

  test('处理技能效果 - 治疗', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 获取玩家卡牌并先造成一些伤害
    const playerCard = battleSystem.getPlayerCards()[0];
    battleCards.damageCard(playerCard, 30);
    const initialHP = playerCard.currentHP;
    
    // 处理治疗效果
    const effect = { healing: 20 };
    const result = battleSystem.processSkillEffect(effect, playerCard, playerCard);
    
    expect(result.healing).toBe(20);
    expect(playerCard.currentHP).toBe(initialHP + 20);
  });

  test('处理技能效果 - 状态效果', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 获取玩家和敌人卡牌
    const playerCard = battleSystem.getPlayerCards()[0];
    const enemyCard = battleSystem.getEnemyCards()[0];
    
    // 处理状态效果
    const effect = { 
      damage: 5,
      statusEffect: {
        name: 'Poison',
        type: 'dot',
        damage: 5,
        duration: 3
      }
    };
    
    const result = battleSystem.processSkillEffect(effect, playerCard, enemyCard);
    
    expect(result.statusEffects).toHaveLength(1);
    expect(enemyCard.statusEffects).toHaveLength(1);
    expect(enemyCard.statusEffects[0].name).toBe('Poison');
  });

  test('处理回合结束时的状态效果', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 获取玩家卡牌
    const playerCard = battleSystem.getPlayerCards()[0];
    
    // 添加持续伤害效果
    battleCards.addStatusEffect(playerCard, {
      name: 'Burn',
      type: 'dot',
      value: 5,
      duration: 2
    });
    
    const initialHP = playerCard.currentHP;
    
    // 处理回合结束效果
    battleSystem.processEndTurnEffects(playerCard);
    
    expect(playerCard.currentHP).toBe(initialHP - 5);
    expect(playerCard.statusEffects[0].duration).toBe(1);
  });

  test('战斗日志记录', () => {
    // 开始战斗
    battleSystem.startBattle();
    
    // 记录一些事件
    battleSystem.logEvent('Test event 1');
    battleSystem.logEvent('Test event 2');
    
    const log = battleSystem.getBattleLog();
    
    expect(log).toHaveLength(3); // 包括战斗开始的日志
    expect(log[1].message).toBe('Test event 1');
    expect(log[2].message).toBe('Test event 2');
  });
}); 