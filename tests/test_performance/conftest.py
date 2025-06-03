"""
性能测试的pytest配置文件
"""
import pytest
import tempfile
import json
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

@pytest.fixture
def app():
    """创建一个测试应用实例"""
    # 导入Flask应用
    from app import app as flask_app
    
    # 配置应用为测试模式
    flask_app.config['TESTING'] = True
    flask_app.config['SERVER_NAME'] = 'localhost'
    
    # 创建临时测试数据文件
    with tempfile.TemporaryDirectory() as temp_dir:
        # 创建基本的测试卡牌数据
        test_cards = {
            "cards": [
                {
                    "id": "1",
                    "name": "测试卡牌1",
                    "description": "这是一张测试卡牌",
                    "type": "生物",
                    "cost": 1,
                    "attack": 1,
                    "health": 1,
                    "image_url": "/static/images/default_card.png"
                },
                {
                    "id": "2",
                    "name": "测试卡牌2",
                    "description": "这是另一张测试卡牌",
                    "type": "法术",
                    "cost": 2,
                    "attack": 0,
                    "health": 0,
                    "image_url": "/static/images/default_card.png"
                }
            ]
        }
        
        # 创建基本的测试牌组数据
        test_decks = {
            "decks": [
                {
                    "id": "1",
                    "name": "测试牌组1",
                    "cards": ["1", "2"]
                }
            ]
        }
        
        # 保存测试数据到临时文件
        cards_file = os.path.join(temp_dir, "test_cards.json")
        decks_file = os.path.join(temp_dir, "test_decks.json")
        
        with open(cards_file, 'w', encoding='utf-8') as f:
            json.dump(test_cards, f, ensure_ascii=False)
            
        with open(decks_file, 'w', encoding='utf-8') as f:
            json.dump(test_decks, f, ensure_ascii=False)
        
        # 配置应用使用测试数据文件
        flask_app.config['CARDS_FILE'] = cards_file
        flask_app.config['DECKS_FILE'] = decks_file
        
        # 将临时文件路径保存到应用上下文，以便于在测试中访问
        flask_app.config['TEMP_CARDS_FILE'] = cards_file
        flask_app.config['TEMP_DECKS_FILE'] = decks_file
        
        # 返回配置好的应用
        yield flask_app

@pytest.fixture
def client(app):
    """创建测试客户端"""
    with app.test_client() as client:
        # 建立应用上下文
        with app.app_context():
            yield client

@pytest.fixture
def benchmark_rounds():
    """基准测试轮数配置"""
    return {
        'small': 10,  # 小数据量测试轮数
        'medium': 5,  # 中数据量测试轮数
        'large': 3    # 大数据量测试轮数
    }

@pytest.fixture
def benchmark_timeouts():
    """基准测试超时配置（秒）"""
    return {
        'api_get': 0.5,       # API GET请求基准时间
        'api_post': 1.0,      # API POST请求基准时间
        'load_small': 0.1,    # 小数据量加载基准时间
        'load_medium': 0.5,   # 中数据量加载基准时间
        'load_large': 2.0,    # 大数据量加载基准时间
        'save_small': 0.2,    # 小数据量保存基准时间
        'save_medium': 1.0,   # 中数据量保存基准时间
        'save_large': 3.0     # 大数据量保存基准时间
    } 