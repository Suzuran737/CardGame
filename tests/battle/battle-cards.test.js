/**
 * battle-cards.test.js
 * 战斗卡牌适配器测试
 */

const { battleCards } = require('../../static/js/battle/battle-cards-adapter');

// 模拟卡牌数据
const mockCardData = {
  id: 'test-card',
  name: 'Test Card',
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
        damage: 10
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

describe('战斗卡牌适配器测试', () => {
  test('创建卡牌', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    
    expect(card).toBeDefined();
    expect(card.id).toBe('test-card');
    expect(card.uuid).toBe('player-test-card-0');
    expect(card.name).toBe('Test Card');
    expect(card.element).toBe('fire');
    expect(card.stats).toEqual(mockCardData.stats);
    expect(card.skills).toEqual(mockCardData.skills);
    expect(card.currentHP).toBe(mockCardData.stats.HP);
    expect(card.currentNRG).toBe(mockCardData.stats.NRG);
    expect(card.statusEffects).toEqual([]);
  });

  test('创建卡牌 - 无效数据', () => {
    const card = battleCards.createCard(null, 'player', 0);
    expect(card).toBeNull();
  });

  test('对卡牌造成伤害', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const damage = battleCards.damageCard(card, 30);
    
    expect(damage).toBe(30);
    expect(card.currentHP).toBe(70);
  });

  test('对卡牌造成致命伤害', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const damage = battleCards.damageCard(card, 150);
    
    expect(damage).toBe(100);
    expect(card.currentHP).toBe(0);
  });

  test('对卡牌造成无效伤害', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const damage = battleCards.damageCard(card, -10);
    
    expect(damage).toBe(0);
    expect(card.currentHP).toBe(100);
  });

  test('治疗卡牌', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    // 先造成一些伤害
    battleCards.damageCard(card, 50);
    
    const healing = battleCards.healCard(card, 20);
    
    expect(healing).toBe(20);
    expect(card.currentHP).toBe(70);
  });

  test('治疗超过最大生命值', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    // 先造成一些伤害
    battleCards.damageCard(card, 20);
    
    const healing = battleCards.healCard(card, 30);
    
    expect(healing).toBe(20);
    expect(card.currentHP).toBe(100);
  });

  test('消耗能量', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const result = battleCards.consumeEnergy(card, 2);
    
    expect(result).toBe(true);
    expect(card.currentNRG).toBe(1);
  });

  test('消耗过多能量', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const result = battleCards.consumeEnergy(card, 5);
    
    expect(result).toBe(false);
    expect(card.currentNRG).toBe(3);
  });

  test('恢复能量', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    // 先消耗一些能量
    battleCards.consumeEnergy(card, 2);
    
    const restored = battleCards.restoreEnergy(card, 1);
    
    expect(restored).toBe(1);
    expect(card.currentNRG).toBe(2);
  });

  test('恢复超过最大能量', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    
    const restored = battleCards.restoreEnergy(card, 2);
    
    expect(restored).toBe(0);
    expect(card.currentNRG).toBe(3);
  });

  test('添加状态效果', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const effect = {
      name: 'Burn',
      type: 'dot',
      damage: 5,
      duration: 3
    };
    
    battleCards.addStatusEffect(card, effect);
    
    expect(card.statusEffects).toHaveLength(1);
    expect(card.statusEffects[0]).toEqual(effect);
  });

  test('移除状态效果', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const effect = {
      name: 'Burn',
      type: 'dot',
      damage: 5,
      duration: 3
    };
    
    battleCards.addStatusEffect(card, effect);
    const removed = battleCards.removeStatusEffect(card, 0);
    
    expect(removed).toEqual(effect);
    expect(card.statusEffects).toHaveLength(0);
  });

  test('移除无效状态效果', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const removed = battleCards.removeStatusEffect(card, 0);
    
    expect(removed).toBeNull();
  });

  test('检查卡牌是否存活', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    
    expect(battleCards.isCardAlive(card)).toBe(true);
    
    battleCards.damageCard(card, 100);
    expect(battleCards.isCardAlive(card)).toBe(false);
  });

  test('获取卡牌技能', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const skill = battleCards.getSkill(card, 0);
    
    expect(skill).toEqual(mockCardData.skills[0]);
  });

  test('获取无效技能', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const skill = battleCards.getSkill(card, 5);
    
    expect(skill).toBeNull();
  });

  test('检查技能是否可用', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    
    expect(battleCards.isSkillAvailable(card, 0)).toBe(true);
    expect(battleCards.isSkillAvailable(card, 1)).toBe(true);
    
    // 消耗能量后再次检查
    battleCards.consumeEnergy(card, 2);
    expect(battleCards.isSkillAvailable(card, 0)).toBe(true);
    expect(battleCards.isSkillAvailable(card, 1)).toBe(false);
  });

  test('使用技能', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const skillEffect = battleCards.useSkill(card, 0);
    
    expect(skillEffect).toEqual(mockCardData.skills[0].effect);
    expect(card.currentNRG).toBe(2);
  });

  test('使用无效技能', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    const skillEffect = battleCards.useSkill(card, 5);
    
    expect(skillEffect).toBeNull();
    expect(card.currentNRG).toBe(3);
  });

  test('使用能量不足的技能', () => {
    const card = battleCards.createCard(mockCardData, 'player', 0);
    // 先消耗能量
    battleCards.consumeEnergy(card, 2);
    
    const skillEffect = battleCards.useSkill(card, 1);
    
    expect(skillEffect).toBeNull();
    expect(card.currentNRG).toBe(1);
  });
}); 