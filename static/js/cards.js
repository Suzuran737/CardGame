// 全局变量
let currentCards = [];
let isDeleteMode = false;
let cardToDelete = null;
let cardToEdit = null;

// 为效果类型选择器添加事件监听
function setupEffectTypeListener(effectTypeSelect) {
    if (!effectTypeSelect) return;
    
    effectTypeSelect.addEventListener('change', () => {
        const skillInput = effectTypeSelect.closest('.skill-input');
        if (!skillInput) return;
        
        const effectDetails = skillInput.querySelector('.effect-details');
        const damageOptions = skillInput.querySelector('.effect-damage-options');
        const healOptions = skillInput.querySelector('.effect-heal-options');
        const buffOptions = skillInput.querySelector('.effect-buff-options');
        const debuffOptions = skillInput.querySelector('.effect-debuff-options');

        if (!effectDetails || !damageOptions || !healOptions || !buffOptions || !debuffOptions) return;

        effectDetails.style.display = 'block';
        damageOptions.classList.remove('active');
        healOptions.classList.remove('active');
        buffOptions.classList.remove('active');
        debuffOptions.classList.remove('active');

        switch (effectTypeSelect.value) {
            case 'damage':
                damageOptions.classList.add('active');
                break;
            case 'heal':
                healOptions.classList.add('active');
                break;
            case 'buff':
                buffOptions.classList.add('active');
                break;
            case 'debuff':
                debuffOptions.classList.add('active');
                break;
            default:
                effectDetails.style.display = 'none';
        }
    });
}

