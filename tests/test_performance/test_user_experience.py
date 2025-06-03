import pytest
import time
import json
import os
from pathlib import Path
from locust import HttpUser, task, between

# 注意: 此文件不会被pytest直接运行
# 需要通过locust命令行运行，例如:
# locust -f tests/test_performance/test_user_experience.py --headless -u 100 -r 10 -t 1m

class CardGameUser(HttpUser):
    """模拟卡牌游戏用户行为的测试类"""
    
    # 设置任务间隔时间，模拟真实用户行为
    wait_time = between(1, 5)
    
    def on_start(self):
        """用户会话开始时执行的操作"""
        # 访问首页
        self.client.get("/")
    
    @task(10)
    def view_cards(self):
        """浏览卡牌页面 - 高频率任务"""
        # 访问卡牌页面
        response = self.client.get("/cards")
        if response.status_code == 200:
            # 获取卡牌数据
            self.client.get("/api/cards")
    
    @task(5)
    def view_decks(self):
        """浏览牌组页面 - 中频率任务"""
        # 访问牌组页面
        response = self.client.get("/decks")
        if response.status_code == 200:
            # 获取牌组数据
            self.client.get("/api/decks")
    
    @task(2)
    def create_deck(self):
        """创建新牌组 - 低频率任务"""
        # 先获取卡牌列表
        cards_response = self.client.get("/api/cards")
        if cards_response.status_code == 200:
            try:
                cards_data = cards_response.json()
                if 'cards' in cards_data and len(cards_data['cards']) > 0:
                    # 从可用卡牌中选择20张（或全部，如果卡牌少于20张）
                    selected_cards = []
                    for i in range(min(20, len(cards_data['cards']))):
                        selected_cards.append(cards_data['cards'][i]['id'])
                    
                    # 创建新牌组
                    new_deck = {
                        "name": f"测试牌组 {time.time()}",
                        "cards": selected_cards
                    }
                    
                    self.client.post(
                        "/api/decks",
                        json=new_deck
                    )
            except json.JSONDecodeError:
                pass
    
    @task(1)
    def prepare_battle(self):
        """准备战斗页面 - 最低频率任务"""
        # 访问准备战斗页面
        self.client.get("/prepare")
        
        # 获取可用牌组
        decks_response = self.client.get("/api/decks")
        if decks_response.status_code == 200:
            try:
                decks_data = decks_response.json()
                if 'decks' in decks_data and len(decks_data['decks']) > 0:
                    # 随机选择一个牌组
                    deck_id = decks_data['decks'][0]['id']
                    
                    # 选择牌组进行战斗
                    self.client.get(f"/battle?deck={deck_id}")
            except json.JSONDecodeError:
                pass

# 额外提供的辅助类，用于在集成测试环境中使用
class TestUserExperienceSimulation:
    """用户体验模拟测试类（适用于pytest环境）"""
    
    @pytest.mark.skip(reason="此测试需要通过locust命令行单独运行")
    def test_user_experience_simulation(self, client):
        """模拟用户体验测试（pytest兼容的接口）"""
        print("\n用户体验模拟测试")
        print("注意: 此测试仅为示例，完整测试需通过locust命令行运行")
        print("命令示例: locust -f tests/test_performance/test_user_experience.py --headless -u 100 -r 10 -t 1m")
        
        # 模拟一个简单的用户会话
        start_time = time.time()
        
        # 访问首页
        response = client.get("/")
        assert response.status_code == 200
        
        # 访问卡牌页面
        response = client.get("/cards")
        assert response.status_code == 200
        
        # 获取卡牌数据
        response = client.get("/api/cards")
        assert response.status_code == 200
        
        # 访问牌组页面
        response = client.get("/decks")
        assert response.status_code == 200
        
        # 获取牌组数据
        response = client.get("/api/decks")
        assert response.status_code == 200
        
        # 计算总耗时
        total_time = time.time() - start_time
        print(f"模拟用户会话总耗时: {total_time:.4f} 秒")
        
        # 验证整体响应时间在合理范围内
        assert total_time < 2.0, f"用户会话耗时过长: {total_time:.4f} 秒"
        
    def test_generate_locust_config(self, tmp_path):
        """生成locust配置文件，方便命令行执行"""
        config_content = """
[locust]
# 主机名，需要替换为实际的应用主机地址
host = http://localhost:5000
# 用户数量
users = 100
# 每秒孵化的用户数
spawn-rate = 10
# 运行时间
run-time = 1m
# 运行模式：headless = 无界面模式
headless = true
# 日志级别
loglevel = INFO
# 指定测试脚本
locustfile = tests/test_performance/test_user_experience.py
        """
        
        config_file = tmp_path / "locust.conf"
        with open(config_file, "w") as f:
            f.write(config_content)
            
        print(f"\nlocust配置文件已生成: {config_file}")
        print("运行locust测试命令: locust --config=locust.conf")
        
        # 确认文件已创建
        assert config_file.exists()
        assert os.path.getsize(config_file) > 0, "配置文件不应为空" 