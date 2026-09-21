const { test, expect } = require('@playwright/test');

test('Hide V2 presents one continuous child journey and a completion moment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('hide_seek_v2_state', JSON.stringify({
      version: 1,
      profile: { displayName: 'journey' },
      missions: [{
        id: 'm-journey',
        title: '오늘의 단어 탐험',
        status: 'READY',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [{
          id: 'w1',
          lexicalId: 'island::섬',
          token: 'island',
          meaning: '섬',
          languageDomain: 'ENGLISH',
          missionRole: 'NEW',
          evidence: [],
          source: {}
        }],
        sourceCount: 0,
        provenance: {}
      }],
      activeMissionId: 'm-journey',
      activeSession: null,
      captureSession: null,
      events: [],
      updatedAt: new Date().toISOString()
    }));
  });

  await page.goto('/v2.html');
  await page.getByRole('button', { name: '탐험 시작' }).click();

  const path = page.locator('.journey-path');
  await expect(path).toBeVisible();
  await expect(path.locator('li')).toHaveCount(6);
  await expect(path.locator('li.is-current small')).toHaveText('01 만나기');

  await page.getByRole('button', { name: '기억하고 찾아보기' }).click();
  await expect(page.locator('.journey-path li.is-current small')).toHaveText('02 첫 찾기');

  await page.getByLabel('회상 답 입력').fill('island');
  await page.getByRole('button', { name: '기억 확인' }).click();
  await page.getByLabel('뜻 회상 입력').fill('섬');
  await page.getByRole('button', { name: '뜻 확인' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('최종 회상 답 입력').fill('island');
  await page.getByRole('button', { name: '마지막 기억 확인' }).click();

  await expect(page.getByRole('heading', { name: '탐험 완료' })).toBeVisible();
  await expect(page.locator('.completion-mark')).toBeVisible();
  await expect(page.locator('.completion-crew')).toBeVisible();

  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
});