// 创建技能输入框
function createSkillInput() {
    const skillDiv = document.createElement('div');
    skillDiv.className = 'skill-input';
    skillDiv.innerHTML = `
        <input type="text" placeholder="技能名称" class="skill-name" required>
        <input type="number" placeholder="消耗能量" class="skill-cost" min="0" required>
        <textarea placeholder="技能描述" class="skill-description" required></textarea>
        
        <div class="skill-effect">
            <div class="effect-group">
                <label>伤害倍率 <span class="tooltip-icon" data-tooltip="技能的基础伤害倍率，必须大于0">?</span></label>
                <input type="number" class="effect-damage" min="0" step="0.1" placeholder="例如：1.8">
            </div>
            
            <div class="effect-group">
                <label>效果类型 <span class="tooltip-icon" data-tooltip="选择技能的效果类型">?</span></label>
                <select class="effect-type">
                    <option value="">选择效果类型</option>
                    <option value="damage">伤害</option>
                    <option value="heal">治疗</option>
                    <option value="buff">增益</option>
                    <option value="debuff">减益</option>
                </select>
            </div>

            <div class="effect-details" style="display: none;">
                <!-- 伤害效果 -->
                <div class="effect-damage-options">
                    <div class="effect-group">
                        <label>是否AOE <span class="tooltip-icon" data-tooltip="是否对全体目标造成伤害">?</span></label>
                        <input type="checkbox" class="effect-aoe">
                    </div>
                    <div class="effect-group">
                        <label>暴击率加成 <span class="tooltip-icon" data-tooltip="额外增加的暴击率，范围0-100">?</span></label>
                        <input type="number" class="effect-crit-rate" min="0" max="100" placeholder="0-100">
                    </div>
                    <div class="effect-group">
                        <label>无视防御 <span class="tooltip-icon" data-tooltip="无视目标防御力的百分比，范围0-100">?</span></label>
                        <input type="number" class="effect-ignore-def" min="0" max="100" placeholder="0-100">
                    </div>
                </div>

                <!-- 治疗效果 -->
                <div class="effect-heal-options">
                    <div class="effect-group">
                        <label>治疗量 <span class="tooltip-icon" data-tooltip="技能的治疗量，必须大于0">?</span></label>
                        <input type="number" class="effect-heal" min="0" step="0.1" placeholder="例如：5">
                    </div>
                    <div class="effect-group">
                        <label>是否AOE <span class="tooltip-icon" data-tooltip="是否对全体目标进行治疗">?</span></label>
                        <input type="checkbox" class="effect-heal-aoe">
                    </div>
                </div>

                <!-- 增益效果 -->
                <div class="effect-buff-options">
                    <div class="effect-group">
                        <label>增益类型 <span class="tooltip-icon" data-tooltip="选择要提升的属性">?</span></label>
                        <select class="buff-type">
                            <option value="defense">防御力</option>
                            <option value="dodge_rate">闪避率</option>
                            <option value="energy">能量</option>
                            <option value="reflect_damage">伤害反弹</option>
                        </select>
                    </div>
                    <div class="effect-group">
                        <label>增益值 <span class="tooltip-icon" data-tooltip="增益效果的数值">?</span></label>
                        <input type="number" class="buff-value" placeholder="数值">
                    </div>
                    <div class="effect-group">
                        <label>持续回合 <span class="tooltip-icon" data-tooltip="增益效果持续的回合数">?</span></label>
                        <input type="number" class="buff-duration" min="1" placeholder="回合数">
                    </div>
                    <div class="effect-group">
                        <label>是否AOE <span class="tooltip-icon" data-tooltip="是否对全体目标施加增益">?</span></label>
                        <input type="checkbox" class="buff-aoe">
                    </div>
                </div>

                <!-- 减益效果 -->
                <div class="effect-debuff-options">
                    <div class="effect-group">
                        <label>减益类型 <span class="tooltip-icon" data-tooltip="选择要降低的属性">?</span></label>
                        <select class="debuff-type">
                            <option value="speed">速度</option>
                            <option value="damage">持续伤害</option>
                            <option value="confusion">混乱</option>
                        </select>
                    </div>
                    <div class="effect-group">
                        <label>减益值 <span class="tooltip-icon" data-tooltip="减益效果的数值">?</span></label>
                        <input type="number" class="debuff-value" placeholder="数值">
                    </div>
                    <div class="effect-group">
                        <label>持续回合 <span class="tooltip-icon" data-tooltip="减益效果持续的回合数">?</span></label>
                        <input type="number" class="debuff-duration" min="1" placeholder="回合数">
                    </div>
                    <div class="effect-group">
                        <label>触发概率 <span class="tooltip-icon" data-tooltip="减益效果触发的概率，范围0-100">?</span></label>
                        <input type="number" class="debuff-probability" min="0" max="100" placeholder="0-100">
                    </div>
                    <div class="effect-group">
                        <label>是否AOE <span class="tooltip-icon" data-tooltip="是否对全体目标施加减益">?</span></label>
                        <input type="checkbox" class="debuff-aoe">
                    </div>
                </div>
            </div>
        </div>
        <button type="button" class="btn danger remove-skill">删除技能</button>
    `;

    // 为效果类型选择器添加事件监听
    const effectTypeSelect = skillDiv.querySelector('.effect-type');
    setupEffectTypeListener(effectTypeSelect);

    // 为删除技能按钮添加事件监听
    const removeSkillBtn = skillDiv.querySelector('.remove-skill');
    removeSkillBtn.addEventListener('click', () => {
        skillDiv.remove();
    });

    return skillDiv;
}

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    loadCards();
    setupEventListeners();
    
    // 为初始技能输入框添加效果类型选择器事件
    const initialEffectTypeSelect = document.querySelector('.effect-type');
    setupEffectTypeListener(initialEffectTypeSelect);
});

