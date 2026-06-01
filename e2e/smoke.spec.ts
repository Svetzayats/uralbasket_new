import { test, expect, type Page } from '@playwright/test';

// Collect unhandled JS exceptions per test
function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  return () => errors;
}

// ── Static pages ─────────────────────────────────────────────────────────────

const staticRoutes: Array<{ path: string; heading: RegExp }> = [
  { path: '/',         heading: /UralBasket|Корзины|Каталог/i },
  { path: '/baskets',  heading: /Корзины/i },
  { path: '/trade',    heading: /Торговое оборудование/i },
  { path: '/design',   heading: /Интерьер и дизайн/i },
  { path: '/boxes',    heading: /Сундуки/i },
  { path: '/blog',     heading: /Блог/i },
  { path: '/contacts', heading: /Контакты/i },
  { path: '/about',    heading: /О нас/i },
  { path: '/delivery', heading: /Оплата|Доставка/i },
];

// ── Dynamic routes ────────────────────────────────────────────────────────────
// Keep in sync with content in src/content/products/ and src/content/blog/

const productRoutes = [
  '/product/podarochnaya-korzina-bolshaya',
  '/product/sunduk-dekorativny',
  '/product/torgovy-latok-dlya-kafe',
];

const blogRoutes = [
  '/blog/kak-vybrat-korzinu-dlya-podarka',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function expectPageOk(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `${path} → HTTP status`).toBe(200);
  await expect(page.locator('.site-header nav'), `${path} → nav present`).toBeVisible();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Static pages — 200 + nav + heading', () => {
  for (const { path, heading } of staticRoutes) {
    test(path, async ({ page }) => {
      const getErrors = trackPageErrors(page);
      await expectPageOk(page, path);
      await expect(page.locator('h1, h2').first(), `${path} → heading`).toContainText(heading);
      expect(getErrors(), `${path} → no JS exceptions`).toHaveLength(0);
    });
  }
});

test.describe('Product detail pages — 200 + nav + h1', () => {
  for (const path of productRoutes) {
    test(path, async ({ page }) => {
      const getErrors = trackPageErrors(page);
      await expectPageOk(page, path);
      await expect(page.locator('h1'), `${path} → h1 present`).toBeVisible();
      expect(getErrors(), `${path} → no JS exceptions`).toHaveLength(0);
    });
  }
});

test.describe('Blog post pages — 200 + nav + h1', () => {
  for (const path of blogRoutes) {
    test(path, async ({ page }) => {
      const getErrors = trackPageErrors(page);
      await expectPageOk(page, path);
      await expect(page.locator('h1'), `${path} → h1 present`).toBeVisible();
      expect(getErrors(), `${path} → no JS exceptions`).toHaveLength(0);
    });
  }
});

// ── Special pages ─────────────────────────────────────────────────────────────

test('404 page — unknown route returns 404 status and shows heading', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist-xyz');
  expect(response?.status()).toBe(404);
  await expect(page.getByText('Страница не найдена')).toBeVisible();
  await expect(page.locator('.site-header nav')).toBeVisible();
});

test('admin page — 200 and Decap CMS mounts', async ({ page }) => {
  const response = await page.goto('/admin/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Управление контентом/);
  // Decap CMS mounts its root element after loading
  await expect(page.locator('#nc-root')).toBeVisible();
});

test('order form is present on product detail page', async ({ page }) => {
  await page.goto('/product/podarochnaya-korzina-bolshaya');
  await expect(page.locator('.order-form'), 'order form present on product page').toBeVisible();
  await expect(page.locator('#of-name')).toBeVisible();
  await expect(page.locator('#of-phone')).toBeVisible();
  await expect(page.locator('#of-email')).toBeVisible();
});

test('order form is present on contacts page', async ({ page }) => {
  await page.goto('/contacts');
  await expect(page.locator('.order-form'), 'order form present on contacts page').toBeVisible();
});

test('product gallery thumbnail switches main image', async ({ page }) => {
  // Only run on a product known to have multiple images — skip gracefully if not
  await page.goto('/product/podarochnaya-korzina-bolshaya');
  const thumbs = page.locator('.thumb-btn');
  const count = await thumbs.count();
  if (count < 2) {
    test.skip();
    return;
  }
  const mainImg = page.locator('#gallery-active');
  const before = await mainImg.getAttribute('src');
  await thumbs.nth(1).click();
  const after = await mainImg.getAttribute('src');
  expect(after).not.toBe(before);
});
