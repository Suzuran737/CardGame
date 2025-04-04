// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    loadCards();
});

// 加载卡牌数据
async function loadCards() {
    try {
        const response = await fetch('/api/cards');
        const data = await response.json();
        displayCards(data.cards);
    } catch (error) {
        console.error('加载卡牌数据失败:', error);
        showMessage('加载卡牌数据失败，请刷新页面重试', 'error');
    }
}

// 显示卡牌
function displayCards(cards) {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        container.appendChild(cardElement);
    });
}

// 创建卡牌元素
function createCardElement(cardData) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = cardData.id;
    
    // 基础显示
    card.innerHTML = `
        <div class="card-header">
            <div class="card-name">${cardData.name}</div>
        </div>
        <div class="card-element element-${cardData.element}">${cardData.element}</div>
        <div class="card-stats">
            <div class="stat">
                <span class="stat-label">HP</span>
                <span>${cardData.stats.HP}</span>
            </div>
            <div class="stat">
                <span class="stat-label">ATK</span>
                <span>${cardData.stats.ATK}</span>
            </div>
            <div class="stat">
                <span class="stat-label">SPD</span>
                <span>${cardData.stats.SPD}</span>
            </div>
        </div>
        <div class="card-skills">
            ${cardData.skills.map(skill => `
                <div class="skill">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-cost">${skill.cost} NRG</div>
                </div>
            `).join('')}
        </div>
        <div class="card-details">
            <div class="detail-stat">
                <span class="detail-label">攻击力</span>
                <span>${cardData.stats.ATK}</span>
            </div>
            <div class="detail-stat">
                <span class="detail-label">生命值</span>
                <span>${cardData.stats.HP}</span>
            </div>
            <div class="detail-stat">
                <span class="detail-label">防御力</span>
                <span>${cardData.stats.DEF}</span>
            </div>
            <div class="detail-stat">
                <span class="detail-label">速度</span>
                <span>${cardData.stats.SPD}</span>
            </div>
            <div class="detail-stat">
                <span class="detail-label">暴击率</span>
                <span>${cardData.stats.CRI}%</span>
            </div>
            <div class="detail-stat">
                <span class="detail-label">初始能量</span>
                <span>${cardData.stats.NRG}</span>
            </div>
            <div class="skill-details">
                ${cardData.skills.map(skill => `
                    <div class="skill">
                        <div class="skill-name">${skill.name}</div>
                        <div class="skill-cost">消耗: ${skill.cost} NRG</div>
                        <div class="skill-description">${skill.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return card;
}

// 显示消息
function showMessage(message, type = 'info') {
    // 这里可以添加消息提示的实现
    console.log(`[${type}] ${message}`);
} 