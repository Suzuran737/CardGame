/**
 * battle-actions.js
 * 处理战斗行动和计算
 */

import BattleState from './battle-state.js';
import BattleCards from './battle-cards.js';
import BattleUI from './battle-ui.js';

/**
 * 选择行动
 * @param {Object} card - 卡牌对象
 * @param {string} actionType - 行动类型
 * @param {Object} skill - 技能对象
 */
function selectAction(card, actionType, skill = null) {
    BattleState.setSelectedAction(card, actionType, skill);
    
    // 显示可选目标
    BattleUI.showTargets();
}

/**
 * 执行行动
 * @param {Object} target - 目标卡牌
 */
function performAction(target) {
    const { selectedCard, selectedAction } = BattleState.state;
    
    // 安全检查：确保selectedCard和selectedAction都不为null
    if (!selectedCard || !selectedAction) {
        console.warn('执行行动失败：选中的卡牌或行动不存在');
        return;
    }
    
    // 检查卡牌是否已经行动过
    if (BattleState.state.actedCards.has(selectedCard.uuid)) {
        console.warn('执行行动失败：该卡牌已经行动过');
        return;
    }
    
    if (selectedAction.type === 'attack') {
        // 执行普通攻击
        const damage = calculateDamage(selectedCard, target);
        
        // 处理混乱状态
        if (damage === 'confused') {
            // 混乱状态下，随机选择一个己方存活的卡牌作为目标
            const friendlyTargets = BattleState.state.currentTurn === 'player' ? 
                BattleState.state.playerCards.filter(card => card.currentHP > 0 && card !== selectedCard) :
                BattleState.state.enemyCards.filter(card => card.currentHP > 0 && card !== selectedCard);
            
            // 如果有可攻击的友方目标
            if (friendlyTargets.length > 0) {
                const randomFriendlyTarget = friendlyTargets[Math.floor(Math.random() * friendlyTargets.length)];
                // 计算对友方的伤害
                const friendlyDamage = calculateDamage(selectedCard, randomFriendlyTarget, true); // 传入true表示忽略再次检查混乱
                
                // 应用伤害
                if (friendlyDamage === 0) {
                    BattleUI.addToBattleLog(`${randomFriendlyTarget.name} 闪避了攻击！`);
                } else {
                    // 应用伤害
                    const actualDamage = BattleCards.dealDamage(randomFriendlyTarget, friendlyDamage);
                    BattleUI.addToBattleLog(`${selectedCard.name} 对友方 ${randomFriendlyTarget.name} 造成 ${actualDamage} 点伤害`);
                    
                    // 检查并处理目标的反伤效果
                    const reflectPercent = BattleCards.getReflectDamagePercent(randomFriendlyTarget);
                    if (reflectPercent > 0) {
                        const reflectDamage = Math.floor(actualDamage * reflectPercent / 100);
                        const actualReflectDamage = BattleCards.dealDamage(selectedCard, reflectDamage);
                        BattleUI.addToBattleLog(`${randomFriendlyTarget.name} 反弹了 ${actualReflectDamage} 点伤害`);
                    }
                }
            } else {
                BattleUI.addToBattleLog(`${selectedCard.name} 处于混乱状态，但没有找到友方目标，攻击落空了！`);
            }
        }
        // 如果目标闪避了攻击
        else if (damage === 0) {
            BattleUI.addToBattleLog(`${target.name} 闪避了攻击！`);
        }
        // 处理正常攻击和反伤
        else {
            // 应用伤害
            const actualDamage = BattleCards.dealDamage(target, damage);
            BattleUI.addToBattleLog(`${selectedCard.name} 对 ${target.name} 造成 ${actualDamage} 点伤害`);
            
            // 检查并处理目标的反伤效果
            const reflectPercent = BattleCards.getReflectDamagePercent(target);
            if (reflectPercent > 0) {
                const reflectDamage = Math.floor(actualDamage * reflectPercent / 100);
                const actualReflectDamage = BattleCards.dealDamage(selectedCard, reflectDamage);
                BattleUI.addToBattleLog(`${target.name} 反弹了 ${actualReflectDamage} 点伤害`);
            }
        }
    } else if (selectedAction.type === 'skill') {
        // 执行技能
        const { skill } = selectedAction;
        BattleCards.consumeEnergy(selectedCard, skill.cost);
        
        // 执行技能效果
        executeSkillEffect(selectedCard, target, skill);
    }
    
    // 记录卡牌已行动
    BattleState.markCardActed(selectedCard);
    
    // 清理选择状态
    BattleState.clearSelection();
    BattleUI.clearSelectionUI();
    
    // 刷新显示
    BattleUI.displayCards();
    
    // 检查战斗是否结束
    if (BattleState.checkBattleEnd()) {
        endBattle();
    } else {
        // 检查是否所有卡牌都已行动
        if (BattleState.checkAllCardsActed()) {
            // 所有卡牌都已行动，切换到下一个回合
            console.log("所有卡牌都已行动，准备切换回合");
            nextTurn();
        } else {
            // 还有卡牌未行动，更新UI提示
            const currentTurn = BattleState.state.currentTurn;
            BattleUI.updateActionPanel(`请选择要行动的卡牌（${currentTurn === 'player' ? '玩家' : '敌方'}回合）`);
        }
    }
}

