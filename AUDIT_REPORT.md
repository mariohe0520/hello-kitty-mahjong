# Hello Kitty 麻将 — 全面代码审计报告

**审计日期：** 2026-03-01
**审计范围：** 全部 JS 文件、CSS、HTML
**项目健康度评分：** 62/100
**麻将规则符合度：** 71/100

---

## 执行摘要

项目整体架构完善，有真实的规则引擎（BeijingRules / SichuanRules）、AI 系统、角色系统。
主要问题集中在：**四川规则缺一门漏洞（P0）**、**browser 代码混入 Node.js API（P0）**、**多个 P1 游戏逻辑 bug**。

---

## 1. 文件结构审查

| 文件 | 用途 | 状态 |
|------|------|------|
| `index.html` | 游戏 UI 主框架 | ✅ 结构合理 |
| `js/tiles.js` | 牌的定义、工具函数 | ⚠️ findChi 边界问题 |
| `js/rules-beijing.js` | 北京麻将规则引擎 | ⚠️ 多个番型计算缺陷 |
| `js/rules-sichuan.js` | 四川血战麻将规则 | ❌ P0 缺一门漏洞 |
| `js/game.js` | 核心状态机（3662行） | ⚠️ 多处 P1 问题 |
| `js/ai.js` | AI 决策系统 | ⚠️ P1 软死锁风险 |
| `js/ai-opponent.js` | AI 存根（51行） | ⚠️ 未接入，死代码 |
| `js/app.js` | UI 渲染、页面导航 | ⚠️ 多处 P1 问题 |
| `js/campaign.js` | 关卡/物语系统 | ⚠️ goal 字段未使用 |
| `js/storage.js` | LocalStorage 封装 | ⚠️ has() 缺 try-catch |
| `js/skills.js` | 角色技能系统 | ✅ 正常 |
| `js/characters.js` | 角色定义 | ✅ 正常 |
| `js/commentary.js` | 实时解说系统 | ✅ 正常 |
| `js/tutorial.js` | 新手教学 | ✅ 基本完整 |
| `js/achievements.js` | 成就系统 | ✅ 正常 |
| `js/enhancements.js` | 向听数/牌计数/提示等 | ✅ 正常 |
| `js/game-modes.js` | 游戏模式定义 | ✅ 正常（仅数据） |
| `js/funny-enhance.js` | 趣味增强 | ❌ P0 浏览器崩溃 |
| `js/stats.js` | 数据统计 | ✅ 正常 |
| `js/rewards.js` | 每日奖励 | ✅ 基本正常 |
| `css/style.css` | 主样式 | ✅ 移动端适配好 |
| `css/tiles.css` | 牌面样式 | ✅ 响应式 |
| `css/animations.css` | 动画库 | ✅ 丰富 |

---

## 2. HTML / CSS 审查

- ✅ `viewport` 设置正确，含 `user-scalable=no` 和 `viewport-fit=cover`
- ✅ iOS PWA meta tags (`apple-mobile-web-app-capable`) 完整
- ✅ 牌面使用 DOM + SVG 渲染，非 Canvas，移动端友好
- ✅ 使用 `clamp()` 实现响应式牌面大小
- ⚠️ 无 ARIA 属性（无障碍支持缺失，P3）
- ⚠️ 操作按钮（吃碰杠胡）触控区域偏小，建议 min-height: 44px

---

## 3. JavaScript 核心逻辑

### 3a. 牌山系统

- ✅ **北京麻将**：34种牌 × 4 = 136张，正确
- ✅ **四川麻将**：27种牌 × 4 = 108张，正确
- ✅ **洗牌**：Fisher-Yates 算法，真随机
- ✅ **排序**：`sortHand()` 按花色+点数排列，不变原数组
- ✅ **发牌**：庄家先摸第14张（通过 startTurn 实现），逻辑正确
- ⚠️ `findChi()` 边界依赖不存在的 rank 0/-1/10，无显式边界检查（P1）

### 3b. 出牌/摸牌逻辑

- ✅ 摸牌从 `state.wall[state.drawIndex]` 取，索引正确递增
- ✅ 出牌从 `player.hand.splice(idx, 1)` 正确移除
- ✅ 出牌后手牌自动排序
- ❌ **`removeLastDiscard()` 溢出 bug**：河区牌过多后 `lastChild` 是溢出徽章而非牌 DOM（P1）
- ⚠️ 杠牌后补牌从牌山末尾（`wall.pop()`）抽取，✅ 正确；但补牌后若牌山已空未立即触发流局（P2）

### 3c. 吃碰杠判定

- ✅ **吃**：仅允许来自上家（`(discardPlayerIndex + 1) % 4 === playerIndex`），正确
- ✅ **碰**：优先级高于吃（reactions 排序：胡4 > 杠3 > 碰2 > 吃1）
- ✅ **明杠**：正确从牌山末尾补牌
- ✅ **暗杠**：正确从牌山末尾补牌
- ✅ **加杠**：正确升级已碰面子
- ⚠️ 四川规则下允许吃牌，标准四川麻将（血战）通常**禁止吃牌**（P1，需确认设计意图）

