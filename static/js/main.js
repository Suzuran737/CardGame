// 全局游戏状态
const gameState = {
    decks: [],
    currentDeck: null,
    battleState: null,
    music: {
        isPlaying: false,
        audio: null
    }
};

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    // 加载卡牌数据
    fetch('/api/cards')
        .then(response => response.json())
        .then(data => {
            console.log('卡牌数据加载成功:', data);
        })
        .catch(error => {
            console.error('加载卡牌数据失败:', error);
        });
});

// 工具函数
function showMessage(message, type = 'info') {
    // 实现消息提示功能
    console.log(`[${type}] ${message}`);
}

// 音乐控制函数
function toggleMusic() {
    const musicControl = document.getElementById('musicControl');
    const icon = musicControl.querySelector('i');
    
    if (!gameState.music.audio) {
        // 创建音频对象（暂时使用占位音频）
        gameState.music.audio = new Audio();
        // 这里可以设置音频源
        // gameState.music.audio.src = '/static/audio/theme.mp3';
    }
    
    if (gameState.music.isPlaying) {
        gameState.music.audio.pause();
        gameState.music.isPlaying = false;
        icon.classList.remove('fa-volume-up');
        icon.classList.add('fa-volume-mute');
    } else {
        gameState.music.audio.play();
        gameState.music.isPlaying = true;
        icon.classList.remove('fa-volume-mute');
        icon.classList.add('fa-volume-up');
    }
}

// 卡牌相关函数
function createCardElement(cardData) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = cardData.id;
    
    // 创建卡牌HTML结构
    card.innerHTML = `
        <div class="card-header">
            <h3>${cardData.name}</h3>
            <span class="element">${cardData.element}</span>
        </div>
        <div class="card-stats">
            <div>攻击: ${cardData.stats.ATK}</div>
            <div>生命: ${cardData.stats.HP}</div>
            <div>防御: ${cardData.stats.DEF}</div>
            <div>速度: ${cardData.stats.SPD}</div>
            <div>暴击: ${cardData.stats.CRI}%</div>
            <div>能量: ${cardData.stats.NRG}</div>
        </div>
        <div class="card-skills">
            ${cardData.skills.map(skill => `
                <div class="skill">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-cost">消耗: ${skill.cost} NRG</div>
                    <div class="skill-description">${skill.description}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    return card;
} 