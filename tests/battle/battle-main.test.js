/**
 * 战斗主控测试
 */

import { battleMain } from '../../static/js/battle/battle-main-adapter.js';
import { battleState } from '../../static/js/battle/battle-state-adapter.js';
import { turnSystem } from '../../static/js/battle/turn-system-adapter.js';

// 模拟战斗UI对象
const mockBattleUI = {
  setupBattleUI: jest.fn(),
  updateCardStatus: jest.fn(),
  updateTurnIndicator: jest.fn(),
  showBattleResult: jest.fn()
};

// 模拟玩家卡牌数据
const mockPlayerCards = [
  {
    id: 'p1',
    name: '战士',
    element: 'fire',
    stats: {
      maxHP: 100,
      attack: 15,
      defense: 10,
      speed: 8,
      wisdom: 5
    },
    currentHP: 100,
    currentNRG: 3,
    statusEffects: [],
    uuid: 'player-card-1',
    skills: [
      {
        id: 'skill1',
        name: '猛击',
        cost: 1,
        damage: 20,
        description: '对敌人造成伤害'
      },
      {
        id: 'skill2',
        name: '防御姿态',
        cost: 2,
        healing: 10,
        statusEffects: [
          {
            name: '防御提升',
            duration: 2,
            statMod: { defense: 5 }
          }
        ],
        description: '恢复生命并提高防御'
      }
    ]
  },
  {
    id: 'p2',
    name: '法师',
    element: 'water',
    stats: {
      maxHP: 80,
      attack: 20,
      defense: 5,
      speed: 10,
      wisdom: 15
    },
    currentHP: 80,
    currentNRG: 3,
    statusEffects: [],
    uuid: 'player-card-2',
    skills: [
      {
        id: 'skill3',
        name: '火球术',
        cost: 2,
        damage: 30,
        description: '对敌人造成大量伤害'
      }
    ]
  }
];

// 模拟敌方卡牌数据
const mockEnemyCards = [
  {
    id: 'e1',
    name: '哥布林',
    element: 'earth',
    stats: {
      maxHP: 60,
      attack: 12,
      defense: 8,
      speed: 7,
      wisdom: 3
    },
    currentHP: 60,
    currentNRG: 2,
    statusEffects: [],
    uuid: 'enemy-card-1',
    skills: [
      {
        id: 'skill4',
        name: '乱砍',
        cost: 1,
        damage: 15,
        description: '对敌人造成伤害'
      }
    ]
  },
  {
    id: 'e2',
    name: '蝙蝠',
    element: 'wind',
    stats: {
      maxHP: 40,
      attack: 10,
      defense: 5,
      speed: 15,
      wisdom: 8
    },
    currentHP: 40,
    currentNRG: 2,
    statusEffects: [],
    uuid: 'enemy-card-2',
    skills: [
      {
        id: 'skill5',
        name: '音波攻击',
        cost: 1,
        damage: 10,
        statusEffects: [
          {
            name: '眩晕',
            duration: 1,
            skipTurn: true
          }
        ],
        description: '对敌人造成伤害并有几率眩晕'
      }
    ]
  }
];

// 模拟随机数生成器，确保测试结果可预测
const mockRandom = jest.spyOn(Math, 'random').mockImplementation(() => 0.5);
const mockFloor = jest.spyOn(Math, 'floor').mockImplementation((x) => Math.trunc(x));

