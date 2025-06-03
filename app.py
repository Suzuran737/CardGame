from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# 默认数据文件路径
app.config['CARDS_FILE'] = 'data/cards.json'
app.config['DECKS_FILE'] = 'data/decks.json'

# 确保data目录存在
if not os.path.exists('data'):
    os.makedirs('data')

# 确保decks.json文件存在
if not os.path.exists(app.config['DECKS_FILE']):
    with open(app.config['DECKS_FILE'], 'w', encoding='utf-8') as f:
        json.dump({"decks": []}, f, ensure_ascii=False, indent=4)

# 确保cards.json文件存在
if not os.path.exists(app.config['CARDS_FILE']):
    with open(app.config['CARDS_FILE'], 'w', encoding='utf-8') as f:
        json.dump({"cards": []}, f, ensure_ascii=False, indent=4)

# 验证卡牌数据
def validate_card_data(card_data):
    required_fields = ['name', 'element', 'stats', 'skills']
    if not all(field in card_data for field in required_fields):
        return False, "缺少必要字段"
    
    required_stats = ['ATK', 'HP', 'DEF', 'SPD', 'CRI', 'NRG']
    if not all(stat in card_data['stats'] for stat in required_stats):
        return False, "缺少必要的属性值"
    
    if not isinstance(card_data['skills'], list):
        return False, "技能必须是列表"
    
    for skill in card_data['skills']:
        if not all(field in skill for field in ['name', 'cost', 'description', 'effect']):
            return False, "技能数据不完整"
    
    return True, None

# 验证并清理卡牌数据
def validate_and_clean_cards_data(cards_data):
    if not isinstance(cards_data, dict) or 'cards' not in cards_data:
        return {"cards": []}
    
    valid_cards = []
    for card in cards_data['cards']:
        is_valid, _ = validate_card_data(card)
        if is_valid:
            valid_cards.append(card)
    
    return {"cards": valid_cards}

# 加载卡牌数据
def load_cards():
    try:
        with open(app.config['CARDS_FILE'], 'r', encoding='utf-8') as f:
            cards_data = json.load(f)
            # 验证并清理数据
            validated_data = validate_and_clean_cards_data(cards_data)
            # 如果数据有变化，保存清理后的数据
            if len(validated_data['cards']) != len(cards_data.get('cards', [])):
                save_cards(validated_data)
            return validated_data
    except FileNotFoundError:
        return {"cards": []}
    except json.JSONDecodeError:
        return {"cards": []}

# 加载牌组数据
def load_decks():
    try:
        with open(app.config['DECKS_FILE'], 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"decks": []}
    except json.JSONDecodeError:
        return {"decks": []}

# 保存牌组数据
def save_decks(decks):
    try:
        with open(app.config['DECKS_FILE'], 'w', encoding='utf-8') as f:
            json.dump(decks, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"保存牌组失败: {str(e)}")
        return False

# 保存卡牌数据
def save_cards(cards):
    try:
        with open(app.config['CARDS_FILE'], 'w', encoding='utf-8') as f:
            json.dump(cards, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"保存卡牌失败: {str(e)}")
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cards')
def cards():
    return render_template('cards.html')

@app.route('/deck')
def deck():
    return render_template('deck.html')

@app.route('/prepare')
def prepare():
    return render_template('prepare.html')

@app.route('/battle')
def battle():
    return render_template('battle.html')

@app.route('/api/cards', methods=['GET'])
def get_cards():
    try:
        return jsonify(load_cards())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cards/<int:card_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_card(card_id):
    if request.method == 'GET':
        try:
            cards = load_cards()
            card = next((card for card in cards['cards'] if card['id'] == card_id), None)
            if card is None:
                return jsonify({"error": "卡牌不存在"}), 404
            return jsonify(card)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    elif request.method == 'PUT':
        try:
            card_data = request.json
            if not card_data:
                return jsonify({"error": "无效的卡牌数据"}), 400
                
            # 验证卡牌数据
            is_valid, error_message = validate_card_data(card_data)
            if not is_valid:
                return jsonify({"error": error_message}), 400
                
            cards = load_cards()
            
            # 查找要更新的卡牌
            card_index = next((i for i, card in enumerate(cards['cards']) if card['id'] == card_id), -1)
            if card_index == -1:
                return jsonify({"error": "卡牌不存在"}), 404
                
            # 更新卡牌数据
            cards['cards'][card_index] = card_data
            
            if save_cards(cards):
                return jsonify({"success": True})
            else:
                return jsonify({"error": "保存卡牌失败"}), 500
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    elif request.method == 'DELETE':
        try:
            cards = load_cards()
            # 查找要删除的卡牌
            card_index = next((i for i, card in enumerate(cards['cards']) if card['id'] == card_id), -1)
            if card_index == -1:
                return jsonify({"error": "卡牌不存在"}), 404
                
            # 删除卡牌
            cards['cards'].pop(card_index)
            
            if save_cards(cards):
                return jsonify({"success": True})
            else:
                return jsonify({"error": "保存卡牌失败"}), 500
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/api/decks', methods=['GET'])
def get_decks():
    try:
        return jsonify(load_decks())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/decks', methods=['POST'])
def save_deck():
    try:
        deck_data = request.json
        if not deck_data or 'name' not in deck_data or 'cards' not in deck_data:
            return jsonify({"error": "无效的牌组数据"}), 400
            
        decks = load_decks()
        
        # 检查是否已存在同名牌组
        existing_index = next((i for i, d in enumerate(decks['decks']) if d['name'] == deck_data['name']), -1)
        if existing_index != -1:
            decks['decks'][existing_index] = deck_data
        else:
            decks['decks'].append(deck_data)
        
        if save_decks(decks):
            return jsonify({"success": True})
        else:
            return jsonify({"error": "保存牌组失败"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cards', methods=['POST'])
def create_card():
    try:
        card_data = request.json
        if not card_data:
            return jsonify({"error": "无效的卡牌数据"}), 400
            
        # 验证卡牌数据
        is_valid, error_message = validate_card_data(card_data)
        if not is_valid:
            return jsonify({"error": error_message}), 400
            
        cards = load_cards()
        
        # 生成新的ID
        new_id = max([card.get('id', 0) for card in cards['cards']], default=0) + 1
        card_data['id'] = new_id
        
        # 添加新卡牌
        cards['cards'].append(card_data)
        
        if save_cards(cards):
            return jsonify({"success": True, "id": new_id})
        else:
            return jsonify({"error": "保存卡牌失败"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 