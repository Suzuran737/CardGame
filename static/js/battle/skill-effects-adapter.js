/**
 * 技能效果适配器 - 用于Jest测试
 * 
 * 此适配器封装了游戏中的技能效果系统，提供了一个与原始游戏代码行为一致的接口，
 * 便于在Jest测试环境中进行单元测试。
 */

// 导入元素系统适配器
const elementSystem = require('./element-system-adapter');

// 技能类型枚举
const SkillType = {
    DAMAGE: 'damage',       // 伤害类技能
    HEAL: 'heal',           // 治疗类技能
    BUFF: 'buff',           // 增益效果
    DEBUFF: 'debuff',       // 减益效果
    AOE: 'aoe',             // 群体效果
    SPECIAL: 'special'      // 特殊效果
};

// 状态效果类型枚举
const StatusEffectType = {
    ATK_UP: 'atk_up',           // 攻击力提升
    DEF_UP: 'def_up',           // 防御力提升
    SPD_UP: 'spd_up',           // 速度提升
    ATK_DOWN: 'atk_down',       // 攻击力降低
    DEF_DOWN: 'def_down',       // 防御力降低
    SPD_DOWN: 'spd_down',       // 速度降低
    DOT: 'dot',                 // 持续伤害
    HOT: 'hot',                 // 持续治疗
    STUN: 'stun',               // 眩晕
    CONFUSE: 'confuse',         // 混乱
    DODGE: 'dodge'              // 闪避
};

// 技能目标类型枚举
const TargetType = {
    SINGLE: 'single',       // 单体目标
    ALL: 'all',             // 全体目标
    RANDOM: 'random',       // 随机目标
    SELF: 'self'            // 自身
};

/**
 * 计算伤害类技能效果
 * @param {Object} caster - 施放技能的卡牌
 * @param {Object} target - 技能目标卡牌
 * @param {Object} skill - 技能对象
 * @returns {Object} 包含伤害值和效果描述的对象
 */
function calculateDamageSkill(caster, target, skill) {
    // 获取技能基础伤害倍率
    const damageMultiplier = skill.multiplier || 1.0;
    
    // 计算基础伤害
    let baseDamage = Math.floor(caster.atk * damageMultiplier);
    
    // 应用元素加成
    const elementalDamage = elementSystem.calculateElementalDamage(
        baseDamage,
        caster.element,
        target.element,
        skill.element
    );
    
    // 计算最终伤害 (考虑目标防御)
    let finalDamage = Math.max(1, elementalDamage - Math.floor(target.def * 0.5));
    
    // 暴击判定
    let isCritical = false;
    if (caster.critRate && Math.random() < caster.critRate) {
        const critMultiplier = caster.critDamage || 1.5;
        finalDamage = Math.floor(finalDamage * critMultiplier);
        isCritical = true;
    }
    
    // 检查目标是否有闪避状态效果
    let isDodged = false;
    if (target.statusEffects && target.statusEffects.some(effect => effect.type === StatusEffectType.DODGE)) {
        // 闪避概率检查
        if (Math.random() < 0.5) { // 假设闪避成功率为50%
            finalDamage = 0;
            isDodged = true;
        }
    }
    
    return {
        value: finalDamage,
        isCritical: isCritical,
        isDodged: isDodged,
        description: `${caster.name}对${target.name}造成了${finalDamage}点伤害${isCritical ? '(暴击)' : ''}${isDodged ? '(闪避)' : ''}`
    };
}

/**
 * 计算治疗类技能效果
 * @param {Object} caster - 施放技能的卡牌
 * @param {Object} target - 技能目标卡牌
 * @param {Object} skill - 技能对象
 * @returns {Object} 包含治疗值和效果描述的对象
 */
function calculateHealSkill(caster, target, skill) {
    // 获取技能基础治疗倍率
    const healMultiplier = skill.multiplier || 1.0;
    
    // 计算基础治疗量 (基于施放者的攻击力或其他属性)
    let baseHeal = Math.floor(caster.atk * healMultiplier);
    
    // 检查是否为同元素加成
    if (skill.element && skill.element === caster.element) {
        baseHeal = Math.floor(baseHeal * elementSystem.ELEMENT_MATCH);
    }
    
    // 确保不会超过目标最大生命值
    const maxHeal = target.maxHp - target.hp;
    const actualHeal = Math.min(baseHeal, maxHeal);
    
    return {
        value: actualHeal,
        description: `${caster.name}为${target.name}恢复了${actualHeal}点生命值`
    };
}

/**
 * 应用状态效果技能
 * @param {Object} caster - 施放技能的卡牌
 * @param {Object} target - 技能目标卡牌
 * @param {Object} skill - 技能对象
 * @returns {Object} 包含应用的状态效果和描述的对象
 */
