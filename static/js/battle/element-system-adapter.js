/**
 * 元素系统适配器 - 用于Jest测试
 * 
 * 此适配器封装了游戏中的元素相克系统，提供了一个与原始游戏代码行为一致的接口，
 * 便于在Jest测试环境中进行单元测试。
 */

// 元素类型枚举
const ElementType = {
    FIRE: 'fire',
    WATER: 'water',
    EARTH: 'earth',
    AIR: 'air',
    LIGHT: 'light',
    DARK: 'dark',
    NEUTRAL: 'neutral'
};

// 元素相克关系表
const elementRelations = {
    [ElementType.FIRE]: {
        strong: [ElementType.AIR, ElementType.EARTH], // 火克风和土
        weak: [ElementType.WATER]                    // 水克火
    },
    [ElementType.WATER]: {
        strong: [ElementType.FIRE, ElementType.EARTH], // 水克火和土
        weak: [ElementType.AIR]                       // 风克水
    },
    [ElementType.EARTH]: {
        strong: [ElementType.AIR, ElementType.DARK],  // 土克风和暗
        weak: [ElementType.FIRE, ElementType.WATER]   // 火和水克土
    },
    [ElementType.AIR]: {
        strong: [ElementType.WATER, ElementType.DARK], // 风克水和暗
        weak: [ElementType.FIRE, ElementType.EARTH]    // 火和土克风
    },
    [ElementType.LIGHT]: {
        strong: [ElementType.DARK],                   // 光克暗
        weak: [ElementType.DARK]                      // 暗克光 (互相克制)
    },
    [ElementType.DARK]: {
        strong: [ElementType.LIGHT],                  // 暗克光
        weak: [ElementType.LIGHT, ElementType.EARTH, ElementType.AIR] // 光、土、风克暗
    },
    [ElementType.NEUTRAL]: {
        strong: [],                                   // 中性不克制任何属性
        weak: []                                      // 中性不被任何属性克制
    }
};

// 元素伤害系数
const ELEMENT_BONUS = 1.5;       // 元素克制加成
const ELEMENT_PENALTY = 0.75;    // 元素被克制减益
const ELEMENT_MATCH = 1.2;       // 卡牌与技能元素匹配加成

/**
 * 判断攻击元素是否克制防御元素
 * @param {string} attackElement - 攻击方元素类型
 * @param {string} defenseElement - 防御方元素类型
 * @returns {boolean} - 是否形成克制关系
 */
function isElementStrong(attackElement, defenseElement) {
    if (!elementRelations[attackElement]) return false;
    return elementRelations[attackElement].strong.includes(defenseElement);
}

/**
 * 判断攻击元素是否被防御元素克制
 * @param {string} attackElement - 攻击方元素类型
 * @param {string} defenseElement - 防御方元素类型
 * @returns {boolean} - 是否被克制
 */
function isElementWeak(attackElement, defenseElement) {
    if (!elementRelations[attackElement]) return false;
    return elementRelations[defenseElement].strong.includes(attackElement);
}

/**
 * 计算元素相克关系对伤害的影响系数
 * @param {string} attackElement - 攻击方元素类型
 * @param {string} defenseElement - 防御方元素类型
 * @param {string} skillElement - 技能元素类型 (可选)
 * @returns {number} - 最终伤害系数
 */
function calculateElementalModifier(attackElement, defenseElement, skillElement = null) {
    let modifier = 1.0;
    
    // 检查攻击元素是否克制防御元素
    if (isElementStrong(attackElement, defenseElement)) {
        modifier *= ELEMENT_BONUS;
    }
    
    // 检查攻击元素是否被防御元素克制
    if (isElementWeak(attackElement, defenseElement)) {
        modifier *= ELEMENT_PENALTY;
    }
    
    // 检查技能元素与卡牌元素是否匹配
    if (skillElement && skillElement === attackElement) {
        modifier *= ELEMENT_MATCH;
    }
    
    return modifier;
}

/**
 * 获取元素之间的关系描述
 * @param {string} attackElement - 攻击方元素类型
 * @param {string} defenseElement - 防御方元素类型
 * @returns {string} - 关系描述："strong", "weak", 或 "neutral"
 */
function getElementRelation(attackElement, defenseElement) {
    if (isElementStrong(attackElement, defenseElement)) {
        return "strong";
    } else if (isElementWeak(attackElement, defenseElement)) {
        return "weak";
    } else {
        return "neutral";
    }
}

/**
 * 计算包含元素相克的伤害值
 * @param {number} baseDamage - 基础伤害值
 * @param {string} attackElement - 攻击方元素类型
 * @param {string} defenseElement - 防御方元素类型
 * @param {string} skillElement - 技能元素类型 (可选)
 * @param {number} resistanceValue - 元素抗性值 (0-100, 默认为0)
 * @returns {number} - 最终伤害值
 */
function calculateElementalDamage(baseDamage, attackElement, defenseElement, skillElement = null, resistanceValue = 0) {
    // 计算元素相克系数
    const elementModifier = calculateElementalModifier(attackElement, defenseElement, skillElement);
    
    // 计算元素抗性影响 (每点抗性减少1%伤害)
    const resistanceModifier = 1 - (resistanceValue / 100);
    
    // 计算最终伤害
    let finalDamage = baseDamage * elementModifier * resistanceModifier;
    
    // 确保伤害至少为1
    return Math.max(1, Math.floor(finalDamage));
}

// 导出元素系统功能
module.exports = {
    ElementType,
    elementRelations,
    isElementStrong,
    isElementWeak,
    calculateElementalModifier,
    getElementRelation,
    calculateElementalDamage,
    ELEMENT_BONUS,
    ELEMENT_PENALTY,
    ELEMENT_MATCH
}; 