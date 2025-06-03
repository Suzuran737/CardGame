/**
 * battle-ui.test.js
 * 战斗UI适配器测试
 */

// 导入依赖
const { battleUI } = require('../../static/js/battle/battle-ui-adapter');
const { battleState } = require('../../static/js/battle/battle-state-adapter');
const { battleCards } = require('../../static/js/battle/battle-cards-adapter');

// 测试数据
const mockPlayerCards = [
  {
    id: 'p1',
    name: '玩家卡牌1',
    element: 'fire',
    stats: {
      HP: 100,
      ATK: 20,
      DEF: 10,
      SPD: 15,
      CRI: 5,
      NRG: 3
    },
    currentHP: 100,
    currentNRG: 3,
    statusEffects: [],
    uuid: 'player-p1-0',
    skills: [
      { name: '火球术', cost: 2, effect: { damage: 1.5 } }
    ]
  },
  {
    id: 'p2',
    name: '玩家卡牌2',
    element: 'water',
    stats: {
      HP: 80,
      ATK: 15,
      DEF: 12,
      SPD: 18,
      CRI: 8,
      NRG: 4
    },
    currentHP: 80,
    currentNRG: 4,
    statusEffects: [],
    uuid: 'player-p2-1',
    skills: [
      { name: '水流冲击', cost: 1, effect: { damage: 1.2 } },
      { name: '治愈之水', cost: 3, effect: { heal: 20 } }
    ]
  }
];

const mockEnemyCards = [
  {
    id: 'e1',
    name: '敌方卡牌1',
    element: 'earth',
    stats: {
      HP: 90,
      ATK: 18,
      DEF: 8,
      SPD: 12,
      CRI: 4,
      NRG: 3
    },
    currentHP: 90,
    currentNRG: 3,
    statusEffects: [],
    uuid: 'enemy-e1-0',
    skills: [
      { name: '岩石投掷', cost: 1, effect: { damage: 1.3 } }
    ]
  }
];