### 3d. 胡牌判定

- ✅ 基本胡牌型（4面子+1雀头）：递归分解算法，正确
- ✅ 七对子：检测正确
- ✅ 国士无双：检测正确（含边界处理）
- ✅ 自摸/荣和区分：`isTsumo` 参数传递正确
- ❌ **振听（振听）**：**完全未实现**（P1）——玩家可以对自己打出过的牌荣和

### 3e. 番数计算

**北京麻将：**
- ⚠️ **清一色/混一色**：只检查暗牌，不检查已副露面子的花色（P2）
- ⚠️ **三暗刻**：不计算暗杠面子（P1）
- ⚠️ **杠上花**：`isGangShang` 标志未传给 `calculateScore`，1番奖励永不触发（P2）
- ✅ 平胡、碰碰胡、七对、国士等核心番型正确

**四川麻将：**
- ⚠️ **对对胡**：已碰/杠面子不纳入 `extractMelds` 分析，对对胡误判（P1）
- ⚠️ **将对**：同上，locked melds 不参与分析（P2）

### 3f. AI 系统

- ✅ 出牌策略基于向听数（shanten）计算，不是纯随机
- ✅ AI 不读取隐藏牌（公平）
- ✅ 有个性化参数（aggressive/cautious/balanced 等）
- ❌ **AI 软死锁**：`delayedAction` 回调抛出异常时 Promise 永不 resolve，游戏卡死（P1）
- ❌ **`case 'defensive'` 重复**：switch 中第二个 `case 'defensive'` 死代码，`cautious` 性格获得错误的等待时机（P1）
- ⚠️ **向听数公式**：三张同牌既计入 `triplets` 又计入 `pairs`，向听数偏低（AI 高估胜率）（P2）
- ⚠️ 无操作超时保护（P1）

### 3g. 对局流程

- ✅ 分数结算：零和（每人扣分之和 = 胡家所得），正确
- ✅ 连庄/轮庄逻辑存在
- ✅ 流局（牌山摸完）触发并计算听牌罚符
- ❌ **无反应窗口超时**：玩家忽视吃碰杠胡按钮，游戏永久冻结（P1）
- ⚠️ 荣和分数仅付1倍，自摸3倍分摊——符合部分北京地方规则，但与标准规则有差异（P2）

---

## 4. 存档系统

- ✅ `save()` / `load()` / `remove()` 均有 try-catch
- ❌ **`has()` 无 try-catch**，私人浏览模式/配额超限下崩溃（P1）
- ❌ **无游戏中途存档**：刷新页面直接丢失当局（P2）
- ⚠️ `exportAll()` 无 try-catch（P2）

---

## 5. 附加功能

- ⚠️ **教学系统**：内容基本完整，但互动性弱（仅展示，无实际操作验证）（P3）
- ✅ 成就系统：触发条件合理
- ✅ 物语系统：关卡结构完整（5章×10关）
- ⚠️ `verifyCampaignGoal` 解析 `desc` 字符串而非 `goal.type` 结构体，维护风险高（P1）

---

## 6. 性能与安全

- ✅ DOM 渲染性能可接受（无大量重排）
- ✅ 动画使用 CSS transitions + `requestAnimationFrame`
- ❌ **`funny-enhance.js`**：`require('child_process')` 是 Node.js 专用 API，在浏览器中立即崩溃（P0）
- ❌ **`showFunnyCloud` 未定义**：调用时 `ReferenceError`（P1）
- ⚠️ `showFunnyFace(type)` 忽略 `type` 参数，永远显示 happy 表情（P2）
- ⚠️ `backToMenu()` 不清理 action bar，导致其显示在主页（P1）
- ⚠️ `showDialogue` 按钮重复绑定（inline onclick + addEventListener），双击可触发两次（P1）
- ⚠️ `ai-opponent.js` 是无用存根，与真实 `ai.js` 重复（P3）

---

## Bug 清单

### P0 — 致命（必须立刻修复）

| ID | 文件 | 描述 | 状态 |
|----|------|------|------|
| P0-1 | `funny-enhance.js:70` | `require('child_process')` 在浏览器中崩溃 → 改用 Web Speech API | ✅ 已修复 |
| P0-2 | `rules-sichuan.js` `checkCanHu` + `game.js` AI胡牌 | 缺一门漏洞（AI可绕过），双重修复：checkCanHu加参数 + AI决策前canPlayerHu验证 | ✅ 已修复 |

### P1 — 严重