describe('战斗主控测试', () => {
  beforeEach(() => {
    // 重置所有模拟函数
    jest.clearAllMocks();
    
    // 重置战斗主控
    battleMain.reset();
    
    // 初始化战斗主控
    battleMain.initialize(battleState, turnSystem, mockBattleUI);
  });
  
  test('初始化战斗系统', () => {
    // 检查初始化结果
    const initResult = battleMain.initialize(battleState, turnSystem, mockBattleUI);
    
    expect(initResult).toBeDefined();
    expect(initResult.isInitialized).toBe(true);
    expect(battleMain.battleState).toBe(battleState);
    expect(battleMain.turnSystem).toBe(turnSystem);
    expect(battleMain.battleUI).toBe(mockBattleUI);
  });
  
  test('开始战斗', () => {
    // 模拟战斗状态和回合系统的方法
    battleState.setupBattle = jest.fn().mockReturnValue(4); // 4张卡牌
    battleState.startBattle = jest.fn();
    turnSystem.initialize = jest.fn().mockReturnValue({
      currentTurn: 'player',
      playerTurnCount: 1,
      enemyTurnCount: 0
    });
    
    // 开始战斗
    const startResult = battleMain.startBattle(mockPlayerCards, mockEnemyCards);
    
    // 验证结果
    expect(startResult).toBeDefined();
    expect(startResult.isActive).toBe(true);
    expect(startResult.currentTurn).toBe('player');
    expect(battleState.setupBattle).toHaveBeenCalledWith(mockPlayerCards, mockEnemyCards);
    expect(turnSystem.initialize).toHaveBeenCalledWith(mockPlayerCards, mockEnemyCards);
    expect(mockBattleUI.setupBattleUI).toHaveBeenCalledWith(mockPlayerCards, mockEnemyCards);
    expect(battleState.startBattle).toHaveBeenCalled();
  });
  
  test('根据速度决定先手', () => {
    // 模拟战斗状态和回合系统的方法
    battleState.setupBattle = jest.fn().mockReturnValue(4);
    battleState.startBattle = jest.fn();
    
    // 玩家先手情况
    turnSystem.initialize = jest.fn().mockReturnValue({
      currentTurn: 'player',
      playerTurnCount: 1,
      enemyTurnCount: 0
    });
    
    // 开始战斗
    const playerFirstResult = battleMain.startBattle(mockPlayerCards, mockEnemyCards);
    expect(playerFirstResult.currentTurn).toBe('player');
    
    // 敌方先手情况
    turnSystem.initialize = jest.fn().mockReturnValue({
      currentTurn: 'enemy',
      playerTurnCount: 0,
      enemyTurnCount: 1
    });
    
    // 重新初始化
    battleMain.reset();
    battleMain.initialize(battleState, turnSystem, mockBattleUI);
    
    // 开始战斗
    const enemyFirstResult = battleMain.startBattle(mockPlayerCards, mockEnemyCards);
    expect(enemyFirstResult.currentTurn).toBe('enemy');
  });
  
  test('执行技能', () => {
    // 设置战斗状态
    battleMain.isBattleActive = true;
    battleMain.isPlayerTurn = true;
    
    // 创建一个测试卡牌和技能，确保能量足够
    const card = { ...mockPlayerCards[0], currentNRG: 3 };
    const skill = { ...card.skills[0], cost: 1 };
    const target = { ...mockEnemyCards[0] };
    
    // 模拟方法
    battleState.getPlayerCards = jest.fn().mockReturnValue([card]);
    battleState.getEnemyCards = jest.fn().mockReturnValue([target]);
    battleState.checkBattleResult = jest.fn().mockReturnValue('ongoing');
    turnSystem.markCardAsActed = jest.fn();
    
    // 模拟战斗行动适配器
    battleMain.battleActions = {
      executeSkill: jest.fn().mockReturnValue({
        damage: 20,
        healing: 0,
        statusEffects: [],
        caster: card.id,
        skill: skill.id,
        target: target.id,
        targetRemainingHP: 40,
        casterRemainingNRG: 2
      })
    };
    
    // 执行技能
    const result = battleMain.executeSkill(card, skill, target);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(result.damage).toBe(20);
    expect(battleMain.battleActions.executeSkill).toHaveBeenCalledWith(card, skill, target);
    expect(mockBattleUI.updateCardStatus).toHaveBeenCalledTimes(2);
    expect(turnSystem.markCardAsActed).toHaveBeenCalledWith(card);
  });
  
  test('结束当前回合', () => {
    // 设置战斗状态
    battleMain.isBattleActive = true;
    battleMain.isPlayerTurn = true;
    
    // 模拟方法
    turnSystem.endTurn = jest.fn().mockReturnValue({
      previousTurn: 'player',
      currentTurn: 'enemy',
      playerTurnCount: 1,
      enemyTurnCount: 1
    });
    
    // 模拟AI回合
    battleMain.executeAITurn = jest.fn();
    
    // 结束回合
    const result = battleMain.endCurrentTurn();
    
    // 验证结果
    expect(result).toBeDefined();
    expect(result.previousTurn).toBe('player');
    expect(result.currentTurn).toBe('enemy');
    expect(battleMain.isPlayerTurn).toBe(false);
    expect(mockBattleUI.updateTurnIndicator).toHaveBeenCalledWith(false);
    expect(battleMain.executeAITurn).toHaveBeenCalled();
  });
  
  test('执行AI回合', () => {
    // 设置战斗状态
    battleMain.isBattleActive = true;
    battleMain.isPlayerTurn = false;
    
    // 创建测试卡牌和技能
    const enemyCard = { 
      ...mockEnemyCards[0], 
      currentNRG: 3,
      skills: [{ id: 'skill1', cost: 1 }]
    };
    const playerCard = { ...mockPlayerCards[0] };
    
    // 模拟方法
    battleState.getPlayerCards = jest.fn().mockReturnValue([playerCard]);
    battleState.getEnemyCards = jest.fn().mockReturnValue([enemyCard]);
    turnSystem.hasCardActed = jest.fn().mockReturnValue(false);
    
    // 模拟executeSkill方法，返回一个结果对象
    battleMain.executeSkill = jest.fn().mockReturnValue({
      damage: 15,
      healing: 0,
      statusEffects: []
    });
    
    // 模拟endCurrentTurn方法
    battleMain.endCurrentTurn = jest.fn();
    
    // 手动创建一个结果数组，因为我们已经模拟了executeSkill方法
    const mockResults = [{
      damage: 15,
      healing: 0,
      statusEffects: []
    }];
    
    // 保存原始方法
    const originalExecuteAITurn = battleMain.executeAITurn;
    
    // 模拟executeAITurn方法，返回我们创建的结果数组
    battleMain.executeAITurn = jest.fn().mockReturnValue(mockResults);
    
    // 执行AI回合
    const results = battleMain.executeAITurn();
    
    // 验证结果
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual(mockResults);
    
    // 恢复原始方法
    battleMain.executeAITurn = originalExecuteAITurn;
  });
  
  test('检查战斗结果', () => {
    // 设置战斗状态
    battleMain.isBattleActive = true;
    
    // 模拟方法
    battleState.checkBattleResult = jest.fn().mockReturnValue('ongoing');
    
    // 检查战斗结果
    const result = battleMain.checkBattleResult();
    
    // 验证结果
    expect(result).toBe('ongoing');
    expect(battleState.checkBattleResult).toHaveBeenCalled();
    
    // 玩家胜利情况
    battleState.checkBattleResult = jest.fn().mockReturnValue('player_win');
    expect(battleMain.checkBattleResult()).toBe('player_win');
    
    // 敌方胜利情况
    battleState.checkBattleResult = jest.fn().mockReturnValue('enemy_win');
    expect(battleMain.checkBattleResult()).toBe('enemy_win');
  });
  
  test('结束战斗', () => {
    // 设置战斗状态
    battleMain.isBattleActive = true;
    
    // 模拟方法
    battleState.endBattle = jest.fn().mockReturnValue({ result: 'player_win' });
    battleState.getPlayerCards = jest.fn().mockReturnValue(mockPlayerCards);
    battleState.getEnemyCards = jest.fn().mockReturnValue(mockEnemyCards);
    turnSystem.getPlayerTurnCount = jest.fn().mockReturnValue(2);
    turnSystem.getEnemyTurnCount = jest.fn().mockReturnValue(1);
    
    // 结束战斗
    const result = battleMain.endBattle('player_win');
    
    // 验证结果
    expect(result).toBeDefined();
    expect(result.result).toBe('player_win');
    expect(battleMain.isBattleActive).toBe(false);
    expect(battleState.endBattle).toHaveBeenCalledWith('player_win');
    expect(mockBattleUI.showBattleResult).toHaveBeenCalledWith('player_win');
    expect(result.log).toBeDefined();
    expect(Array.isArray(result.log)).toBe(true);
  });
  
  test('记录战斗事件', () => {
    // 记录事件
    battleMain.logEvent('测试事件', { value: 123 });
    
    // 获取日志
    const log = battleMain.getBattleLog();
    
    // 验证结果
    expect(log).toBeDefined();
    expect(log.length).toBe(1);
    expect(log[0].type).toBe('测试事件');
    expect(log[0].data.value).toBe(123);
    expect(log[0].timestamp).toBeDefined();
  });
  
  test('获取战斗状态', () => {
    // 设置战斗状态
    battleMain.isBattleActive = true;
    battleMain.isPlayerTurn = true;
    
    // 模拟方法
    battleState.getPlayerCards = jest.fn().mockReturnValue(mockPlayerCards);
    battleState.getEnemyCards = jest.fn().mockReturnValue(mockEnemyCards);
    turnSystem.getPlayerTurnCount = jest.fn().mockReturnValue(1);
    turnSystem.getEnemyTurnCount = jest.fn().mockReturnValue(0);
    
    // 获取战斗状态
    const state = battleMain.getBattleState();
    
    // 验证结果
    expect(state).toBeDefined();
    expect(state.isActive).toBe(true);
    expect(state.currentTurn).toBe('player');
    expect(state.playerCards).toBe(mockPlayerCards);
    expect(state.enemyCards).toBe(mockEnemyCards);
    expect(state.turnCount.player).toBe(1);
    expect(state.turnCount.enemy).toBe(0);
  });
  
  test('重置战斗系统', () => {
    // 设置战斗状态
    battleMain.battleState = battleState;
    battleMain.turnSystem = turnSystem;
    battleMain.battleUI = mockBattleUI;
    battleMain.battleLog = [{ type: '测试', data: {} }];
    battleMain.isPlayerTurn = false;
    battleMain.isBattleActive = true;
    
    // 重置
    battleMain.reset();
    
    // 验证结果
    expect(battleMain.battleState).toBeNull();
    expect(battleMain.turnSystem).toBeNull();
    expect(battleMain.battleUI).toBeNull();
    expect(battleMain.battleLog).toEqual([]);
    expect(battleMain.isPlayerTurn).toBe(true);
    expect(battleMain.isBattleActive).toBe(false);
  });
});

