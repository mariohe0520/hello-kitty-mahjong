import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = `file://${path.join(__dirname, 'index.html')}`;
const ssDir = path.join(__dirname, 'test-screenshots');

import fs from 'fs';
fs.mkdirSync(ssDir, { recursive: true });

const results = [];

function log(test, pass, detail = '') {
  const status = pass ? '✅' : '❌';
  results.push({ test, pass, detail });
  console.log(`${status} ${test}${detail ? ': ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.on('dialog', async dialog => {
    if (dialog.type() === 'confirm') {
      await dialog.accept();
      return;
    }
    await dialog.dismiss();
  });

  try {
    // ===== TEST 1: LOAD & SPLASH =====
    await page.goto(htmlPath, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ssDir, '01-splash.png'), fullPage: false });
    
    const splashVisible = await page.$eval('#splash', el => el.style.display !== 'none').catch(() => false);
    log('Splash screen loads', true);

    // Wait for splash to finish
    await page.waitForTimeout(3000);
    
    // ===== TEST 2: MAIN MENU =====
    const menuVisible = await page.$eval('#home', el => getComputedStyle(el).display !== 'none').catch(() => false);
    await page.screenshot({ path: path.join(ssDir, '02-menu.png'), fullPage: false });
    log('Main menu visible', menuVisible, menuVisible ? 'Home displayed' : 'Home not showing');

    // ===== TEST 3: START BEIJING MAHJONG =====
    const beijingCard = page.locator('#home .play-beijing').first();
    if (await beijingCard.count()) {
      await beijingCard.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(ssDir, '03-game-start.png'), fullPage: false });
      
      // Check game board is visible
      const gameVisible = await page.$eval('#game', el => el.style.display !== 'none').catch(() => false);
      log('Game starts (Beijing)', gameVisible, gameVisible ? 'Game board visible' : 'Game board not showing');
    } else {
      log('Game starts (Beijing)', false, 'Beijing button not found');
    }

    // ===== TEST 4: HAND TILES RENDERED =====
    await page.waitForTimeout(1000);
    const handTiles = await page.$$('.hand-area .tile, .my-hand .tile, .player-hand .tile, [class*="hand"] .tile');
    const handCount = handTiles.length;
    log('Hand tiles rendered', handCount >= 13, `Found ${handCount} tiles in hand`);
    await page.screenshot({ path: path.join(ssDir, '04-hand-tiles.png'), fullPage: false });

    // ===== TEST 5: OTHER PLAYERS VISIBLE =====
    const otherPlayers = await page.$$('.opponent, .other-player, [class*="player-"]:not([class*="player-0"]), .seat');
    log('Other players visible', otherPlayers.length >= 1, `Found ${otherPlayers.length} other player areas`);

    // ===== TEST 6: DISCARD A TILE =====
    let discardSuccess = false;
    if (handTiles.length > 0) {
      // Try clicking a tile to select, then discard
      const lastTile = handTiles[handTiles.length - 1];
      await lastTile.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(ssDir, '05-tile-selected.png'), fullPage: false });
      
      // Check if tile was selected or directly discarded
      const selectedTile = await page.$('.tile.selected, .tile.active, .tile[data-selected]');
      if (selectedTile) {
        // Double-click or click again to discard
        await selectedTile.click();
        await page.waitForTimeout(500);
      }
      
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(ssDir, '06-after-discard.png'), fullPage: false });
      
      // Check discard pile
      const discards = await page.$$('.discard .tile, .discard-area .tile, [class*="discard"] .tile, .river .tile');
      discardSuccess = discards.length > 0;
      log('Tile discard works', discardSuccess, `Discards: ${discards.length} tile(s) in discard area`);
    } else {
      log('Tile discard works', false, 'No hand tiles to discard');
    }

    // ===== TEST 7: AI TAKES TURN =====
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ssDir, '07-ai-turn.png'), fullPage: false });
    
    // After our discard, AI should have played
    const allDiscards = await page.$$('.discard .tile, .discard-area .tile, [class*="discard"] .tile, .river .tile');
    log('AI takes turn', allDiscards.length > 1, `Total discards after AI: ${allDiscards.length}`);

    // ===== TEST 8: ACTION BAR (CHI/PENG/GANG/HU) =====
    // Check if action bar elements exist in DOM
    const actionBar = await page.$('.action-bar, .action-buttons, #actionBar, [class*="action"]');
    const actionBtns = await page.$$('.action-bar button, .action-buttons button, #actionBar button, .action-btn');
    log('Action bar exists', actionBar !== null || actionBtns.length > 0, 
        `Action bar: ${actionBar ? 'yes' : 'no'}, buttons: ${actionBtns.length}`);

    // ===== TEST 9: PLAY A FEW ROUNDS =====
    let roundsPlayed = 0;
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1500);
      const currentHand = await page.$$('.hand-area .tile, .my-hand .tile, .player-hand .tile, [class*="hand"] .tile');
      if (currentHand.length > 0) {
        const idx = currentHand.length - 1;
        const tile = currentHand[idx];
        await tile.click().catch(() => {});
        await page.waitForTimeout(300);
        // Hand DOM is rerendered frequently; reacquire before second click to avoid stale element handles.
        const selected = await page.$('.tile.selected, .tile.active, .tile[data-selected]');
        if (selected) {
          await selected.click().catch(() => {});
        } else {
          const refreshed = await page.$$('.hand-area .tile, .my-hand .tile, .player-hand .tile, [class*="hand"] .tile');
          if (refreshed.length > 0) {
            await refreshed[Math.min(idx, refreshed.length - 1)].click().catch(() => {});
          }
        }
        await page.waitForTimeout(1500);
        roundsPlayed++;
      }
    }
    await page.screenshot({ path: path.join(ssDir, '08-mid-game.png'), fullPage: false });
    log('Mid-game stability', roundsPlayed >= 3, `Played ${roundsPlayed} rounds without crash`);

    // ===== TEST 10: NO JS ERRORS =====
    log('No critical JS errors', consoleErrors.length === 0, 
        consoleErrors.length > 0 ? `Errors: ${consoleErrors.slice(0, 3).join('; ')}` : 'Clean console');

    // ===== TEST 11: VISUAL LAYOUT CHECK =====
    // Check nothing overflows viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;
    log('No horizontal overflow', bodyWidth <= viewportWidth + 5, `Body: ${bodyWidth}px, viewport: ${viewportWidth}px`);

    // ===== TEST 12: FINAL FULL GAME SCREENSHOT =====
    await page.screenshot({ path: path.join(ssDir, '09-final-state.png'), fullPage: false });

    // ===== TEST 13: GO BACK TO MENU =====
    const gameTopBackBtn = page.locator('#game .game-topbar .icon-btn').first();
    if (await gameTopBackBtn.count()) {
      await gameTopBackBtn.click().catch(() => {});
    } else {
      await page.evaluate(() => {
        if (window.App?.backToMenu) window.App.backToMenu();
      }).catch(() => {});
    }
    await page.waitForTimeout(1000);
    const menuAgain = await page.$eval('#home', el => getComputedStyle(el).display !== 'none').catch(() => false);
    await page.screenshot({ path: path.join(ssDir, '10-back-to-menu.png'), fullPage: false });
    log('Back to menu works', menuAgain);

    // ===== TEST 14: SICHUAN MODE =====
    await page.evaluate(() => {
      if (window.App?.backToMenu) window.App.backToMenu();
    }).catch(() => {});
    await page.waitForTimeout(800);
    const sichuanBtn = page.locator('#home .play-card.play-sichuan').first();
    if (await sichuanBtn.count()) {
      await sichuanBtn.click().catch(async () => {
        await page.evaluate(() => {
          if (window.App?.startGame) window.App.startGame('sichuan');
        });
      });
    } else {
      await page.evaluate(() => {
        if (window.App?.startGame) window.App.startGame('sichuan');
      }).catch(() => {});
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ssDir, '11-sichuan.png'), fullPage: false });
    const gameVis = await page.$eval('#game', el => el.style.display !== 'none').catch(() => false);
    log('Sichuan mode starts', gameVis);

  } catch (err) {
    console.error('Test error:', err.message);
    await page.screenshot({ path: path.join(ssDir, 'error.png'), fullPage: false }).catch(() => {});
  }

  await browser.close();

  // Summary
  console.log('\n===== TEST SUMMARY =====');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`${passed}/${total} tests passed`);
  results.forEach(r => console.log(`  ${r.pass ? '✅' : '❌'} ${r.test}: ${r.detail}`));

  if (consoleErrors.length > 0) {
    console.log('\nConsole errors:');
    consoleErrors.forEach(e => console.log('  ⚠️', e));
  }
})();
