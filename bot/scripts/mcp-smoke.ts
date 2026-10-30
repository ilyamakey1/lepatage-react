// Проверка MCP-сервера lepatage-stock так, как его видит Hermes: stdio + SDK-клиент, реальная база (только чтение).
// Запуск из bot/: npx tsx scripts/mcp-smoke.ts
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath = fileURLToPath(new URL('../src/mcp-server.ts', import.meta.url));
const tsx = fileURLToPath(new URL('../node_modules/.bin/tsx', import.meta.url));

const client = new Client({ name: 'mcp-smoke', version: '0.0.0' });
await client.connect(
  new StdioClientTransport({
    command: tsx,
    args: [serverPath],
    env: { ...(process.env as Record<string, string>), ...(process.env.CATALOG_DB_URL ? { CATALOG_DB_URL: process.env.CATALOG_DB_URL } : {}) },
  }),
);

const call = async (name: string, args: Record<string, unknown>) => {
  const r = (await client.callTool({ name, arguments: args })) as { content: Array<{ type: string; text: string }> };
  return JSON.parse(r.content[0].text);
};

console.log('tools:', (await client.listTools()).tools.map((t) => t.name).join(', '));

const found = await call('search_products', { query: 'vivienne' });
console.log('\nsearch_products("vivienne"):');
for (const p of found) console.log(`  #${p.id} ${p.name} — ${p.priceText} [${p.kind}] score=${p.score}`);

const belt = (await call('search_products', { query: 'пояс элеганс' }))[0];
const q = await call('quote', { items: [{ productId: belt.id, qty: 2 }] });
console.log(`\nquote(2× ${belt.name}, id ${belt.id}):`);
for (const l of q.lines) console.log(`  ${l.text}; за шт. ${l.unitPrice} (обычная ${l.regularUnitPrice}); наличие: ${l.availability}`);
console.log(`  итого ${q.formatted.subtotal}, скидка ${q.formatted.discountTotal}, доставка: ${q.delivery}, errors: ${q.errors.length}`);

await client.close();
