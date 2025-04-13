/**
 * battle-main.js
 * 主模块，负责初始化战斗并协调各个模块
 */

import BattleState from './battle-state.js';
import BattleUI from './battle-ui.js';
import BattleActions from './battle-actions.js';

/**
 * 初始化战斗
 */
function initializeBattle() {
    // 加载玩家卡牌
    if (!BattleState.loadPlayerCards()) {
        BattleUI.showMessage('卡牌数据错误，请重新选择卡牌', 'error');
        setTimeout(() => window.location.href = '/prepare', 2000);
        return;
    }
    
    // 加载敌方卡牌
    BattleState.loadEnemyCards().then(success => {
        if (!success) {
            BattleUI.showMessage('加载敌方卡牌失败，请刷新页面重试', 'error');
            return;
        }
        
        // 显示卡牌
        BattleUI.displayCards();
        
        // 初始化UI事件监听器
        BattleUI.initializeBattleUI();
        
        // 开始战斗
        startBattle();
    });
}

/**
 * 开始战斗
 */
function startBattle() {
    // 决定先手
    const firstTurn = BattleState.determineFirstTurn();
    console.log(`===战斗开始，先手方: ${firstTurn}`);
    
    // 初始化先手方的回合计数为1
    if (firstTurn === 'player') {
        BattleState.state.playerTurnCount = 1;
        BattleState.state.enemyTurnCount = 0;
    } else {
        BattleState.state.enemyTurnCount = 1;
        BattleState.state.playerTurnCount = 0;
    }
    
    // 清空已行动卡牌记录
    BattleState.state.actedCards.clear();
    console.log("===已清空actedCards集合");
    
    BattleUI.updateTurnDisplay();
    
    // 开始第一回合
    console.log(`===开始第一回合: ${firstTurn}`);
    setTimeout(() => {
        if (firstTurn === 'player') {
            console.log("===启动玩家首回合");
            BattleActions.startPlayerTurn();
        } else {
            console.log("===启动敌方首回合");
            BattleActions.startEnemyTurn();
        }
    }, 500);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeBattle();
});

// 导出模块（如果需要）
export default {
    initializeBattle,
    startBattle
}; 