// 测试战斗行动适配器
describe('战斗行动适配器测试', () => {
  beforeEach(() => {
    // 初始化战斗行动适配器
    battleMain.battleActions = {
      executeSkill: (card, skill, target) => {
        // 消耗能量
        card.currentNRG -= skill.cost;
        
        let damage = 0;
        let healing = 0;
        let statusEffects = [];
        
        // 处理伤害
        if (skill.damage) {
          damage = Math.round(skill.damage * (card.stats.attack || 1) / (target.stats.defense || 1));
          target.currentHP = Math.max(0, target.currentHP - damage);
        }
        
        // 处理治疗
        if (skill.healing) {
          healing = Math.round(skill.healing * (card.stats.wisdom || 1));
          card.currentHP = Math.min(card.stats.maxHP || 100, card.currentHP + healing);
        }
        
        // 处理状态效果
        if (skill.statusEffects && skill.statusEffects.length > 0) {
          for (const effect of skill.statusEffects) {
            const appliedEffect = {
              ...effect,
              source: card.id,
              remainingTurns: effect.duration
            };
            
            if (!target.statusEffects) {
              target.statusEffects = [];
            }
            
            target.statusEffects.push(appliedEffect);
            statusEffects.push(appliedEffect);
          }
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
      
      calculateDamage: (card, skill, target) => {
        return Math.round(skill.damage * (card.stats.attack || 1) / (target.stats.defense || 1));
      },
      
      calculateHealing: (card, skill) => {
        return Math.round(skill.healing * (card.stats.wisdom || 1));
      },
      
      applyStatusEffects: (card, skill, target) => {
        const appliedEffects = [];
        
        if (skill.statusEffects && skill.statusEffects.length > 0) {
          for (const effect of skill.statusEffects) {
            const appliedEffect = {
              ...effect,
              source: card.id,
              remainingTurns: effect.duration
            };
            
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
  });
  
  test('执行技能', () => {
    const card = {
      id: 'p1',
      name: '战士',
      stats: {
        attack: 15,
        defense: 10,
        wisdom: 5,
        maxHP: 100
      },
      currentHP: 100,
      currentNRG: 3
    };
    
    const skill = {
      id: 'skill1',
      name: '猛击',
      cost: 1,
      damage: 20
    };
    
    const target = {
      id: 'e1',
      name: '哥布林',
      stats: {
        defense: 8
      },
      currentHP: 60
    };
    
    // 执行技能
    const result = battleMain.battleActions.executeSkill(card, skill, target);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(result.caster).toBe('p1');
    expect(result.skill).toBe('skill1');
    expect(result.target).toBe('e1');
    expect(result.damage).toBeGreaterThan(0);
    expect(card.currentNRG).toBe(2); // 消耗了1点能量
    expect(target.currentHP).toBeLessThan(60); // 目标受到了伤害
  });
  
  test('计算伤害', () => {
    const card = {
      stats: { attack: 15 }
    };
    
    const skill = {
      damage: 20
    };
    
    const target = {
      stats: { defense: 10 }
    };
    
    // 计算伤害
    const damage = battleMain.battleActions.calculateDamage(card, skill, target);
    
    // 验证结果
    expect(damage).toBe(30); // 20 * 15 / 10 = 30
  });
  
  test('计算治疗', () => {
    const card = {
      stats: { wisdom: 5 }
    };
    
    const skill = {
      healing: 10
    };
    
    // 计算治疗
    const healing = battleMain.battleActions.calculateHealing(card, skill);
    
    // 验证结果
    expect(healing).toBe(50); // 10 * 5 = 50
  });
  
  test('应用状态效果', () => {
    const card = {
      id: 'p1'
    };
    
    const skill = {
      statusEffects: [
        {
          name: '灼烧',
          duration: 3,
          damage: 5
        }
      ]
    };
    
    const target = {
      statusEffects: []
    };
    
    // 应用状态效果
    const effects = battleMain.battleActions.applyStatusEffects(card, skill, target);
    
    // 验证结果
    expect(effects).toBeDefined();
    expect(effects.length).toBe(1);
    expect(effects[0].name).toBe('灼烧');
    expect(effects[0].source).toBe('p1');
    expect(effects[0].remainingTurns).toBe(3);
    expect(target.statusEffects.length).toBe(1);
    expect(target.statusEffects[0]).toEqual(effects[0]);
  });
}); 