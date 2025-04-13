// 选中的卡牌
let selectedCards = new Map(); // 使用Map来存储卡牌和对应的槽位
const MAX_SELECTED_CARDS = 3;

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    loadSavedDecks();
    loadAllCards();
    
    // 添加开始战斗按钮事件监听
    const startBattleBtn = document.getElementById('startBattleBtn');
    if (startBattleBtn) {
        startBattleBtn.addEventListener('click', startBattle);
    }
});

// 加载保存的牌组
async function loadSavedDecks() {
    try {
        const response = await fetch('/api/decks');
        if (!response.ok) throw new Error('加载牌组失败');
        const data = await response.json();
        updateDeckDropdown(data.decks || []);
    } catch (error) {
        console.error('加载牌组失败:', error);
        showMessage('加载牌组失败: ' + error.message, 'error');
    }
}

// 加载所有卡牌
async function loadAllCards() {
    try {
        const response = await fetch('/api/cards');
        if (!response.ok) throw new Error('加载卡牌失败');
        const data = await response.json();
        updateQuickSelect(data.cards || []);
    } catch (error) {
        console.error('加载卡牌失败:', error);
        showMessage('加载卡牌失败: ' + error.message, 'error');
    }
}

// 更新牌组下拉菜单
function updateDeckDropdown(decks) {
    const dropdown = document.getElementById('deckDropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    if (decks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'deck-item';
        emptyMessage.textContent = '暂无保存的牌组';
        dropdown.appendChild(emptyMessage);
        return;
    }
    
    decks.forEach(deck => {
        const deckItem = document.createElement('div');
        deckItem.className = 'deck-item';
        deckItem.innerHTML = `
            <div class="deck-name">${deck.name}</div>
            <div class="deck-preview">
                ${deck.cards.map(cardId => {
                    const card = getCardById(cardId);
                    return card ? createCardElement(card).outerHTML : '';
                }).join('')}
            </div>
        `;
        deckItem.addEventListener('click', () => selectDeck(deck));
        dropdown.appendChild(deckItem);
    });
}

// 更新快速选择区域
function updateQuickSelect(cards) {
    const grid = document.getElementById('quickSelectCards');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (cards.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '暂无可用卡牌';
        grid.appendChild(emptyMessage);
        return;
    }
    
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        cardElement.addEventListener('click', () => toggleCardSelection(card));
        grid.appendChild(cardElement);
    });
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
                    SPD: parseInt(card.querySelector('.stat:nth-child(3) span:last-child').textContent),
                    DEF: parseInt(card.dataset.def || 0),
                    CRI: parseInt(card.dataset.cri || 0),
                    NRG: parseInt(card.dataset.nrg || 0)
                },
                skills: JSON.parse(card.dataset.skills || '[]')
            };
        }
    }
    return null;
}

