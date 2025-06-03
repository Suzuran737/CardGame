import pytest
import os
import sys
import json
from unittest.mock import MagicMock
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Add the project directory to sys.path to make imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# 导入应用程序的相关模块
from app import app as flask_app


@pytest.fixture
def app():
    """创建测试用的Flask应用实例"""
    flask_app.config.update({
        "TESTING": True,
        "SERVER_NAME": "localhost:5000"
    })
    
    # 使用应用上下文
    with flask_app.app_context():
        yield flask_app


@pytest.fixture
def client(app):
    """创建测试客户端"""
    return app.test_client()


@pytest.fixture
def selenium_driver(request):
    """创建Selenium WebDriver实例"""
    # 配置Chrome选项
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # 无界面运行
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # 初始化WebDriver（如果没有安装ChromeDriver，会自动下载）
        try:
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
            driver.implicitly_wait(10)  # 设置隐式等待时间
            
            # 测试结束后关闭WebDriver
            def fin():
                driver.quit()
                
            request.addfinalizer(fin)
            return driver
        except Exception as e:
            pytest.skip(f"无法初始化Chrome WebDriver: {e}")
    except Exception as e:
        pytest.skip(f"无法设置Chrome选项: {e}")
    
    # 如果一切失败，尝试使用模拟的WebDriver
    class MockWebDriver:
        def get(self, url):
            pass
        
        def find_element(self, by, value):
            return None
        
        def quit(self):
            pass
    
    pytest.skip("使用模拟的WebDriver进行测试")
    return MockWebDriver()


@pytest.fixture
def mock_fetch_api():
    """模拟浏览器Fetch API"""
    return MagicMock()


@pytest.fixture
def test_html_content():
    """提供用于测试的HTML内容"""
    return {
        "index": """
            <div class="container">
                <h1>Card Game</h1>
                <div class="menu">
                    <button class="btn primary">开始游戏</button>
                    <button class="btn secondary">卡组配置</button>
                    <button class="btn tertiary">卡牌展示</button>
                </div>
            </div>
        """,
        "cards": """
            <div class="cards-container">
                <div class="card" data-id="1">
                    <h3>测试卡牌</h3>
                </div>
            </div>
        """,
        "deck": """
            <div class="deck-builder">
                <div class="deck-list"></div>
            </div>
        """,
        "prepare": """
            <div class="prepare-content">
                <div class="deck-slots">
                    <div class="deck-slot" data-slot="1"></div>
                    <div class="deck-slot" data-slot="2"></div>
                    <div class="deck-slot" data-slot="3"></div>
                </div>
            </div>
        """,
        "battle": """
            <div class="battle-container">
                <div class="player-area"></div>
                <div class="enemy-area"></div>
            </div>
        """
    }


@pytest.fixture
def test_card_data():
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
                    "HP": 25,
                    "DEF": 7,
                    "SPD": 6,
                    "CRI": 10,
                    "NRG": 3
                },
                "skills": [
                    {
                        "name": "测试技能2",
                        "cost": 3,
                        "description": "测试技能描述2",
                        "effect": {
                            "heal": 10
                        }
                    }
                ]
            }
        ]
    }


@pytest.fixture
def test_deck_data():
    """提供测试用的牌组数据"""
    return {
        "decks": [
            {
                "name": "测试牌组1",
                "cards": ["1", "2", "3"]
            },
            {
                "name": "测试牌组2",
                "cards": ["4", "5", "6"]
            }
        ]
    } 