/**
 * 计算伤害
 * @param {Object} attacker - 攻击者
 * @param {Object} defender - 防御者
 * @param {boolean} ignoreConfusion - 是否忽略混乱效果的检查
 * @returns {number|string} 计算出的伤害值或表示混乱状态的字符串
 */
function calculateDamage(attacker, defender, ignoreConfusion = false) {
    // 使用考虑状态效果的属性值
    const attackerATK = BattleCards.calculateCurrentStat(attacker, 'ATK');
    const defenderDEF = BattleCards.calculateCurrentStat(defender, 'DEF');
    
    // 基础伤害计算：攻击力减去防御力的一部分，确保防御不会过于强大
    const defReduction = defenderDEF * 0.7; // 防御力只能抵消70%
    const baseDamage = Math.max(1, attackerATK - defReduction);
    
    // 暴击判定
    const critChance = BattleCards.calculateCurrentStat(attacker, 'CRI') / 100;
    const isCrit = Math.random() < critChance;
    
    let damage = baseDamage;
    if (isCrit) {
        damage *= 1.5;
        BattleUI.addToBattleLog('暴击！');
    }
    
    // 记录伤害计算详情（用于调试）
    console.log(`伤害计算: ${attacker.name}(ATK:${attackerATK}) -> ${defender.name}(DEF:${defenderDEF}), 最终伤害:${Math.floor(damage)}`);
    
    // 特殊情况：混乱效果，有一定概率攻击己方
    if (!ignoreConfusion && BattleCards.hasStatusEffect(attacker, 'confusion')) {
        const confusionEffect = attacker.statusEffects.find(effect => effect.confusion);
        const confusionChance = confusionEffect ? confusionEffect.confusion : 0;
        
        if (Math.random() * 100 < confusionChance) {
            // 混乱发动，返回特殊标记
            BattleUI.addToBattleLog(`${attacker.name} 处于混乱状态，攻击了错误的目标！`);
            return 'confused';
        }
    }
    
    // 检查闪避
    const dodgeRate = BattleCards.getDodgeRate(defender);
    if (dodgeRate > 0 && Math.random() * 100 < dodgeRate) {
        // 闪避成功
        return 0;
    }
    
    // 返回最终伤害值
    return Math.floor(damage);
}

/**
 * 执行技能效果
 * @param {Object} caster - 施放者
 * @param {Object} target - 目标
 * @param {Object} skill - 技能对象
 */
