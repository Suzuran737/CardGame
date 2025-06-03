/**
 * battle-cards-adapter.js
 * 适配器文件，提供卡牌相关功能，用于Jest测试
 */

/**
 * 战斗卡牌适配器
 */
const battleCards = {
  /**
   * 创建卡牌
   * @param {Object} cardData 卡牌数据
   * @param {string} side 所属方 ('player' 或 'enemy')
   * @param {number} index 卡牌索引
   * @returns {Object} 卡牌对象
   */
  createCard(cardData, side, index) {
    if (!cardData) return null;
    
    // 创建卡牌对象
    return {
      id: cardData.id,
      uuid: `${side}-${cardData.id}-${index}`,
      name: cardData.name,
      element: cardData.element,
      stats: {
        HP: cardData.stats.HP,
        ATK: cardData.stats.ATK,
        DEF: cardData.stats.DEF,
        SPD: cardData.stats.SPD,
        CRI: cardData.stats.CRI,
        NRG: cardData.stats.NRG
      },
      skills: cardData.skills || [],
      currentHP: cardData.stats.HP,
      currentNRG: cardData.stats.NRG,
      statusEffects: []
    };
  },
  
  /**
   * 对卡牌造成伤害
   * @param {Object} card 卡牌对象
   * @param {number} amount 伤害量
   * @returns {number} 实际造成的伤害
   */
  damageCard(card, amount) {
    if (!card || amount <= 0) return 0;
    
    const previousHP = card.currentHP;
    card.currentHP = Math.max(0, card.currentHP - amount);
    
    return previousHP - card.currentHP;
  },
  
  /**
   * 治疗卡牌
   * @param {Object} card 卡牌对象
   * @param {number} amount 治疗量
   * @returns {number} 实际治疗的量
   */
  healCard(card, amount) {
    if (!card || amount <= 0) return 0;
    
    const previousHP = card.currentHP;
    const maxHP = card.stats.HP;
    card.currentHP = Math.min(maxHP, card.currentHP + amount);
    
    return card.currentHP - previousHP;
  },
  
  /**
   * 消耗卡牌能量
   * @param {Object} card 卡牌对象
   * @param {number} amount 消耗量
   * @returns {boolean} 是否消耗成功
   */
  consumeEnergy(card, amount) {
    if (!card || amount <= 0) return false;
    
    // 检查能量是否足够
    if (card.currentNRG < amount) {
      return false;
    }
    
    // 消耗能量
    card.currentNRG -= amount;
    return true;
  },
  
  /**
   * 恢复卡牌能量
   * @param {Object} card 卡牌对象
   * @param {number} amount 恢复量
   * @returns {number} 实际恢复的量
   */
  restoreEnergy(card, amount) {
    if (!card || amount <= 0) return 0;
    
    const previousNRG = card.currentNRG;
    const maxNRG = card.stats.NRG;
    card.currentNRG = Math.min(maxNRG, card.currentNRG + amount);
    
    return card.currentNRG - previousNRG;
  },
  
  /**
   * 添加状态效果
   * @param {Object} card 卡牌对象
   * @param {Object} effect 状态效果
   */
  addStatusEffect(card, effect) {
    if (!card || !effect) return;
    
    // 确保卡牌有状态效果数组
    if (!card.statusEffects) {
      card.statusEffects = [];
    }
    
    // 添加状态效果
    card.statusEffects.push({ ...effect });
  },
  
  /**
   * 移除状态效果
   * @param {Object} card 卡牌对象
   * @param {number} index 状态效果索引
   * @returns {Object|null} 被移除的状态效果，如果索引无效则返回null
   */
  removeStatusEffect(card, index) {
    if (!card || !card.statusEffects || index < 0 || index >= card.statusEffects.length) {
      return null;
    }
    
    // 移除并返回状态效果
    const [removedEffect] = card.statusEffects.splice(index, 1);
    return removedEffect;
  },
  
  /**
   * 检查卡牌是否存活
   * @param {Object} card 卡牌对象
   * @returns {boolean} 是否存活
   */
  isCardAlive(card) {
    return card && card.currentHP > 0;
  },
  
  /**
   * 获取卡牌的技能
   * @param {Object} card 卡牌对象
   * @param {number} index 技能索引
   * @returns {Object|null} 技能对象，如果索引无效则返回null
   */
  getSkill(card, index) {
    if (!card || !card.skills || index < 0 || index >= card.skills.length) {
      return null;
    }
    
    return card.skills[index];
  },
  
  /**
   * 检查技能是否可用（能量是否足够）
   * @param {Object} card 卡牌对象
   * @param {number} skillIndex 技能索引
   * @returns {boolean} 技能是否可用
   */
  isSkillAvailable(card, skillIndex) {
    const skill = this.getSkill(card, skillIndex);
    if (!skill) return false;
    
    return card.currentNRG >= skill.cost;
  },
  
  /**
   * 使用技能
   * @param {Object} card 卡牌对象
   * @param {number} skillIndex 技能索引
   * @returns {Object|null} 技能效果，如果技能不可用则返回null
   */
  useSkill(card, skillIndex) {
    if (!this.isSkillAvailable(card, skillIndex)) {
      return null;
    }
    
    const skill = this.getSkill(card, skillIndex);
    
    // 消耗能量
    this.consumeEnergy(card, skill.cost);
    
    // 返回技能效果
    return skill.effect;
  }
};

// 导出战斗卡牌适配器
module.exports = { battleCards }; 