describe('战斗UI适配器测试', () => {
  // 每个测试前重置状态
  beforeEach(() => {
    // 重置UI状态
    battleUI.resetUI();
    
    // 设置战斗状态
    battleState.setupBattle(mockPlayerCards, mockEnemyCards);
    battleState.currentTurn = 'player';
    battleState.actedCards = new Set();
  });

  test('初始化战斗UI', () => {
    const result = battleUI.initializeBattleUI();
    
    expect(result).toBeDefined();
    expect(result.initialized).toBe(true);
    expect(result.playerCards).toBe(2);
    expect(result.enemyCards).toBe(1);
  });

  test('显示卡牌', () => {
    const { playerCardElements, enemyCardElements } = battleUI.displayCards();
    
    expect(playerCardElements).toHaveLength(2);
    expect(enemyCardElements).toHaveLength(1);
    
    expect(playerCardElements[0].dataset.uuid).toBe('player-p1-0');
    expect(playerCardElements[0].dataset.side).toBe('player');
    expect(playerCardElements[0].classList.contains('selectable')).toBe(true);
    
    expect(enemyCardElements[0].dataset.uuid).toBe('enemy-e1-0');
    expect(enemyCardElements[0].dataset.side).toBe('enemy');
  });

  test('更新回合显示', () => {
    const displayText = battleUI.updateTurnDisplay();
    
    expect(displayText).toBe('当前回合：玩家回合（总回合数：0）');
    expect(battleUI.mockDOM.turnDisplay.textContent).toBe('当前回合：玩家回合（总回合数：0）');
    
    // 切换回合
    battleState.currentTurn = 'enemy';
    battleState.enemyTurnCount = 1;
    
    const newDisplayText = battleUI.updateTurnDisplay();
    
    expect(newDisplayText).toBe('当前回合：敌方回合（总回合数：1）');
  });

  test('更新行动面板', () => {
    const actionPanel = battleUI.updateActionPanel('请选择卡牌');
    
    expect(actionPanel.children).toHaveLength(1);
    expect(actionPanel.children[0].textContent).toBe('请选择卡牌');
  });

  test('显示卡牌行动选项', () => {
    const card = mockPlayerCards[0];
    const actionOptions = battleUI.showCardActions(card);
    
    expect(battleUI.uiState.selectedCard).toBe(card);
    expect(actionOptions.children.length).toBeGreaterThan(1);
    
    // 检查卡牌信息
    expect(actionOptions.children[0].className).toBe('card-info');
    expect(actionOptions.children[0].innerHTML).toContain('玩家卡牌1');
    
    // 检查普通攻击按钮
    expect(actionOptions.children[1].textContent).toBe('普通攻击');
    expect(actionOptions.children[1].disabled).toBe(false);
    
    // 检查技能按钮
    expect(actionOptions.children[2].textContent).toBe('火球术');
    expect(actionOptions.children[2].disabled).toBe(false);
  });

  test('显示技能按钮 - 能量不足时禁用', () => {
    const card = { ...mockPlayerCards[0], currentNRG: 1 };
    const actionOptions = battleUI.showCardActions(card);
    
    // 检查技能按钮 - 应该被禁用
    expect(actionOptions.children[2].disabled).toBe(true);
    expect(actionOptions.children[2].className).toContain('disabled');
  });

  test('选择行动', () => {
    const card = mockPlayerCards[0];
    const skill = card.skills[0];
    
    const action = battleUI.selectAction(card, 'skill', skill);
    
    expect(action).toBeDefined();
    expect(action.card).toBe(card);
    expect(action.actionType).toBe('skill');
    expect(action.skill).toBe(skill);
    
    // 检查是否显示了目标
    expect(battleUI.uiState.targetableCards.length).toBeGreaterThan(0);
  });

  test('显示可选目标', () => {
    // 设置玩家回合
    battleState.currentTurn = 'player';
    
    const targetElements = battleUI.showTargets();
    
    expect(targetElements).toHaveLength(1);
    expect(targetElements[0].dataset.side).toBe('enemy');
    expect(targetElements[0].classList.contains('targetable')).toBe(true);
    
    // 设置敌方回合
    battleState.currentTurn = 'enemy';
    
    const newTargetElements = battleUI.showTargets();
    
    expect(newTargetElements).toHaveLength(2);
    expect(newTargetElements[0].dataset.side).toBe('player');
  });

  test('执行行动', () => {
    // 设置选中卡牌
    const sourceCard = mockPlayerCards[0];
    const targetCard = mockEnemyCards[0];
    
    battleUI.uiState.selectedCard = sourceCard;
    
    const result = battleUI.performAction(targetCard);
    
    expect(result).toBeDefined();
    expect(result.source).toBe(sourceCard);
    expect(result.target).toBe(targetCard);
    expect(result.success).toBe(true);
    
    // 检查选择状态是否被清理
    expect(battleUI.uiState.selectedCard).toBeNull();
    expect(battleUI.uiState.targetableCards).toHaveLength(0);
  });

  test('清理UI选择状态', () => {
    // 设置一些选择状态
    battleUI.displayCards();
    battleUI.uiState.selectedCard = mockPlayerCards[0];
    battleUI.uiState.targetableCards = [...mockEnemyCards];
    
    // 添加样式
    battleUI.uiState.cardElements[0].classList.add('selected');
    battleUI.uiState.cardElements[2].classList.add('targetable');
    
    // 清理选择状态
    battleUI.clearSelectionUI();
    
    // 验证状态已清理
    expect(battleUI.uiState.selectedCard).toBeNull();
    expect(battleUI.uiState.targetableCards).toHaveLength(0);
    expect(battleUI.uiState.cardElements[0].classList.contains('selected')).toBe(false);
    expect(battleUI.uiState.cardElements[2].classList.contains('targetable')).toBe(false);
  });

  test('添加战斗日志', () => {
    const message = '玩家卡牌1 攻击了 敌方卡牌1，造成15点伤害';
    const logEntry = battleUI.addToBattleLog(message);
    
    expect(logEntry).toBeDefined();
    expect(logEntry.textContent).toBe(message);
    expect(battleUI.mockDOM.battleLog.children).toHaveLength(1);
    expect(battleUI.uiState.battleLogEntries).toHaveLength(1);
    expect(battleUI.uiState.battleLogEntries[0]).toBe(message);
  });

  test('显示消息', () => {
    const message = '请选择目标';
    const messageElement = battleUI.showMessage(message, 'info');
    
    expect(messageElement).toBeDefined();
    expect(messageElement.innerHTML).toBe(message);
    expect(messageElement.className).toBe('message info');
    expect(battleUI.uiState.messages).toHaveLength(1);
    expect(battleUI.uiState.messages[0].message).toBe(message);
    expect(battleUI.uiState.messages[0].type).toBe('info');
  });

  test('显示战斗结果 - 胜利', () => {
    const resultElement = battleUI.showBattleResult(true);
    
    expect(resultElement).toBeDefined();
    expect(resultElement.textContent).toBe('战斗胜利！');
    expect(resultElement.className).toContain('victory');
    
    // 检查是否也显示了消息
    expect(battleUI.mockDOM.messageContainer.innerHTML).toBe('战斗胜利！');
    expect(battleUI.mockDOM.messageContainer.className).toContain('success');
  });

  test('显示战斗结果 - 失败', () => {
    const resultElement = battleUI.showBattleResult(false);
    
    expect(resultElement).toBeDefined();
    expect(resultElement.textContent).toBe('战斗失败！');
    expect(resultElement.className).toContain('defeat');
    
    // 检查是否也显示了消息
    expect(battleUI.mockDOM.messageContainer.innerHTML).toBe('战斗失败！');
    expect(battleUI.mockDOM.messageContainer.className).toContain('error');
  });

  test('创建模拟卡牌元素', () => {
    const card = mockPlayerCards[0];
    const cardElement = battleUI.createMockCardElement(card, 'player', 0);
    
    expect(cardElement).toBeDefined();
    expect(cardElement.dataset.uuid).toBe('player-p1-0');
    expect(cardElement.dataset.side).toBe('player');
    expect(cardElement.classList.contains('card')).toBe(true);
    expect(cardElement.classList.contains('selectable')).toBe(true);
    
    // 测试卡牌已阵亡的情况
    const deadCard = { ...card, currentHP: 0 };
    const deadCardElement = battleUI.createMockCardElement(deadCard, 'player', 0);
    
    expect(deadCardElement.classList.contains('dead')).toBe(true);
    expect(deadCardElement.classList.contains('selectable')).toBe(false);
    
    // 测试卡牌已行动的情况
    battleState.actedCards.add(card.uuid);
    const actedCardElement = battleUI.createMockCardElement(card, 'player', 0);
    
    expect(actedCardElement.classList.contains('acted')).toBe(true);
    expect(actedCardElement.classList.contains('selectable')).toBe(false);
  });
}); 