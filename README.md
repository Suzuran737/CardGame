# 卡牌游戏

这是软件工程课程作业。
这是一个借助ai的基于Python Flask框架开发的卡牌游戏项目，包含卡牌管理、卡组构建和战斗系统等功能。

## 项目结构

```
CardGame/
├── app.py                 # Flask应用主文件
├── data/
│   └── cards.json        # 卡牌数据文件
├── static/
│   ├── css/              # 样式文件
│   │   ├── style.css     # 通用样式
│   │   ├── cards.css     # 卡牌页面样式
│   │   ├── deck.css      # 卡组页面样式
│   │   ├── battle.css    # 战斗页面样式
│   │   └── prepare.css   # 准备页面样式
│   ├── js/               # JavaScript文件
│   │   ├── main.js       # 通用功能
│   │   ├── cards.js      # 卡牌管理功能
│   │   ├── deck.js       # 卡组管理功能
│   │   └── battle/       # 战斗相关功能
│   │       ├── battle-main.js    # 战斗主逻辑
│   │       ├── battle-state.js   # 战斗状态管理
│   │       ├── battle-actions.js # 战斗动作处理
│   │       ├── battle-ui.js      # 战斗界面交互
│   │       └── battle-cards.js   # 战斗卡牌处理
│   └── images/           # 图片资源
└── templates/            # HTML模板
    ├── index.html        # 首页
    ├── cards.html        # 卡牌管理页面
    ├── deck.html         # 卡组管理页面
    ├── prepare.html      # 战斗准备页面
    └── battle.html       # 战斗页面
```

## 功能特点

### 1. 卡牌管理
- 查看所有卡牌
- 添加新卡牌
- 修改现有卡牌
- 删除卡牌
- 搜索卡牌

### 2. 卡组构建
- 创建自定义卡组
- 从卡牌库中选择卡牌
- 管理卡组中的卡牌
- 保存和加载卡组

### 3. 战斗系统
- 回合制战斗
- 卡牌技能系统
- 状态效果（增益/减益）
- 战斗日志
- 胜负判定

## 卡牌属性

每张卡牌包含以下属性：
- 名称
- 元素类型（风、火、水、光、暗、土）
- 基础属性（生命值、攻击力、防御力、速度、暴击率、初始能量）
- 技能（最多3个）
  - 技能名称
  - 消耗能量
  - 技能描述
  - 效果类型（伤害、治疗、增益、减益）

## 运行环境要求

- Python 3.7+
- Flask 2.0+
- 现代浏览器（推荐Chrome、Firefox或Edge）

## 安装步骤

1. 克隆项目到本地：
```bash
git clone https://github.com/yourusername/CardGame.git
cd CardGame
```

2. 创建虚拟环境（可选但推荐）：
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

## 运行项目

1. 启动Flask服务器：
```bash
python app.py
```

2. 在浏览器中访问：
```
http://localhost:5000
```

## 使用说明

### 卡牌管理
1. 点击"编辑卡牌"按钮
2. 选择相应操作：
   - 添加卡牌：创建新卡牌
   - 修改卡牌：编辑现有卡牌
   - 删除卡牌：移除卡牌
   - 搜索卡牌：查找特定卡牌

### 卡组构建
1. 在卡组页面选择"创建新卡组"
2. 从卡牌库中选择3张卡牌
3. 点击"保存卡组"完成创建

### 战斗系统
1. 在准备页面选择要使用的卡组
2. 点击"开始战斗"进入战斗界面
3. 按照回合制规则进行战斗：
   - 选择要使用的技能
   - 选择目标
   - 等待敌方行动
   - 查看战斗日志

## 开发说明

### 添加新卡牌
1. 在`data/cards.json`中添加新卡牌数据
2. 确保包含所有必要属性
3. 重启服务器使更改生效

### 修改游戏规则
1. 战斗逻辑在`static/js/battle/`目录下
2. 卡牌效果在`battle-actions.js`中定义
3. 状态管理在`battle-state.js`中处理

## 注意事项

- 确保`data/cards.json`文件格式正确
- 卡牌名称不能超过8个字符
- 每个卡组必须包含3张卡牌
- 战斗过程中请勿刷新页面

## 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