// 设置事件监听器
function setupEventListeners() {
    // 获取所有需要的元素
    const editBtn = document.getElementById('editBtn');
    const addCardBtn = document.getElementById('addCardBtn');
    const deleteCardBtn = document.getElementById('deleteCardBtn');
    const editCardBtn = document.getElementById('editCardBtn');
    const searchCardBtn = document.getElementById('searchCardBtn');
    const dropdownContent = document.querySelector('.dropdown-content');
    const cardModal = document.getElementById('cardModal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');
    const cardForm = document.getElementById('cardForm');
    const addSkillBtn = document.getElementById('addSkillBtn');

    // 编辑按钮点击事件
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        });
    }

    // 添加卡牌按钮点击事件
    if (addCardBtn) {
        addCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.style.display = 'none';
            document.getElementById('modalTitle').textContent = '添加新卡牌';
            resetForm();
            cardModal.style.display = 'block';
        });
    }

    // 删除卡牌按钮点击事件
    if (deleteCardBtn) {
        deleteCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.style.display = 'none';
            isDeleteMode = !isDeleteMode;
            toggleDeleteButtons();
        });
    }

    // 修改卡牌按钮点击事件
    if (editCardBtn) {
        editCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.style.display = 'none';
            if (!cardToEdit) {
                showMessage('请先选择要修改的卡牌', 'warning');
                return;
            }
            document.getElementById('modalTitle').textContent = '修改卡牌';
            fillFormWithCardData(cardToEdit);
            cardModal.style.display = 'block';
        });
    }

    // 关闭按钮点击事件
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            cardModal.style.display = 'none';
        });
    }

    // 取消按钮点击事件
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            cardModal.style.display = 'none';
        });
    }

    // 表单提交事件
    if (cardForm) {
        cardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const cardData = getFormData();
                if (cardToEdit) {
                    await updateCard(cardData);
                } else {
                    await addCard(cardData);
                }
                cardModal.style.display = 'none';
            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
    }

    // 添加技能按钮点击事件
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', () => {
            const skillsContainer = document.getElementById('skillsContainer');
            const newSkill = createSkillInput();
            skillsContainer.appendChild(newSkill);
        });
    }

    // 点击页面其他地方时隐藏下拉菜单
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.edit-dropdown')) {
            dropdownContent.style.display = 'none';
        }
    });

    // 确认删除按钮点击事件
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (cardToDelete) {
                await deleteCard(cardToDelete);
                document.getElementById('confirmModal').style.display = 'none';
                cardToDelete = null;
            }
        });
    }

    // 取消删除按钮点击事件
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('confirmModal').style.display = 'none';
            cardToDelete = null;
        });
    }

    // 搜索卡牌按钮点击事件
    if (searchCardBtn) {
        searchCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.style.display = 'none';
            document.getElementById('searchModal').style.display = 'block';
        });
    }

    // 搜索按钮点击事件
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchTerm = document.getElementById('searchInput').value.trim();
            if (searchTerm) {
                searchCards(searchTerm);
                document.getElementById('searchModal').style.display = 'none';
            } else {
                showMessage('请输入搜索内容', 'warning');
            }
        });
    }

    // 取消搜索按钮点击事件
    const cancelSearchBtn = document.getElementById('cancelSearchBtn');
    if (cancelSearchBtn) {
        cancelSearchBtn.addEventListener('click', () => {
            document.getElementById('searchModal').style.display = 'none';
        });
    }

    // 搜索模态框关闭按钮点击事件
    const searchModalClose = document.querySelector('#searchModal .close');
    if (searchModalClose) {
        searchModalClose.addEventListener('click', () => {
            document.getElementById('searchModal').style.display = 'none';
        });
    }
}

