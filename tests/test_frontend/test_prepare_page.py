import pytest
from flask import url_for
from bs4 import BeautifulSoup
import json
import re
from unittest.mock import patch, MagicMock


class TestPreparePage:
    """准备页面测试类"""
    
    def test_prepare_page_renders(self, client):
        """测试准备页面能否正确渲染"""
        response = client.get('/prepare')
        assert response.status_code == 200
        
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证页面标题
        assert soup.find('title').text == '战斗准备 - 卡牌游戏'
        
        # 验证页面主标题
        assert soup.find('h1').text.strip() == '准备战斗'
        
        # 验证导航按钮
        home_button = soup.find('button', string=re.compile('返回首页'))
        assert home_button is not None
        assert 'onclick' in home_button.attrs
        assert '/' in home_button['onclick']
    
    def test_prepare_page_structure(self, client):
        """测试准备页面的基础结构"""
        response = client.get('/prepare')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证准备内容区域
        prepare_content = soup.find(class_='prepare-content')
        assert prepare_content is not None
        
        # 验证牌组选择区域
        deck_selection = soup.find(class_='deck-selection')
        assert deck_selection is not None
        
        # 验证战斗信息区域
        battle_info = soup.find(class_='battle-info')
        assert battle_info is not None
        
        # 验证已选卡牌区域
        selected_cards = soup.find(id='selectedCards')
        assert selected_cards is not None
        
        # 验证卡牌槽位数量
        deck_slots = selected_cards.find_all(class_='deck-slot')
        assert len(deck_slots) == 3  # 游戏规则中指定3张卡牌
    
    def test_my_decks_dropdown(self, client):
        """测试我的牌组下拉菜单"""
        response = client.get('/prepare')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证我的牌组按钮
        my_decks_btn = soup.find(id='myDecksBtn')
        assert my_decks_btn is not None
        assert my_decks_btn.text.strip() == '我的牌组'
        
        # 验证牌组下拉菜单
        deck_dropdown = soup.find(id='deckDropdown')
        assert deck_dropdown is not None
    
    def test_quick_select_section(self, client):
        """测试快速选择区域"""
        response = client.get('/prepare')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证快速选择区域
        quick_select = soup.find(class_='quick-select')
        assert quick_select is not None
        
        # 验证区域标题
        quick_select_title = quick_select.find('h2')
        assert quick_select_title is not None
        assert quick_select_title.text.strip() == '快速选择'
        
        # 验证卡牌网格
        cards_grid = soup.find(id='quickSelectCards')
        assert cards_grid is not None
    
    def test_start_battle_button(self, client):
        """测试开始战斗按钮"""
        response = client.get('/prepare')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 验证开始战斗按钮
        start_battle_btn = soup.find(id='startBattleBtn')
        assert start_battle_btn is not None
        assert start_battle_btn.text.strip() == '开始战斗'
        
        # 验证按钮最初是禁用的
        assert start_battle_btn.has_attr('disabled')
    
    def test_prepare_page_js_loaded(self, client):
        """测试准备页面JS加载"""
        response = client.get('/prepare')
        html = response.data.decode('utf-8')
        
        # 检查主脚本和准备页面特定脚本
        assert 'js/main.js' in html
        assert 'js/prepare.js' in html
    
    def test_prepare_page_css_loaded(self, client):
        """测试准备页面CSS加载"""
        response = client.get('/prepare')
        html = response.data.decode('utf-8')
        
        # 检查CSS链接
        assert 'css/style.css' in html
        assert 'css/prepare.css' in html 