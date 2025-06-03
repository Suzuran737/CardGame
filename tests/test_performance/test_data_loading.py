import pytest
import time
import json
import os
import tempfile
import shutil
from pathlib import Path
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

def generate_test_cards(num_cards):
    """生成测试卡牌数据"""
    cards = []
    for i in range(num_cards):
        card = {
            "id": i,
            "name": f"测试卡牌 {i}",
            "description": f"这是第 {i} 张测试卡牌的描述",
            "element": "火" if i % 5 == 0 else "水" if i % 5 == 1 else "风" if i % 5 == 2 else "土" if i % 5 == 3 else "光",
            "stats": {
                "ATK": i % 10 + 1,
                "HP": i % 12 + 10,
                "DEF": i % 8 + 1,
                "SPD": i % 6 + 1,
                "CRI": i % 5 + 1,
                "NRG": i % 10 + 1
            },
            "skills": [
                {
                    "name": f"技能1-{i}",
                    "cost": i % 5 + 1,
                    "description": f"技能1的描述 {i}",
                    "effect": "damage"
                },
                {
                    "name": f"技能2-{i}",
                    "cost": i % 3 + 2,
                    "description": f"技能2的描述 {i}",
                    "effect": "heal"
                }
            ],
            "image_url": f"/static/images/card_{i % 10}.png"
        }
        cards.append(card)
    return cards

def generate_test_decks(num_decks, card_ids):
    """生成测试牌组数据"""
    decks = []
    for i in range(num_decks):
        # 每个牌组选择20张卡牌
        deck_cards = []
        for j in range(20):
            card_id = card_ids[min((i * j) % len(card_ids), len(card_ids) - 1)]
            deck_cards.append(card_id)
            
        deck = {
            "id": i,
            "name": f"测试牌组 {i}",
            "cards": deck_cards
        }
        decks.append(deck)
    return decks

