import pytest
import json
import sys
import os
from unittest.mock import MagicMock, patch

# Add the project directory to sys.path to make imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# 导入应用程序的相关模块
from app import validate_card_data, load_cards


class TestCardModel:
    """卡牌数据模型测试类"""
    
    @pytest.fixture
    def valid_card_data(self):
        """返回一个有效的卡牌数据字典"""
        return {
            "id": 1,
            "name": "测试卡牌",
            "element": "火",
            "stats": {
                "ATK": 10,
                "HP": 20,
                "DEF": 5,
                "SPD": 8,
                "CRI": 15,
                "NRG": 2
            },
            "skills": [
                {
                    "name": "测试技能",
                    "cost": 2,
                    "description": "测试技能描述",
                    "effect": {
                        "damage": 1.5
                    }
                }
            ]
        }
    
    def test_card_model_validation(self, valid_card_data):
        """测试有效的卡牌数据模型验证"""
        is_valid, _ = validate_card_data(valid_card_data)
        assert is_valid is True
    
    def test_card_required_fields(self):
        """测试卡牌必需字段缺失时的验证"""
        missing_name = {
            "element": "火",
            "stats": {
                "ATK": 10,
                "HP": 20,
                "DEF": 5,
                "SPD": 8,
                "CRI": 15,
                "NRG": 2
            },
            "skills": []
        }
        is_valid, error_msg = validate_card_data(missing_name)
        assert is_valid is False
        assert "缺少必要字段" in error_msg
        
        missing_element = {
            "name": "测试卡牌",
            "stats": {
                "ATK": 10,
                "HP": 20,
                "DEF": 5,
                "SPD": 8,
                "CRI": 15,
                "NRG": 2
            },
            "skills": []
        }
        is_valid, error_msg = validate_card_data(missing_element)
        assert is_valid is False
        assert "缺少必要字段" in error_msg
        
        missing_stats = {
            "name": "测试卡牌",
            "element": "火",
            "skills": []
        }
        is_valid, error_msg = validate_card_data(missing_stats)
        assert is_valid is False
        assert "缺少必要字段" in error_msg
        
        missing_skills = {
            "name": "测试卡牌",
            "element": "火",
            "stats": {
                "ATK": 10,
                "HP": 20,
                "DEF": 5,
                "SPD": 8,
                "CRI": 15,
                "NRG": 2
            }
        }
        is_valid, error_msg = validate_card_data(missing_skills)
        assert is_valid is False
        assert "缺少必要字段" in error_msg
    
    def test_card_stats_validation(self, valid_card_data):
        """测试卡牌属性值验证"""
        # 缺少ATK属性
        card_data = dict(valid_card_data)
        card_data["stats"] = {
            "HP": 20,
            "DEF": 5,
            "SPD": 8,
            "CRI": 15,
            "NRG": 2
        }
        is_valid, error_msg = validate_card_data(card_data)
        assert is_valid is False
        assert "缺少必要的属性值" in error_msg
        
        # 缺少HP属性
        card_data = dict(valid_card_data)
        card_data["stats"] = {
            "ATK": 10,
            "DEF": 5,
            "SPD": 8,
            "CRI": 15,
            "NRG": 2
        }
        is_valid, error_msg = validate_card_data(card_data)
        assert is_valid is False
        assert "缺少必要的属性值" in error_msg
        
        # 缺少多个属性
        card_data = dict(valid_card_data)
        card_data["stats"] = {
            "ATK": 10,
            "HP": 20
        }
        is_valid, error_msg = validate_card_data(card_data)
        assert is_valid is False
        assert "缺少必要的属性值" in error_msg
    
    def test_card_skills_validation(self, valid_card_data):
        """测试卡牌技能验证"""
        # 技能不是列表
        card_data = dict(valid_card_data)
        card_data["skills"] = {"name": "错误技能"}
        is_valid, error_msg = validate_card_data(card_data)
        assert is_valid is False
        assert "技能必须是列表" in error_msg
        
        # 技能列表为空是有效的
        card_data = dict(valid_card_data)
        card_data["skills"] = []
        is_valid, error_msg = validate_card_data(card_data)
        assert is_valid is True
        
        # 技能数据不完整
        card_data = dict(valid_card_data)
        card_data["skills"] = [{
            "name": "不完整技能",
            "cost": 1
            # 缺少description和effect
        }]
        is_valid, error_msg = validate_card_data(card_data)
        assert is_valid is False
        assert "技能数据不完整" in error_msg
        
        # 多个技能，其中一个不完整
        card_data = dict(valid_card_data)
        card_data["skills"] = [
            {
                "name": "完整技能",
                "cost": 1,
                "description": "完整技能描述",
                "effect": {"damage": 1}
            },
            {
                "name": "不完整技能",
                "description": "不完整技能描述"
                # 缺少cost和effect
            }
        ]
        is_valid, error_msg = validate_card_data(card_data)
        assert is_valid is False
        assert "技能数据不完整" in error_msg
    
    def test_card_element_validation(self, valid_card_data):
        """测试卡牌元素类型"""
        valid_elements = ["火", "水", "风", "土", "光", "暗"]
        
        for element in valid_elements:
            card_data = dict(valid_card_data)
            card_data["element"] = element
            is_valid, _ = validate_card_data(card_data)
            assert is_valid is True
        
        # 元素字段存在但不在有效范围内仍然是有效的
        # 因为验证函数没有检查元素类型的有效性
        card_data = dict(valid_card_data)
        card_data["element"] = "无效元素"
        is_valid, _ = validate_card_data(card_data)
        assert is_valid is True
        
    def test_card_extended_data(self, valid_card_data):
        """测试卡牌包含额外数据字段的情况"""
        # 添加额外的非必需字段，应该仍然是有效的
        card_data = dict(valid_card_data)
        card_data["description"] = "卡牌的详细描述"
        card_data["rarity"] = "普通"
        card_data["tags"] = ["战士", "近战"]
        
        is_valid, _ = validate_card_data(card_data)
        assert is_valid is True
        
    def test_loaded_cards_structure(self):
        """测试加载的卡牌数据结构"""
        cards_data = load_cards()
        
        # 验证返回的是一个字典
        assert isinstance(cards_data, dict), "加载的卡牌数据应该是一个字典"
        
        # 验证包含cards键
        assert "cards" in cards_data, "卡牌数据应包含'cards'键"
        
        # 验证cards是一个列表
        assert isinstance(cards_data["cards"], list), "cards字段应该是一个列表"
        
        # 如果有卡牌数据，验证每个卡牌格式正确
        if cards_data["cards"]:
            for card in cards_data["cards"]:
                # 验证卡牌是否含有必要的字段
                assert "name" in card, "卡牌应包含名称"
                assert "element" in card, "卡牌应包含元素"
                assert "stats" in card, "卡牌应包含属性"
                assert "skills" in card, "卡牌应包含技能" 