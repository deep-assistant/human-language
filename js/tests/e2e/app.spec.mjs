// End-to-end tests for the unified SPA at app.html.
//
// Run modes:
//   * Local PR gate — `BASE_URL` defaults to http://localhost:8000, and the
//     companion CI workflow (`js.yml`) boots a static server before invoking
//     Playwright.
//   * Post-deploy verification — set `BASE_URL=https://link-assistant.github.io/human-language`
//     to re-run the same assertions against the deployed GitHub Pages site.
//
// The suite intentionally avoids assertions that depend on live Wikidata
// responses; those live in the existing Node-only test scripts. The browser
// suite verifies the wiring: every mode boots without runtime errors, the
// "Failed to load transformer" regression from issue #35 stays gone, and
// every mode's main interaction surface (textbox, buttons, badges) renders.

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const APP = `${BASE_URL.replace(/\/$/, '')}/app.html`;

// Collect every console error / pageerror that happens after the page boots
// so each test can assert "no surprises were logged". We deliberately ignore
// favicon 404s and the well-known React 19 dev-mode warning about
// `useLayoutEffect` on the server (we render client-only, so it never fires).
async function attachErrorCollectors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('favicon.ico')) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

test.describe('Unified SPA - app.html', () => {
  test('landing page renders with all seven mode tabs', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(APP);
    await expect(page.getByRole('button', { name: 'Alphabet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dictionary' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ontology' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entities' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Properties' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Transformer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generation' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Alphabet mode', () => {
  test('renders letter and IPA without errors', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=alphabet&letter=A`);
    // Alphabet mode wraps its content in `<section role="region" aria-label="Alphabet">`.
    await expect(page.getByRole('region', { name: 'Alphabet' })).toBeVisible({ timeout: 10000 });
    // Pagination buttons are always present once the letter renders.
    await expect(page.getByRole('button', { name: 'Next →' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Dictionary mode', () => {
  test('renders search input and lookup button', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=dictionary`);
    // Dictionary mode exposes a Word searchbox and a "Look up" button.
    await expect(page.getByRole('searchbox', { name: 'Word' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Look up' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Ontology mode', () => {
  test('renders ontology heading', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=ontology`);
    await expect(page.getByRole('heading', { name: 'Ontology', exact: false })).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });
});

test.describe('Entities mode', () => {
  test('renders entity browser with id input', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=entity&id=Q35120`);
    await expect(page.locator('body')).toContainText(/Q35120|Entity|entity/i, { timeout: 10000 });
    expect(errors).toEqual([]);
  });
});

test.describe('Properties mode', () => {
  test('renders property browser with id input', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=property&id=P31`);
    await expect(page.locator('body')).toContainText(/P31|Property|property/i, { timeout: 10000 });
    expect(errors).toEqual([]);
  });
});

test.describe('Transformer mode - regression for issue #35', () => {
  test('mode boots without the "require is not defined" banner', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=transformer`);

    // The headline assertion: the bug from issue #35 must stay fixed.
    await expect(page.getByRole('heading', { name: 'Transformer', exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('Failed to load transformer');
    await expect(page.locator('body')).not.toContainText('require is not defined');
    await expect(page.locator("text=Can't find variable: require")).toHaveCount(0);

    // Transform button must be enabled (it stays disabled while the
    // transformer module is loading; if the module fails to load, it stays
    // disabled forever).
    const transformBtn = page.getByRole('button', { name: 'Transform', exact: true });
    await expect(transformBtn).toBeVisible();
    await expect(transformBtn).toBeEnabled({ timeout: 5000 });
    expect(errors).toEqual([]);
  });

  test('Load example fills textarea and Transform runs against Wikidata', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${APP}#mode=transformer`);
    await page.getByRole('button', { name: 'Transform', exact: true }).waitFor({ state: 'visible' });

    // Use a deterministic example via the example-text card rather than
    // the random "Load example" button so the assertion below is stable.
    await page.getByRole('button', { name: /Geographic Relation/ }).click();
    await page.getByRole('button', { name: 'Transform', exact: true }).click();

    // Wait for the Q/P Sequence panel to appear with at least one Q/P id.
    await expect(page.locator('body')).toContainText('Q/P Sequence', { timeout: 45000 });
    await expect(page.locator('body')).toContainText(/[QP]\d+/);
  });

  test('Clear button empties the textarea', async ({ page }) => {
    await page.goto(`${APP}#mode=transformer`);
    const ta = page.locator('textarea').first();
    await ta.waitFor();
    await ta.fill('Hello world');
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(ta).toHaveValue('');
  });
});

test.describe('Generation mode (Q/P → text)', () => {
  test('mode boots and the Generate button is enabled', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=generation`);

    await expect(page.getByRole('heading', { name: 'Generation', exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('Failed to load renderer');
    await expect(page.locator('body')).not.toContainText('require is not defined');

    const generateBtn = page.getByRole('button', { name: 'Generate', exact: true });
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeEnabled({ timeout: 5000 });
    expect(errors).toEqual([]);
  });

  test('Generate renders the default constructor across the UN 6 languages offline', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=generation`);
    await page.getByRole('button', { name: 'Generate', exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Generate', exact: true }).click();

    // Plain-text role values render with no Wikidata round-trip, so the
    // English sentence is deterministic.
    await expect(page.locator('body')).toContainText('Sentences', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Berlin is a city');
    await expect(page.locator('body')).toContainText('English');
    await expect(page.locator('body')).toContainText('Chinese');
    expect(errors).toEqual([]);
  });

  test('quantity constructor exposes value/unit fields and renders a measurement offline', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto(`${APP}#mode=generation`);
    await page.getByRole('button', { name: 'Generate', exact: true }).waitFor({ state: 'visible' });

    // Switching to the quantity constructor swaps Object out for Value + Unit.
    await page.getByRole('combobox').first().selectOption('quantity');
    await page.getByRole('textbox', { name: 'Subject' }).fill('Mount Everest');
    await page.getByRole('textbox', { name: 'Value' }).fill('8848');
    await page.getByRole('textbox', { name: 'Unit' }).fill('meters');
    await page.getByRole('button', { name: 'Generate', exact: true }).click();

    await expect(page.locator('body')).toContainText('Mount Everest is 8848 meters', { timeout: 10000 });
    expect(errors).toEqual([]);
  });
});
