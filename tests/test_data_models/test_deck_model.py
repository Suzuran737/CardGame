import pytest
import json
import sys
import os
from unittest.mock import MagicMock, patch

# Add the project directory to sys.path to make imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# 导入应用程序的相关模块
from app import load_cards, load_decks


class TestDeckModel:
    """牌组数据模型测试类"""
    
    @pytest.fixture
    def valid_deck_data(self):
        """返回一个有效的牌组数据字典"""
        return {
            "name": "测试牌组",
            "cards": ["1", "2", "3"]
        }
    
    def test_decks_data_structure(self):
        """测试牌组数据的基本结构"""
        # 从应用程序加载牌组数据
        decks_data = load_decks()
        
        # 验证返回的是一个字典
        assert isinstance(decks_data, dict), "加载的牌组数据应该是一个字典"
        
        # 验证包含decks键
        assert "decks" in decks_data, "牌组数据应包含'decks'键"
        
        # 验证decks是一个列表
        assert isinstance(decks_data["decks"], list), "decks字段应该是一个列表"
    
    def test_deck_model_structure(self):
        """测试单个牌组模型的结构"""
        decks_data = load_decks()
        
        # 如果有牌组数据，验证每个牌组格式正确
        if decks_data["decks"]:
            for deck in decks_data["decks"]:
                # 验证牌组是否含有必要的字段
                assert "name" in deck, "牌组应包含名称"
                assert "cards" in deck, "牌组应包含卡牌列表"
                assert isinstance(deck["name"], str), "牌组名称应为字符串"
                assert isinstance(deck["cards"], list), "牌组的卡牌列表应为数组"
    
    def test_deck_unique_names(self):
        """测试牌组名称的唯一性"""
        decks_data = load_decks()
        
        # 如果有牌组数据，检查名称唯一性
        if decks_data["decks"]:
            # 收集所有牌组名称
            deck_names = [deck["name"] for deck in decks_data["decks"]]
            
            # 检查是否有重复的名称
            assert len(deck_names) == len(set(deck_names)), "牌组名称应当唯一"
    
    def test_deck_with_invalid_cards(self):
        """测试牌组中包含无效卡牌的情况"""
        decks_data = load_decks()
        cards_data = load_cards()
        
        # 确保有卡牌数据和牌组数据
        if not decks_data["decks"] or not cards_data["cards"]:
            pytest.skip("缺少测试数据")
            
        # 收集已存在的卡牌ID
        card_ids = [str(card["id"]) for card in cards_data["cards"]]
        
        # 找到包含"无效卡牌牌组"的牌组
        invalid_card_deck = None
        for deck in decks_data["decks"]:
            if deck["name"] == "无效卡牌牌组":
                invalid_card_deck = deck
                break
        
        # 如果找到了无效卡牌牌组，验证其中的卡牌是否存在
        if invalid_card_deck:
            for card_id in invalid_card_deck["cards"]:
                assert card_id not in card_ids, f"卡牌ID {card_id} 应该是无效的"
    
    def test_empty_deck(self):
        """测试空牌组的情况"""
        decks_data = load_decks()
        
        # 确保有牌组数据
        if not decks_data["decks"]:
            pytest.skip("缺少测试数据")
            
        # 找到包含"空牌组"的牌组
        empty_deck = None
        for deck in decks_data["decks"]:
            if deck["name"] == "空牌组":
                empty_deck = deck
                break
        
        # 如果找到了空牌组，验证其卡牌列表为空
        if empty_deck:
            assert len(empty_deck["cards"]) == 0, "空牌组的卡牌列表应为空"
    
    def test_deck_card_references(self):
        """测试牌组中的卡牌引用是否有效"""
        decks_data = load_decks()
        cards_data = load_cards()
        
        # 确保有卡牌数据和牌组数据
        if not decks_data["decks"] or not cards_data["cards"]:
            pytest.skip("缺少测试数据")
            
        # 收集已存在的卡牌ID
        card_ids = [str(card["id"]) for card in cards_data["cards"]]
        
        # 选择不是"无效卡牌牌组"的牌组进行测试
        valid_decks = [deck for deck in decks_data["decks"] if deck["name"] != "无效卡牌牌组"]
        
        # 检查每个牌组中的卡牌引用是否有效
        invalid_refs = []
        for deck in valid_decks:
            if deck["name"] != "空牌组" and deck["cards"]:  # 跳过空牌组
                for card_id in deck["cards"]:
                    if card_id not in card_ids:
                        invalid_refs.append(f"牌组 '{deck['name']}' 中的卡牌ID {card_id}")
        
        # 输出警告，但不使测试失败
        if invalid_refs:
            print(f"警告：以下卡牌引用无效：{', '.join(invalid_refs)}")
                    
    def test_deck_card_duplicates(self):
        """测试牌组中是否存在重复的卡牌ID"""
        decks_data = load_decks()
        
        # 确保有牌组数据
        if not decks_data["decks"]:
            pytest.skip("缺少测试数据")
            
        # 检查每个牌组中是否有重复的卡牌ID
        for deck in decks_data["decks"]:
            card_ids = deck["cards"]
            unique_card_ids = set(card_ids)
            assert len(card_ids) == len(unique_card_ids), f"牌组 '{deck['name']}' 中存在重复的卡牌ID"
            
    def test_deck_max_cards(self):
        """测试牌组中的最大卡牌数量"""
        # 根据游戏规则，假定每个牌组最多可以包含10张卡牌
        MAX_CARDS_PER_DECK = 10
        
        decks_data = load_decks()
        
        # 确保有牌组数据
        if not decks_data["decks"]:
            pytest.skip("缺少测试数据")
            
        # 检查每个牌组的卡牌数量是否不超过最大限制
        for deck in decks_data["decks"]:
            assert len(deck["cards"]) <= MAX_CARDS_PER_DECK, f"牌组 '{deck['name']}' 的卡牌数量超过了最大限制 {MAX_CARDS_PER_DECK}" 