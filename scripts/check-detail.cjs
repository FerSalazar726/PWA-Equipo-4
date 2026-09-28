// Requiere un servidor iniciado y Playwright disponible. No modifica los datos.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const screenshots = process.argv.includes('--screenshots');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    // El worker no debe ocultar las respuestas simuladas con su caché.
    const context = await browser.newContext({ baseURL, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const capture = async name => {
      if (screenshots) await page.screenshot({ path: path.resolve('evidence', `oscar-semana4-${name}.png`), fullPage: true, animations: 'disabled' });
    };

    // El listado tiene datos en su HTML; el detalle inicial solo muestra la carga.
    const initial = await context.request.get('/inspecciones/inspection-001');
    assert.equal(initial.status(), 200);
    assert.match(await initial.text(), /loading-skeleton/);
    await page.goto('/inspecciones');
    for (const id of ['inspection-001', 'inspection-002', 'inspection-003']) {
      const api = await context.request.get(`/api/inspecciones/${id}`);
      assert.equal(api.status(), 200);
      const data = await api.json();
      await page.locator(`a[href="/inspecciones/${id}"]`).click();
      await page.locator('.inspection-detail').waitFor();
      assert.deepEqual(await page.locator('.inspection-detail dd').allTextContents(), [
        data.location, data.date, data.inspector, data.statusLabel, String(data.findings), data.summary,
      ]);
      if (id === 'inspection-001') {
        for (const width of [1280, 390, 320]) {
          await page.setViewportSize({ width, height: 900 });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          if (width !== 320) await capture(`detalle-${width}`);
        }
      }
      await page.getByRole('link', { name: 'Volver al listado de inspecciones' }).click();
    }
    console.log('PASS: navegación desde los tres enlaces, seis campos correctos, retorno y vistas 1280/390/320.');

    await page.goto('/inspecciones/no-existe');
    await page.getByRole('heading', { name: 'No se encontró la inspección.' }).waitFor();
    assert.equal(await page.locator('.state-empty[role="status"]').count(), 1);
    assert.equal(await page.locator('main [role="alert"]').count(), 0);
    await capture('no-encontrado');
    console.log('PASS: ID inexistente muestra EmptyState.');

    const apiPattern = '**/api/inspecciones/inspection-001';
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route(apiPattern, async route => { await gate; await route.continue(); });
    await page.goto('/inspecciones/inspection-001');
    await page.locator('.loading-skeleton').waitFor();
    assert.equal(await page.locator('.loading-skeleton').getAttribute('role'), 'status');
    assert.equal(await page.locator('.loading-skeleton').getAttribute('aria-live'), 'polite');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.skeleton-line').first().evaluate(el => getComputedStyle(el).animationName), 'none');
    await capture('carga');
    release();
    await page.locator('.inspection-detail').waitFor();
    await page.unroute(apiPattern);
    console.log('PASS: carga mientras la API espera, éxito posterior y movimiento reducido.');

    for (const mode of ['http500', 'network', 'invalid-json']) {
      await page.route(apiPattern, route => mode === 'network' ? route.abort('failed') : route.fulfill({
        status: mode === 'http500' ? 500 : 200,
        contentType: 'application/json', body: mode === 'http500' ? '{}' : '{json inválido',
      }));
      await page.reload();
      await page.locator('main').getByRole('alert').waitFor();
      assert.match(await page.locator('main').getByRole('alert').textContent(), /No se pudo cargar el detalle de la inspección/);
      assert.equal(await page.locator('.inspection-detail').count(), 0);
      if (mode === 'http500') await capture('error');
      await page.unroute(apiPattern);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: HTTP 500, fallo de red y JSON inválido muestran ErrorState sin excepciones JS.');
    await context.close();

    // Verificación adicional sin bloquear el service worker existente.
    const integrated = await browser.newContext({ baseURL });
    const integratedPage = await integrated.newPage();
    await integratedPage.goto('/inspecciones');
    await integratedPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await integratedPage.locator('a[href="/inspecciones/inspection-002"]').click();
    await integratedPage.locator('.inspection-detail').waitFor();
    assert.match(await integratedPage.locator('.inspection-detail').textContent(), /Laboratorio de Electrónica/);
    await integrated.close();
    console.log('PASS: listado y detalle funcionan con el service worker activo.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
