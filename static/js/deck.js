// 当前牌组状态
let currentDeck = {
    name: '默认牌组1',
    cards: Array(3).fill(null)
};

// 已保存的牌组列表
let savedDecks = [];

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    initializeDeckBuilder();
    loadAvailableCards();
    loadSavedDecks();
});

// 初始化牌组构建器
function initializeDeckBuilder() {
    const deckSlots = document.getElementById('deckSlots');
    deckSlots.innerHTML = ''; // 清空现有槽位
    
    // 创建3个牌组槽位
    for (let i = 0; i < 3; i++) {
        const slot = document.createElement('div');
        slot.className = 'deck-slot';
        slot.dataset.index = i;
        slot.addEventListener('click', () => handleSlotClick(i));
        deckSlots.appendChild(slot);
    }
}

// 处理槽位点击
function handleSlotClick(index) {
    const slot = document.querySelector(`.deck-slot[data-index="${index}"]`);
    if (slot.classList.contains('filled')) {
        removeCardFromSlot(index);
    }
}

// 加载可用卡牌
function loadAvailableCards() {
    const availableCards = document.getElementById('availableCards');
    
    fetch('/api/cards')
        .then(response => response.json())
        .then(data => {
            availableCards.innerHTML = ''; // 清空现有卡牌
            data.cards.forEach(card => {
                const cardElement = createCardElement(card);
                if (cardElement) {  // 只添加有效的卡牌元素
                    cardElement.addEventListener('click', () => handleCardClick(card));
                    availableCards.appendChild(cardElement);
                }
            });
            updateCardStates();
        })
        .catch(error => {
            console.error('加载卡牌失败:', error);
            showMessage('加载卡牌失败，请刷新页面重试', 'error');
        });
}

// 处理卡牌点击
function handleCardClick(card) {
    // 检查是否已经存在相同的卡牌
    if (currentDeck.cards.includes(card.id.toString())) {
        showMessage('不能添加重复的卡牌', 'warning');
        return;
    }
    
    // 找到第一个空槽位
    const emptySlotIndex = currentDeck.cards.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) {
        showMessage('牌组已满，请先移除一张卡牌', 'warning');
        return;
    }
    
    // 更新牌组状态
    currentDeck.cards[emptySlotIndex] = card.id.toString();
    
    // 更新UI
    const slot = document.querySelector(`.deck-slot[data-index="${emptySlotIndex}"]`);
    updateDeckSlot(slot, card);
    
    // 更新卡牌状态
    updateCardStates();
    
    showMessage(`已添加 ${card.name} 到牌组`, 'success');
}

// 更新牌组槽位
function updateDeckSlot(slot, card) {
    slot.classList.add('filled');
    slot.innerHTML = '';
    
    const cardElement = createCardElement(card);
    cardElement.classList.add('in-deck');
    slot.appendChild(cardElement);
}

// 从槽位移除卡牌
function removeCardFromSlot(index) {
    if (currentDeck.cards[index]) {
        currentDeck.cards[index] = null;
        const slot = document.querySelector(`.deck-slot[data-index="${index}"]`);
        slot.classList.remove('filled');
        slot.innerHTML = '';
        
        updateCardStates();
        showMessage('已移除卡牌', 'info');
    }
}

// 更新卡牌状态
function updateCardStates() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const cardId = card.dataset.id;
        if (currentDeck.cards.includes(cardId)) {
            card.classList.add('in-deck');
        } else {
            card.classList.remove('in-deck');
        }
    });
}

// 保存牌组
function saveDeck() {
    // 检查牌组是否完整
    if (currentDeck.cards.some(card => card === null)) {
        showMessage('请完成牌组配置', 'warning');
        return;
    }
    
    // 获取牌组名称
    const deckName = prompt('请输入牌组名称：', currentDeck.name);
    if (!deckName) return;
    
    currentDeck.name = deckName;
    
    // 保存到服务器
    fetch('/api/decks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentDeck)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('牌组保存成功', 'success');
            loadSavedDecks();
        } else {
            showMessage('牌组保存失败', 'error');
        }
    })
    .catch(error => {
        console.error('保存牌组失败:', error);
        showMessage('保存牌组失败，请重试', 'error');
    });
}

// 清空牌组
function clearDeck() {
    currentDeck.cards = Array(3).fill(null);
    const slots = document.querySelectorAll('.deck-slot');
    slots.forEach(slot => {
        slot.classList.remove('filled');
        slot.innerHTML = '';
    });
    
    updateCardStates();
    showMessage('牌组已清空', 'info');
}

// 加载已保存的牌组
function loadSavedDecks() {
    fetch('/api/decks')
        .then(response => response.json())
        .then(data => {
            const deckList = document.getElementById('deckList');
            if (deckList) {
                deckList.innerHTML = '';
                data.decks.forEach(deck => {
                    const deckItem = createDeckItem(deck);
                    deckList.appendChild(deckItem);
                });
            }
        })
        .catch(error => {
            console.error('加载牌组失败:', error);
            showMessage('加载牌组失败，请刷新页面重试', 'error');
        });
}

