// stdio MCP-сервер `lepatage-stock` для Hermes Agent: каталог, наличие и расчёт цены по базе сайта.
// stdout занят протоколом MCP — логировать только в stderr.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { createCatalog, MAX_QTY, openCatalogDb, type Catalog } from './catalog.js';
import { DEFAULT_CATALOG_DB_URL } from './paths.js';

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] });

const options = {
  size: z.string().optional().describe('Размер, например "S" или "M"'),
  color: z.string().optional().describe('Цвет словом ("черный", "бордовый") или hex ("#000000")'),
  model: z.string().optional().describe('Модель, если у товара есть выбор моделей'),
};

export function createMcpServer(catalog: Catalog): McpServer {
  const server = new McpServer({ name: 'lepatage-stock', version: '0.1.0' });

  server.registerTool(
    'list_catalog',
    {
      description:
        'Список товаров L\'EPATAGE: id, название, категория, цена и цена со скидкой (₽), размеры, цвета, модели, ' +
        'готовое изделие или индивидуальный пошив, ссылка. Можно отфильтровать по категории: corsets/корсеты, bags/сумки, accessories/аксессуары.',
      inputSchema: { category: z.string().optional().describe('Категория: slug или название') },
    },
    async ({ category }) => json(await catalog.listCatalog(category)),
  );

  server.registerTool(
    'search_products',
    {
      description:
        'Найти товары по словам клиента (кириллица или латиница, с опечатками): «вивьен», «корсет кейт», «сумка dune». ' +
        'Возвращает до 5 лучших совпадений с id — используй id в check_availability и quote.',
      inputSchema: { query: z.string().min(1).describe('Что ищет клиент') },
    },
    async ({ query }) => json(await catalog.searchProducts(query)),
  );

  server.registerTool(
    'check_availability',
    {
      description:
        'Проверить наличие товара в нужном размере/цвете/модели. Статусы: in_stock, out_of_stock, made_to_order ' +
        '(индивидуальный пошив, ссылка /custom-order), unavailable, invalid_option (с допустимыми вариантами), not_found. ' +
        'source=flag значит, что точный остаток по размерам не ведётся.',
      inputSchema: { productId: z.number().int().describe('id товара'), ...options },
    },
    async ({ productId, ...sel }) => json(await catalog.checkAvailability(productId, sel)),
  );

  server.registerTool(
    'quote',
    {
      description:
        'Посчитать стоимость заказа по прайсу сайта: цена за штуку, скидка, сумма по строкам и итог в рублях. ' +
        'Доставка не входит — её стоимость уточнит менеджер. Называй клиенту только цены из этого ответа.',
      inputSchema: {
        items: z
          .array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(MAX_QTY), ...options }))
          .min(1)
          .describe('Позиции заказа'),
      },
    },
    async ({ items }) => json(await catalog.quote(items)),
  );

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = await openCatalogDb(process.env.CATALOG_DB_URL || DEFAULT_CATALOG_DB_URL);
  await createMcpServer(createCatalog(db)).connect(new StdioServerTransport());
  console.error('lepatage-stock MCP запущен');
}
