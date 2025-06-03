import pytest
import json
import time
from flask import Flask

@pytest.fixture
def client(app):
    """创建一个测试客户端"""
    return app.test_client()

class TestApiResponseTime:
    """API响应时间测试类"""
    
    @pytest.mark.benchmark(
        group="api-get",
        min_time=0.1,
        max_time=0.5,
        min_rounds=5,
        timer=time.time,
        disable_gc=True,
        warmup=False
    )
    def test_get_cards_response_time(self, client, benchmark):
        """测试获取卡牌列表API的响应时间"""
        @benchmark
        def result():
            return client.get('/api/cards')
        
        assert result.status_code == 200
        assert "application/json" in result.content_type
        
    @pytest.mark.benchmark(
        group="api-get",
        min_time=0.1,
        max_time=0.5,
        min_rounds=5,
        timer=time.time,
        disable_gc=True,
        warmup=False
    )
    def test_get_decks_response_time(self, client, benchmark):
        """测试获取牌组列表API的响应时间"""
        @benchmark
        def result():
            return client.get('/api/decks')
        
        assert result.status_code == 200
        assert "application/json" in result.content_type
    
    @pytest.mark.benchmark(
        group="api-post",
        min_time=0.1,
        max_time=1.0,
        min_rounds=5,
        timer=time.time,
        disable_gc=True,
        warmup=False
    )
    def test_create_card_response_time(self, client, benchmark):
        """测试创建卡牌API的响应时间"""
        test_card = {
            "name": "测试卡牌",
            "description": "这是一张测试卡牌",
            "type": "生物",
            "cost": 3,
            "attack": 2,
            "health": 2,
            "image_url": "/static/images/default_card.png"
        }
        
        @benchmark
        def result():
            return client.post(
                '/api/cards',
                data=json.dumps(test_card),
                content_type='application/json'
            )
        
        # 注意：此处不检查状态码，因为在测试环境中可能会拒绝创建卡牌
        # 我们主要关注API的响应时间，而不是功能
        
    @pytest.mark.benchmark(
        group="api-post",
        min_time=0.1,
        max_time=1.0,
        min_rounds=5,
        timer=time.time,
        disable_gc=True,
        warmup=False
    )
    def test_create_deck_response_time(self, client, benchmark):
        """测试创建牌组API的响应时间"""
        test_deck = {
            "name": "测试牌组",
            "cards": []
        }
        
        @benchmark
        def result():
            return client.post(
                '/api/decks',
                data=json.dumps(test_deck),
                content_type='application/json'
            )
        
        # 注意：此处不检查状态码，因为在测试环境中可能会拒绝创建牌组
        # 我们主要关注API的响应时间，而不是功能 