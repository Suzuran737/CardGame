from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# 确保data目录存在
if not os.path.exists('data'):
    os.makedirs('data')

# 确保decks.json文件存在
if not os.path.exists('data/decks.json'):
    with open('data/decks.json', 'w', encoding='utf-8') as f:
        json.dump({"decks": []}, f, ensure_ascii=False, indent=4)

# 加载卡牌数据
def load_cards():
    try:
        with open('data/cards.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"cards": []}
    except json.JSONDecodeError:
        return {"cards": []}

# 加载牌组数据
def load_decks():
    try:
        with open('data/decks.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"decks": []}
    except json.JSONDecodeError:
        return {"decks": []}

# 保存牌组数据
def save_decks(decks):
    try:
        with open('data/decks.json', 'w', encoding='utf-8') as f:
            json.dump(decks, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"保存牌组失败: {str(e)}")
        return False

# 保存卡牌数据
def save_cards(cards):
    try:
        with open('data/cards.json', 'w', encoding='utf-8') as f:
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

@app.route('/api/cards', methods=['GET', 'POST'])
def handle_cards():
    if request.method == 'GET':
        try:
            return jsonify(load_cards())
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    elif request.method == 'POST':
        try:
            card_data = request.json
            if not card_data:
                return jsonify({"error": "无效的卡牌数据"}), 400
                
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

@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
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

@app.route('/api/cards/<int:card_id>', methods=['PUT'])
def update_card(card_id):
    try:
        card_data = request.json
        if not card_data:
            return jsonify({"error": "无效的卡牌数据"}), 400
            
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

if __name__ == '__main__':
    app.run(debug=True) 