function executeSkillEffect(caster, target, skill) {
    // 记录技能使用
    BattleUI.addToBattleLog(`${caster.name} 使用 ${skill.name}`);
    
    // 技能效果处理逻辑
    if (!skill.effect) return;
    
    // 确定效果来源方
    const effectSource = BattleState.state.currentTurn; // 'player' 或 'enemy'
    const isPlayer = effectSource === 'player';
    
    // 确定技能目标
    let targets = [];
    const isAOE = skill.effect.aoe === true;
    
    // 根据技能类型决定目标
    // 1. 伤害类和debuff类技能针对敌方
    if (skill.effect.damage || skill.effect.debuff) {
        if (isAOE) {
            // AOE伤害/debuff技能针对所有敌方
            targets = isPlayer ? BattleState.state.enemyCards : BattleState.state.playerCards;
        } else {
            // 单体伤害/debuff技能
            targets = [target];
        }
    }
    // 2. 治疗类和buff类技能针对己方
    else if (skill.effect.heal || (skill.effect.buff && !skill.effect.self_buff)) {
        if (isAOE) {
            // AOE治疗/buff技能针对所有己方
            targets = isPlayer ? BattleState.state.playerCards : BattleState.state.enemyCards;
        } else {
            // 单体治疗/buff技能可以针对任何己方卡牌
            targets = [target];
        }
    }
    // 3. 其他默认处理（可能包含多种效果的复杂技能）
    else {
        targets = isAOE ? 
            (isPlayer ? BattleState.state.enemyCards : BattleState.state.playerCards) :
            [target];
    }
    
    // 应用效果到所有目标
    targets.forEach(currentTarget => {
        if (currentTarget.currentHP <= 0) return; // 跳过已死亡的目标
        
        // 伤害类技能
        if (skill.effect.damage) {
            // 使用考虑状态效果后的攻击力
            const currentATK = BattleCards.calculateCurrentStat(caster, 'ATK');
            // 计算技能伤害：当前攻击力 * 技能伤害系数
            const rawDamage = Math.floor(currentATK * skill.effect.damage);
            
            // 如果技能有忽视防御的效果
            let finalDamage = rawDamage;
            if (skill.effect.ignore_def) {
                const ignoreDefPercent = skill.effect.ignore_def / 100;
                const currentDEF = BattleCards.calculateCurrentStat(currentTarget, 'DEF');
                const effectiveDef = currentDEF * (1 - ignoreDefPercent);
                finalDamage = Math.max(1, rawDamage - effectiveDef * 0.7);
            } else {
                // 正常应用防御力减免
                const currentDEF = BattleCards.calculateCurrentStat(currentTarget, 'DEF');
                const defReduction = currentDEF * 0.7;
                finalDamage = Math.max(1, rawDamage - defReduction);
            }
            
            // 如果技能指定了固定暴击率
            if (skill.effect.crit_rate) {
                const willCrit = Math.random() * 100 < skill.effect.crit_rate;
                if (willCrit) {
                    finalDamage *= 1.5;
                    BattleUI.addToBattleLog('技能暴击！');
                }
            }
            
            // 检查闪避
            const dodgeRate = BattleCards.getDodgeRate(currentTarget);
            if (dodgeRate > 0 && Math.random() * 100 < dodgeRate) {
                // 闪避成功
                BattleUI.addToBattleLog(`${currentTarget.name} 闪避了技能攻击！`);
                return; // 跳过该目标的后续处理
            }
            
            // 应用最终伤害
            const damageToApply = Math.floor(finalDamage);
            const actualDamage = BattleCards.dealDamage(currentTarget, damageToApply);
            BattleUI.addToBattleLog(`${currentTarget.name} 受到 ${actualDamage} 点伤害`);
            
            // 检查并处理反伤效果
            const reflectPercent = BattleCards.getReflectDamagePercent(currentTarget);
            if (reflectPercent > 0) {
                const reflectDamage = Math.floor(actualDamage * reflectPercent / 100);
                if (reflectDamage > 0) {
                    const actualReflectDamage = BattleCards.dealDamage(caster, reflectDamage);
                    BattleUI.addToBattleLog(`${currentTarget.name} 反弹了 ${actualReflectDamage} 点伤害给 ${caster.name}`);
                }
            }
            
            // 记录伤害计算详情（用于调试）
            console.log(`技能伤害计算: ${caster.name} -> ${currentTarget.name}, 技能:${skill.name}, 伤害:${actualDamage}`);
        }
        
        // 治疗类技能
        if (skill.effect.heal) {
            const healAmount = skill.effect.heal;
            const actualHeal = BattleCards.heal(currentTarget, healAmount);
            BattleUI.addToBattleLog(`${currentTarget.name} 恢复 ${actualHeal} 点生命值`);
        }
        
        // 敌方debuff效果
        if (skill.effect.debuff) {
            const applyProbability = skill.effect.debuff.probability || 100;
            const applyDebuff = Math.random() * 100 < applyProbability;
            
            if (applyDebuff) {
                // 创建一个具体的debuff对象
                const debuffEffect = { ...skill.effect.debuff };
                delete debuffEffect.probability; // 移除概率属性，不需要保存
                
                // 记录效果名称以便显示
                if (!debuffEffect.name) {
                    if (debuffEffect.speed) debuffEffect.name = "速度降低";
                    else if (debuffEffect.confusion) debuffEffect.name = "混乱";
                    else if (debuffEffect.poison) debuffEffect.name = "中毒";
                    else if (debuffEffect.damage) debuffEffect.name = "灼烧";
                    else debuffEffect.name = "减益效果";
                }
                
                // 确保设置了正确的持续时间
                if (!debuffEffect.duration || debuffEffect.duration <= 0) {
                    debuffEffect.duration = 1; // 默认持续1回合
                    console.log(`修正效果持续时间为1回合: ${debuffEffect.name}`);
                }
                
                // 确保设置来源
                BattleCards.applyEffect(currentTarget, debuffEffect, debuffEffect.duration, effectSource);
                BattleUI.addToBattleLog(`${currentTarget.name} 受到了${debuffEffect.name}效果，持续${debuffEffect.duration}回合`);
            }
        }
    });
    
    // 自身buff效果（不受AOE影响）
    if (skill.effect.self_buff) {
        const buffEffect = { ...skill.effect.self_buff };
        
        // 记录效果名称以便显示
        if (!buffEffect.name) {
            if (buffEffect.defense) buffEffect.name = "防御增强";
            else if (buffEffect.dodge_rate) buffEffect.name = "闪避增强";
            else if (buffEffect.reflect_damage) buffEffect.name = "伤害反弹";
            else if (buffEffect.energy) buffEffect.name = "能量增益";
            else buffEffect.name = "增益效果";
        }
        
        // 确保设置了正确的持续时间
        if (!buffEffect.duration || buffEffect.duration <= 0) {
            buffEffect.duration = 1; // 默认持续1回合
            console.log(`修正自身效果持续时间为1回合: ${buffEffect.name}`);
        }
        
        // 确保设置来源
        BattleCards.applyEffect(caster, buffEffect, buffEffect.duration, effectSource);
        BattleUI.addToBattleLog(`${caster.name} 获得了${buffEffect.name}效果，持续${buffEffect.duration}回合`);
    }
    
    // 能量效果（AOE时适用于己方全体）
    if (skill.effect.buff && skill.effect.buff.energy) {
        const energyAmount = skill.effect.buff.energy;
        const energyTargets = isPlayer ? BattleState.state.playerCards : BattleState.state.enemyCards;
        
        if (isAOE) {
            // 团队能量增益
            energyTargets.forEach(energyTarget => {
                if (energyTarget.currentHP <= 0) return; // 跳过已死亡的目标
                
                // 增加能量但不超过上限
                energyTarget.currentNRG = Math.min(5, energyTarget.currentNRG + energyAmount);
                BattleUI.addToBattleLog(`${energyTarget.name} 获得 ${energyAmount} 点能量`);
            });
        } else {
            // 单体能量增益，只对施法者生效
            caster.currentNRG = Math.min(5, caster.currentNRG + energyAmount);
            BattleUI.addToBattleLog(`${caster.name} 获得 ${energyAmount} 点能量`);
        }
    }
}

