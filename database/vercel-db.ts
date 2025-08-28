import { createClient } from '@libsql/client';

// Конфигурация для Vercel (Turso)
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || 'file:./lepatage.db';
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

export const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN || undefined,
});

// Функция для инициализации базы данных
export async function initDatabase() {
  try {
    // Создаем таблицы если их нет
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        short_description TEXT,
        price REAL NOT NULL,
        sale_price REAL,
        category_id INTEGER,
        images TEXT,
        colors TEXT,
        sizes TEXT,
        in_stock INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 0,
        is_new INTEGER DEFAULT 0,
        on_sale INTEGER DEFAULT 0,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        password_hash TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Функция для заполнения базы тестовыми данными
export async function seedDatabase() {
  try {
    // Проверяем, есть ли уже данные
    const categoriesCount = await db.execute('SELECT COUNT(*) as count FROM categories');
    const count = categoriesCount.rows[0]?.count;
    
    if (count && Number(count) > 0) {
      console.log('📊 Database already has data, skipping seed');
      return;
    }

    // Добавляем категории
    await db.execute(`
      INSERT INTO categories (name, slug, description, image) VALUES 
      ('Корсеты', 'corsets', 'Элегантные корсеты для особых случаев', '/assets/corsets.jpg'),
      ('Сумки', 'bags', 'Стильные сумки и клатчи', '/assets/bags.jpg'),
      ('Аксессуары', 'accessories', 'Украшения и аксессуары', '/assets/accessories.jpg')
    `);

    // Добавляем продукты
    await db.execute(`
      INSERT INTO products (name, slug, description, short_description, price, category_id, images, colors, sizes, featured, is_new, on_sale) VALUES 
      ('Корсет "Авегю"', 'corset-avegue', 'Элегантный корсет из качественных материалов', 'Красивый корсет для особых случаев', 299.99, 1, '["/assets/corset-avegue.jpg"]', '["Черный", "Красный", "Белый"]', '["XS", "S", "M", "L", "XL"]', 1, 1, 1),
      ('Сумка "Вечерняя"', 'evening-bag', 'Стильная вечерняя сумка для особых случаев', 'Элегантная сумка для вечерних мероприятий', 199.99, 2, '["/assets/bags.jpg"]', '["Черный", "Золотой"]', '["Один размер"]', 1, 0, 0),
      ('Колье "Роскошь"', 'luxury-necklace', 'Роскошное колье из качественных материалов', 'Элегантное колье для особых случаев', 399.99, 3, '["/assets/jewelry.jpg"]', '["Серебряный", "Золотой"]', '["Регулируемый"]', 1, 1, 1)
    `);

    // Добавляем админа
    await db.execute(`
      INSERT INTO users (email, first_name, last_name, is_admin) VALUES 
      ('admin@lepatage.by', 'Admin', 'User', 1)
    `);

    console.log('🌱 Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}