// 创建卡牌元素
function createCardElement(card) {
    const element = document.createElement('div');
    element.className = `card ${selectedCards.has(card.id) ? 'selected' : ''}`;
    element.dataset.id = card.id;
    element.dataset.def = card.stats.DEF;
    element.dataset.cri = card.stats.CRI;
    element.dataset.nrg = card.stats.NRG;
    element.dataset.skills = JSON.stringify(card.skills || []);
    
    element.innerHTML = `
        <div class="card-header">
            <div class="card-name">${card.name}</div>
        </div>
        <div class="card-element element-${card.element}">${card.element}</div>
        <div class="card-stats">
            <div class="stat">
                <span class="stat-label">HP</span>
                <span>${card.stats.HP}</span>
            </div>
            <div class="stat">
                <span class="stat-label">ATK</span>
                <span>${card.stats.ATK}</span>
            </div>
            <div class="stat">
                <span class="stat-label">SPD</span>
                <span>${card.stats.SPD}</span>
            </div>
        </div>
    `;

    // 创建提示框
    const tooltip = document.createElement('div');
    tooltip.className = 'card-tooltip';
    tooltip.dataset.cardId = card.id;
    tooltip.innerHTML = `
        <div class="tooltip-header">
            <div class="tooltip-name">${card.name}</div>
            <div class="tooltip-element element-${card.element}">${card.element}</div>
        </div>
        <div class="tooltip-stats">
            <div class="tooltip-stat">
                <span class="stat-label">生命值</span>
                <span class="stat-value">${card.stats.HP}</span>
            </div>
            <div class="tooltip-stat">
                <span class="stat-label">攻击力</span>
                <span class="stat-value">${card.stats.ATK}</span>
            </div>
            <div class="tooltip-stat">
                <span class="stat-label">速度</span>
                <span class="stat-value">${card.stats.SPD}</span>
            </div>
            <div class="tooltip-stat">
                <span class="stat-label">防御力</span>
                <span class="stat-value">${card.stats.DEF}</span>
            </div>
            <div class="tooltip-stat">
                <span class="stat-label">暴击率</span>
                <span class="stat-value">${card.stats.CRI}%</span>
            </div>
            <div class="tooltip-stat">
                <span class="stat-label">初始能量</span>
                <span class="stat-value">${card.stats.NRG}</span>
            </div>
        </div>
        <div class="tooltip-skills">
            ${card.skills ? card.skills.map(skill => `
                <div class="tooltip-skill">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-cost">消耗: ${skill.cost} NRG</div>
                    <div class="skill-description">${skill.description}</div>
                </div>
            `).join('') : ''}
        </div>
    `;

    // 将提示框添加到body
    document.body.appendChild(tooltip);

    // 添加鼠标悬停事件
    let tooltipTimeout;
    element.addEventListener('mouseenter', (e) => {
        clearTimeout(tooltipTimeout);
        const rect = element.getBoundingClientRect();
        const tooltip = document.querySelector(`.card-tooltip[data-card-id="${card.id}"]`);
        if (tooltip) {
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${rect.top}px`;
            tooltip.style.display = 'block';
        }
    });

    element.addEventListener('mouseleave', () => {
        const tooltip = document.querySelector(`.card-tooltip[data-card-id="${card.id}"]`);
        if (tooltip) {
            tooltipTimeout = setTimeout(() => {
                tooltip.style.display = 'none';
            }, 100);
        }
    });

    // 添加窗口滚动事件，确保提示框位置正确
    window.addEventListener('scroll', () => {
        const tooltip = document.querySelector(`.card-tooltip[data-card-id="${card.id}"]`);
        if (tooltip && tooltip.style.display === 'block') {
            const rect = element.getBoundingClientRect();
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${rect.top}px`;
        }
    });

    return element;
}

// 切换卡牌选择状态
function toggleCardSelection(card) {
    const slots = document.querySelectorAll('.deck-slot');
    let emptySlot = null;

    // 如果卡牌已经被选中，不允许在快速选择区域取消
    if (selectedCards.has(card.id)) {
        return;
    }

    // 如果未选中且未达到最大数量，添加到空槽位
    if (selectedCards.size < MAX_SELECTED_CARDS) {
        // 找到第一个空槽位
        for (let i = 0; i < slots.length; i++) {
            if (!slots[i].classList.contains('filled')) {
                emptySlot = slots[i];
                break;
            }
        }

        if (emptySlot) {
            const cardElement = createCardElement(card);
            emptySlot.appendChild(cardElement);
            emptySlot.classList.add('filled');
            selectedCards.set(card.id, parseInt(emptySlot.dataset.slot));
            
            // 为已选卡牌添加点击事件以取消选择
            cardElement.addEventListener('click', () => {
                // 移除对应的悬浮框
                const tooltip = document.querySelector(`.card-tooltip[data-card-id="${card.id}"]`);
                if (tooltip) {
                    tooltip.remove();
                }
                
                emptySlot.innerHTML = '';
                emptySlot.classList.remove('filled');
                selectedCards.delete(card.id);
                updateBattleButton();
                showMessage('已取消选择卡牌', 'info');
            });
        }
    } else {
        showMessage('最多只能选择3张卡牌', 'warning');
        return;
    }

    updateBattleButton();
}