function applyStatusEffect(caster, target, skill) {
    if (!skill.statusEffect) {
        return { success: false, description: "没有指定状态效果" };
    }
    
    // 创建新的状态效果对象
    const newEffect = {
        type: skill.statusEffect.type,
        value: skill.statusEffect.value,
        duration: skill.statusEffect.duration || 2, // 默认持续2回合
        source: caster.id
    };
    
    // 初始化目标的状态效果数组(如果不存在)
    if (!target.statusEffects) {
        target.statusEffects = [];
    }
    
    // 检查是否已存在同类型效果
    const existingEffectIndex = target.statusEffects.findIndex(effect => effect.type === newEffect.type);
    
    if (existingEffectIndex >= 0) {
        // 替换或者累加效果，取决于效果类型
        const isStackable = [StatusEffectType.ATK_UP, StatusEffectType.DEF_UP, StatusEffectType.ATK_DOWN, StatusEffectType.DEF_DOWN].includes(newEffect.type);
        
        if (isStackable) {
            // 累加效果值，取较长持续时间
            target.statusEffects[existingEffectIndex].value += newEffect.value;
            target.statusEffects[existingEffectIndex].duration = Math.max(
                target.statusEffects[existingEffectIndex].duration,
                newEffect.duration
            );
        } else {
            // 替换为新效果
            target.statusEffects[existingEffectIndex] = newEffect;
        }
    } else {
        // 添加新效果
        target.statusEffects.push(newEffect);
    }
    
    // 根据状态效果类型确定描述
    let effectDescription = "";
    switch (newEffect.type) {
        case StatusEffectType.ATK_UP:
            effectDescription = `攻击力提升了${newEffect.value}点`;
            break;
        case StatusEffectType.DEF_UP:
            effectDescription = `防御力提升了${newEffect.value}点`;
            break;
        case StatusEffectType.SPD_UP:
            effectDescription = `速度提升了${newEffect.value}点`;
            break;
        case StatusEffectType.ATK_DOWN:
            effectDescription = `攻击力降低了${newEffect.value}点`;
            break;
        case StatusEffectType.DEF_DOWN:
            effectDescription = `防御力降低了${newEffect.value}点`;
            break;
        case StatusEffectType.SPD_DOWN:
            effectDescription = `速度降低了${newEffect.value}点`;
            break;
        case StatusEffectType.DOT:
            effectDescription = `受到了持续伤害效果`;
            break;
        case StatusEffectType.HOT:
            effectDescription = `获得了持续治疗效果`;
            break;
        case StatusEffectType.STUN:
            effectDescription = `被眩晕了`;
            break;
        case StatusEffectType.CONFUSE:
            effectDescription = `被混乱了`;
            break;
        case StatusEffectType.DODGE:
            effectDescription = `获得了闪避效果`;
            break;
        default:
            effectDescription = `受到了一个状态效果`;
    }
    
    return {
        success: true,
        effect: newEffect,
        description: `${caster.name}使${target.name}${effectDescription}(持续${newEffect.duration}回合)`
    };
}

/**
 * 应用群体(AOE)技能效果
 * @param {Object} caster - 施放技能的卡牌
 * @param {Array} targets - 技能目标卡牌数组
 * @param {Object} skill - 技能对象
 * @returns {Array} 包含每个目标效果的结果数组
 */
function applyAOESkill(caster, targets, skill) {
    if (!targets || targets.length === 0) {
        return { success: false, description: "没有有效目标" };
    }
    
    const results = [];
    
    // AOE伤害通常会有伤害衰减
    const damageReduction = skill.aoeReduction || 0.8; // 默认AOE伤害为单体的80%
    
    // 应用于每个目标
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        
        // 根据技能类型计算效果
        if (skill.type === SkillType.DAMAGE) {
            // 创建一个衰减版本的伤害技能
            const aoeDamageSkill = { ...skill, multiplier: skill.multiplier * damageReduction };
            const damageResult = calculateDamageSkill(caster, target, aoeDamageSkill);
            results.push(damageResult);
        } else if (skill.type === SkillType.BUFF || skill.type === SkillType.DEBUFF) {
            const statusResult = applyStatusEffect(caster, target, skill);
            results.push(statusResult);
        }
    }
    
    return {
        results: results,
        description: `${caster.name}对${targets.length}个目标使用了群体技能`
    };
}

/**
 * 更新状态效果持续时间，移除过期效果
 * @param {Object} card - 卡牌对象
 * @returns {Object} 包含已移除效果和剩余效果的对象
 */
