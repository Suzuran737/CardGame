/**
 * 战斗卡牌测试
 * 
 * 测试游戏中的卡牌系统，包括卡牌创建、属性、技能和状态效果
 */

// 导入卡牌适配器
import { battleCards } from '../../static/js/battle/battle-cards-adapter.js';

// 测试数据
const testCardData = {
  id: 1,
  name: '测试卡牌',
  element: 'fire',
  stats: {
    HP: 20,
    ATK: 10,
    DEF: 5,
    SPD: 8,
    CRI: 15,
    NRG: 2
  },
  skills: [
    { name: '火球术', cost: 2, effect: { damage: 1.5 } }
  ]
};

describe('战斗卡牌测试', () => {
  // 在每个测试前重置状态
  beforeEach(() => {
    // 重置卡牌系统状态
  });

  // 测试卡牌创建
  test('测试卡牌创建', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 验证卡牌基本属性
    expect(card.id).toBe(testCardData.id);
    expect(card.name).toBe(testCardData.name);
    expect(card.element).toBe(testCardData.element);
    expect(card.uuid).toBe(`player-${testCardData.id}-0`);
    
    // 验证卡牌状态
    expect(card.currentHP).toBe(testCardData.stats.HP);
    expect(card.currentNRG).toBe(testCardData.stats.NRG);
    expect(card.statusEffects).toEqual([]);
  });

  // 测试卡牌属性
  test('测试卡牌属性', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 验证卡牌属性
    expect(card.stats.HP).toBe(testCardData.stats.HP);
    expect(card.stats.ATK).toBe(testCardData.stats.ATK);
    expect(card.stats.DEF).toBe(testCardData.stats.DEF);
    expect(card.stats.SPD).toBe(testCardData.stats.SPD);
    expect(card.stats.CRI).toBe(testCardData.stats.CRI);
    expect(card.stats.NRG).toBe(testCardData.stats.NRG);
  });

  // 测试卡牌技能
  test('测试卡牌技能', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 验证卡牌技能
    expect(card.skills.length).toBe(1);
    expect(card.skills[0].name).toBe('火球术');
    expect(card.skills[0].cost).toBe(2);
    expect(card.skills[0].effect.damage).toBe(1.5);
  });

  // 测试卡牌伤害
  test('测试卡牌伤害', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 初始生命值
    expect(card.currentHP).toBe(testCardData.stats.HP);
    
    // 造成伤害
    battleCards.damageCard(card, 5);
    
    // 验证伤害后的生命值
    expect(card.currentHP).toBe(testCardData.stats.HP - 5);
    
    // 造成过量伤害
    battleCards.damageCard(card, 100);
    
    // 验证生命值不会小于0
    expect(card.currentHP).toBe(0);
  });

  // 测试卡牌治疗
  test('测试卡牌治疗', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 先造成一些伤害
    battleCards.damageCard(card, 10);
    expect(card.currentHP).toBe(testCardData.stats.HP - 10);
    
    // 治疗卡牌
    battleCards.healCard(card, 5);
    
    // 验证治疗后的生命值
    expect(card.currentHP).toBe(testCardData.stats.HP - 5);
    
    // 过量治疗
    battleCards.healCard(card, 100);
    
    // 验证生命值不会超过最大值
    expect(card.currentHP).toBe(testCardData.stats.HP);
  });

  // 测试卡牌能量消耗
  test('测试卡牌能量消耗', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 初始能量
    expect(card.currentNRG).toBe(testCardData.stats.NRG);
    
    // 消耗能量
    const success = battleCards.consumeEnergy(card, 1);
    
    // 验证能量消耗成功
    expect(success).toBe(true);
    expect(card.currentNRG).toBe(testCardData.stats.NRG - 1);
    
    // 尝试消耗过多能量
    const failedConsumption = battleCards.consumeEnergy(card, 10);
    
    // 验证能量消耗失败，能量不变
    expect(failedConsumption).toBe(false);
    expect(card.currentNRG).toBe(testCardData.stats.NRG - 1);
  });

  // 测试卡牌能量恢复
  test('测试卡牌能量恢复', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 先消耗一些能量
    battleCards.consumeEnergy(card, 1);
    expect(card.currentNRG).toBe(testCardData.stats.NRG - 1);
    
    // 恢复能量
    battleCards.restoreEnergy(card, 1);
    
    // 验证能量恢复后的值
    expect(card.currentNRG).toBe(testCardData.stats.NRG);
    
    // 过量恢复
    battleCards.restoreEnergy(card, 10);
    
    // 验证能量不会超过最大值
    expect(card.currentNRG).toBe(testCardData.stats.NRG);
  });

  // 测试卡牌状态效果
  test('测试卡牌状态效果', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 添加状态效果
    const effect = {
      name: '灼烧',
      duration: 2,
      damage: 3,
      source: 'enemy'
    };
    
    battleCards.addStatusEffect(card, effect);
    
    // 验证状态效果添加成功
    expect(card.statusEffects.length).toBe(1);
    expect(card.statusEffects[0].name).toBe('灼烧');
    expect(card.statusEffects[0].duration).toBe(2);
    
    // 添加第二个状态效果
    const effect2 = {
      name: '中毒',
      duration: 3,
      poison: 2,
      source: 'enemy'
    };
    
    battleCards.addStatusEffect(card, effect2);
    
    // 验证第二个状态效果添加成功
    expect(card.statusEffects.length).toBe(2);
    expect(card.statusEffects[1].name).toBe('中毒');
  });

  // 测试移除状态效果
  test('测试移除状态效果', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 添加状态效果
    const effect = {
      name: '灼烧',
      duration: 2,
      damage: 3,
      source: 'enemy'
    };
    
    battleCards.addStatusEffect(card, effect);
    expect(card.statusEffects.length).toBe(1);
    
    // 移除状态效果
    battleCards.removeStatusEffect(card, 0);
    
    // 验证状态效果被移除
    expect(card.statusEffects.length).toBe(0);
  });

  // 测试检查卡牌是否存活
  test('测试检查卡牌是否存活', () => {
    const card = battleCards.createCard(testCardData, 'player', 0);
    
    // 初始应该是存活的
    expect(battleCards.isCardAlive(card)).toBe(true);
    
    // 造成致命伤害
    battleCards.damageCard(card, 100);
    
    // 验证卡牌已阵亡
    expect(battleCards.isCardAlive(card)).toBe(false);
  });
}); 