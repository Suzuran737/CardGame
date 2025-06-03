/**
 * card-effects-adapter.test.js
 * 卡牌效果适配器测试
 */

// 导入card-effects-adapter模块
const { cardEffects } = require('../../static/js/battle/card-effects-adapter');

describe('卡牌效果适配器测试', () => {
  // 测试数据
  let testCard;
  
  beforeEach(() => {
    // 初始化测试卡牌
    testCard = {
      uuid: 'test-card-1',
      name: 'Test Card',
      stats: {
        HP: 100,
        ATK: 20,
        DEF: 10,
        SPD: 15,
        NRG: 3
      },
      currentHP: 100,
      currentNRG: 3,
      statusEffects: []
    };
  });

  describe('应用状态效果测试', () => {
    test('应用攻击力提升效果', () => {
      const result = cardEffects.applyStatusEffect(testCard, 'ATK_UP', null, 3);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(1);
      expect(testCard.statusEffects[0].type).toBe('ATK_UP');
      expect(testCard.statusEffects[0].duration).toBe(3);
      expect(testCard.statusEffects[0].value).toBe(2);
    });
    
    test('应用防御力降低效果', () => {
      const result = cardEffects.applyStatusEffect(testCard, 'DEF_DOWN', null, 2);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(1);
      expect(testCard.statusEffects[0].type).toBe('DEF_DOWN');
      expect(testCard.statusEffects[0].value).toBe(-2);
    });
    
    test('应用中毒效果', () => {
      const result = cardEffects.applyStatusEffect(testCard, 'POISON', null, 4);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(1);
      expect(testCard.statusEffects[0].type).toBe('POISON');
      // 中毒值应该是最大生命值的10%
      expect(testCard.statusEffects[0].value).toBe(10);
    });
    
    test('应用再生效果', () => {
      const result = cardEffects.applyStatusEffect(testCard, 'REGEN', null, 3);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(1);
      expect(testCard.statusEffects[0].type).toBe('REGEN');
      // 再生值应该是最大生命值的5%
      expect(testCard.statusEffects[0].value).toBe(5);
    });
    
    test('应用混乱效果', () => {
      const result = cardEffects.applyStatusEffect(testCard, 'CONFUSION', null, 2);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(1);
      expect(testCard.statusEffects[0].type).toBe('CONFUSION');
      expect(testCard.statusEffects[0].value).toBe(1);
    });
    
    test('更新已存在的效果持续时间', () => {
      // 先应用一个效果
      cardEffects.applyStatusEffect(testCard, 'ATK_UP', null, 2);
      
      // 再应用相同类型但持续时间更长的效果
      const result = cardEffects.applyStatusEffect(testCard, 'ATK_UP', null, 4);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(1);
      expect(testCard.statusEffects[0].type).toBe('ATK_UP');
      expect(testCard.statusEffects[0].duration).toBe(4);
    });
    
    test('更新已存在的效果为更强效果', () => {
      // 添加一个自定义效果，值较小
      testCard.statusEffects.push({
        type: 'ATK_UP',
        duration: 3,
        value: 1
      });
      
      // 应用相同类型但效果更强的效果
      const result = cardEffects.applyStatusEffect(testCard, 'ATK_UP', null, 2);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(1);
      expect(testCard.statusEffects[0].value).toBe(2);
      expect(testCard.statusEffects[0].duration).toBe(3); // 保留原来的更长持续时间
    });
    
    test('处理无效参数', () => {
      const result = cardEffects.applyStatusEffect(null, 'ATK_UP');
      expect(result).toBe(false);
    });
  });

  describe('移除状态效果测试', () => {
    beforeEach(() => {
      // 添加一些测试效果
      testCard.statusEffects = [
        { type: 'ATK_UP', duration: 3, value: 2 },
        { type: 'POISON', duration: 2, value: 10 }
      ];
    });
    
    test('移除存在的效果', () => {
      const result = cardEffects.removeStatusEffect(testCard, 'ATK_UP');
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(1);
      expect(testCard.statusEffects[0].type).toBe('POISON');
    });
    
    test('尝试移除不存在的效果', () => {
      const result = cardEffects.removeStatusEffect(testCard, 'CONFUSION');
      
      expect(result).toBe(false);
      expect(testCard.statusEffects).toHaveLength(2);
    });
    
    test('处理无效参数', () => {
      const result = cardEffects.removeStatusEffect(null, 'ATK_UP');
      expect(result).toBe(false);
    });
  });

  describe('处理回合开始效果测试', () => {
    test('处理中毒效果', () => {
      testCard.statusEffects = [
        { type: 'POISON', duration: 2, value: 10 }
      ];
      testCard.currentHP = 100;
      
      const result = cardEffects.processTurnStartEffects(testCard);
      
      expect(result).toBe(true);
      expect(testCard.currentHP).toBe(90); // 减少10点生命值
    });
    
    test('处理再生效果', () => {
      testCard.statusEffects = [
        { type: 'REGEN', duration: 2, value: 5 }
      ];
      testCard.currentHP = 80;
      
      const result = cardEffects.processTurnStartEffects(testCard);
      
      expect(result).toBe(true);
      expect(testCard.currentHP).toBe(85); // 恢复5点生命值
    });
    
    test('处理多种效果', () => {
      testCard.statusEffects = [
        { type: 'POISON', duration: 2, value: 10 },
        { type: 'REGEN', duration: 2, value: 5 }
      ];
      testCard.currentHP = 80;
      
      const result = cardEffects.processTurnStartEffects(testCard);
      
      expect(result).toBe(true);
      expect(testCard.currentHP).toBe(75); // 先减少10点，再恢复5点
    });
    
    test('恢复能量', () => {
      testCard.currentNRG = 1;
      
      const result = cardEffects.processTurnStartEffects(testCard);
      
      expect(result).toBe(true);
      expect(testCard.currentNRG).toBe(3); // 恢复到最大能量
    });
    
    test('处理无效参数', () => {
      const result = cardEffects.processTurnStartEffects(null);
      expect(result).toBe(false);
    });
  });

  describe('处理回合结束效果测试', () => {
    test('减少效果持续时间', () => {
      testCard.statusEffects = [
        { type: 'ATK_UP', duration: 3, value: 2 },
        { type: 'POISON', duration: 2, value: 10 },
        { type: 'CONFUSION', duration: 1, value: 1 }
      ];
      
      const result = cardEffects.processTurnEndEffects(testCard);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(2); // CONFUSION应该被移除
      expect(testCard.statusEffects[0].duration).toBe(2); // ATK_UP减少到2回合
      expect(testCard.statusEffects[1].duration).toBe(1); // POISON减少到1回合
    });
    
    test('移除所有过期效果', () => {
      testCard.statusEffects = [
        { type: 'ATK_UP', duration: 1, value: 2 },
        { type: 'POISON', duration: 1, value: 10 }
      ];
      
      const result = cardEffects.processTurnEndEffects(testCard);
      
      expect(result).toBe(true);
      expect(testCard.statusEffects).toHaveLength(0); // 所有效果都应该被移除
    });
    
    test('处理无效参数', () => {
      const result = cardEffects.processTurnEndEffects(null);
      expect(result).toBe(false);
    });
  });

  describe('获取状态修正值测试', () => {
    beforeEach(() => {
      testCard.statusEffects = [
        { type: 'ATK_UP', duration: 2, value: 2 },
        { type: 'DEF_DOWN', duration: 2, value: -2 }
      ];
    });
    
    test('获取攻击力修正', () => {
      const modifier = cardEffects.getStatusModifier(testCard, 'ATK');
      expect(modifier).toBe(2);
    });
    
    test('获取防御力修正', () => {
      const modifier = cardEffects.getStatusModifier(testCard, 'DEF');
      expect(modifier).toBe(-2);
    });
    
    test('获取速度修正（无效果）', () => {
      const modifier = cardEffects.getStatusModifier(testCard, 'SPD');
      expect(modifier).toBe(0);
    });
    
    test('多个相同类型效果的叠加', () => {
      testCard.statusEffects.push({ type: 'ATK_UP', duration: 1, value: 3 });
      
      const modifier = cardEffects.getStatusModifier(testCard, 'ATK');
      expect(modifier).toBe(5); // 2 + 3
    });
    
    test('处理无效参数', () => {
      const modifier = cardEffects.getStatusModifier(null, 'ATK');
      expect(modifier).toBe(0);
    });
  });

  describe('检查状态效果测试', () => {
    beforeEach(() => {
      testCard.statusEffects = [
        { type: 'ATK_UP', duration: 2, value: 2 },
        { type: 'POISON', duration: 2, value: 10 }
      ];
    });
    
    test('检查存在的效果', () => {
      expect(cardEffects.hasStatusEffect(testCard, 'ATK_UP')).toBe(true);
      expect(cardEffects.hasStatusEffect(testCard, 'POISON')).toBe(true);
    });
    
    test('检查不存在的效果', () => {
      expect(cardEffects.hasStatusEffect(testCard, 'CONFUSION')).toBe(false);
      expect(cardEffects.hasStatusEffect(testCard, 'STUN')).toBe(false);
    });
    
    test('处理无效参数', () => {
      expect(cardEffects.hasStatusEffect(null, 'ATK_UP')).toBe(false);
      expect(cardEffects.hasStatusEffect(testCard, null)).toBe(false);
    });
  });
}); 