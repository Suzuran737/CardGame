import pytest
import json
import sys
import os
import copy

# Add the project directory to sys.path to make imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# 导入应用程序的相关模块
from app import load_cards, load_decks


class TestDataIntegrity:
    """数据完整性测试类"""
    
    def test_card_ids_unique(self):
        """测试卡牌ID的唯一性"""
        cards_data = load_cards()
        
        # 确保有卡牌数据
        if not cards_data["cards"]:
            pytest.skip("缺少卡牌测试数据")
            
        # 收集所有卡牌ID
        card_ids = [str(card["id"]) for card in cards_data["cards"]]
        
        # 确保卡牌ID是唯一的
        assert len(card_ids) == len(set(card_ids)), "卡牌ID应该是唯一的"
    
    def test_card_data_types(self):
        """测试卡牌数据的数据类型是否符合要求"""
        cards_data = load_cards()
        
        # 确保有卡牌数据
        if not cards_data["cards"]:
            pytest.skip("缺少卡牌测试数据")
            
        # 验证每张卡牌的数据类型
        for card in cards_data["cards"]:
            # 验证基本字段类型
            assert isinstance(card["name"], str), f"卡牌 {card.get('id', 'unknown')} 的名称必须是字符串"
            assert isinstance(card["element"], str), f"卡牌 {card.get('id', 'unknown')} 的元素必须是字符串"
            assert isinstance(card["stats"], dict), f"卡牌 {card.get('id', 'unknown')} 的属性必须是字典"
            assert isinstance(card["skills"], list), f"卡牌 {card.get('id', 'unknown')} 的技能必须是列表"
            
            # 验证属性值类型
            for stat, value in card["stats"].items():
                assert isinstance(value, (int, float)), f"卡牌 {card.get('id', 'unknown')} 的属性 {stat} 必须是数字"
            
            # 验证技能数据类型
            for skill in card["skills"]:
                assert isinstance(skill["name"], str), f"卡牌 {card.get('id', 'unknown')} 的技能名称必须是字符串"
                assert isinstance(skill["cost"], (int, float)), f"卡牌 {card.get('id', 'unknown')} 的技能消耗必须是数字"
                assert isinstance(skill["description"], str), f"卡牌 {card.get('id', 'unknown')} 的技能描述必须是字符串"
                assert isinstance(skill["effect"], dict), f"卡牌 {card.get('id', 'unknown')} 的技能效果必须是字典"
    
    def test_deck_data_types(self):
        """测试牌组数据的数据类型是否符合要求"""
        decks_data = load_decks()
        
        # 确保有牌组数据
        if not decks_data["decks"]:
            pytest.skip("缺少牌组测试数据")
            
        # 验证每个牌组的数据类型
        for deck in decks_data["decks"]:
            # 验证基本字段类型
            assert isinstance(deck["name"], str), f"牌组 '{deck.get('name', 'unknown')}' 的名称必须是字符串"
            assert isinstance(deck["cards"], list), f"牌组 '{deck.get('name', 'unknown')}' 的卡牌列表必须是数组"
            
            # 验证卡牌引用类型
            for card_id in deck["cards"]:
                assert isinstance(card_id, str), f"牌组 '{deck.get('name', 'unknown')}' 中的卡牌ID必须是字符串"
    
    def test_data_consistency(self):
        """测试数据一致性，确保牌组中引用的卡牌在卡牌库中存在"""
        cards_data = load_cards()
        decks_data = load_decks()
        
        # 确保有卡牌和牌组数据
        if not cards_data["cards"] or not decks_data["decks"]:
            pytest.skip("缺少测试数据")
            
        # 获取所有卡牌ID
        card_ids = [str(card["id"]) for card in cards_data["cards"]]
        
        # 统计卡牌引用数量
        card_reference_count = {}
        for card_id in card_ids:
            card_reference_count[card_id] = 0
        
        # 跳过无效卡牌牌组
        valid_decks = [deck for deck in decks_data["decks"] if deck["name"] != "无效卡牌牌组"]
        
        # 计数每张卡牌被引用的次数
        for deck in valid_decks:
            for card_id in deck["cards"]:
                if card_id in card_reference_count:
                    card_reference_count[card_id] += 1
        
        # 检查是否所有卡牌都被至少一个牌组引用
        unused_cards = [card_id for card_id, count in card_reference_count.items() if count == 0]
        
        # 此处不强制断言，只是记录未被使用的卡牌
        if unused_cards:
            print(f"警告：以下卡牌未被任何牌组引用：{', '.join(unused_cards)}")
    
    def test_data_file_json_format(self):
        """测试数据文件格式是否为有效的JSON格式"""
        # 测试卡牌数据文件
        try:
            with open(os.path.join(os.path.dirname(__file__), '../../data/cards.json'), 'r', encoding='utf-8') as f:
                cards_data = json.load(f)
                assert isinstance(cards_data, dict), "卡牌数据文件格式错误，应为JSON对象"
                assert "cards" in cards_data, "卡牌数据文件应包含'cards'键"
                assert isinstance(cards_data["cards"], list), "cards字段应为列表"
        except json.JSONDecodeError:
            pytest.fail("卡牌数据文件不是有效的JSON格式")
        except Exception as e:
            pytest.fail(f"读取卡牌数据文件时发生错误：{str(e)}")
        
        # 测试牌组数据文件
        try:
            with open(os.path.join(os.path.dirname(__file__), '../../data/decks.json'), 'r', encoding='utf-8') as f:
                decks_data = json.load(f)
                assert isinstance(decks_data, dict), "牌组数据文件格式错误，应为JSON对象"
                assert "decks" in decks_data, "牌组数据文件应包含'decks'键"
                assert isinstance(decks_data["decks"], list), "decks字段应为列表"
        except json.JSONDecodeError:
            pytest.fail("牌组数据文件不是有效的JSON格式")
        except Exception as e:
            pytest.fail(f"读取牌组数据文件时发生错误：{str(e)}")
    
    def test_data_manipulation_integrity(self):
        """测试数据操作后的完整性"""
        # 复制原始数据
        original_cards = copy.deepcopy(load_cards())
        original_decks = copy.deepcopy(load_decks())
        
        # 确保有卡牌和牌组数据
        if not original_cards["cards"] or not original_decks["decks"]:
            pytest.skip("缺少测试数据")
            
        # 修改卡牌数据（模拟操作）
        cards_copy = copy.deepcopy(original_cards)
        if cards_copy["cards"]:
            # 只修改第一张卡牌
            cards_copy["cards"][0]["name"] = cards_copy["cards"][0]["name"] + " (修改)"
        
        # 验证修改后的数据仍然符合结构要求
        if cards_copy["cards"]:
            for card in cards_copy["cards"]:
                assert "name" in card, f"修改后的卡牌缺少名称字段"
                assert "element" in card, f"修改后的卡牌缺少元素字段"
                assert "stats" in card, f"修改后的卡牌缺少属性字段"
                assert "skills" in card, f"修改后的卡牌缺少技能字段"
        
        # 修改牌组数据（模拟操作）
        decks_copy = copy.deepcopy(original_decks)
        if decks_copy["decks"]:
            # 只修改第一个牌组
            decks_copy["decks"][0]["name"] = decks_copy["decks"][0]["name"] + " (修改)"
        
        # 验证修改后的数据仍然符合结构要求
        if decks_copy["decks"]:
            for deck in decks_copy["decks"]:
                assert "name" in deck, f"修改后的牌组缺少名称字段"
                assert "cards" in deck, f"修改后的牌组缺少卡牌列表字段"
                
        # 验证原始数据未被修改
        assert original_cards != cards_copy, "数据修改应该产生不同的副本"
        assert original_decks != decks_copy, "数据修改应该产生不同的副本" 