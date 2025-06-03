/**
 * battle-actions.test.js
 * 战斗动作适配器测试
 */

// 导入battle-actions-adapter模块
const battleActions = require('../../static/js/battle/battle-actions-adapter');

describe('战斗动作适配器测试', () => {
  // 测试数据
  let attackerCard;
  let defenderCard;
  
  beforeEach(() => {
    // 初始化测试数据
    attackerCard = {
      name: 'Attacker',
      stats: {
        ATK: 50,
        DEF: 20,
        SPD: 30,
        CRI: 25 // 25% 暴击率
      },
      statusEffects: []
    };
    
    defenderCard = {
      name: 'Defender',
      stats: {
        HP: 100,
        ATK: 30,
        DEF: 30,
        SPD: 20
      },
      currentHP: 100,
      statusEffects: []
    };
    
    // 重置所有模拟
    jest.restoreAllMocks();
  });

  describe('calculateDamage测试', () => {
    test('基础伤害计算', () => {
      // 模拟随机数生成器，确保不触发暴击和闪避
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.9) // 不触发闪避
        .mockReturnValueOnce(0.9); // 不触发暴击
      
      const damage = battleActions.calculateDamage(attackerCard, defenderCard);
      
      // 期望伤害 = ATK - (DEF * 0.7) = 50 - (30 * 0.7) = 50 - 21 = 29
      expect(damage).toBe(29);
      
      // 恢复原始的随机数生成器
      Math.random = originalRandom;
    });
    
    test('暴击伤害计算', () => {
      // 模拟随机数生成器，确保触发暴击但不触发闪避
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.9) // 不触发闪避
        .mockReturnValueOnce(0.1); // 触发暴击
      
      const damage = battleActions.calculateDamage(attackerCard, defenderCard);
      
      // 期望伤害 = (ATK - (DEF * 0.7)) * 1.5 = (50 - 21) * 1.5 = 29 * 1.5 = 43.5 = 43(取整)
      expect(damage).toBe(43);
      
      // 恢复原始的随机数生成器
      Math.random = originalRandom;
    });
    
    test('混乱效果测试', () => {
      // 添加混乱效果
      attackerCard.statusEffects.push({
        confusion: 60 // 60%的概率混乱
      });
      
      // 模拟随机数生成器，确保触发混乱
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5); // 触发混乱 (0.5 * 100 < 60)
      
      const result = battleActions.calculateDamage(attackerCard, defenderCard);
      
      // 期望返回混乱标记
      expect(result).toBe('confused');
      
      // 恢复原始的随机数生成器
      Math.random = originalRandom;
    });
    
    test('闪避效果测试', () => {
      // 提高防御者的速度以增加闪避率
      defenderCard.stats.SPD = 30; // 30%的闪避率
      
      // 模拟随机数生成器，确保触发闪避
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.2); // 触发闪避 (0.2 * 100 < 30)
      
      const damage = battleActions.calculateDamage(attackerCard, defenderCard);
      
      // 闪避成功，伤害为0
      expect(damage).toBe(0);
      
      // 恢复原始的随机数生成器
      Math.random = originalRandom;
    });
    
    test('闪避率增加效果测试', () => {
      // 添加闪避率增加的状态效果
      defenderCard.statusEffects.push({
        dodge_rate: 50 // 额外50%的闪避率
      });
      
      // 模拟随机数生成器，确保触发闪避
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.6); // 触发闪避 (0.6 * 100 < 20 + 50)
      
      const damage = battleActions.calculateDamage(attackerCard, defenderCard);
      
      // 闪避成功，伤害为0
      expect(damage).toBe(0);
      
      // 恢复原始的随机数生成器
      Math.random = originalRandom;
    });
    
    test('最小伤害测试', () => {
      // 设置防御者的防御力非常高
      defenderCard.stats.DEF = 100;
      
      // 模拟随机数生成器，确保不触发暴击和闪避
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.9) // 不触发闪避
        .mockReturnValueOnce(0.9); // 不触发暴击
      
      const damage = battleActions.calculateDamage(attackerCard, defenderCard);
      
      // 期望伤害为最小值1
      expect(damage).toBe(1);
      
      // 恢复原始的随机数生成器
      Math.random = originalRandom;
    });
  });

  describe('executeSkillEffect测试', () => {
    test('伤害技能效果', () => {
      // 创建伤害技能
      const damageSkill = {
        effect: {
          damage: 1.5 // 伤害倍率
        }
      };
      
      // 直接模拟calculateDamage函数
      jest.spyOn(battleActions, 'calculateDamage').mockReturnValue(30);
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, damageSkill);
      
      // 期望伤害 = 基础伤害 * 倍率 = 30 * 1.5 = 45
      expect(result).toBe(45);
      
      // 恢复原始函数
      jest.restoreAllMocks();
    });
    
    test('治疗技能效果', () => {
      // 设置目标当前生命值
      defenderCard.currentHP = 70;
      
      // 创建治疗技能
      const healSkill = {
        effect: {
          heal: 20 // 治疗量
        }
      };
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, healSkill);
      
      // 期望治疗量为20
      expect(result).toBe(20);
      // 期望目标生命值增加
      expect(defenderCard.currentHP).toBe(90);
    });
    
    test('治疗不超过最大生命值', () => {
      // 设置目标当前生命值接近最大值
      defenderCard.currentHP = 90;
      
      // 创建治疗技能
      const healSkill = {
        effect: {
          heal: 20 // 治疗量
        }
      };
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, healSkill);
      
      // 期望治疗量为10（不超过最大生命值）
      expect(result).toBe(10);
      // 期望目标生命值为最大值
      expect(defenderCard.currentHP).toBe(100);
    });
    
    test('增益效果技能', () => {
      // 创建增益效果技能
      const buffSkill = {
        effect: {
          buff: {
            name: '力量增强',
            atk_boost: 10,
            duration: 3
          }
        }
      };
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, buffSkill);
      
      // 期望返回增益效果
      expect(result).toEqual({
        name: '力量增强',
        atk_boost: 10,
        duration: 3
      });
      // 期望目标添加了状态效果
      expect(defenderCard.statusEffects.length).toBe(1);
      expect(defenderCard.statusEffects[0]).toEqual({
        name: '力量增强',
        atk_boost: 10,
        duration: 3
      });
    });
    
    test('减益效果技能', () => {
      // 创建减益效果技能
      const debuffSkill = {
        effect: {
          debuff: {
            name: '防御弱化',
            def_reduction: 5,
            duration: 2
          }
        }
      };
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, debuffSkill);
      
      // 期望返回减益效果
      expect(result).toEqual({
        name: '防御弱化',
        def_reduction: 5,
        duration: 2
      });
      // 期望目标添加了状态效果
      expect(defenderCard.statusEffects.length).toBe(1);
      expect(defenderCard.statusEffects[0]).toEqual({
        name: '防御弱化',
        def_reduction: 5,
        duration: 2
      });
    });
    
    test('混乱效果处理', () => {
      // 创建伤害技能
      const damageSkill = {
        effect: {
          damage: 1.5
        }
      };
      
      // 模拟calculateDamage函数返回混乱
      jest.spyOn(battleActions, 'calculateDamage').mockReturnValue('confused');
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, damageSkill);
      
      // 期望返回混乱标记
      expect(result).toBe('confused');
      
      // 恢复原始函数
      jest.restoreAllMocks();
    });
    
    test('闪避效果处理', () => {
      // 创建伤害技能
      const damageSkill = {
        effect: {
          damage: 1.5
        }
      };
      
      // 模拟calculateDamage函数返回闪避
      jest.spyOn(battleActions, 'calculateDamage').mockReturnValue(0);
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, damageSkill);
      
      // 期望返回0伤害
      expect(result).toBe(0);
      
      // 恢复原始函数
      jest.restoreAllMocks();
    });
    
    test('无效果技能', () => {
      // 创建无效果技能
      const emptySkill = {
        effect: {}
      };
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, emptySkill);
      
      // 期望返回null
      expect(result).toBeNull();
    });
    
    test('无效果属性的技能', () => {
      // 创建无效果属性的技能
      const invalidSkill = {};
      
      const result = battleActions.executeSkillEffect(attackerCard, defenderCard, invalidSkill);
      
      // 期望返回undefined
      expect(result).toBeUndefined();
    });
  });
}); 