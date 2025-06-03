/**
 * 元素系统测试
 * 
 * 测试游戏中的元素相克系统，包括元素相克关系、元素伤害计算和元素抗性效果
 */

const elementSystem = require('../../static/js/battle/element-system-adapter');

describe('元素系统测试', () => {
    const { 
        ElementType, 
        isElementStrong, 
        isElementWeak, 
        calculateElementalModifier,
        getElementRelation,
        calculateElementalDamage,
        ELEMENT_BONUS,
        ELEMENT_PENALTY,
        ELEMENT_MATCH
    } = elementSystem;

    describe('元素相克关系测试', () => {
        test('火元素应该克制风元素', () => {
            expect(isElementStrong(ElementType.FIRE, ElementType.AIR)).toBe(true);
            expect(isElementWeak(ElementType.FIRE, ElementType.AIR)).toBe(false);
            expect(getElementRelation(ElementType.FIRE, ElementType.AIR)).toBe('strong');
        });

        test('火元素应该克制土元素', () => {
            expect(isElementStrong(ElementType.FIRE, ElementType.EARTH)).toBe(true);
            expect(isElementWeak(ElementType.FIRE, ElementType.EARTH)).toBe(false);
            expect(getElementRelation(ElementType.FIRE, ElementType.EARTH)).toBe('strong');
        });

        test('水元素应该克制火元素', () => {
            expect(isElementStrong(ElementType.WATER, ElementType.FIRE)).toBe(true);
            expect(isElementWeak(ElementType.WATER, ElementType.FIRE)).toBe(false);
            expect(getElementRelation(ElementType.WATER, ElementType.FIRE)).toBe('strong');
        });

        test('火元素应该被水元素克制', () => {
            expect(isElementStrong(ElementType.FIRE, ElementType.WATER)).toBe(false);
            expect(isElementWeak(ElementType.FIRE, ElementType.WATER)).toBe(true);
            expect(getElementRelation(ElementType.FIRE, ElementType.WATER)).toBe('weak');
        });

        test('光元素和暗元素互相克制', () => {
            expect(isElementStrong(ElementType.LIGHT, ElementType.DARK)).toBe(true);
            expect(isElementWeak(ElementType.LIGHT, ElementType.DARK)).toBe(true);
            
            expect(isElementStrong(ElementType.DARK, ElementType.LIGHT)).toBe(true);
            expect(isElementWeak(ElementType.DARK, ElementType.LIGHT)).toBe(true);
        });

        test('中性元素不克制任何元素也不被任何元素克制', () => {
            const allElements = Object.values(ElementType);
            
            allElements.forEach(element => {
                expect(isElementStrong(ElementType.NEUTRAL, element)).toBe(false);
                expect(isElementWeak(ElementType.NEUTRAL, element)).toBe(false);
                expect(getElementRelation(ElementType.NEUTRAL, element)).toBe('neutral');
            });
        });
    });

    describe('元素伤害计算测试', () => {
        test('元素克制应该增加伤害', () => {
            // 火攻击风防御，火克风
            const baseDamage = 100;
            const modifierFireVsAir = calculateElementalModifier(ElementType.FIRE, ElementType.AIR);
            const damageFireVsAir = calculateElementalDamage(baseDamage, ElementType.FIRE, ElementType.AIR);
            
            expect(modifierFireVsAir).toBe(ELEMENT_BONUS);
            expect(damageFireVsAir).toBe(Math.floor(baseDamage * ELEMENT_BONUS));
        });

        test('元素被克制应该减少伤害', () => {
            // 火攻击水防御，水克火
            const baseDamage = 100;
            const modifierFireVsWater = calculateElementalModifier(ElementType.FIRE, ElementType.WATER);
            const damageFireVsWater = calculateElementalDamage(baseDamage, ElementType.FIRE, ElementType.WATER);
            
            expect(modifierFireVsWater).toBe(ELEMENT_PENALTY);
            expect(damageFireVsWater).toBe(Math.floor(baseDamage * ELEMENT_PENALTY));
        });

        test('同元素技能应该增加伤害', () => {
            // 火元素卡牌使用火元素技能
            const baseDamage = 100;
            const modifierFireUsingFire = calculateElementalModifier(
                ElementType.FIRE, 
                ElementType.NEUTRAL, 
                ElementType.FIRE
            );
            const damageFireUsingFire = calculateElementalDamage(
                baseDamage, 
                ElementType.FIRE, 
                ElementType.NEUTRAL, 
                ElementType.FIRE
            );
            
            expect(modifierFireUsingFire).toBe(ELEMENT_MATCH);
            expect(damageFireUsingFire).toBe(Math.floor(baseDamage * ELEMENT_MATCH));
        });

        test('元素克制和同元素技能组合应该叠加加成', () => {
            // 水元素卡牌使用水元素技能攻击火元素敌人
            const baseDamage = 100;
            const expectedModifier = ELEMENT_BONUS * ELEMENT_MATCH;
            const modifierWaterUsingWaterVsFire = calculateElementalModifier(
                ElementType.WATER, 
                ElementType.FIRE, 
                ElementType.WATER
            );
            const damageWaterUsingWaterVsFire = calculateElementalDamage(
                baseDamage, 
                ElementType.WATER, 
                ElementType.FIRE, 
                ElementType.WATER
            );
            
            expect(modifierWaterUsingWaterVsFire).toBe(expectedModifier);
            expect(damageWaterUsingWaterVsFire).toBe(Math.floor(baseDamage * expectedModifier));
        });

        test('互相克制的元素伤害计算', () => {
            // 光元素攻击暗元素，互相克制
            const baseDamage = 100;
            const expectedModifier = ELEMENT_BONUS * ELEMENT_PENALTY;
            const modifierLightVsDark = calculateElementalModifier(ElementType.LIGHT, ElementType.DARK);
            const damageLightVsDark = calculateElementalDamage(baseDamage, ElementType.LIGHT, ElementType.DARK);
            
            expect(modifierLightVsDark).toBe(expectedModifier);
            expect(damageLightVsDark).toBe(Math.floor(baseDamage * expectedModifier));
        });
    });

    describe('元素抗性测试', () => {
        test('元素抗性应该减少伤害', () => {
            const baseDamage = 100;
            const resistance = 50; // 50%抗性
            
            // 无元素优势情况下的抗性
            const damageWithResistance = calculateElementalDamage(
                baseDamage, 
                ElementType.FIRE, 
                ElementType.NEUTRAL, 
                null, 
                resistance
            );
            
            expect(damageWithResistance).toBe(Math.floor(baseDamage * 0.5)); // 100 * (1 - 50/100)
        });

        test('高抗性与元素克制组合', () => {
            const baseDamage = 100;
            const resistance = 75; // 75%抗性
            
            // 元素克制下的高抗性
            const damageWithResistanceAndElementalBonus = calculateElementalDamage(
                baseDamage, 
                ElementType.FIRE, 
                ElementType.AIR, 
                null, 
                resistance
            );
            
            const expectedDamage = Math.floor(baseDamage * ELEMENT_BONUS * 0.25); // 100 * 1.5 * (1 - 75/100)
            expect(damageWithResistanceAndElementalBonus).toBe(expectedDamage);
        });

        test('100%抗性应该将伤害降至最小值1', () => {
            const baseDamage = 100;
            const resistance = 100; // 100%抗性
            
            const damageWithFullResistance = calculateElementalDamage(
                baseDamage, 
                ElementType.FIRE, 
                ElementType.AIR, 
                null, 
                resistance
            );
            
            // 即使有元素克制加成，但100%抗性应该将伤害降至最小值1
            expect(damageWithFullResistance).toBe(1);
        });

        test('抗性、元素克制和元素匹配的综合计算', () => {
            const baseDamage = 100;
            const resistance = 30; // 30%抗性
            
            // 水元素卡牌使用水元素技能攻击火元素敌人，但敌人有30%抗性
            const damageComplex = calculateElementalDamage(
                baseDamage, 
                ElementType.WATER, 
                ElementType.FIRE, 
                ElementType.WATER, 
                resistance
            );
            
            const expectedModifier = ELEMENT_BONUS * ELEMENT_MATCH * 0.7; // 1.5 * 1.2 * (1 - 30/100)
            expect(damageComplex).toBe(Math.floor(baseDamage * expectedModifier));
        });
    });
}); 