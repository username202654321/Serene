export default async function run(page) {
  const routes = ["/", "/games", "/browser", "/chat", "/shop", "/profile", "/settings", "/studio"];
  const results = [];
  for (const route of routes) {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(500);
    results.push({ route, width: await page.evaluate(() => innerWidth), bodyHeight: await page.evaluate(() => document.body.scrollHeight), viewportHeight: await page.evaluate(() => innerHeight), text: (await page.locator("body").innerText()).slice(0, 120) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(300);
    results.push({ route, width: await page.evaluate(() => innerWidth), bodyHeight: await page.evaluate(() => document.body.scrollHeight), viewportHeight: await page.evaluate(() => innerHeight), text: (await page.locator("body").innerText()).slice(0, 120) });
  }
  return results;
}
