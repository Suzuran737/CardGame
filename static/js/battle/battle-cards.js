/**
 * battle-cards.js
 * 处理卡牌相关功能
 */

/**
 * 创建卡牌元素
 * @param {Object} card - 卡牌数据
 * @returns {HTMLElement} 创建的卡牌元素
 */
function createCardElement(card) {
    const element = document.createElement('div');
    element.className = 'card';
    element.dataset.id = card.id;
    element.dataset.uuid = card.uuid || `card-${card.id}-${Math.random().toString(36).substr(2, 9)}`; // 使用uuid如果存在，否则生成一个随机ID
    
    // 计算考虑了状态效果后的属性值
    const currentATK = calculateCurrentStat(card, 'ATK');
    const currentDEF = calculateCurrentStat(card, 'DEF');
    const currentSPD = calculateCurrentStat(card, 'SPD');
    
    // 判断属性是增强还是减弱
    const atkModClass = currentATK > card.stats.ATK ? 'stat-modified buff' : (currentATK < card.stats.ATK ? 'stat-modified debuff' : '');
    const defModClass = currentDEF > card.stats.DEF ? 'stat-modified buff' : (currentDEF < card.stats.DEF ? 'stat-modified debuff' : '');
    const spdModClass = currentSPD > card.stats.SPD ? 'stat-modified buff' : (currentSPD < card.stats.SPD ? 'stat-modified debuff' : '');
    
    // 添加变化值的提示
    const atkDiff = currentATK - card.stats.ATK;
    const defDiff = currentDEF - card.stats.DEF;
    const spdDiff = currentSPD - card.stats.SPD;
    
    const atkModText = atkDiff !== 0 ? ` (${atkDiff > 0 ? '+' : ''}${atkDiff})` : '';
    const defModText = defDiff !== 0 ? ` (${defDiff > 0 ? '+' : ''}${defDiff})` : '';
    const spdModText = spdDiff !== 0 ? ` (${spdDiff > 0 ? '+' : ''}${spdDiff})` : '';
    
    // 基本卡牌HTML
    let cardHTML = `
        <div class="card-header">
            <div class="card-name">${card.name}</div>
        </div>
        <div class="card-element element-${card.element.toLowerCase()}">${card.element}</div>
        <div class="card-stats">
            <div class="stat">
                <span class="stat-label">HP</span>
                <span>${card.currentHP}/${card.stats.HP}</span>
            </div>
            <div class="stat">
                <span class="stat-label">ATK</span>
                <span class="${atkModClass}" title="基础值: ${card.stats.ATK}">${currentATK}${atkModText}</span>
            </div>
            <div class="stat">
                <span class="stat-label">DEF</span>
                <span class="${defModClass}" title="基础值: ${card.stats.DEF}">${currentDEF}${defModText}</span>
            </div>
            <div class="stat">
                <span class="stat-label">SPD</span>
                <span class="${spdModClass}" title="基础值: ${card.stats.SPD}">${currentSPD}${spdModText}</span>
            </div>
        </div>
        <div class="card-energy">
            <span class="energy-label">能量</span>
            <span class="energy-value">${card.currentNRG}/5</span>
        </div>
    `;
    
    // 渲染状态效果图标
    if (card.statusEffects && card.statusEffects.length > 0) {
        cardHTML += `<div class="status-effects">`;
        card.statusEffects.forEach(effect => {
            const effectName = getEffectName(effect);
            cardHTML += `<div class="status-effect" title="${effectName}: 持续${effect.duration}回合">${effectName[0]}</div>`;
        });
        cardHTML += `</div>`;
    }
    
    element.innerHTML = cardHTML;
    return element;
}

/**
 * 获取效果的显示名称
 * @param {Object} effect - 效果对象
 * @returns {string} 效果名称
 */
function getEffectName(effect) {
    if (effect.name) return effect.name;
    
    if (effect.defense) return "防御增强";
    if (effect.dodge_rate) return "闪避增强";
    if (effect.reflect_damage) return "伤害反弹";
    if (effect.speed) return effect.speed > 0 ? "速度增强" : "速度降低";
    if (effect.confusion) return "混乱";
    if (effect.energy) return "能量增益";
    if (effect.poison) return "中毒";
    if (effect.damage && !effect.aoe) return "灼烧"; // 单体damage效果一般是灼烧
    
    return "状态效果";
}

/**
 * 获取效果的类型标识符，用于判断效果是否属于同一类型
 * @param {Object} effect - 效果对象
 * @returns {string} 效果类型标识符
 */
