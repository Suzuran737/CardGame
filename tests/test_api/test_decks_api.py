import pytest
import json

def test_get_decks(client, setup_test_data):
    """测试获取所有牌组"""
    response = client.get('/api/decks')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'decks' in data
    assert len(data['decks']) > 0
    assert data['decks'][0]['name'] == '测试牌组1'

def test_create_deck(client, setup_test_data):
    """测试创建新牌组"""
    new_deck = {
        "name": "新测试牌组",
        "cards": ["1", "2", "3", "4"]
    }
    
    response = client.post('/api/decks',
                          data=json.dumps(new_deck),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True

def test_update_existing_deck(client, setup_test_data):
    """测试更新已存在的牌组"""
    updated_deck = {
        "name": "测试牌组1",  # 使用已存在的牌组名
        "cards": ["1", "2", "3", "4", "5"]  # 更新卡牌列表
    }
    
    response = client.post('/api/decks',
                          data=json.dumps(updated_deck),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True

def test_create_deck_invalid_data(client, setup_test_data):
    """测试创建牌组时使用无效数据"""
    invalid_deck = {
        "name": "无效牌组"
        # 缺少 cards 字段
    }
    
    response = client.post('/api/decks',
                          data=json.dumps(invalid_deck),
                          content_type='application/json')
    assert response.status_code == 400

def test_create_deck_empty_cards(client, setup_test_data):
    """测试创建空牌组"""
    empty_deck = {
        "name": "空牌组",
        "cards": []
    }
    
    response = client.post('/api/decks',
                          data=json.dumps(empty_deck),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True

def test_create_deck_duplicate_name(client, setup_test_data):
    """测试创建重名牌组"""
    # 先创建一个牌组
    deck1 = {
        "name": "重名牌组",
        "cards": ["1", "2"]
    }
    client.post('/api/decks',
                data=json.dumps(deck1),
                content_type='application/json')
    
    # 尝试创建同名牌组
    deck2 = {
        "name": "重名牌组",
        "cards": ["3", "4"]
    }
    response = client.post('/api/decks',
                          data=json.dumps(deck2),
                          content_type='application/json')
    assert response.status_code == 200  # 应该更新现有牌组
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True

def test_create_deck_invalid_card_ids(client, setup_test_data):
    """测试创建包含无效卡牌ID的牌组"""
    invalid_deck = {
        "name": "无效卡牌牌组",
        "cards": ["999", "1000"]  # 不存在的卡牌ID
    }
    
    response = client.post('/api/decks',
                          data=json.dumps(invalid_deck),
                          content_type='application/json')
    assert response.status_code == 200  # 允许创建，但实际使用时需要验证卡牌存在性
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True 