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
  await expect(page.getByRole('heading', { name: '다음 탐험은 이렇게 이어져요' })).toBeVisible();
  await expect(page.locator('.home-crew')).toBeVisible();
  await expect(page.locator('.quest-stat-row--quiet')).toBeVisible();
  await page.getByRole('button', { name: '탐험 미션' }).click();
  await expect(page.getByRole('heading', { name: '오늘의 탐험 지도' })).toBeVisible();
  await expect(page.locator('.mission-path')).toBeVisible();
  await expect(page.getByRole('button', { name: '이어서 탐험' })).toBeVisible();
  await expect(page.getByText('정리 도구', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '홈으로' }).click();
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
  await expect(page.locator('.completion-achievement')).toContainText('끝까지');
  await expect(page.locator('.completion-next')).toBeVisible();
  await expect(page.getByText('오늘의 기록 보기', { exact: true })).toBeVisible();
  expect(await page.locator('.completion-mark').evaluate(el=>getComputedStyle(el).animationName)).toContain('hide-v2-complete-pop');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.completion-mark').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.getByRole('button', { name: '기억 사다리 보기' }).click();
  await expect(page.getByRole('heading', { name: '기억 사다리' })).toBeVisible();
  await expect(page.locator('.ladder-board')).toBeVisible();
  await expect(page.locator('.ladder-rung')).toHaveCount(3);
  await expect(page.getByText('다시 찾을 단어', { exact: true })).toBeVisible();
  await expect(page.getByText('올라가는 단어', { exact: true })).toBeVisible();
  await expect(page.getByText('안정된 단어', { exact: true })).toBeVisible();
  await expect(page.getByText('다시 찾기 길', { exact: true })).toBeVisible();
  await expect(page.getByText('기억 기록 자세히 보기', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '이 단어는 지금 어떤 길일까?' })).toBeVisible();
  await expect(page.locator('.memory-why-card')).toBeVisible();
  await page.getByRole('button', { name: '짧은 응원' }).click();
  await expect(page.locator('.memory-crew-copy')).not.toContainText('island');
  await expect(page.locator('.memory-crew-copy')).not.toContainText('섬');

  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
});
