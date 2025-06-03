import pytest
from flask import url_for
from bs4 import BeautifulSoup
import re


class TestIndexPage:
    """主页测试类"""
    
    def test_index_page_renders(self, client):
        """测试主页能否正确渲染"""
        response = client.get('/')
        assert response.status_code == 200
        
        # 确保页面包含关键元素
        html = response.data.decode('utf-8')
        assert '<title>卡牌游戏</title>' in html
        assert 'Card Game' in html
        
        # 使用BeautifulSoup解析HTML
        soup = BeautifulSoup(html, 'html.parser')
        
        # 测试页面标题
        title = soup.find('title')
        assert title.text == '卡牌游戏'
        
        # 测试导航按钮存在
        buttons = soup.find_all('button')
        button_texts = [btn.text.strip() for btn in buttons if btn.text.strip()]
        
        assert '开始游戏' in button_texts
        assert '卡组配置' in button_texts
        assert '卡牌展示' in button_texts
        
    def test_index_page_links(self, client):
        """测试主页链接是否正确"""
        response = client.get('/')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 测试按钮的链接
        start_button = soup.find('button', string=re.compile('开始游戏'))
        assert 'onclick' in start_button.attrs
        assert '/prepare' in start_button['onclick']
        
        deck_button = soup.find('button', string=re.compile('卡组配置'))
        assert 'onclick' in deck_button.attrs
        assert '/deck' in deck_button['onclick']
        
        cards_button = soup.find('button', string=re.compile('卡牌展示'))
        assert 'onclick' in cards_button.attrs
        assert '/cards' in cards_button['onclick']
    
    def test_index_page_static_resources(self, client):
        """测试静态资源是否正确加载"""
        response = client.get('/')
        html = response.data.decode('utf-8')
        
        # 检查CSS和JS引用
        assert 'css/style.css' in html
        assert 'js/main.js' in html
        
        # 检查Font Awesome
        assert 'font-awesome' in html
        
        # 检查图标
        assert 'card_icon.ico' in html
    
    def test_index_page_music_control(self, client):
        """测试音乐控制元素是否存在"""
        response = client.get('/')
        html = response.data.decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # 查找音乐控制元素
        music_control = soup.find(id='musicControl')
        assert music_control is not None
        
        # 确保音乐控制元素包含图标
        icon = music_control.find('i')
        assert icon is not None
        assert 'fa-music' in icon.get('class', [])
        
        # 验证点击事件
        assert 'onclick="toggleMusic()"' in str(music_control) 