// 创建牌组项
function createDeckItem(deck) {
    const deckItem = document.createElement('div');
    deckItem.className = 'deck-item';
    deckItem.innerHTML = `
        <div class="deck-name">${deck.name}</div>
        <div class="deck-cards">
            ${deck.cards.map(cardId => {
                const card = getCardById(cardId);
                return card ? `<div class="card in-deck">${card.name}</div>` : '';
            }).join('')}
        </div>
    `;
    deckItem.addEventListener('click', () => useSavedDeck(deck));
    return deckItem;
}

// 使用已保存的牌组
function useSavedDeck(deck) {
    currentDeck = { ...deck };
    updateDeckSlots();
    showMessage(`已加载牌组：${deck.name}`, 'success');
}

// 更新所有牌组槽位
function updateDeckSlots() {
    const slots = document.querySelectorAll('.deck-slot');
    slots.forEach((slot, index) => {
        const cardId = currentDeck.cards[index];
        if (cardId) {
            const card = getCardById(cardId);
            if (card) {
                updateDeckSlot(slot, card);
            }
        } else {
            slot.classList.remove('filled');
            slot.innerHTML = '';
        }
    });
    updateCardStates();
}

// 根据ID获取卡牌数据
function getCardById(cardId) {
    const cards = document.querySelectorAll('.card');
    for (const card of cards) {
        if (card.dataset.id === cardId) {
            return {
                id: card.dataset.id,
                name: card.querySelector('.card-name').textContent,
                element: card.querySelector('.card-element').textContent,
                stats: {
                    HP: parseInt(card.querySelector('.stat:nth-child(1) span:last-child').textContent),
                    ATK: parseInt(card.querySelector('.stat:nth-child(2) span:last-child').textContent),
                    SPD: parseInt(card.querySelector('.stat:nth-child(3) span:last-child').textContent)
                }
            };
        }
    }
    return null;
}

// 创建卡牌元素
function createCardElement(cardData) {
    // 验证卡牌数据
    if (!cardData || !cardData.stats) {
        console.error('无效的卡牌数据:', cardData);
        return null;
    }

    try {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = cardData.id;
        
        // 确保所有必要的属性都存在
        const stats = cardData.stats || {};
        const defaultStats = {
            DEF: 0,
            CRI: 0,
            NRG: 0,
            HP: 0,
            ATK: 0,
            SPD: 0
        };
        
        // 使用默认值填充缺失的属性
        Object.keys(defaultStats).forEach(key => {
            card.dataset[key.toLowerCase()] = stats[key] || defaultStats[key];
        });
        
        card.dataset.skills = JSON.stringify(cardData.skills || []);
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-name">${cardData.name || '未知卡牌'}</div>
            </div>
            <div class="card-element element-${cardData.element || '无'}">${cardData.element || '无'}</div>
            <div class="card-stats">
                <div class="stat">
                    <span class="stat-label">HP</span>
                    <span>${stats.HP || 0}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">ATK</span>
                    <span>${stats.ATK || 0}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">SPD</span>
                    <span>${stats.SPD || 0}</span>
                </div>
            </div>
        `;

        // 创建提示框
        const tooltip = document.createElement('div');
        tooltip.className = 'card-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-name">${cardData.name || '未知卡牌'}</div>
                <div class="tooltip-element element-${cardData.element || '无'}">${cardData.element || '无'}</div>
            </div>
            <div class="tooltip-stats">
                <div class="tooltip-stat">
                    <span class="stat-label">生命值</span>
                    <span class="stat-value">${stats.HP || 0}</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-label">攻击力</span>
                    <span class="stat-value">${stats.ATK || 0}</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-label">速度</span>
                    <span class="stat-value">${stats.SPD || 0}</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-label">防御力</span>
                    <span class="stat-value">${stats.DEF || 0}</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-label">暴击率</span>
                    <span class="stat-value">${stats.CRI || 0}%</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-label">初始能量</span>
                    <span class="stat-value">${stats.NRG || 0}</span>
                </div>
            </div>
            <div class="tooltip-skills">
                ${(cardData.skills || []).map(skill => `
                    <div class="tooltip-skill">
                        <div class="skill-name">${skill.name || '未知技能'}</div>
                        <div class="skill-cost">消耗: ${skill.cost || 0} NRG</div>
                        <div class="skill-description">${skill.description || '无描述'}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // 将提示框添加到body
        document.body.appendChild(tooltip);

        // 添加鼠标悬停事件
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${rect.top}px`;
            tooltip.style.display = 'block';
        });

        card.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });

        // 添加窗口滚动事件，确保提示框位置正确
        window.addEventListener('scroll', () => {
            if (tooltip.style.display === 'block') {
                const rect = card.getBoundingClientRect();
                tooltip.style.left = `${rect.right + 10}px`;
                tooltip.style.top = `${rect.top}px`;
            }
        });

        return card;
    } catch (error) {
        console.error('创建卡牌元素时出错:', error);
        return null;
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
} 