/**
 * 结束战斗
 */
function endBattle() {
    const winner = BattleState.getWinner();
    
    // 记录战斗结果到战斗日志
    if (winner === 'player') {
        BattleUI.addToBattleLog('战斗结束！玩家胜利！');
        
        // 统计存活的玩家卡牌
        const survivingCards = BattleState.state.playerCards.filter(card => card.currentHP > 0);
        const survivingCardsInfo = survivingCards.map(card => 
            `${card.name}（剩余HP: ${card.currentHP}/${card.stats.HP}）`
        ).join('、');
        
        BattleUI.addToBattleLog(`存活卡牌: ${survivingCardsInfo}`);
    } else {
        BattleUI.addToBattleLog('战斗结束！敌方胜利！');
        
        // 统计存活的敌方卡牌
        const survivingCards = BattleState.state.enemyCards.filter(card => card.currentHP > 0);
        const survivingCardsInfo = survivingCards.map(card => 
            `${card.name}（剩余HP: ${card.currentHP}/${card.stats.HP}）`
        ).join('、');
        
        BattleUI.addToBattleLog(`敌方存活卡牌: ${survivingCardsInfo}`);
    }
    
    // 显示战斗结果界面
    BattleUI.showBattleResult(winner === 'player');
}

/**
 * 切换到下一个回合
 */