// 选择牌组
async function selectDeck(deck) {
    try {
        // 清空当前选择
        selectedCards.clear();
        const slots = document.querySelectorAll('.deck-slot');
        slots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('filled');
        });

        // 移除所有现有的悬浮框
        const existingTooltips = document.querySelectorAll('.card-tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());

        // 加载牌组中的卡牌
        const response = await fetch('/api/cards');
        if (!response.ok) throw new Error('加载卡牌失败');
        const data = await response.json();
        const allCards = data.cards || [];

        // 添加新选择的卡牌
        for (let i = 0; i < deck.cards.length; i++) {
            const cardId = deck.cards[i];
            const card = allCards.find(c => c.id.toString() === cardId);
            if (card) {
                const slot = slots[i];
                const cardElement = createCardElement(card);
                slot.appendChild(cardElement);
                slot.classList.add('filled');
                selectedCards.set(card.id, i + 1);
                
                // 为已选卡牌添加点击事件以取消选择
                cardElement.addEventListener('click', () => {
                    // 移除对应的悬浮框
                    const tooltip = document.querySelector(`.card-tooltip[data-card-id="${card.id}"]`);
                    if (tooltip) {
                        tooltip.remove();
                    }
                    
                    slot.innerHTML = '';
                    slot.classList.remove('filled');
                    selectedCards.delete(card.id);
                    updateBattleButton();
                    showMessage('已取消选择卡牌', 'info');
                });
            }
        }

        updateBattleButton();
        showMessage(`已选择牌组: ${deck.name}`, 'success');
    } catch (error) {
        console.error('选择牌组失败:', error);
        showMessage('选择牌组失败: ' + error.message, 'error');
    }
}

// 更新开始战斗按钮状态
function updateBattleButton() {
    const startBattleBtn = document.getElementById('startBattleBtn');
    if (startBattleBtn) {
        startBattleBtn.disabled = selectedCards.size !== MAX_SELECTED_CARDS;
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// 开始战斗
function startBattle() {
    if (selectedCards.size !== MAX_SELECTED_CARDS) {
        showMessage(`请选择${MAX_SELECTED_CARDS}张卡牌`, 'warning');
        return;
    }
    
    // 保存选择的卡牌到本地存储
    const battleDeck = [];
    selectedCards.forEach((slotIndex, cardId) => {
        // 从快速选择区域或已选卡牌区域获取卡牌数据
        const cardElement = document.querySelector(`.card[data-id="${cardId}"]`);
        if (cardElement) {
            battleDeck.push({
                id: cardId,
                name: cardElement.querySelector('.card-name').textContent,
                element: cardElement.querySelector('.card-element').textContent,
                hp: parseInt(cardElement.querySelector('.stat:nth-child(1) span:last-child').textContent),
                atk: parseInt(cardElement.querySelector('.stat:nth-child(2) span:last-child').textContent),
                spd: parseInt(cardElement.querySelector('.stat:nth-child(3) span:last-child').textContent),
                def: parseInt(cardElement.dataset.def || 0),
                cri: parseInt(cardElement.dataset.cri || 0),
                nrg: parseInt(cardElement.dataset.nrg || 0),
                skills: JSON.parse(cardElement.dataset.skills || '[]'),
                description: cardElement.dataset.description || ''
            });
        }
    });

    if (battleDeck.length !== MAX_SELECTED_CARDS) {
        showMessage('卡牌数据错误，请重新选择卡牌', 'error');
        return;
    }
    
    localStorage.setItem('battleDeck', JSON.stringify(battleDeck));
    window.location.href = '/battle';
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
    selectedCards = [...deck.cards];
    updateSelectedCardsDisplay();
    showMessage(`已选择牌组：${deck.name}`, 'success');
}

// 更新选中的卡牌显示
function updateSelectedCardsDisplay() {
    const selectedCardsContainer = document.getElementById('selectedCards');
    const startBattleBtn = document.getElementById('startBattleBtn');
    
    selectedCardsContainer.innerHTML = '';
    
    if (selectedCards.length === 0) {
        startBattleBtn.disabled = true;
        return;
    }
    
    fetch('/api/cards')
        .then(response => response.json())
        .then(data => {
            selectedCards.forEach(cardId => {
                const card = data.cards.find(c => c.id.toString() === cardId);
                if (card) {
                    const cardElement = createCardElement(card);
                    cardElement.classList.add('in-deck');
                    selectedCardsContainer.appendChild(cardElement);
                }
            });
            
            startBattleBtn.disabled = selectedCards.length !== MAX_SELECTED_CARDS;
        });
} 