function updateStatusEffects(card) {
    if (!card.statusEffects || card.statusEffects.length === 0) {
        return { removed: [], remaining: [] };
    }
    
    const removedEffects = [];
    const remainingEffects = [];
    
    // 遍历所有状态效果
    for (let i = 0; i < card.statusEffects.length; i++) {
        const effect = card.statusEffects[i];
        
        // 减少持续时间
        effect.duration--;
        
        if (effect.duration <= 0) {
            // 效果已过期，添加到已移除列表
            removedEffects.push(effect);
        } else {
            // 效果仍然有效，保留
            remainingEffects.push(effect);
        }
    }
    
    // 更新卡牌的状态效果
    card.statusEffects = remainingEffects;
    
    return {
        removed: removedEffects,
        remaining: remainingEffects
    };
}

/**
 * 应用持续性状态效果(如持续伤害、持续治疗)
 * @param {Object} card - 卡牌对象
 * @returns {Array} 应用效果的结果数组
 */
function applyPersistentEffects(card) {
    if (!card.statusEffects || card.statusEffects.length === 0) {
        return [];
    }
    
    const results = [];
    
    // 遍历所有状态效果
    for (let i = 0; i < card.statusEffects.length; i++) {
        const effect = card.statusEffects[i];
        
        // 根据效果类型应用效果
        if (effect.type === StatusEffectType.DOT) {
            // 持续伤害
            const dotDamage = effect.value || 5; // 默认每回合5点伤害
            card.hp = Math.max(0, card.hp - dotDamage);
            
            results.push({
                type: 'damage',
                value: dotDamage,
                description: `${card.name}受到${dotDamage}点持续伤害`
            });
        } else if (effect.type === StatusEffectType.HOT) {
            // 持续治疗
            const hotHeal = effect.value || 5; // 默认每回合5点治疗
            const maxHeal = card.maxHp - card.hp;
            const actualHeal = Math.min(hotHeal, maxHeal);
            
            if (actualHeal > 0) {
                card.hp += actualHeal;
                
                results.push({
                    type: 'heal',
                    value: actualHeal,
                    description: `${card.name}恢复了${actualHeal}点生命值`
                });
            }
        }
    }
    
    return results;
}

/**
 * 获取卡牌当前的属性值(考虑状态效果)
 * @param {Object} card - 卡牌对象
 * @param {string} attribute - 属性名称('atk', 'def', 'spd'等)
 * @returns {number} 考虑状态效果后的属性值
 */
function getAttributeWithEffects(card, attribute) {
    if (!card || !card[attribute]) {
        return 0;
    }
    
    let baseValue = card[attribute];
    let modifier = 0;
    
    // 如果没有状态效果，直接返回基础值
    if (!card.statusEffects || card.statusEffects.length === 0) {
        return baseValue;
    }
    
    // 计算状态效果的影响
    for (let i = 0; i < card.statusEffects.length; i++) {
        const effect = card.statusEffects[i];
        
        switch (attribute) {
            case 'atk':
                if (effect.type === StatusEffectType.ATK_UP) {
                    modifier += effect.value;
                } else if (effect.type === StatusEffectType.ATK_DOWN) {
                    modifier -= effect.value;
                }
                break;
            case 'def':
                if (effect.type === StatusEffectType.DEF_UP) {
                    modifier += effect.value;
                } else if (effect.type === StatusEffectType.DEF_DOWN) {
                    modifier -= effect.value;
                }
                break;
            case 'spd':
                if (effect.type === StatusEffectType.SPD_UP) {
                    modifier += effect.value;
                } else if (effect.type === StatusEffectType.SPD_DOWN) {
                    modifier -= effect.value;
                }
                break;
        }
    }
    
    // 确保最终值至少为1
    return Math.max(1, baseValue + modifier);
}

/**
 * 检查卡牌是否可以行动(不被眩晕等控制效果影响)
 * @param {Object} card - 卡牌对象
 * @returns {boolean} 是否可以行动
 */
function canAct(card) {
    if (!card.statusEffects || card.statusEffects.length === 0) {
        return true;
    }
    
    // 检查是否有阻止行动的效果
    return !card.statusEffects.some(effect => effect.type === StatusEffectType.STUN);
}

/**
 * 创建一个技能对象
 * @param {string} name - 技能名称
 * @param {string} type - 技能类型(SkillType枚举)
 * @param {Object} options - 技能选项
 * @returns {Object} 技能对象
 */
function createSkill(name, type, options = {}) {
    return {
        name,
        type,
        multiplier: options.multiplier || 1.0,
        element: options.element,
        energyCost: options.energyCost || 2,
        cooldown: options.cooldown || 0,
        currentCooldown: 0,
        targetType: options.targetType || TargetType.SINGLE,
        statusEffect: options.statusEffect,
        aoeReduction: options.aoeReduction,
        description: options.description || `${name}技能`
    };
}

// 导出技能效果系统功能
module.exports = {
    SkillType,
    StatusEffectType,
    TargetType,
    calculateDamageSkill,
    calculateHealSkill,
    applyStatusEffect,
    applyAOESkill,
    updateStatusEffects,
    applyPersistentEffects,
    getAttributeWithEffects,
    canAct,
    createSkill
}; 