function nextTurn() {
    // 确保清理掉敌方回合标志
    window._enemyTurnInProgress = false;
    
    console.log("===执行nextTurn函数，当前回合:", BattleState.state.currentTurn);
    
    // 保存当前回合状态，并确定下一个回合的类型
    const currentTurn = BattleState.state.currentTurn;
    const nextTurnType = currentTurn === 'player' ? 'enemy' : 'player';
    
    console.log(`===准备从 ${currentTurn} 回合切换到 ${nextTurnType} 回合`);
    
    // 切换回合状态，这会更新currentTurn并清理actedCards
    BattleState.switchTurn();
    
    // 确认回合确实切换了
    console.log(`===回合切换后: ${BattleState.state.currentTurn}, 应该是 ${nextTurnType}`);
    
    // 更新UI显示
    BattleUI.updateTurnDisplay();
    
    // 确保延迟足够长，以便UI能够更新
    setTimeout(() => {
        console.log(`===开始新回合 ${BattleState.state.currentTurn}`);
        
        // 根据新回合类型开始相应的回合
        if (BattleState.state.currentTurn === 'player') {
            console.log("===显式启动玩家回合");
            startPlayerTurn();
        } else {
            console.log("===显式启动敌方回合");
            startEnemyTurn();
        }
    }, 800);
}

/**
 * 应用持续伤害效果（如中毒、灼烧等）
 * @param {Object} card - 卡牌对象
 * @param {string} currentTurn - 当前回合方 ('player' 或 'enemy')
 */
function applyDOTEffects(card, currentTurn) {
    if (!card.statusEffects || card.statusEffects.length === 0) return;
    
    // 处理所有DOT效果，包括当前回合方施加的和没有来源标记的效果
    card.statusEffects.forEach(effect => {
        // 如果效果有来源且不是当前回合方，则跳过
        if (effect.source && effect.source !== currentTurn) {
            return;
        }
        
        // 为没有来源的效果设置来源（向后兼容）
        if (!effect.source) {
            effect.source = currentTurn;
        }
        
        // 灼烧效果 - 只要有damage属性且不是AOE，就视为灼烧
        if (effect.damage && !effect.aoe) {
            const burnDamage = effect.damage;
            // 直接应用伤害
            const actualDamage = BattleCards.dealDamage(card, burnDamage);
            const effectName = effect.name || "灼烧";
            BattleUI.addToBattleLog(`${card.name} 受到来自 ${currentTurn === 'player' ? '玩家' : '敌方'} 的 ${actualDamage} 点${effectName}伤害（回合 ${BattleState.state[currentTurn === 'player' ? 'playerTurnCount' : 'enemyTurnCount']}）`);
        }
        
        // 中毒效果
        if (effect.poison) {
            const poisonDamage = effect.poison;
            // 直接应用伤害
            const actualDamage = BattleCards.dealDamage(card, poisonDamage);
            BattleUI.addToBattleLog(`${card.name} 受到来自 ${currentTurn === 'player' ? '玩家' : '敌方'} 的 ${actualDamage} 点中毒伤害（回合 ${BattleState.state[currentTurn === 'player' ? 'playerTurnCount' : 'enemyTurnCount']}）`);
        }
        
        // 其他可能的持续效果...
    });
}

/**
 * 开始玩家回合
 */
function startPlayerTurn() {
    // 清理敌方回合标志
    window._enemyTurnInProgress = false;
    
    console.log("===开始玩家回合，回合计数:", BattleState.state.playerTurnCount);
    
    // 确保当前是玩家回合
    if (BattleState.state.currentTurn !== 'player') {
        console.error("===错误：startPlayerTurn被调用时当前回合不是玩家回合");
        BattleState.state.currentTurn = 'player'; // 强制设置为玩家回合
        console.log("===已强制修正为玩家回合");
    }
    
    // 确保actedCards已清空
    if (BattleState.state.actedCards.size > 0) {
        console.warn("===警告：开始玩家回合时actedCards不为空，已清理");
        BattleState.state.actedCards.clear();
    }
    
    // 更新能量
    BattleState.updateEnergy('player');
    console.log("===已更新玩家卡牌能量");
    
    // 先应用持续伤害效果
    BattleState.state.playerCards.forEach(card => {
        if (card.currentHP > 0) {
            applyDOTEffects(card, 'player');
        }
    });
    
    // 然后处理状态效果持续时间
    BattleState.state.playerCards.forEach(card => {
        if (card.currentHP > 0) {
            console.log(`===处理玩家卡牌 ${card.name} 的效果持续时间`);
            const expiredEffects = BattleCards.decreaseEffectDuration(card, 'player');
            
            // 添加效果过期的日志
            expiredEffects.forEach(effect => {
                const effectName = effect.name || getEffectDisplayName(effect);
                BattleUI.addToBattleLog(`${card.name} 的 ${effectName} 效果已结束（回合 ${BattleState.state.playerTurnCount}）`);
                console.log(`===玩家回合: ${card.name} 的 ${effectName} 效果已过期`);
            });
        }
    });
    
    // 刷新显示
    BattleUI.displayCards();
    
    // 显示提示信息
    BattleUI.updateActionPanel("请选择要行动的卡牌");
    console.log("===玩家回合准备完毕，等待玩家选择卡牌");
}

