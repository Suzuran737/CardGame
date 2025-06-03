/**
 * turn-system.test.js
 * 回合系统适配器测试
 */

const { turnSystem } = require('../../static/js/battle/turn-system-adapter');
const { battleState } = require('../../static/js/battle/battle-state-adapter');

// 模拟玩家卡牌数据
const mockPlayerCards = [
  {
    id: 'p1',
    name: 'Player Card 1',
    element: 'fire',
    stats: {
      HP: 100,
      ATK: 20,
      DEF: 10,
      SPD: 15,
      CRI: 5,
      NRG: 3
    },
    currentHP: 100,
    currentNRG: 3,
    statusEffects: [],
    uuid: 'player-p1-0',
    skills: []
  },
  {
    id: 'p2',
    name: 'Player Card 2',
    element: 'water',
    stats: {
      HP: 80,
      ATK: 15,
      DEF: 12,
      SPD: 18,
      CRI: 8,
      NRG: 4
    },
    currentHP: 80,
    currentNRG: 4,
    statusEffects: [],
    uuid: 'player-p2-1',
    skills: []
  }
];

// 模拟敌方卡牌数据
const mockEnemyCards = [
  {
    id: 'e1',
    name: 'Enemy Card 1',
    element: 'earth',
    stats: {
      HP: 90,
      ATK: 18,
      DEF: 8,
      SPD: 12,
      CRI: 4,
      NRG: 3
    },
    currentHP: 90,
    currentNRG: 3,
    statusEffects: [],
    uuid: 'enemy-e1-0',
    skills: []
  }
];

