/**
 * battle-state-adapter.test.js
 * 战斗状态适配器测试
 */

// 导入battle-state-adapter模块
const { battleState } = require('../../static/js/battle/battle-state-adapter');

// 模拟原始模块抛出异常的情况
jest.mock('../../static/js/battle/battle-state.js', () => {
  return {
    __esModule: true,
    default: {
      setupBattle: jest.fn().mockImplementation(() => {
        throw new Error('模拟异常');
      }),
      switchTurn: jest.fn().mockImplementation(() => {
        throw new Error('模拟异常');
      }),
      checkBattleEnd: jest.fn().mockImplementation(() => {
        throw new Error('模拟异常');
      }),
      getWinner: jest.fn().mockImplementation(() => {
        throw new Error('模拟异常');
      }),
      markCardActed: jest.fn().mockImplementation(() => {
        throw new Error('模拟异常');
      }),
      checkAllCardsActed: jest.fn().mockImplementation(() => {
        throw new Error('模拟异常');
      }),
      clearSelection: jest.fn().mockImplementation(() => {
        throw new Error('模拟异常');
      }),
      startBattle: jest.fn().mockImplementation(() => {
        throw new Error('模拟异常');
      }),
      state: {}
    }
  };
});

describe('战斗状态适配器测试', () => {
  // 测试数据
  let mockPlayerCards;
  let mockEnemyCards;
  
  beforeEach(() => {
    // 重置战斗状态
    battleState.playerCards = [];
    battleState.enemyCards = [];
    battleState.currentTurn = 'player';
    battleState.currentPhase = 'prepare';
    battleState.playerTurnCount = 0;
    battleState.enemyTurnCount = 0;
    battleState.actedCards = new Set();
    battleState.selectedCard = null;
    battleState.selectedAction = null;
    
    // 初始化测试数据
    mockPlayerCards = [
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
        skills: []
      },
      {
        id: 'p2',
        name: 'Player Card 2',
        element: 'water',
        stats: {
          HP: 80,
          ATK: 25,
          DEF: 8,
          SPD: 18,
          CRI: 10,
          NRG: 3
        },
        skills: []
      }
    ];
    
    mockEnemyCards = [
      {
        id: 'e1',
        name: 'Enemy Card 1',
        element: 'earth',
        stats: {
          HP: 90,
          ATK: 18,
          DEF: 12,
          SPD: 14,
          CRI: 3,
          NRG: 2
        },
        skills: []
      },
      {
        id: 'e2',
        name: 'Enemy Card 2',
        element: 'wind',
        stats: {
          HP: 70,
          ATK: 22,
          DEF: 7,
          SPD: 20,
          CRI: 8,
          NRG: 2
        },
        skills: []
      }
    ];
  });

  describe('战斗设置测试', () => {
    test('设置战斗初始状态', () => {
      const result = battleState.setupBattle(mockPlayerCards, mockEnemyCards);
      
      // 验证返回值（卡牌总数）
      expect(result).toBe(4);
      
      // 验证玩家卡牌数据
      expect(battleState.playerCards).toHaveLength(2);
      expect(battleState.playerCards[0].uuid).toContain('player-p1');
      expect(battleState.playerCards[0].currentHP).toBe(100);
      expect(battleState.playerCards[0].currentNRG).toBe(3);
      expect(battleState.playerCards[0].statusEffects).toEqual([]);
      
      // 验证敌方卡牌数据
      expect(battleState.enemyCards).toHaveLength(2);
      expect(battleState.enemyCards[0].uuid).toContain('enemy-e1');
      expect(battleState.enemyCards[0].currentHP).toBe(90);
      expect(battleState.enemyCards[0].currentNRG).toBe(2);
      expect(battleState.enemyCards[0].statusEffects).toEqual([]);
      
      // 验证初始状态
      expect(battleState.currentTurn).toBe('player');
      expect(battleState.currentPhase).toBe('battle');
      expect(battleState.playerTurnCount).toBe(1);
      expect(battleState.enemyTurnCount).toBe(0);
      expect(battleState.actedCards.size).toBe(0);
    });
    
    test('设置战斗时处理没有NRG属性的卡牌', () => {
      // 创建没有NRG属性的卡牌
      const noNrgPlayerCards = [
        {
          id: 'p3',
          name: 'No NRG Player Card',
          element: 'fire',
          stats: {
            HP: 100,
            ATK: 20,
            DEF: 10,
            SPD: 15,
            CRI: 5
            // 没有NRG属性
          },
          skills: []
        }
      ];
      
      const noNrgEnemyCards = [
        {
          id: 'e3',
          name: 'No NRG Enemy Card',
          element: 'earth',
          stats: {
            HP: 90,
            ATK: 18,
            DEF: 12,
            SPD: 14,
            CRI: 3
            // 没有NRG属性
          },
          skills: []
        }
      ];
      
      const result = battleState.setupBattle(noNrgPlayerCards, noNrgEnemyCards);
      
      // 验证返回值（卡牌总数）
      expect(result).toBe(2);
      
      // 验证玩家卡牌数据，应该使用默认NRG值3
      expect(battleState.playerCards[0].currentNRG).toBe(3);
      
      // 验证敌方卡牌数据，应该使用默认NRG值2
      expect(battleState.enemyCards[0].currentNRG).toBe(2);
    });
    
    test('设置战斗时处理空卡牌列表', () => {
      // 测试空玩家卡牌列表
      const result1 = battleState.setupBattle([], mockEnemyCards);
      expect(result1).toBe(2); // 只有敌方卡牌
      expect(battleState.playerCards).toHaveLength(0);
      expect(battleState.enemyCards).toHaveLength(2);
      
      // 重置状态
      battleState.playerCards = [];
      battleState.enemyCards = [];
      
      // 测试空敌方卡牌列表
      const result2 = battleState.setupBattle(mockPlayerCards, []);
      expect(result2).toBe(2); // 只有玩家卡牌
      expect(battleState.playerCards).toHaveLength(2);
      expect(battleState.enemyCards).toHaveLength(0);
      
      // 重置状态
      battleState.playerCards = [];
      battleState.enemyCards = [];
      
      // 测试双方都是空卡牌列表
      const result3 = battleState.setupBattle([], []);
      expect(result3).toBe(0); // 没有卡牌
      expect(battleState.playerCards).toHaveLength(0);
      expect(battleState.enemyCards).toHaveLength(0);
    });
  });

  describe('回合管理测试', () => {
    beforeEach(() => {
      // 设置战斗初始状态
      battleState.setupBattle(mockPlayerCards, mockEnemyCards);
      // 手动设置初始回合计数
      battleState.playerTurnCount = 1;
      battleState.enemyTurnCount = 0;
    });
    
    test('切换回合', () => {
      // 初始状态是玩家回合
      expect(battleState.currentTurn).toBe('player');
      expect(battleState.playerTurnCount).toBe(1);
      expect(battleState.enemyTurnCount).toBe(0);
      
      // 切换到敌方回合
      const nextTurn = battleState.switchTurn();
      
      expect(nextTurn).toBe('enemy');
      expect(battleState.currentTurn).toBe('enemy');
      // 手动验证回合计数的变化
      expect(battleState.enemyTurnCount).toBe(1);
      expect(battleState.actedCards.size).toBe(0);
      
      // 再次切换回玩家回合
      battleState.switchTurn();
      
      expect(battleState.currentTurn).toBe('player');
      expect(battleState.playerTurnCount).toBe(2); // 现在应该增加玩家回合计数
    });
    
    test('标记卡牌已行动', () => {
      // 标记一张玩家卡牌已行动
      battleState.markCardActed(battleState.playerCards[0]);
      
      // 验证卡牌已被标记
      expect(battleState.actedCards.has(battleState.playerCards[0].uuid)).toBe(true);
      expect(battleState.actedCards.size).toBe(1);
      
      // 切换回合后，已行动标记应被清除
      battleState.switchTurn();
      expect(battleState.actedCards.size).toBe(0);
    });
    
    test('标记无效卡牌已行动', () => {
      // 尝试标记一个无效卡牌
      battleState.markCardActed(null);
      expect(battleState.actedCards.size).toBe(0);
      
      // 尝试标记一个没有uuid的卡牌
      battleState.markCardActed({name: 'Invalid Card'});
      expect(battleState.actedCards.size).toBe(0);
    });
    
    test('检查所有卡牌行动状态', () => {
      // 手动重置适配器的内部状态，确保初始状态正确
      battleState.actedCards.clear();
      
      // 标记所有玩家卡牌已行动
      battleState.playerCards.forEach(card => {
        battleState.markCardActed(card);
      });
      
      // 所有卡牌都已行动
      const finalState = battleState.checkAllCardsActed();
      expect(finalState).toBe(true);
    });
    
    test('检查没有卡牌行动状态', () => {
      // 清空已行动标记
      battleState.actedCards.clear();
      
      // 没有卡牌已行动
      const finalState = battleState.checkAllCardsActed();
      expect(finalState).toBe(false);
    });
    
    test('检查部分卡牌行动状态', () => {
      // 清空已行动标记
      battleState.actedCards.clear();
      
      // 只标记一张卡牌已行动
      battleState.markCardActed(battleState.playerCards[0]);
      
      // 不是所有卡牌都已行动
      const finalState = battleState.checkAllCardsActed();
      expect(finalState).toBe(false);
    });
    
    test('当前方没有存活卡牌时的行动状态', () => {
      // 清空已行动标记
      battleState.actedCards.clear();
      
      // 设置所有当前方卡牌的生命值为0
      battleState.playerCards.forEach(card => {
        card.currentHP = 0;
      });
      
      // 当前方没有存活卡牌，应该返回true
      const finalState = battleState.checkAllCardsActed();
      expect(finalState).toBe(true);
    });
    
    test('敌方回合检查卡牌行动状态', () => {
      // 切换到敌方回合
      battleState.switchTurn();
      expect(battleState.currentTurn).toBe('enemy');
      
      // 清空已行动标记
      battleState.actedCards.clear();
      
      // 标记所有敌方卡牌已行动
      battleState.enemyCards.forEach(card => {
        battleState.markCardActed(card);
      });
      
      // 所有敌方卡牌都已行动
      const finalState = battleState.checkAllCardsActed();
      expect(finalState).toBe(true);
    });
  });

  describe('战斗结束检查测试', () => {
    beforeEach(() => {
      // 设置战斗初始状态
      battleState.setupBattle(mockPlayerCards, mockEnemyCards);
      
      // 确保卡牌有生命值
      battleState.playerCards.forEach(card => {
        card.currentHP = card.stats.HP;
      });
      
      battleState.enemyCards.forEach(card => {
        card.currentHP = card.stats.HP;
      });
    });
    
    test('战斗未结束状态', () => {
      // 手动设置生命值确保双方都有存活卡牌
      battleState.playerCards[0].currentHP = 50;
      battleState.enemyCards[0].currentHP = 50;
      
      // 确保其他卡牌也有生命值
      battleState.playerCards[1].currentHP = 40;
      battleState.enemyCards[1].currentHP = 40;
      
      // 初始状态：双方都有存活卡牌，战斗不应该结束
      expect(battleState.checkBattleEnd()).toBe(false);
      
      // 由于适配器的实现，我们直接测试内部逻辑
      const playerAlive = battleState.playerCards.some(card => card.currentHP > 0);
      const enemyAlive = battleState.enemyCards.some(card => card.currentHP > 0);
      
      expect(playerAlive).toBe(true);
      expect(enemyAlive).toBe(true);
      expect(!playerAlive || !enemyAlive).toBe(false);
    });
    
    test('玩家胜利状态', () => {
      // 所有敌方卡牌阵亡
      battleState.enemyCards.forEach(card => {
        card.currentHP = 0;
      });
      
      // 确保玩家卡牌存活
      battleState.playerCards[0].currentHP = 50;
      battleState.playerCards[1].currentHP = 40;
      
      // 战斗应该结束
      expect(battleState.checkBattleEnd()).toBe(true);
      
      // 手动验证胜利条件
      const playerAlive = battleState.playerCards.some(card => card.currentHP > 0);
      const enemyAlive = battleState.enemyCards.some(card => card.currentHP > 0);
      
      expect(playerAlive).toBe(true);
      expect(enemyAlive).toBe(false);
      
      // 验证胜利方
      expect(battleState.getWinner()).toBe('player');
    });
    
    test('敌方胜利状态', () => {
      // 所有玩家卡牌阵亡
      battleState.playerCards.forEach(card => {
        card.currentHP = 0;
      });
      
      // 确保敌方卡牌存活
      battleState.enemyCards[0].currentHP = 50;
      battleState.enemyCards[1].currentHP = 40;
      
      // 战斗应该结束
      expect(battleState.checkBattleEnd()).toBe(true);
      
      // 手动验证胜利条件
      const playerAlive = battleState.playerCards.some(card => card.currentHP > 0);
      const enemyAlive = battleState.enemyCards.some(card => card.currentHP > 0);
      
      expect(playerAlive).toBe(false);
      expect(enemyAlive).toBe(true);
      
      // 敌方应该获胜
      expect(battleState.getWinner()).toBe('enemy');
    });
    
    test('平局状态', () => {
      // 所有玩家卡牌阵亡
      battleState.playerCards.forEach(card => {
        card.currentHP = 0;
      });
      
      // 所有敌方卡牌也阵亡
      battleState.enemyCards.forEach(card => {
        card.currentHP = 0;
      });
      
      // 战斗应该结束
      expect(battleState.checkBattleEnd()).toBe(true);
      
      // 手动验证胜利条件
      const playerAlive = battleState.playerCards.some(card => card.currentHP > 0);
      const enemyAlive = battleState.enemyCards.some(card => card.currentHP > 0);
      
      expect(playerAlive).toBe(false);
      expect(enemyAlive).toBe(false);
      
      // 应该是平局
      expect(battleState.getWinner()).toBe('draw');
    });
    
    test('战斗尚未结束状态', () => {
      // 双方都有卡牌存活
      battleState.playerCards[0].currentHP = 50;
      battleState.enemyCards[0].currentHP = 50;
      
      // 战斗不应该结束
      expect(battleState.checkBattleEnd()).toBe(false);
      
      // 获胜方应该为null
      expect(battleState.getWinner()).toBe(null);
    });
    
    test('空卡牌列表的战斗结束检查', () => {
      // 设置空的玩家卡牌列表
      battleState.playerCards = [];
      
      // 战斗应该结束，因为玩家没有卡牌
      expect(battleState.checkBattleEnd()).toBe(true);
      
      // 敌方应该获胜
      expect(battleState.getWinner()).toBe('enemy');
      
      // 重置状态
      battleState.playerCards = mockPlayerCards.map((card, index) => ({
        ...card,
        uuid: `player-${card.id}-${index}`,
        currentHP: card.stats.HP,
        currentNRG: card.stats.NRG || 3,
        statusEffects: []
      }));
      battleState.enemyCards = [];
      
      // 战斗应该结束，因为敌方没有卡牌
      expect(battleState.checkBattleEnd()).toBe(true);
      
      // 玩家应该获胜
      expect(battleState.getWinner()).toBe('player');
    });
  });

  describe('选择管理测试', () => {
    beforeEach(() => {
      // 设置战斗初始状态
      battleState.setupBattle(mockPlayerCards, mockEnemyCards);
    });
    
    test('清除选择状态', () => {
      // 设置选中的卡牌和行动
      battleState.selectedCard = battleState.playerCards[0];
      battleState.selectedAction = { type: 'attack' };
      
      // 清除选择
      battleState.clearSelection();
      
      // 验证选择已被清除
      expect(battleState.selectedCard).toBeNull();
      expect(battleState.selectedAction).toBeNull();
    });
    
    test('清除已经为null的选择状态', () => {
      // 初始状态下选择就是null
      battleState.selectedCard = null;
      battleState.selectedAction = null;
      
      // 清除选择
      battleState.clearSelection();
      
      // 验证选择仍然为null
      expect(battleState.selectedCard).toBeNull();
      expect(battleState.selectedAction).toBeNull();
    });
    
    test('设置选择状态', () => {
      // 设置选中的卡牌和行动
      const card = battleState.playerCards[0];
      const action = { type: 'attack' };
      
      battleState.selectedCard = card;
      battleState.selectedAction = action;
      
      // 验证选择已被设置
      expect(battleState.selectedCard).toBe(card);
      expect(battleState.selectedAction).toBe(action);
    });
  });

  describe('战斗阶段管理测试', () => {
    test('启动战斗', () => {
      // 设置准备阶段
      battleState.currentPhase = 'prepare';
      
      // 启动战斗
      const result = battleState.startBattle();
      
      // 验证战斗已启动
      expect(result).toBe(true);
      expect(battleState.currentPhase).toBe('battle');
    });
    
    test('在已经是战斗阶段时启动战斗', () => {
      // 设置已经是战斗阶段
      battleState.currentPhase = 'battle';
      
      // 启动战斗
      const result = battleState.startBattle();
      
      // 验证返回true，阶段不变
      expect(result).toBe(true);
      expect(battleState.currentPhase).toBe('battle');
    });
    
    test('在结束阶段启动战斗', () => {
      // 设置结束阶段
      battleState.currentPhase = 'end';
      
      // 启动战斗
      const result = battleState.startBattle();
      
      // 验证战斗已启动，阶段改变
      expect(result).toBe(true);
      expect(battleState.currentPhase).toBe('battle');
    });
  });
}); 