/**
 * 开始敌方回合
 */
function startEnemyTurn() {
    // 添加防止重复执行的标志
    if (window._enemyTurnInProgress === true) {
        console.error("===敌方回合已在进行中，忽略重复调用");
        return;
    }
    window._enemyTurnInProgress = true;
    
    console.log("===开始敌方回合，回合计数:", BattleState.state.enemyTurnCount);
    
    // 确保当前是敌方回合
    if (BattleState.state.currentTurn !== 'enemy') {
        console.error("===错误：startEnemyTurn被调用时当前回合不是敌方回合");
        BattleState.state.currentTurn = 'enemy'; // 强制设置为敌方回合
        console.log("===已强制修正为敌方回合");
    }
    
    // 确保actedCards已清空
    if (BattleState.state.actedCards.size > 0) {
        console.warn("===警告：开始敌方回合时actedCards不为空，已清理");
        BattleState.state.actedCards.clear();
    }
    
    // 更新能量
    BattleState.updateEnergy('enemy');
    console.log("===已更新敌方卡牌能量");
    
    // 先应用持续伤害效果
    BattleState.state.enemyCards.forEach(card => {
        if (card.currentHP > 0) {
            applyDOTEffects(card, 'enemy');
        }
    });
    
    // 然后处理状态效果持续时间
    BattleState.state.enemyCards.forEach(card => {
        if (card.currentHP > 0) {
            console.log(`===处理敌方卡牌 ${card.name} 的效果持续时间`);
            const expiredEffects = BattleCards.decreaseEffectDuration(card, 'enemy');
            
            // 添加效果过期的日志
            expiredEffects.forEach(effect => {
                const effectName = effect.name || getEffectDisplayName(effect);
                BattleUI.addToBattleLog(`${card.name} 的 ${effectName} 效果已结束（回合 ${BattleState.state.enemyTurnCount}）`);
                console.log(`===敌方回合: ${card.name} 的 ${effectName} 效果已过期`);
            });
        }
    });
    
    // 刷新显示
    BattleUI.displayCards();
    console.log("===敌方回合准备完毕，开始AI行动");
    
    // 延迟一下再执行AI行动，让玩家有时间看到敌方回合的开始
    setTimeout(() => {
        // 再次检查当前回合
        if (BattleState.state.currentTurn !== 'enemy') {
            console.log("===回合已改变，AI行动结束");
            window._enemyTurnInProgress = false; // 清理标志
            return;
        }
        // AI行动
        performAIAction();
    }, 800);
}

/**
 * 执行AI行动
 */
