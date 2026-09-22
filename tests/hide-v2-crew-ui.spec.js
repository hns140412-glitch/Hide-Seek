const { test, expect } = require('@playwright/test');

test('Hide V2 shows exploration crew as answer-safe companion without mobile overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.SnapExplorationCrewRuntime = {
      presentation() {
        return {
          displayName: '탐험대원',
          avatarText: '탐',
          supportText: '정답 대신 짧은 단서만 같이 찾아봐요.',
          sourceAuthority: 'SNAP_POP_EXPLORATION_CREW'
        };
      },
      minimalSupport() {
        return {
          text: '뜻을 천천히 떠올려 봐요. 정답은 아직 보여주지 않을게요.',
          revealsAnswer: false
        };
      }
    };
    localStorage.setItem('hide_seek_v2_state', JSON.stringify({
      version: 1,
      profile: { displayName: 'crew-test' },
      missions: [{
        id: 'm-crew',
        title: '탐험대원 미션',
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
      activeMissionId: 'm-crew',
      activeSession: null,
      captureSession: null,
      events: [],
      updatedAt: new Date().toISOString()
    }));
  });

  await page.goto('/v2.html');
  await page.getByRole('button', { name: '탐험 시작' }).click();

  const strip = page.locator('.crew-strip');
  await expect(strip).toBeVisible();
  await expect(strip.getByText('탐험대원', { exact: true })).toBeVisible();
  await expect(strip.locator('.crew-support-copy')).toHaveText('정답 대신 짧은 단서만 같이 찾아봐요.');
  await expect(strip).not.toContainText('island');

  await strip.getByRole('button', { name: '짧은 응원' }).click();
  await expect(strip.locator('.crew-support-copy')).toHaveText('뜻을 천천히 떠올려 봐요. 정답은 아직 보여주지 않을게요.');

  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    stripRight: document.querySelector('.crew-strip').getBoundingClientRect().right
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
  expect(metrics.stripRight).toBeLessThanOrEqual(391);
});