function getEffectType(effect) {
    if (effect.defense) return "defense";
    if (effect.dodge_rate) return "dodge";
    if (effect.reflect_damage) return "reflect";
    if (effect.speed) return "speed";
    if (effect.confusion) return "confusion";
    if (effect.energy) return "energy";
    if (effect.poison) return "poison";
    if (effect.damage && !effect.aoe) return "burn";
    if (effect.name) return effect.name; // 使用自定义名称作为类型
    
    // 如果没有明确的类型标识，使用效果的第一个属性
    const keys = Object.keys(effect).filter(key => 
        key !== 'duration' && key !== 'source' && key !== 'probability'
    );
    return keys.length > 0 ? keys[0] : "unknown";
}

/**
 * 应用状态效果到卡牌
 * @param {Object} card - 卡牌对象
 * @param {Object} effect - 效果对象
 * @param {number} duration - 效果持续时间
 * @param {string} source - 效果来源 ('player' 或 'enemy')
 */
function applyEffect(card, effect, duration, source = 'player') {
    // 初始化卡牌的statusEffects数组（如果不存在）
    if (!card.statusEffects) {
        card.statusEffects = [];
    }
    
    // 确保持续时间是有效值
    const validDuration = (duration && duration > 0) ? Math.max(1, duration) : 1;
    
    // 创建一个新的效果对象，确保设置正确的持续时间和来源
    const newEffect = {
        ...effect,
        duration: validDuration,
        source: source
    };
    
    // 获取效果的类型标识符
    const effectType = getEffectType(effect);
    console.log(`应用效果: ${effectType}, 持续时间: ${validDuration}, 来源: ${source}`);
    
    // 检查是否已存在同类型的效果
    const existingEffectIndex = card.statusEffects.findIndex(existing => 
        getEffectType(existing) === effectType && existing.source === source
    );
    
    if (existingEffectIndex >= 0) {
        // 如果已存在同类型效果，则更新持续时间（取较长的）和效果值
        const existingEffect = card.statusEffects[existingEffectIndex];
        const updatedEffect = {
            ...newEffect,
            // 持续时间取较长的
            duration: Math.max(existingEffect.duration, newEffect.duration)
        };
        
        // 更新效果而不是添加新的
        card.statusEffects[existingEffectIndex] = updatedEffect;
        console.log(`更新效果: ${effectType}, 持续时间: ${updatedEffect.duration}, 来源: ${updatedEffect.source}`);
    } else {
        // 如果不存在同类型效果，则添加新效果
        card.statusEffects.push(newEffect);
        console.log(`添加新效果: ${effectType}, 持续时间: ${newEffect.duration}, 来源: ${newEffect.source}`);
    }
}

/**
 * 减少卡牌所有状态效果的持续时间，移除已过期效果
 * @param {Object} card - 卡牌对象
 * @param {string} currentTurn - 当前回合方 ('player' 或 'enemy')
 * @returns {Array} 过期的效果列表
 */
function decreaseEffectDuration(card, currentTurn) {
    // 添加调试日志
    console.log(`处理卡牌 ${card.name} 的效果，当前回合: ${currentTurn}`);
    card.statusEffects.forEach(effect => {
        console.log(`- 效果: ${effect.name || '未命名'}, 类型: ${getEffectType(effect)}, 来源: ${effect.source || '未知'}, 持续: ${effect.duration}`);
    });
    
    // 保存初始状态效果列表
    const originalEffects = [...card.statusEffects];
    
    // 识别回合结束时应该减少的效果
    // 原则：效果应该在施加者的回合结束时减少持续时间
    // 1. 当前回合是player，则应该减少来源为player的效果
    // 2. 当前回合是enemy，则应该减少来源为enemy的效果
    // 3. 未指定来源的效果也应该减少持续时间（默认为当前回合方）
    const expiringEffects = originalEffects.filter(effect => 
        (effect.source === currentTurn || !effect.source) && effect.duration === 1
    );
    
    // 处理所有效果
    card.statusEffects = card.statusEffects.map(effect => {
        // 为未指定来源的效果设置来源
        if (!effect.source) {
            effect.source = currentTurn;
            console.log(`为效果设置默认来源: ${getEffectType(effect)} -> ${currentTurn}`);
        }
        
        // 如果是当前回合方施加的效果，减少持续时间
        if (effect.source === currentTurn) {
            console.log(`减少效果持续时间: ${getEffectType(effect)}, ${effect.duration} -> ${effect.duration - 1}`);
            return { ...effect, duration: effect.duration - 1 };
        }
        
        // 否则保持不变
        return effect;
    }).filter(effect => {
        // 过滤掉已过期的效果
        const remaining = effect.duration > 0;
        if (!remaining) {
            console.log(`效果已过期并移除: ${getEffectType(effect)}`);
        }
        return remaining;
    });
    
    // 返回本回合过期的效果
    return expiringEffects;
}

/**
 * 计算卡牌的当前属性值，考虑状态效果
 * @param {Object} card - 卡牌对象
 * @param {string} statName - 属性名称（例如：'ATK', 'DEF'）
 * @returns {number} 计算后的属性值
 */