function performAIAction() {
    console.log("===执行AI行动，当前回合:", BattleState.state.currentTurn);
    
    // 确保当前确实是敌方回合
    if (BattleState.state.currentTurn !== 'enemy') {
        console.error("===错误：非敌方回合调用了AI行动函数");
        window._enemyTurnInProgress = false; // 清理标志
        return;
    }
    
    // 获取所有存活的敌方卡牌
    const aliveEnemyCards = BattleState.state.enemyCards.filter(card => 
        card.currentHP > 0 && !BattleState.state.actedCards.has(card.uuid)
    );
    
    console.log("===可行动的敌方卡牌:", aliveEnemyCards.map(card => card.name));
    
    if (aliveEnemyCards.length === 0) {
        // 所有敌方卡牌都已行动，切换到玩家回合
        console.log("===所有敌方卡牌都已行动，准备切换回合");
        window._enemyTurnInProgress = false; // 清理标志
        setTimeout(() => {
            console.log("===显式调用nextTurn切换到玩家回合");
            nextTurn();
        }, 500);
        return;
    }
    
    // 获取当前要行动的卡牌
    const aiCard = aliveEnemyCards[0];
    console.log(`===敌方卡牌 ${aiCard.name} 准备行动`);
    
    // 查找目标（存活的玩家卡牌）
    const alivePlayerCards = BattleState.state.playerCards.filter(card => card.currentHP > 0);
    console.log("===可选择的目标:", alivePlayerCards.map(card => card.name));
    
    if (alivePlayerCards.length === 0) {
        console.log("===没有可攻击的玩家卡牌，敌方胜利");
        window._enemyTurnInProgress = false; // 清理标志
        endBattle();
        return;
    }
    
    const target = alivePlayerCards[0];
    console.log(`===选择目标: ${target.name}`);
    
    // 查找可用的技能
    const availableSkills = aiCard.skills.filter(skill => aiCard.currentNRG >= skill.cost);
    console.log(`===可用技能: ${availableSkills.map(skill => skill.name).join(', ') || '无'}`);
    
    const availableSkill = availableSkills.length > 0 ? availableSkills[0] : null;
    
    if (availableSkill) {
        // 使用技能
        console.log(`===敌方 ${aiCard.name} 使用技能 ${availableSkill.name}`);
        selectAction(aiCard, 'skill', availableSkill);
    } else {
        // 普通攻击
        console.log(`===敌方 ${aiCard.name} 进行普通攻击`);
        selectAction(aiCard, 'attack');
    }
    
    // 直接执行行动
    try {
        performAction(target);
        
        // 检查战斗是否已经结束
        if (BattleState.checkBattleEnd()) {
            window._enemyTurnInProgress = false; // 清理标志
            return; // performAction会调用endBattle
        }
        
        // 检查回合是否已经改变
        if (BattleState.state.currentTurn !== 'enemy') {
            console.log("===回合已改变，AI行动结束");
            window._enemyTurnInProgress = false; // 清理标志
            return;
        }
        
        // 记录卡牌已行动
        BattleState.markCardActed(aiCard);
        console.log(`===敌方 ${aiCard.name} 已完成行动`);
        
        // 检查是否还有其他存活的敌方卡牌需要行动
        const remainingEnemyCards = BattleState.state.enemyCards.filter(card => 
            card.currentHP > 0 && !BattleState.state.actedCards.has(card.uuid)
        );
        
        console.log(`===剩余未行动的敌方卡牌: ${remainingEnemyCards.map(card => card.name).join(', ') || '无'}`);
        
        if (remainingEnemyCards.length > 0) {
            // 延迟执行下一个敌方卡牌的行动
            console.log("===延迟执行下一个敌方卡牌的行动");
            setTimeout(() => {
                // 再次检查当前回合
                if (BattleState.state.currentTurn !== 'enemy') {
                    console.log("===回合已改变，AI行动结束");
                    window._enemyTurnInProgress = false; // 清理标志
                    return;
                }
                performAIAction();
            }, 1000);
        } else {
            // 所有敌方卡牌都已行动，切换到玩家回合
            console.log("===所有敌方卡牌都已行动，准备切换回合");
            window._enemyTurnInProgress = false; // 清理标志
            setTimeout(() => {
                console.log("===显式调用nextTurn切换到玩家回合");
                nextTurn();
            }, 500);
        }
    } catch (error) {
        console.error("===AI行动执行出错:", error);
        // 出错时仍然切换回合，避免游戏卡住
        window._enemyTurnInProgress = false; // 清理标志
        setTimeout(() => {
            console.log("===错误恢复：调用nextTurn切换回合");
            nextTurn();
        }, 500);
    }
}

/**
 * 获取效果的显示名称
 * @param {Object} effect - 效果对象
 * @returns {string} 效果显示名称
 */
function getEffectDisplayName(effect) {
    if (effect.name) return effect.name;
    
    if (effect.defense) return "防御增强";
    if (effect.dodge_rate) return "闪避增强";
    if (effect.reflect_damage) return "伤害反弹";
    if (effect.speed) {
        return effect.speed > 0 ? "速度增强" : "速度降低";
    }
    if (effect.confusion) return "混乱";
    if (effect.poison) return "中毒";
    if (effect.damage) return "灼烧";
    
    return "状态效果";
}

// 导出模块
export default {
    selectAction,
    performAction,
    calculateDamage,
    executeSkillEffect,
    endBattle,
    nextTurn,
    startPlayerTurn,
    startEnemyTurn,
    performAIAction,
    applyDOTEffects,
    getEffectDisplayName
}; 