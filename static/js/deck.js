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
            data.cards.forEach(card => {
                const cardElement = createCardElement(card);
                cardElement.addEventListener('click', () => handleCardClick(card));
                availableCards.appendChild(cardElement);
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
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = cardData.id;
    
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
    `;
    
    return card;
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