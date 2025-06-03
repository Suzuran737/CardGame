/**
 * battle-actions-adapter.js
 * 适配器文件，实现战斗动作功能供测试使用
 */

// 导入测试模块（如果在测试环境中）
let battleActions = null;
try {
    battleActions = require('./battle-actions');
} catch (e) {
    console.log('无法导入battle-actions模块，使用适配器内部实现');
}

/**
 * 计算伤害
 * @param {Object} attacker 攻击者卡牌
 * @param {Object} defender 防御者卡牌
 * @param {boolean} ignoreConfusion 是否忽略混乱效果
 * @returns {number|string} 伤害值或特殊标记
 */
function calculateDamage(attacker, defender, ignoreConfusion = false) {
    // 基本参数检查
    if (!attacker || !defender) {
        return 0;
    }
    
    // 特殊情况：混乱效果，有一定概率攻击己方
    if (!ignoreConfusion && attacker.statusEffects) {
        const confusionEffect = attacker.statusEffects.find(effect => effect.confusion);
        if (confusionEffect) {
            const confusionChance = confusionEffect.confusion || 0;
            // 如果随机值小于混乱几率，则触发混乱
            if (Math.random() * 100 < confusionChance) {
                return 'confused'; // 混乱发动，返回特殊标记
            }
        }
    }
    
    // 检查闪避
    let dodgeRate = 0;
    if (defender.stats && defender.stats.SPD) {
        // 基础闪避率：SPD的1%，最高30%
        dodgeRate = Math.min(30, defender.stats.SPD);
        
        // 添加状态效果的闪避加成
        if (defender.statusEffects) {
            for (const effect of defender.statusEffects) {
                if (effect.dodge_rate) {
                    dodgeRate += effect.dodge_rate;
                }
            }
        }
    }
    
    // 如果随机值小于闪避率，则触发闪避
    if (dodgeRate > 0 && Math.random() * 100 < dodgeRate) {
        return 0; // 闪避成功
    }
    
    // 获取基础属性
    const attackerATK = attacker.stats ? (attacker.stats.ATK || 1) : 1;
    const defenderDEF = defender.stats ? (defender.stats.DEF || 0) : 0;
    
    // 计算基础伤害
    const defReduction = defenderDEF * 0.7; // 防御力只能抵消70%
    let damage = Math.max(1, attackerATK - defReduction);
    
    // 检查是否暴击
    const critChance = attacker.stats && attacker.stats.CRI ? attacker.stats.CRI / 100 : 0;
    // 如果随机值小于暴击率，则触发暴击
    const isCrit = Math.random() < critChance;
    if (isCrit) {
        damage *= 1.5;
    }
    
    // 返回最终伤害值
    return Math.floor(damage);
}

/**
 * 执行技能效果
 * @param {Object} caster 施法者卡牌
 * @param {Object} target 目标卡牌
 * @param {Object} skill 技能对象
 * @returns {*} 技能执行结果
 */
function executeSkillEffect(caster, target, skill) {
    // 如果没有提供技能，返回undefined
    if (!skill) {
        return undefined;
    }
    
    // 如果技能没有效果属性，返回undefined
    if (!skill.effect) {
        return undefined;
    }
    
    // 处理伤害效果
    if (skill.effect.damage) {
        // 检查calculateDamage是否被模拟
        let baseDamage;
        
        // 使用模块的calculateDamage函数，这样Jest的spyOn可以正确工作
        baseDamage = module.exports.calculateDamage(caster, target);
        
        // 如果是特殊结果（混乱或闪避），直接返回
        if (baseDamage === 'confused') {
            return 'confused';
        }
        
        if (baseDamage === 0) {
            return 0; // 闪避成功
        }
        
        // 计算技能伤害
        const skillDamage = Math.floor(baseDamage * skill.effect.damage);
        
        // 如果目标有currentHP属性，减少其生命值
        if (target && typeof target.currentHP === 'number') {
            target.currentHP = Math.max(0, target.currentHP - skillDamage);
        }
        
        return skillDamage;
    }
    
    // 处理治疗效果
    if (skill.effect.heal) {
        const healAmount = skill.effect.heal;
        
        // 确保目标有currentHP和stats.HP属性
        if (!target || typeof target.currentHP !== 'number' || !target.stats || !target.stats.HP) {
            return false;
        }
        
        // 实际治疗量不能超过最大生命值
        const actualHeal = Math.min(healAmount, target.stats.HP - target.currentHP);
        target.currentHP += actualHeal;
        return actualHeal;
    }
    
    // 处理增益效果
    if (skill.effect.buff) {
        const buff = {
            ...skill.effect.buff,
            duration: skill.effect.buff.duration
        };
        
        // 添加增益效果
        if (!target.statusEffects) {
            target.statusEffects = [];
        }
        target.statusEffects.push(buff);
        return buff;
    }
    
    // 处理减益效果
    if (skill.effect.debuff) {
        const debuff = {
            ...skill.effect.debuff,
            duration: skill.effect.debuff.duration
        };
        
        // 添加减益效果
        if (!target.statusEffects) {
            target.statusEffects = [];
        }
        target.statusEffects.push(debuff);
        return debuff;
    }
    
    return null;
}

// 为测试暴露battleActions对象
if (typeof global !== 'undefined') {
    global.battleActions = battleActions;
}

// 导出适配器对象
const battleActionsAdapter = {
    calculateDamage,
    executeSkillEffect
};

module.exports = battleActionsAdapter; 