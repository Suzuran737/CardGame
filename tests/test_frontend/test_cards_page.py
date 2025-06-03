import pytest
from flask import url_for
from bs4 import BeautifulSoup
import json
import re
from unittest.mock import patch, MagicMock


class TestCardsPage:
    """卡牌展示页面测试类"""
    
    def test_cards_page_renders(self, client):
        """测试卡牌页面能否正确渲染"""
        response = client.get('/cards')
        assert response.status_code == 200
        
        html = response.data.decode('utf-8')
        assert '<title>卡牌展示 - 卡牌游戏</title>' in html
        
        # 使用BeautifulSoup解析HTML
        soup = BeautifulSoup(html, 'html.parser')
        
        # 检查页面标题
        assert soup.find('h1').text.strip() == '卡牌展示'
        
        # 检查返回首页按钮
        home_button = soup.find('button', string=re.compile('返回首页'))
        assert home_button is not None
        assert 'onclick' in home_button.attrs
        assert '/' in home_button['onclick']
        
        # 检查卡牌容器
        cards_container = soup.find(id='cardsContainer')
        assert cards_container is not None
    
    def test_cards_page_edit_buttons(self, client):
        """测试卡牌页面编辑按钮"""
        response = client.get('/cards')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 检查编辑按钮
        edit_btn = soup.find(id='editBtn')
        assert edit_btn is not None
        assert edit_btn.text.strip() == '编辑卡牌'
        
        # 检查下拉菜单
        dropdown = soup.find(class_='dropdown-content')
        assert dropdown is not None
        
        # 检查下拉菜单项
        dropdown_items = dropdown.find_all('button')
        dropdown_texts = [item.text.strip() for item in dropdown_items]
        
        assert '添加卡牌' in dropdown_texts
        assert '删除卡牌' in dropdown_texts
        assert '修改卡牌' in dropdown_texts
        assert '查找卡牌' in dropdown_texts
        
        # 检查按钮ID
        assert soup.find(id='addCardBtn') is not None
        assert soup.find(id='deleteCardBtn') is not None
        assert soup.find(id='editCardBtn') is not None
        assert soup.find(id='searchCardBtn') is not None
    
    def test_cards_modal_form(self, client):
        """测试卡牌编辑模态框"""
        response = client.get('/cards')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 检查模态框
        modal = soup.find(id='cardModal')
        assert modal is not None
        
        # 检查表单
        form = modal.find(id='cardForm')
        assert form is not None
        
        # 检查表单字段
        assert form.find(id='cardName') is not None
        assert form.find(id='cardElement') is not None
        assert form.find(id='hp') is not None
        assert form.find(id='atk') is not None
        assert form.find(id='def') is not None
        assert form.find(id='spd') is not None
        assert form.find(id='cri') is not None
        assert form.find(id='nrg') is not None
        
        # 检查技能区域
        skills_container = form.find(id='skillsContainer')
        assert skills_container is not None
        
        # 检查添加技能按钮
        add_skill_btn = soup.find(id='addSkillBtn')
        assert add_skill_btn is not None
        assert add_skill_btn.text.strip() == '添加技能'
        
        # 检查表单按钮
        submit_btn = form.find('button', type='submit')
        assert submit_btn is not None
        assert submit_btn.text.strip() == '保存'
        
        cancel_btn = form.find(id='cancelBtn')
        assert cancel_btn is not None
        assert cancel_btn.text.strip() == '取消'
    
    @patch('app.load_cards')
    def test_api_cards_endpoint(self, mock_load_cards, client, test_cards_data):
        """测试卡牌API端点"""
        # 模拟API响应
        mock_load_cards.return_value = test_cards_data
        
        # 请求API
        response = client.get('/api/cards')
        assert response.status_code == 200
        
        # 验证返回的JSON数据
        data = json.loads(response.data.decode('utf-8'))
        assert 'cards' in data
        assert len(data['cards']) == len(test_cards_data['cards'])
        
        # 验证卡牌数据
        for i, card in enumerate(data['cards']):
            test_card = test_cards_data['cards'][i]
            assert card['id'] == test_card['id']
            assert card['name'] == test_card['name']
            assert card['element'] == test_card['element']
            
            # 验证属性
            for stat, value in test_card['stats'].items():
                assert card['stats'][stat] == value
    
    def test_cards_css_js_loaded(self, client):
        """测试卡牌页面JS和CSS加载"""
        response = client.get('/cards')
        html = response.data.decode('utf-8')
        
        # 检查CSS文件
        assert 'css/style.css' in html
        assert 'css/cards.css' in html
        
        # 检查JS文件加载
        soup = BeautifulSoup(html, 'html.parser')
        script_tags = soup.find_all('script')
        
        # 检查是否有JS文件加载
        js_loaded = any(tag.has_attr('src') for tag in script_tags)
        assert js_loaded 