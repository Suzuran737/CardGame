import pytest
from flask import url_for
from bs4 import BeautifulSoup
import json
import re
from unittest.mock import patch, MagicMock


class TestDeckPage:
    """卡组配置页面测试类"""
    
    def test_deck_page_renders(self, client):
        """测试卡组配置页面能否正确渲染"""
        response = client.get('/deck')
        assert response.status_code == 200
        
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证页面标题
        title = soup.find('title')
        assert title is not None, "页面标题元素不存在"
        assert title.text == '卡牌配置 - 卡牌游戏', f"页面标题不正确，实际标题: {title.text}"
        
        # 验证页面主标题
        heading = soup.find('h1')
        assert heading is not None, "页面主标题不存在"
        assert heading.text.strip() == '卡牌配置', f"主标题不正确，实际标题: {heading.text}"
        
        # 验证导航按钮
        home_button = soup.find('button', string=re.compile('返回首页'))
        assert home_button is not None, "找不到返回首页按钮"
        assert 'onclick' in home_button.attrs
        assert '/' in home_button['onclick']
    
    def test_deck_builder_structure(self, client):
        """测试卡组构建器结构"""
        response = client.get('/deck')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证卡组构建区域存在
        deck_builder = soup.find(class_='deck-builder')
        assert deck_builder is not None, "找不到卡组构建区域"
        
        # 验证当前牌组区域存在
        current_deck = soup.find(class_='current-deck')
        assert current_deck is not None, "找不到当前牌组区域"
        
        # 验证牌组槽位区域存在
        deck_slots = soup.find(id='deckSlots')
        assert deck_slots is not None, "找不到牌组槽位区域"
        
        # 验证可用卡牌区域存在
        available_cards = soup.find(class_='available-cards')
        assert available_cards is not None, "找不到可用卡牌区域"
        
        # 验证可用卡牌网格
        cards_grid = soup.find(id='availableCards')
        assert cards_grid is not None, "找不到可用卡牌网格"
    
    def test_deck_control_buttons(self, client):
        """测试卡组控制按钮"""
        response = client.get('/deck')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证保存牌组按钮
        save_deck_btn = soup.find('button', string='保存牌组')
        assert save_deck_btn is not None, "找不到保存牌组按钮"
        assert 'onclick' in save_deck_btn.attrs
        assert 'saveDeck()' in save_deck_btn['onclick']
        
        # 验证清空牌组按钮
        clear_deck_btn = soup.find('button', string='清空牌组')
        assert clear_deck_btn is not None, "找不到清空牌组按钮"
        assert 'onclick' in clear_deck_btn.attrs
        assert 'clearDeck()' in clear_deck_btn['onclick']
    
    @patch('app.load_cards')
    @patch('app.load_decks')
    def test_api_decks_endpoint(self, mock_load_decks, mock_load_cards, client, test_deck_data):
        """测试卡组API端点"""
        # 模拟API响应
        mock_load_decks.return_value = test_deck_data
        
        # 请求API
        response = client.get('/api/decks')
        assert response.status_code == 200
        
        # 验证返回的JSON数据
        data = json.loads(response.data.decode('utf-8'))
        assert 'decks' in data
        assert len(data['decks']) == len(test_deck_data['decks'])
        
        # 验证卡组数据
        for i, deck in enumerate(data['decks']):
            test_deck = test_deck_data['decks'][i]
            assert deck['name'] == test_deck['name']
            
            # 验证卡牌列表
            assert len(deck['cards']) == len(test_deck['cards'])
            for j, card_id in enumerate(deck['cards']):
                assert card_id == test_deck['cards'][j]
    
    def test_available_cards_section(self, client):
        """测试可用卡牌区域"""
        response = client.get('/deck')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证可用卡牌区域存在
        available_cards = soup.find(class_='available-cards')
        assert available_cards is not None, "找不到可用卡牌区域"
        
        # 验证区域标题
        available_cards_title = available_cards.find('h2')
        assert available_cards_title is not None, "找不到可用卡牌区域标题"
        assert available_cards_title.text.strip() == '可用卡牌', "可用卡牌区域标题不正确"
        
        # 验证卡牌网格容器
        cards_grid = available_cards.find(id='availableCards')
        assert cards_grid is not None, "找不到可用卡牌网格"
    
    def test_deck_css_js_loaded(self, client):
        """测试卡组页面JS和CSS加载"""
        response = client.get('/deck')
        html = response.data.decode('utf-8')
        
        # 检查CSS链接
        assert 'css/style.css' in html, "主样式表未加载"
        assert 'css/deck.css' in html, "卡组页面样式表未加载"
        
        # 检查JS链接
        assert 'js/main.js' in html, "主JS文件未加载"
        assert 'js/deck.js' in html, "卡组相关JS文件未加载" 