// 加载卡牌
async function loadCards() {
    try {
        const response = await fetch('/api/cards');
        if (!response.ok) throw new Error('加载卡牌失败');
        const data = await response.json();
        currentCards = data.cards || [];
        displayCards(currentCards);
    } catch (error) {
        console.error('加载卡牌失败:', error);
        showMessage('加载卡牌失败: ' + error.message, 'error');
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
function createCardElement(card) {
    const element = document.createElement('div');
    element.className = 'card';
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
        <button class="delete-btn">×</button>
    `;

    // 添加删除按钮事件
    const deleteBtn = element.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isDeleteMode) {
            cardToDelete = card;
            document.getElementById('confirmModal').style.display = 'block';
        }
    });

    // 添加点击事件用于编辑
    element.addEventListener('click', () => {
        if (!isDeleteMode) {
            cardToEdit = card;
        }
    });

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

    // 添加窗口滚动事件
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

// 切换删除按钮显示
function toggleDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
        btn.style.display = isDeleteMode ? 'flex' : 'none';
    });
}

// 重置表单
function resetForm() {
    const form = document.getElementById('cardForm');
    form.reset();
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = '';
    cardToEdit = null;
    
    // 重新添加一个技能输入框
    const skillInput = createSkillInput();
    skillsContainer.appendChild(skillInput);
}

// 填充表单数据
function fillFormWithCardData(card) {
    document.getElementById('cardName').value = card.name;
    document.getElementById('cardElement').value = card.element;
    document.getElementById('hp').value = card.stats.HP;
    document.getElementById('atk').value = card.stats.ATK;
    document.getElementById('spd').value = card.stats.SPD;
    document.getElementById('def').value = card.stats.DEF;
    document.getElementById('cri').value = card.stats.CRI;
    document.getElementById('nrg').value = card.stats.NRG;
    
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = '';
    
    card.skills.forEach(skill => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-input';
        skillDiv.innerHTML = `
            <input type="text" placeholder="技能名称" class="skill-name" value="${skill.name}" required>
            <input type="number" placeholder="消耗能量" class="skill-cost" value="${skill.cost}" min="0" required>
            <textarea placeholder="技能描述" class="skill-description" required>${skill.description}</textarea>
            
            <div class="skill-effect">
                <div class="effect-group">
                    <label>伤害倍率</label>
                    <input type="number" class="effect-damage" min="0" step="0.1" placeholder="例如：1.8" value="${skill.effect.damage || ''}">
                </div>
                
                <div class="effect-group">
                    <label>效果类型</label>
                    <select class="effect-type">
                        <option value="">选择效果类型</option>
                        <option value="damage" ${skill.effect.damage ? 'selected' : ''}>伤害</option>
                        <option value="heal" ${skill.effect.heal ? 'selected' : ''}>治疗</option>
                        <option value="buff" ${skill.effect.buff ? 'selected' : ''}>增益</option>
                        <option value="debuff" ${skill.effect.debuff ? 'selected' : ''}>减益</option>
                    </select>
                </div>

                <div class="effect-details" style="display: ${skill.effect ? 'block' : 'none'}">
                    <!-- 伤害效果 -->
                    <div class="effect-damage-options ${skill.effect.damage ? 'active' : ''}">
                        <div class="effect-group">
                            <label>是否AOE</label>
                            <input type="checkbox" class="effect-aoe" ${skill.effect.aoe ? 'checked' : ''}>
                        </div>
                        <div class="effect-group">
                            <label>暴击率加成</label>
                            <input type="number" class="effect-crit-rate" min="0" max="100" placeholder="0-100" value="${skill.effect.crit_rate || ''}">
                        </div>
                        <div class="effect-group">
                            <label>无视防御</label>
                            <input type="number" class="effect-ignore-def" min="0" max="100" placeholder="0-100" value="${skill.effect.ignore_def || ''}">
                        </div>
                    </div>

                    <!-- 治疗效果 -->
                    <div class="effect-heal-options ${skill.effect.heal ? 'active' : ''}">
                        <div class="effect-group">
                            <label>治疗量</label>
                            <input type="number" class="effect-heal" min="0" step="0.1" placeholder="例如：5" value="${skill.effect.heal || ''}">
                        </div>
                        <div class="effect-group">
                            <label>是否AOE</label>
                            <input type="checkbox" class="effect-heal-aoe" ${skill.effect.aoe ? 'checked' : ''}>
                        </div>
                    </div>

                    <!-- 增益效果 -->
                    <div class="effect-buff-options ${skill.effect.buff ? 'active' : ''}">
                        <div class="effect-group">
                            <label>增益类型</label>
                            <select class="buff-type">
                                <option value="defense" ${skill.effect.buff?.defense ? 'selected' : ''}>防御力</option>
                                <option value="dodge_rate" ${skill.effect.buff?.dodge_rate ? 'selected' : ''}>闪避率</option>
                                <option value="energy" ${skill.effect.buff?.energy ? 'selected' : ''}>能量</option>
                                <option value="reflect_damage" ${skill.effect.buff?.reflect_damage ? 'selected' : ''}>伤害反弹</option>
                            </select>
                        </div>
                        <div class="effect-group">
                            <label>增益值</label>
                            <input type="number" class="buff-value" placeholder="数值" value="${skill.effect.buff ? Object.values(skill.effect.buff)[0] : ''}">
                        </div>
                        <div class="effect-group">
                            <label>持续回合</label>
                            <input type="number" class="buff-duration" min="1" placeholder="回合数" value="${skill.effect.buff?.duration || ''}">
                        </div>
                        <div class="effect-group">
                            <label>是否AOE</label>
                            <input type="checkbox" class="buff-aoe" ${skill.effect.aoe ? 'checked' : ''}>
                        </div>
                    </div>

                    <!-- 减益效果 -->
                    <div class="effect-debuff-options ${skill.effect.debuff ? 'active' : ''}">
                        <div class="effect-group">
                            <label>减益类型</label>
                            <select class="debuff-type">
                                <option value="speed" ${skill.effect.debuff?.speed ? 'selected' : ''}>速度</option>
                                <option value="damage" ${skill.effect.debuff?.damage ? 'selected' : ''}>持续伤害</option>
                                <option value="confusion" ${skill.effect.debuff?.confusion ? 'selected' : ''}>混乱</option>
                            </select>
                        </div>
                        <div class="effect-group">
                            <label>减益值</label>
                            <input type="number" class="debuff-value" placeholder="数值" value="${skill.effect.debuff ? Object.values(skill.effect.debuff)[0] : ''}">
                        </div>
                        <div class="effect-group">
                            <label>持续回合</label>
                            <input type="number" class="debuff-duration" min="1" placeholder="回合数" value="${skill.effect.debuff?.duration || ''}">
                        </div>
                        <div class="effect-group">
                            <label>触发概率</label>
                            <input type="number" class="debuff-probability" min="0" max="100" placeholder="0-100" value="${skill.effect.debuff?.probability || ''}">
                        </div>
                        <div class="effect-group">
                            <label>是否AOE</label>
                            <input type="checkbox" class="debuff-aoe" ${skill.effect.aoe ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
            </div>
            <button type="button" class="btn danger remove-skill">删除技能</button>
        `;
        skillsContainer.appendChild(skillDiv);

        // 为删除技能按钮添加事件
        skillDiv.querySelector('.remove-skill').addEventListener('click', () => {
            skillDiv.remove();
        });

        // 为效果类型选择器添加事件
        const effectTypeSelect = skillDiv.querySelector('.effect-type');
        setupEffectTypeListener(effectTypeSelect);
    });
}

// 获取表单数据并验证
function getFormData() {
    // 获取并验证基本信息
    const name = document.getElementById('cardName').value.trim();
    if (!name) {
        throw new Error('卡牌名称不能为空');
    }
    if (name.length > 8) {
        throw new Error('卡牌名称不能超过8个字符');
    }

    const element = document.getElementById('cardElement').value;
    if (!element) {
        throw new Error('请选择元素类型');
    }

    // 获取并验证属性值
    const stats = {
        HP: parseInt(document.getElementById('hp').value),
        ATK: parseInt(document.getElementById('atk').value),
        SPD: parseInt(document.getElementById('spd').value),
        DEF: parseInt(document.getElementById('def').value),
        CRI: parseInt(document.getElementById('cri').value),
        NRG: parseInt(document.getElementById('nrg').value)
    };

    // 验证属性值范围
    const validations = {
        HP: { min: 1, max: 30, name: '生命值' },
        ATK: { min: 0, max: 15, name: '攻击力' },
        SPD: { min: 1, max: 15, name: '速度' },
        DEF: { min: 0, max: 10, name: '防御力' },
        CRI: { min: 0, max: 100, name: '暴击率' },
        NRG: { min: 0, max: 5, name: '初始能量' }
    };

    for (const [stat, value] of Object.entries(stats)) {
        if (isNaN(value)) {
            throw new Error(`${validations[stat].name}必须是数字`);
        }
        if (value < validations[stat].min || value > validations[stat].max) {
            throw new Error(`${validations[stat].name}必须在${validations[stat].min}到${validations[stat].max}之间`);
        }
    }

    // 获取并验证技能
    const skills = [];
    const skillInputs = document.querySelectorAll('.skill-input');
    if (skillInputs.length === 0) {
        throw new Error('至少需要添加一个技能');
    }
    if (skillInputs.length > 3) {
        throw new Error('最多只能添加三个技能');
    }

    skillInputs.forEach((skillDiv, index) => {
        const skillName = skillDiv.querySelector('.skill-name').value.trim();
        const skillCost = parseInt(skillDiv.querySelector('.skill-cost').value);
        const skillDescription = skillDiv.querySelector('.skill-description').value.trim();
        const effectType = skillDiv.querySelector('.effect-type').value;
        const effectDamage = parseFloat(skillDiv.querySelector('.effect-damage').value);

        // 验证基本技能信息
        if (!skillName) {
            throw new Error(`技能${index + 1}的名称不能为空`);
        }
        if (skillName.length > 6) {
            throw new Error(`技能名称不能超过6个字符`);
        }
        if (isNaN(skillCost) || skillCost < 0 || skillCost > 10) {
            throw new Error(`技能${index + 1}的消耗能量必须在0到10之间`);
        }
        if (!skillDescription) {
            throw new Error(`技能${index + 1}的描述不能为空`);
        }
        if (skillDescription.length > 50) {
            throw new Error(`技能描述不能超过50个字符`);
        }

        // 验证效果数据
        if (!effectType) {
            throw new Error(`技能${index + 1}必须选择效果类型`);
        }

        // 构建效果对象
        const effect = {};
        if (effectType === 'damage') {
            if (isNaN(effectDamage) || effectDamage <= 0) {
                throw new Error(`技能${index + 1}的伤害倍率必须大于0`);
            }
            effect.damage = effectDamage;
            
            const isAOE = skillDiv.querySelector('.effect-aoe').checked;
            if (isAOE) effect.aoe = true;
            
            const critRate = parseInt(skillDiv.querySelector('.effect-crit-rate').value);
            if (critRate) {
                if (critRate < 0 || critRate > 100) {
                    throw new Error(`技能${index + 1}的暴击率加成必须在0到100之间`);
                }
                effect.crit_rate = critRate;
            }
            
            const ignoreDef = parseInt(skillDiv.querySelector('.effect-ignore-def').value);
            if (ignoreDef) {
                if (ignoreDef < 0 || ignoreDef > 100) {
                    throw new Error(`技能${index + 1}的无视防御必须在0到100之间`);
                }
                effect.ignore_def = ignoreDef;
            }
        } else if (effectType === 'heal') {
            const healValue = parseFloat(skillDiv.querySelector('.effect-heal').value);
            const isAOE = skillDiv.querySelector('.effect-heal-aoe').checked;
            
            if (isNaN(healValue) || healValue <= 0) {
                throw new Error(`技能${index + 1}的治疗量必须大于0`);
            }
            
            effect.heal = healValue;
            if (isAOE) effect.aoe = true;
        } else if (effectType === 'buff') {
            const buffType = skillDiv.querySelector('.buff-type').value;
            const buffValue = parseInt(skillDiv.querySelector('.buff-value').value);
            const buffDuration = parseInt(skillDiv.querySelector('.buff-duration').value);
            const isAOE = skillDiv.querySelector('.buff-aoe').checked;
            
            if (isNaN(buffValue)) {
                throw new Error(`技能${index + 1}的增益值不能为空`);
            }
            if (isNaN(buffDuration) || buffDuration < 1) {
                throw new Error(`技能${index + 1}的持续回合必须大于0`);
            }
            
            effect.buff = {
                [buffType]: buffValue,
                duration: buffDuration
            };
            if (isAOE) effect.aoe = true;
        } else if (effectType === 'debuff') {
            const debuffType = skillDiv.querySelector('.debuff-type').value;
            const debuffValue = parseInt(skillDiv.querySelector('.debuff-value').value);
            const debuffDuration = parseInt(skillDiv.querySelector('.debuff-duration').value);
            const debuffProbability = parseInt(skillDiv.querySelector('.debuff-probability').value);
            const isAOE = skillDiv.querySelector('.debuff-aoe').checked;
            
            if (isNaN(debuffValue)) {
                throw new Error(`技能${index + 1}的减益值不能为空`);
            }
            if (isNaN(debuffDuration) || debuffDuration < 1) {
                throw new Error(`技能${index + 1}的持续回合必须大于0`);
            }
            if (isNaN(debuffProbability) || debuffProbability < 0 || debuffProbability > 100) {
                throw new Error(`技能${index + 1}的触发概率必须在0到100之间`);
            }
            
            effect.debuff = {
                [debuffType]: debuffValue,
                duration: debuffDuration,
                probability: debuffProbability
            };
            if (isAOE) effect.aoe = true;
        }

        skills.push({
            name: skillName,
            cost: skillCost,
            description: skillDescription,
            effect: effect
        });
    });

    // 构建返回的数据对象
    const cardData = {
        name: name,
        element: element,
        stats: stats,
        skills: skills
    };

    // 如果是编辑模式，添加ID
    if (cardToEdit) {
        cardData.id = cardToEdit.id;
    }

    return cardData;
}

// 添加卡牌
async function addCard(cardData) {
    try {
        const response = await fetch('/api/cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cardData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '添加卡牌失败');
        }
        
        await loadCards();
        showMessage('卡牌添加成功', 'success');
    } catch (error) {
        console.error('添加卡牌失败:', error);
        showMessage('添加卡牌失败: ' + error.message, 'error');
    }
}

// 更新卡牌
async function updateCard(cardData) {
    try {
        if (!cardData.id) {
            throw new Error('卡牌ID不能为空');
        }

        const response = await fetch(`/api/cards/${cardData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cardData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '更新卡牌失败');
        }
        
        const data = await response.json();
        if (data.success) {
            showMessage('卡牌更新成功', 'success');
            return true;
        } else {
            showMessage(data.error || '更新卡牌失败', 'error');
            return false;
        }
    } catch (error) {
        console.error('更新卡牌时出错:', error);
        showMessage('更新卡牌失败: ' + error.message, 'error');
        return false;
    }
}

// 删除卡牌
async function deleteCard(card) {
    try {
        const response = await fetch(`/api/cards/${card.id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('删除卡牌失败');
        
        await loadCards();
        showMessage('卡牌删除成功', 'success');
    } catch (error) {
        console.error('删除卡牌失败:', error);
        showMessage('删除卡牌失败: ' + error.message, 'error');
    }
}

// 搜索卡牌
function searchCards(searchTerm) {
    const filteredCards = currentCards.filter(card => 
        card.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredCards.length === 0) {
        showMessage('未找到匹配的卡牌', 'warning');
    } else {
        displayCards(filteredCards);
        // 高亮显示匹配的文本
        document.querySelectorAll('.card-name').forEach(nameElement => {
            const name = nameElement.textContent;
            if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
                const regex = new RegExp(searchTerm, 'gi');
                nameElement.innerHTML = name.replace(regex, match => 
                    `<span class="highlight">${match}</span>`
                );
            }
        });
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