describe('回合系统适配器测试', () => {
  // 每个测试前重置回合系统
  beforeEach(() => {
    // 重置回合系统
    turnSystem.initialize({
      playerCards: mockPlayerCards,
      enemyCards: mockEnemyCards
    });
    
    // 清空已行动卡牌记录
    battleState.actedCards = new Set();
  });

  test('初始化回合系统', () => {
    const result = turnSystem.initialize({
      playerCards: mockPlayerCards,
      enemyCards: mockEnemyCards
    });
    
    expect(result).toBeDefined();
    expect(result.currentTurn).toBe('player'); // 由于玩家卡牌速度更高
    expect(result.playerTurnCount).toBe(1);
    expect(result.enemyTurnCount).toBe(0);
  });

  test('确定先手方 - 玩家速度更高', () => {
    const result = turnSystem.determineFirstTurn(mockPlayerCards, mockEnemyCards);
    expect(result).toBe('player');
  });

  test('确定先手方 - 敌方速度更高', () => {
    const fastEnemyCards = [
      {
        ...mockEnemyCards[0],
        stats: { ...mockEnemyCards[0].stats, SPD: 50 }
      }
    ];
    
    const result = turnSystem.determineFirstTurn(mockPlayerCards, fastEnemyCards);
    expect(result).toBe('enemy');
  });

  test('开始回合', () => {
    const result = turnSystem.startTurn();
    
    expect(result).toBeDefined();
    expect(result.side).toBe('player');
    expect(result.turnCount).toBe(1);
    expect(result.cards).toHaveLength(2);
  });

  test('结束回合', () => {
    const result = turnSystem.endTurn();
    
    expect(result).toBeDefined();
    expect(result.previousTurn).toBe('player');
    expect(result.currentTurn).toBe('enemy');
    expect(result.playerTurnCount).toBe(1);
    expect(result.enemyTurnCount).toBe(1);
  });

  test('切换回合', () => {
    const result = turnSystem.switchTurn();
    
    expect(result).toBeDefined();
    expect(result.previousTurn).toBe('player');
    expect(result.currentTurn).toBe('enemy');
    expect(result.playerTurnCount).toBe(1);
    expect(result.enemyTurnCount).toBe(1);
  });

  test('标记卡牌已行动', () => {
    turnSystem.markCardActed(mockPlayerCards[0]);
    
    expect(battleState.actedCards.has(mockPlayerCards[0].uuid)).toBe(true);
  });

  test('检查卡牌是否已行动', () => {
    turnSystem.markCardActed(mockPlayerCards[0]);
    
    expect(turnSystem.hasCardActed(mockPlayerCards[0])).toBe(true);
    expect(turnSystem.hasCardActed(mockPlayerCards[1])).toBe(false);
  });

  test('检查所有卡牌是否都已行动', () => {
    expect(turnSystem.checkAllCardsActed()).toBe(false);
    
    turnSystem.markCardActed(mockPlayerCards[0]);
    expect(turnSystem.checkAllCardsActed()).toBe(false);
    
    turnSystem.markCardActed(mockPlayerCards[1]);
    expect(turnSystem.checkAllCardsActed()).toBe(true);
  });

  test('更新能量', () => {
    // 先消耗一些能量
    mockPlayerCards[0].currentNRG = 1;
    mockPlayerCards[1].currentNRG = 2;
    
    turnSystem.updateEnergy();
    
    expect(mockPlayerCards[0].currentNRG).toBe(2);
    expect(mockPlayerCards[1].currentNRG).toBe(3);
  });

  test('添加状态效果', () => {
    const effect = {
      name: 'Burn',
      type: 'dot',
      damage: 5,
      duration: 3
    };
    
    // 添加监听器以测试通知
    const listener = jest.fn();
    turnSystem.addTurnListener(listener);
    
    turnSystem.addStatusEffect(mockPlayerCards[0], effect);
    
    expect(mockPlayerCards[0].statusEffects).toHaveLength(1);
    expect(mockPlayerCards[0].statusEffects[0]).toEqual(effect);
    expect(listener).toHaveBeenCalledWith('statusEffectAdded', {
      card: mockPlayerCards[0],
      effect
    });
  });

  test('移除状态效果', () => {
    const effect = {
      name: 'Burn',
      type: 'dot',
      damage: 5,
      duration: 3
    };
    
    // 添加状态效果
    turnSystem.addStatusEffect(mockPlayerCards[0], effect);
    
    // 添加监听器以测试通知
    const listener = jest.fn();
    turnSystem.addTurnListener(listener);
    
    const removed = turnSystem.removeStatusEffect(mockPlayerCards[0], 0);
    
    expect(removed).toEqual(effect);
    expect(mockPlayerCards[0].statusEffects).toHaveLength(0);
    expect(listener).toHaveBeenCalledWith('statusEffectRemoved', {
      card: mockPlayerCards[0],
      effect
    });
  });

  test('处理状态效果', () => {
    const effect = {
      name: 'Burn',
      type: 'dot',
      damage: 5,
      duration: 2 // 设置为2，因为在回合开始时会减1
    };
    
    // 添加状态效果
    turnSystem.addStatusEffect(mockPlayerCards[0], effect);
    
    // 添加监听器以测试通知
    const listener = jest.fn();
    turnSystem.addTurnListener(listener);
    
    const initialHP = mockPlayerCards[0].currentHP;
    
    // 处理回合开始时的状态效果
    turnSystem.processStatusEffects('turnStart');
    
    // 验证伤害已应用，持续时间已减少
    expect(mockPlayerCards[0].currentHP).toBe(initialHP - 5);
    expect(mockPlayerCards[0].statusEffects[0].duration).toBe(1); // 处理后duration从2减为1
    expect(listener).toHaveBeenCalledWith('statusEffectTriggered', expect.objectContaining({ 
      card: mockPlayerCards[0],
      type: 'damage'
    }));
  });

  test('处理状态效果 - 效果过期', () => {
    const effect = {
      name: 'Burn',
      type: 'dot',
      damage: 5,
      duration: 1 // 只剩1回合，处理后应该为0，并在回合结束时移除
    };
    
    // 添加状态效果
    turnSystem.addStatusEffect(mockPlayerCards[0], effect);
    
    // 处理回合开始时的状态效果，减少duration
    turnSystem.processStatusEffects('turnStart');
    
    // 此时duration应为0，但效果尚未移除
    expect(mockPlayerCards[0].statusEffects[0].duration).toBe(0);
    
    // 处理回合结束时的状态效果，移除已过期的效果
    turnSystem.processStatusEffects('turnEnd');
    
    // 验证效果已移除
    expect(mockPlayerCards[0].statusEffects).toHaveLength(0);
  });

  test('获取当前回合数', () => {
    expect(turnSystem.getCurrentTurnNumber()).toBe(1);
    
    turnSystem.switchTurn();
    expect(turnSystem.getCurrentTurnNumber()).toBe(1);
    
    turnSystem.switchTurn();
    expect(turnSystem.getCurrentTurnNumber()).toBe(2);
  });

  test('获取当前活跃玩家', () => {
    // 模拟battleState.getActiveCard方法
    jest.spyOn(battleState, 'getActiveCard').mockReturnValue(mockPlayerCards[0]);
    
    const activePlayer = turnSystem.getActivePlayer();
    
    expect(activePlayer).toEqual(mockPlayerCards[0]);
  });

  test('获取所有状态效果', () => {
    const effect1 = {
      name: 'Burn',
      type: 'dot',
      damage: 5,
      duration: 3
    };
    
    const effect2 = {
      name: 'Poison',
      type: 'dot',
      damage: 3,
      duration: 2
    };
    
    // 添加状态效果
    turnSystem.addStatusEffect(mockPlayerCards[0], effect1);
    turnSystem.addStatusEffect(mockEnemyCards[0], effect2);
    
    const allEffects = turnSystem.getAllStatusEffects();
    
    expect(allEffects).toHaveLength(2);
    expect(allEffects[0].effect).toEqual(effect1);
    expect(allEffects[0].card).toEqual(mockPlayerCards[0]);
    expect(allEffects[1].effect).toEqual(effect2);
    expect(allEffects[1].card).toEqual(mockEnemyCards[0]);
  });

  test('添加和移除回合监听器', () => {
    const listener = jest.fn();
    
    turnSystem.addTurnListener(listener);
    turnSystem.notifyTurnListeners('test', { data: 'test' });
    
    expect(listener).toHaveBeenCalledWith('test', { data: 'test' });
    
    // 重置模拟函数
    listener.mockReset();
    
    // 移除监听器
    const removed = turnSystem.removeTurnListener(listener);
    expect(removed).toBe(true);
    
    // 再次通知，不应该被调用
    turnSystem.notifyTurnListeners('test', { data: 'test' });
    expect(listener).not.toHaveBeenCalled();
  });

  test('通知回合监听器 - 处理错误', () => {
    // 创建一个会抛出错误的监听器
    const errorListener = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    
    // 添加一个正常的监听器和一个会抛出错误的监听器
    const normalListener = jest.fn();
    turnSystem.addTurnListener(normalListener);
    turnSystem.addTurnListener(errorListener);
    
    // 捕获控制台错误
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // 通知监听器
    turnSystem.notifyTurnListeners('test', { data: 'test' });
    
    // 验证正常的监听器被调用
    expect(normalListener).toHaveBeenCalledWith('test', { data: 'test' });
    
    // 验证错误被记录
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // 恢复控制台错误
    consoleErrorSpy.mockRestore();
  });
}); 