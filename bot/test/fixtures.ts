// Фикстурная БД каталога в памяти — та же структура таблиц, что в database/schema.ts сайта.
import { createClient, type Client } from '@libsql/client';

export const IDS = {
  vivienne: 1,
  kate: 2,
  belt: 3,
  bag: 4,
  studs: 5,
  hidden: 6,
  oddSale: 7,
  sized: 8,
} as const;

export async function catalogFixture(): Promise<Client> {
  const db = createClient({ url: ':memory:' });
  await db.executeMultiple(`
    CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE);
    CREATE TABLE products (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, short_description TEXT,
      price REAL NOT NULL, sale_price REAL, category_id INTEGER, images TEXT, colors TEXT, sizes TEXT,
      in_stock INTEGER DEFAULT 1, featured INTEGER DEFAULT 0, is_new INTEGER DEFAULT 0, on_sale INTEGER DEFAULT 0,
      is_ready_made INTEGER DEFAULT 0, material TEXT, models TEXT, tags TEXT
    );
    CREATE TABLE product_variants (
      id INTEGER PRIMARY KEY, product_id INTEGER, color TEXT, size TEXT, sku TEXT UNIQUE, price REAL,
      stock INTEGER DEFAULT 0, image TEXT
    );
    INSERT INTO categories VALUES (1, 'Корсеты', 'corsets'), (2, 'Сумки', 'bags'), (3, 'Аксессуары', 'accessories');
    INSERT INTO products (id, name, slug, price, sale_price, category_id, sizes, colors, tags, in_stock, is_ready_made) VALUES
      (1, 'Корсет "VIVIENNE"', 'corset-vivienne', 19900, 15900, 1, '["XS","S","M","L","XL"]', '["#000000","#8b0000","#ffffff"]', '["classic"]', 1, 0),
      (2, 'Корсет "KATE"', 'corset-kate', 16900, 12900, 1, '["XS","S","M","L","XL"]', '["#000000","#8b0000"]', '["british"]', 1, 0),
      (3, 'Пояс "Элеганс"', 'belt-elegance', 11900, 8900, 3, '["S","M","L"]', '["#000000","#8b0000","#654321"]', '["elegant"]', 1, 0),
      (4, 'Сумка "VIVIENE"', 'bag-viviene', 29900, NULL, 2, NULL, '[]', '[]', 1, 1),
      (5, 'Чехол "Studs"', 'case-studs', 4900, NULL, 3, NULL, '["#e8b4b8","#000000"]', '[]', 1, 1),
      (6, 'Корсет "OLD"', 'corset-old', 15000, NULL, 1, '["S"]', '["#000000"]', '[]', 0, 1),
      (7, 'Аксессуар "Шарм"', 'accessory-charm', 5000, 6000, 3, NULL, '["Черный|#000000"]', '[]', 1, 1),
      (8, 'Пояс "Мини"', 'belt-mini', 9000, NULL, 3, '["S","M"]', '["#000000"]', '[]', 1, 1);
    INSERT INTO product_variants (product_id, color, size, sku, price, stock) VALUES
      (5, '#000000', NULL, 'studs-black', NULL, 2),
      (5, '#e8b4b8', NULL, 'studs-pink', NULL, 0),
      (8, '#000000', 'S', 'mini-s', 7000, 1),
      (8, '#000000', 'M', 'mini-m', NULL, 3);
  `);
  return db;
}