function calculateCurrentStat(card, statName) {
    // 基础值
    let value = card.stats[statName] || 0;
    
    // 应用状态效果
    if (card.statusEffects && card.statusEffects.length > 0) {
        card.statusEffects.forEach(effect => {
            // 特殊处理速度效果
            if (statName === 'SPD' && effect.speed !== undefined) {
                value += effect.speed;
                console.log(`应用速度效果: ${effect.speed}, 结果: ${value}`);
            }
            // 直接匹配属性名（小写）
            else if (effect[statName.toLowerCase()] !== undefined) {
                value += effect[statName.toLowerCase()];
                console.log(`应用${statName}效果: ${effect[statName.toLowerCase()]}, 结果: ${value}`);
            }
            
            // 特殊映射
            if (statName === 'DEF' && effect.defense) {
                value += effect.defense;
                console.log(`应用防御效果: ${effect.defense}, 结果: ${value}`);
            }
        });
    }
    
    return Math.max(0, value); // 属性值最小为0
}

/**
 * 检查卡牌是否有指定类型的状态效果
 * @param {Object} card - 卡牌对象
 * @param {string} effectType - 效果类型
 * @returns {boolean} 是否存在该效果
 */
function hasStatusEffect(card, effectType) {
    if (!card.statusEffects || card.statusEffects.length === 0) {
        return false;
    }
    
    return card.statusEffects.some(effect => effect[effectType] !== undefined);
}

/**
 * 获取卡牌的闪避率
 * @param {Object} card - 卡牌对象
 * @returns {number} 闪避率（0-100）
 */
function getDodgeRate(card) {
    let dodgeRate = 0;
    
    // 应用状态效果
    if (card.statusEffects && card.statusEffects.length > 0) {
        card.statusEffects.forEach(effect => {
            if (effect.dodge_rate) {
                dodgeRate += effect.dodge_rate;
            }
        });
    }
    
    return Math.min(80, dodgeRate); // 闪避率最高80%
}

/**
 * 对卡牌造成伤害
 * @param {Object} card - 目标卡牌
 * @param {number} damage - 造成的伤害值
 * @returns {number} 实际造成的伤害
 */
function dealDamage(card, damage) {
    // 检查是否闪避
    const dodgeRate = getDodgeRate(card);
    if (dodgeRate > 0 && Math.random() * 100 < dodgeRate) {
        // 闪避成功
        return 0; 
    }
    
    // 实际伤害计算
    const oldHP = card.currentHP;
    card.currentHP = Math.max(0, card.currentHP - damage);
    
    // 返回实际造成的伤害
    return oldHP - card.currentHP;
}

/**
 * 获取卡牌的伤害反弹百分比
 * @param {Object} card - 卡牌对象
 * @returns {number} 反弹伤害百分比（0-100）
 */
function getReflectDamagePercent(card) {
    let reflectPercent = 0;
    
    // 应用状态效果
    if (card.statusEffects && card.statusEffects.length > 0) {
        card.statusEffects.forEach(effect => {
            if (effect.reflect_damage) {
                reflectPercent += effect.reflect_damage;
            }
        });
    }
    
    return reflectPercent;
}

/**
 * 治疗卡牌
 * @param {Object} card - 目标卡牌
 * @param {number} amount - 治疗量
 * @returns {number} 实际恢复的生命值
 */
function heal(card, amount) {
    const oldHP = card.currentHP;
    card.currentHP = Math.min(card.stats.HP, card.currentHP + amount);
    return card.currentHP - oldHP;
}

/**
 * 消耗卡牌能量
 * @param {Object} card - 卡牌对象
 * @param {number} amount - 消耗量
 * @returns {boolean} 是否能够消耗成功
 */
function consumeEnergy(card, amount) {
    if (card.currentNRG >= amount) {
        card.currentNRG -= amount;
        return true;
    }
    return false;
}

/**
 * 获取卡牌的详细信息
 * @param {Object} card - 卡牌对象
 * @returns {Object} 卡牌详细信息
 */
function getCardDetails(card) {
    return {
        id: card.id,
        name: card.name,
        element: card.element,
        stats: { ...card.stats },
        currentHP: card.currentHP,
        currentNRG: card.currentNRG,
        skills: card.skills.map(skill => ({ ...skill })),
        statusEffects: card.statusEffects.map(effect => ({ ...effect })),
        description: card.description
    };
}

/**
 * 检查卡牌是否死亡
 * @param {Object} card - 卡牌对象
 * @returns {boolean} 是否死亡
 */
function isDead(card) {
    return card.currentHP <= 0;
}

// 导出模块
export default {
    createCardElement,
    applyEffect,
    decreaseEffectDuration,
    dealDamage,
    heal,
    consumeEnergy,
    getCardDetails,
    isDead,
    calculateCurrentStat,
    hasStatusEffect,
    getDodgeRate,
    getReflectDamagePercent,
    getEffectType
}; 