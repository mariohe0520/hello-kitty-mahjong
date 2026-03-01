# AGENTS.md — Hello Kitty 麻将

## 项目概述
- Hello Kitty 主题的日式麻将游戏
- 纯前端项目，HTML + CSS + JavaScript
- 部署在 GitHub Pages，无构建工具
- 包含 AI 对手（对家/上家/下家）

## 技术栈
- 原生 JavaScript
- CSS3 动画
- LocalStorage 存档
- 可能使用 Canvas 渲染牌面

## 核心玩法
- 日本麻将（日麻）或国标麻将规则
- 四人对局（1 玩家 + 3 AI）
- 支持吃/碰/杠/胡操作
- 东风圈/半庄制

## 测试方式
- 打开 index.html，DevTools Console 0 错误
- 核心功能验证：发牌 → 摸牌 → 出牌 → 吃碰杠判定 → 胡牌判定 → 计分
- AI 对手能正常出牌、不会卡死

## 代码规范
- 中文注释
- 不删除任何现有功能
- 每次修改说明原因