@pytest.fixture
def setup_test_files():
    """设置测试文件夹和测试数据文件"""
    # 创建临时目录
    test_dir = tempfile.mkdtemp()
    
    # 生成不同大小的测试数据
    sizes = [10, 100, 500, 1000]
    test_files = {}
    
    for size in sizes:
        # 生成卡牌数据
        cards = generate_test_cards(size)
        card_ids = [card["id"] for card in cards]
        
        # 生成牌组数据（牌组数为卡牌数的1/10）
        decks = generate_test_decks(size // 10, card_ids)
        
        # 保存到临时文件
        cards_file = os.path.join(test_dir, f"cards_{size}.json")
        decks_file = os.path.join(test_dir, f"decks_{size}.json")
        
        with open(cards_file, 'w', encoding='utf-8') as f:
            json.dump({"cards": cards}, f, ensure_ascii=False)
            
        with open(decks_file, 'w', encoding='utf-8') as f:
            json.dump({"decks": decks}, f, ensure_ascii=False)
            
        test_files[size] = {
            "cards_file": cards_file,
            "decks_file": decks_file
        }
    
    yield test_files
    
    # 清理临时目录
    shutil.rmtree(test_dir)

class TestDataLoadingPerformance:
    """数据加载性能测试类"""
    
    def test_load_cards_performance(self, setup_test_files, monkeypatch):
        """测试加载不同大小的卡牌数据性能"""
        from flask import Flask
        from app import load_cards, app
        
        print("\n卡牌数据加载性能测试:")
        print("卡牌数量\t加载时间(秒)")
        print("-" * 30)
        
        for size, files in sorted(setup_test_files.items()):
            cards_file = files["cards_file"]
            
            # 修改应用配置以使用测试文件
            with app.test_request_context():
                monkeypatch.setitem(app.config, 'CARDS_FILE', cards_file)
                
                # 测量加载时间
                start_time = time.time()
                cards = load_cards()
                end_time = time.time()
                
                load_time = end_time - start_time
                print(f"{size}\t\t{load_time:.4f}")
                
                # 验证加载的卡牌数量
                assert len(cards["cards"]) == size, f"应该加载 {size} 张卡牌，但实际加载了 {len(cards['cards'])} 张"
                
                # 验证加载时间在合理范围内
                assert load_time < size / 100 + 0.5, f"加载 {size} 张卡牌太慢: {load_time:.4f} 秒"
    
    def test_load_decks_performance(self, setup_test_files, monkeypatch):
        """测试加载不同大小的牌组数据性能"""
        from flask import Flask
        from app import load_decks, app
        
        print("\n牌组数据加载性能测试:")
        print("牌组数量\t加载时间(秒)")
        print("-" * 30)
        
        for size, files in sorted(setup_test_files.items()):
            decks_file = files["decks_file"]
            deck_count = size // 10
            
            # 修改应用配置以使用测试文件
            with app.test_request_context():
                monkeypatch.setitem(app.config, 'DECKS_FILE', decks_file)
                
                # 测量加载时间
                start_time = time.time()
                decks = load_decks()
                end_time = time.time()
                
                load_time = end_time - start_time
                print(f"{deck_count}\t\t{load_time:.4f}")
                
                # 验证加载的牌组数量
                assert len(decks["decks"]) == deck_count, f"应该加载 {deck_count} 个牌组，但实际加载了 {len(decks['decks'])} 个"
                
                # 验证加载时间在合理范围内
                assert load_time < deck_count / 50 + 0.5, f"加载 {deck_count} 个牌组太慢: {load_time:.4f} 秒"
    
    @pytest.mark.parametrize("size", [100, 500, 1000])
    def test_save_cards_performance(self, setup_test_files, size, tmp_path, monkeypatch):
        """测试保存不同大小的卡牌数据性能"""
        from app import save_cards, app
        
        # 获取测试卡牌数据
        cards_file = setup_test_files[size]["cards_file"]
        with open(cards_file, 'r', encoding='utf-8') as f:
            cards_data = json.load(f)
        
        # 创建临时输出文件
        output_file = os.path.join(tmp_path, f"save_cards_{size}.json")
        
        # 修改应用配置以使用测试文件
        with app.test_request_context():
            monkeypatch.setitem(app.config, 'CARDS_FILE', output_file)
            
            # 测量保存时间
            start_time = time.time()
            result = save_cards(cards_data)
            end_time = time.time()
            
            save_time = end_time - start_time
            
            print(f"\n保存 {size} 张卡牌耗时: {save_time:.4f} 秒")
            
            # 验证保存成功
            assert result is True, "保存卡牌应该成功"
            
            # 验证保存的卡牌数量
            with open(output_file, 'r', encoding='utf-8') as f:
                saved_cards = json.load(f)
                assert len(saved_cards["cards"]) == size, f"应该保存 {size} 张卡牌，但实际保存了 {len(saved_cards['cards'])} 张"
            
            # 验证保存时间在合理范围内
            assert save_time < size / 200 + 0.5, f"保存 {size} 张卡牌太慢: {save_time:.4f} 秒"
    
    @pytest.mark.parametrize("size", [10, 50, 100])
    def test_save_decks_performance(self, setup_test_files, size, tmp_path, monkeypatch):
        """测试保存不同大小的牌组数据性能"""
        from app import save_decks, app
        
        # 获取测试牌组数据
        decks_file = setup_test_files[size * 10]["decks_file"]
        with open(decks_file, 'r', encoding='utf-8') as f:
            decks_data = json.load(f)
        
        # 创建临时输出文件
        output_file = os.path.join(tmp_path, f"save_decks_{size}.json")
        
        # 修改应用配置以使用测试文件
        with app.test_request_context():
            monkeypatch.setitem(app.config, 'DECKS_FILE', output_file)
            
            # 测量保存时间
            start_time = time.time()
            result = save_decks(decks_data)
            end_time = time.time()
            
            save_time = end_time - start_time
            
            print(f"\n保存 {size} 个牌组耗时: {save_time:.4f} 秒")
            
            # 验证保存成功
            assert result is True, "保存牌组应该成功"
            
            # 验证保存的牌组数量
            with open(output_file, 'r', encoding='utf-8') as f:
                saved_decks = json.load(f)
                assert len(saved_decks["decks"]) == size, f"应该保存 {size} 个牌组，但实际保存了 {len(saved_decks['decks'])} 个"
            
            # 验证保存时间在合理范围内
            assert save_time < size / 100 + 0.5, f"保存 {size} 个牌组太慢: {save_time:.4f} 秒" 