| ID | 文件 | 行号 | 描述 | 状态 |
|----|------|------|------|------|
| P1-1 | `game.js` | ~3007 | `removeLastDiscard()` 溢出后删除 badge 而非牌 DOM | ✅ 已修复 |
| P1-2 | `game.js` | 全文 | 振听（振听）完全未实现 | ⏳ 待修复 |
| P1-3 | `rules-beijing.js` | ~414 | 三暗刻不计暗杠 locked melds | ✅ 已修复 |
| P1-4 | `rules-sichuan.js` | ~218 | 对对胡不计已碰/杠面子 | ✅ 已修复 |
| P1-5 | `ai.js` | ~386 | `delayedAction` 回调异常导致 Promise 挂起，AI 卡死 | ✅ 已修复 |
| P1-6 | `ai.js` | ~368 | `case 'defensive'` 重复，`cautious` 性格时机错误 | ✅ 已修复 |
| P1-7 | `game.js` | ~1909 | 无反应窗口超时，玩家忽视操作按钮游戏永久冻结 | ✅ 已修复（20秒自动过牌） |
| P1-8 | `app.js` | ~585 | `backToMenu` 不清理 action bar | ✅ 已修复 |
| P1-9 | `app.js` | ~474 | `showDialogue` 双重事件绑定 | ✅ 已修复 |
| P1-10 | `storage.js` | ~42 | `has()` 无 try-catch | ✅ 已修复 |
| P1-11 | `campaign.js`/`game.js` | ~3469 | `verifyCampaignGoal` 解析字符串而非 `goal.type` | ⏳ 待修复 |
| P1-12 | `funny-enhance.js` | ~148 | `showFunnyCloud` 未定义 | ✅ 已修复 |
| P1-13 | `rules-sichuan.js` | ~371 | 四川模式允许吃牌（标准规则禁吃） | ⏳ 需确认设计意图 |

### P2 — 中等

| ID | 文件 | 描述 |
|----|------|------|
| P2-1 | `rules-beijing.js` | 清一色/混一色不检查 locked melds 花色 |
| P2-2 | `game.js` | `isGangShang` 未传递，杠上花永不触发 |
| P2-3 | `ai.js` | 向听数公式双重计算三张牌，偏低 |
| P2-4 | `ai.js` | `chooseDiscard` 空手牌返回 undefined |
| P2-5 | `game.js` | 反应阶段不更新轮次指示器 |
| P2-6 | `rules-sichuan.js` | `isBloodWarComplete` 未去重 winners 数组 |
| P2-7 | `storage.js` | 无游戏中途存档 |
| P2-8 | `storage.js` | `exportAll()` 无 try-catch |
| P2-9 | `campaign.js` | `completeLevel` 不防御 NaN stars |

### P3 — 低

| ID | 描述 |
|----|------|
| P3-1 | ai-opponent.js 存根未接入，死代码 |
| P3-2 | `showFunnyFace` 忽略 type 参数 |
| P3-3 | CSS style 在模块加载时注入，未等 DOMContentLoaded |
| P3-4 | 国士无双 pair 检测逻辑可更明确 |
| P3-5 | Daily challenge rand() 无状态，多次调用返回相同值 |
| P3-6 | 无障碍（ARIA）属性完全缺失 |

---

## 麻将规则符合度评分：71/100

| 规则 | 实现状态 |
|------|---------|
| 136/108张牌初始化 | ✅ 正确 |
| Fisher-Yates洗牌 | ✅ 正确 |
| 发牌逻辑 | ✅ 正确 |
| 吃上家限制 | ✅ 正确 |
| 碰优先于吃 | ✅ 正确 |
| 胡>杠>碰>吃优先级 | ✅ 正确 |
| 明杠/暗杠/加杠补牌 | ✅ 正确 |
| 基本胡牌型检测 | ✅ 正确 |
| 七对子 | ✅ 正确 |
| 国士无双 | ✅ 正确 |
| 自摸/荣和区分 | ✅ 正确 |
| 振听规则 | ❌ 未实现 |
| 流局处理 | ✅ 基本正确 |
| 缺一门（四川） | ❌ P0漏洞 |
| 清一色/混一色 | ⚠️ locked melds缺陷 |
| 三暗刻 | ⚠️ 暗杠未计入 |
| 杠上花 | ⚠️ 永不触发 |
| 对对胡（四川） | ⚠️ locked melds缺陷 |

---

## 修复优先级建议

1. **P0-1** - funny-enhance.js require崩溃 → 立刻修复
2. **P0-2** - 四川缺一门漏洞 → 立刻修复
3. **P1-5** - AI Promise挂起 → 修复（防止游戏卡死）
4. **P1-7** - 操作按钮无超时 → 修复（防止游戏冻结）
5. **P1-8/P1-9** - app.js UI cleanup → 修复
6. **P1-1** - removeLastDiscard overflow → 修复
7. **P1-6** - AI switch bug → 修复
8. **P1-10** - storage.has() → 修复
9. **P1-12** - showFunnyCloud → 修复
10. 其余 P1 按影响范围排序修复
