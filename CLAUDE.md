# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Game Does

Full Chinese mahjong game featuring Hello Kitty characters. Supports Beijing rules and Sichuan (血战到底) rules. 4-player with 3 AI opponents. Deployed to GitHub Pages, playable on iOS Safari.

## No Build Step

Pure vanilla JS. Open `index.html` in browser. Deploy: `git push` → GitHub Pages auto-deploys.

## Architecture

| File | Role |
|------|------|
| `game.js` | **Core state machine**: wall, drawing, discarding, reactions (chi/peng/gang/hu), win detection, scoring. All game state lives here. |
| `ai.js` | AI opponent decision making — personality-based timing and discard strategy |
| `rules-sichuan.js` | Sichuan-specific scoring: fan counting, 缺一门 (que yi men) validation |
| `app.js` | UI rendering, navigation, campaign mode progression |
| `skills.js` | Character skill system — each Hello Kitty character has unique abilities |
| `commentary.js` | Real-time commentary (must be started via `init()`) |

## Critical Bug Pattern

`state.campaignLevel` is a level **object**, not an ID number. Always extract `.id` before calling `Campaign.getLevel(id)`. Accessing it directly as an ID causes wrong level to load.

## Discard Pile Layout Rules

Each player's discard pond (河) should display tiles in rows of 6, max 3 rows. Never free-float or stack tiles randomly — they become unclickable. Player seating: bottom = 我, right = 下家, top = 对家, left = 上家. Side players' tiles should be rotated 90°.

## Tile Sizing on Mobile

Use CSS `clamp()` for responsive tile sizes: `clamp(22px, calc((100vw - 20px) / 14), 34px)` for the bottom hand. Side opponent columns: max 36px wide. This prevents overflow on iPhone screens (430px wide).

## Deployment

```bash
git add -A && git commit -m "..." && git push
```
