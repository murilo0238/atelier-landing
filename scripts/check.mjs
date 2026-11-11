// Verificação local: servidor estático + Playwright (capturas e checagens de comportamento).
// Uso: npm install && npx playwright install chromium && npm run check [-- pasta-capturas]
// PLAYWRIGHT_FROM=<pasta> usa o Playwright instalado em outro projeto; BASE_URL=<url> testa um site publicado.
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join, resolve } from "node:path";

const require = createRequire(process.env.PLAYWRIGHT_FROM ? `${process.env.PLAYWRIGHT_FROM}/` : import.meta.url);
const { chromium, devices } = require("@playwright/test");

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const out = process.argv[2] ?? join(root, "..", "atelier-shots");
mkdirSync(out, { recursive: true });
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2" };

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = join(root, p);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(4321);

const base = process.env.BASE_URL || "http://localhost:4321/";
const browser = await chromium.launch();
const report = [];

for (const [name, opts] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["tablet", { viewport: { width: 820, height: 1180 } }],
  ["mobile", devices["iPhone 13"]],
  ["small", { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }],
]) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await page.goto(base, { waitUntil: "networkidle" });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: `${out}/${name}-hero.png` });
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  report.push(`[${name}] overflow horizontal: ${overflow}px · erros: ${errors.length ? errors.join(" | ") : "nenhum"}`);
  await ctx.close();
}

// Comportamento (com animações ativas)
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Abrir menu" }).click();
report.push(`[menu] aberto: ${await page.locator("#menu").isVisible()}`);
await page.locator("#menu").getByRole("link", { name: /Projetos/ }).click();
await page.waitForTimeout(900);
report.push(`[menu] fechou ao navegar: ${await page.locator("#menu").isHidden()} · barra visível: ${await page.locator(".bar").evaluate((b) => b.classList.contains("is-visible"))}`);
await page.screenshot({ path: `${out}/mobile-scrolled.png` });

await page.locator("[data-picker]").evaluate((el) => el.scrollIntoView({ block: "center" }));
await page.getByRole("button", { name: "Próximo projeto" }).click();
await page.waitForTimeout(400);
report.push(`[seletor] após próximo: ${await page.locator("[data-picker-name]").textContent()}`);

await page.locator("[data-form]").evaluate((el) => el.scrollIntoView({ block: "center" }));
await page.getByRole("button", { name: /Solicitar uma consulta/ }).click();
report.push(`[form] vazio: ${await page.locator("[data-form-msg]").textContent()}`);
await page.getByLabel("Nome").fill("Ana Souza");
await page.getByLabel("E-mail").fill("ana@exemplo.com");
await page.getByLabel("Sobre o projeto").fill("Casa de campo");
await page.getByRole("button", { name: /Solicitar uma consulta/ }).click();
report.push(`[form] válido: ${(await page.locator("[data-form-msg]").textContent()).slice(0, 70)}…`);
await page.waitForTimeout(1200);
await page.locator("#contato").screenshot({ path: `${out}/mobile-contato.png` });

const revealed = await page.evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight);
  return document.querySelectorAll(".reveal:not(.in)").length;
});
report.push(`[reveal] ainda ocultos após rolar tudo: ${revealed} (normal se > 0 só no topo)`);
await ctx.close();

await browser.close();
server.close();
console.log(report.join("\n"));
