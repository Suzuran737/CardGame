import pytest
import os
import json
import time
import threading
from flask import Flask
from app import app as flask_app
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

@pytest.fixture(autouse=True)
def app():
    """创建测试用的 Flask 应用实例"""
    # 确保每次测试都使用新的应用实例
    flask_app.config.update({
        'TESTING': True,
        'CARDS_FILE': None,  # 将在 setup_test_data 中设置
        'DECKS_FILE': None,  # 将在 setup_test_data 中设置
        'APPLICATION_ROOT': 'http://localhost:5000'  # 用于Selenium测试
    })
    return flask_app

@pytest.fixture
def client(app):
    """创建测试客户端"""
    return app.test_client()

@pytest.fixture
def server(app):
    """启动Flask服务器用于Selenium测试"""
    server = threading.Thread(target=app.run, kwargs={
        'debug': False,
        'use_reloader': False
    })
    server.daemon = True
    server.start()
    # 给服务器一些时间启动
    time.sleep(1)
    yield
    # 服务器是守护线程，会在测试结束时自动关闭

@pytest.fixture
def selenium(server):
    """提供Selenium WebDriver实例"""
    # 配置Chrome选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # 创建WebDriver
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    
    yield driver
    
    # 测试结束后关闭浏览器
    driver.quit()

@pytest.fixture
def test_cards_data():
    """提供测试用的卡牌数据"""
    return {
        "cards": [
            {
                "id": 1,
                "name": "测试卡牌1",
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
                        "name": "测试技能1",
                        "cost": 2,
                        "description": "测试技能描述",
                        "effect": {
                            "damage": 1.5
                        }
                    }
                ]
            },
            {
                "id": 2,
                "name": "测试卡牌2",
                "element": "水",
                "stats": {
                    "ATK": 8,
                    "HP": 15,
                    "DEF": 3,
                    "SPD": 10,
                    "CRI": 10,
                    "NRG": 1
                },
                "skills": [
                    {
                        "name": "测试技能2",
                        "cost": 1,
                        "description": "回复5点生命值",
                        "effect": {
                            "heal": 5
                        }
                    }
                ]
            },
            {
                "id": 3,
                "name": "敌方卡牌1",
                "element": "风",
                "stats": {
                    "ATK": 9,
                    "HP": 18,
                    "DEF": 4,
                    "SPD": 7,
                    "CRI": 12,
                    "NRG": 1
                },
                "skills": [
                    {
                        "name": "敌方技能1",
                        "cost": 1,
                        "description": "造成伤害并降低目标速度",
                        "effect": {
                            "damage": 1.2,
                            "debuff": {
                                "speed": -2,
                                "duration": 2
                            }
                        }
                    }
                ]
            }
        ]
    }

@pytest.fixture
def test_decks_data():
    """提供测试用的牌组数据"""
    return {
        "decks": [
            {
                "name": "测试牌组1",
                "cards": ["1", "2", "3"]
            }
        ]
    }

@pytest.fixture(autouse=True)
def setup_test_data(test_cards_data, test_decks_data, tmp_path, app):
    """设置测试数据文件"""
    # 创建测试数据目录
    test_data_dir = tmp_path / "test_data"
    test_data_dir.mkdir()
    
    # 写入测试卡牌数据
    cards_file = test_data_dir / "cards.json"
    with open(cards_file, 'w', encoding='utf-8') as f:
        json.dump(test_cards_data, f, ensure_ascii=False, indent=4)
    
    # 写入测试牌组数据
    decks_file = test_data_dir / "decks.json"
    with open(decks_file, 'w', encoding='utf-8') as f:
        json.dump(test_decks_data, f, ensure_ascii=False, indent=4)
    
    # 设置应用的数据文件路径
    app.config['CARDS_FILE'] = str(cards_file)
    app.config['DECKS_FILE'] = str(decks_file)
    
    yield
    
    # 清理测试数据
    try:
        os.remove(str(cards_file))
        os.remove(str(decks_file))
        os.rmdir(str(test_data_dir))
    except:
        pass 