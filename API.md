# API 文档

## 卡牌管理接口

### 获取所有卡牌
- **URL**: `/api/cards`
- **方法**: `GET`
- **描述**: 获取所有卡牌数据
- **响应**:
  ```json
  {
    "cards": [
      {
        "id": 1,
        "name": "卡牌名称",
        "element": "元素类型",
        "stats": {
          "HP": 10,
          "ATK": 5,
          "SPD": 8,
          "DEF": 3,
          "CRI": 20,
          "NRG": 2
        },
        "skills": [
          {
            "name": "技能名称",
            "cost": 2,
            "description": "技能描述",
            "effect": {
              "damage": 1.5,
              "aoe": true
            }
          }
        ]
      }
    ]
  }
  ```

### 添加新卡牌
- **URL**: `/api/cards`
- **方法**: `POST`
- **描述**: 添加一张新卡牌
- **请求体**:
  ```json
  {
    "name": "卡牌名称",
    "element": "元素类型",
    "stats": {
      "HP": 10,
      "ATK": 5,
      "SPD": 8,
      "DEF": 3,
      "CRI": 20,
      "NRG": 2
    },
    "skills": [
      {
        "name": "技能名称",
        "cost": 2,
        "description": "技能描述",
        "effect": {
          "damage": 1.5,
          "aoe": true
        }
      }
    ]
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "卡牌添加成功"
  }
  ```

### 更新卡牌
- **URL**: `/api/cards/<int:card_id>`
- **方法**: `PUT`
- **描述**: 更新指定ID的卡牌
- **请求体**: 同添加卡牌
- **响应**:
  ```json
  {
    "success": true,
    "message": "卡牌更新成功"
  }
  ```

### 删除卡牌
- **URL**: `/api/cards/<int:card_id>`
- **方法**: `DELETE`
- **描述**: 删除指定ID的卡牌
- **响应**:
  ```json
  {
    "success": true,
    "message": "卡牌删除成功"
  }
  ```

## 错误响应
所有接口在发生错误时都会返回以下格式的响应：
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 数据验证规则
1. 卡牌名称
   - 必填
   - 长度：1-8个字符

2. 元素类型
   - 必填
   - 可选值：风、火、水、光、暗、土

3. 属性值
   - HP：1-30
   - ATK：0-15
   - SPD：1-15
   - DEF：0-10
   - CRI：0-100
   - NRG：0-5

4. 技能
   - 最多3个技能
   - 技能名称：1-6个字符
   - 技能描述：1-50个字符
   - 能量消耗：0-10

## 状态码
- 200：请求成功
- 400：请求参数错误
- 404：资源不存在
- 500：服务器内部错误 