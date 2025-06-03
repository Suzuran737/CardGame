import pytest
import json

def test_get_cards(client, setup_test_data):
    """测试获取所有卡牌"""
    response = client.get('/api/cards')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'cards' in data
    assert len(data['cards']) > 0
    assert data['cards'][0]['name'] == '测试卡牌1'

def test_create_card(client, setup_test_data):
    """测试创建新卡牌"""
    new_card = {
        "name": "新测试卡牌",
        "element": "水",
        "stats": {
            "ATK": 8,
            "HP": 15,
            "DEF": 3,
            "SPD": 10,
            "CRI": 20,
            "NRG": 1
        },
        "skills": [
            {
                "name": "新测试技能",
                "cost": 1,
                "description": "新测试技能描述",
                "effect": {
                    "damage": 1.2
                }
            }
        ]
    }
    
    response = client.post('/api/cards',
                          data=json.dumps(new_card),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True
    assert 'id' in data

def test_update_card(client, setup_test_data):
    """测试更新卡牌"""
    updated_card = {
        "id": 1,
        "name": "更新后的卡牌",
        "element": "火",
        "stats": {
            "ATK": 12,
            "HP": 25,
            "DEF": 6,
            "SPD": 9,
            "CRI": 18,
            "NRG": 2
        },
        "skills": [
            {
                "name": "更新后的技能",
                "cost": 2,
                "description": "更新后的技能描述",
                "effect": {
                    "damage": 1.6
                }
            }
        ]
    }
    
    response = client.put('/api/cards/1',
                         data=json.dumps(updated_card),
                         content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True

def test_delete_card(client, setup_test_data):
    """测试删除卡牌"""
    response = client.delete('/api/cards/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True

def test_get_nonexistent_card(client, setup_test_data):
    """测试获取不存在的卡牌"""
    response = client.get('/api/cards/999')
    assert response.status_code == 404

def test_update_nonexistent_card(client, setup_test_data):
    """测试更新不存在的卡牌"""
    card_data = {
        "id": 999,
        "name": "不存在的卡牌",
        "element": "火",
        "stats": {"ATK": 10, "HP": 20, "DEF": 5, "SPD": 8, "CRI": 15, "NRG": 2},
        "skills": []
    }
    
    response = client.put('/api/cards/999',
                         data=json.dumps(card_data),
                         content_type='application/json')
    assert response.status_code == 404

def test_delete_nonexistent_card(client, setup_test_data):
    """测试删除不存在的卡牌"""
    response = client.delete('/api/cards/999')
    assert response.status_code == 404

def test_create_card_invalid_data(client, setup_test_data):
    """测试创建卡牌时使用无效数据"""
    invalid_card = {
        "name": "无效卡牌",
        # 缺少必要字段
    }
    
    response = client.post('/api/cards',
                          data=json.dumps(invalid_card),
                          content_type='application/json')
    assert response.status_code == 400

def test_update_card_invalid_data(client, setup_test_data):
    """测试更新卡牌时使用无效数据"""
    invalid_card = {
        "id": 1,
        "name": "无效更新",
        # 缺少必要字段
    }
    
    response = client.put('/api/cards/1',
                         data=json.dumps(invalid_card),
                         content_type='application/json')
    assert response.status_code == 400 