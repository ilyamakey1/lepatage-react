import { db } from './db.js';
import { 
  categories, 
  products, 
  productVariants, 
  collections, 
  collectionProducts 
} from './schema.js';

async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Insert categories
    const categoryData = [
      { 
        name: 'Корсеты', 
        slug: 'corsets', 
        description: 'Элегантные корсеты для создания идеального силуэта',
        image: '/assets/corsets.jpg'
      },
      { 
        name: 'Пояса', 
        slug: 'belts', 
        description: 'Стильные пояса для завершения любого образа',
        image: '/assets/belts.jpg'
      },
      { 
        name: 'Аксессуары', 
        slug: 'accessories', 
        description: 'Стильные аксессуары для завершения образа',
        image: '/assets/accessories.jpg'
      },
      { 
        name: 'Украшения', 
        slug: 'jewelry', 
        description: 'Изысканные украшения для создания неповторимого образа',
        image: '/assets/jewelry.jpg'
      },
      { 
        name: 'Сумки', 
        slug: 'bags', 
        description: 'Стильные сумки для любого случая',
        image: '/assets/bags.jpg'
      },
      { 
        name: 'Чехлы', 
        slug: 'cases', 
        description: 'Защитные чехлы для ваших любимых вещей',
        image: '/assets/cases.jpg'
      },
    ];

    // Clear existing data
    await db.delete(collectionProducts);
    await db.delete(collections);
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(categories);

    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    console.log('Categories inserted:', insertedCategories.length);

    // Create a map for category lookups
    const categoryMap = insertedCategories.reduce((acc, cat) => {
      acc[cat.slug] = cat.id;
      return acc;
    }, {} as Record<string, number>);

    // Insert products
    const productData = [
      // Corsets
      {
        name: 'Корсет "VIVIENNE"',
        slug: 'corset-vivienne',
        description: 'Элегантный корсет VIVIENNE с изысканным дизайном. Идеальное сочетание комфорта и стиля для создания безупречного силуэта.',
        shortDescription: 'Элегантный корсет с изысканным дизайном',
        price: 19900,
        salePrice: 15900,
        categoryId: categoryMap.corsets,
        images: JSON.stringify(['/assets/corset-avegue.jpg']),
        colors: JSON.stringify(['#000000', '#8b0000', '#ffffff']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
        inStock: true,
        featured: true,
        onSale: true,
        tags: JSON.stringify(['elegance', 'classic', 'bestseller'])
      },
      {
        name: 'Корсет "HOURGLASS"',
        slug: 'corset-hourglass',
        description: 'Корсет HOURGLASS создает идеальные пропорции фигуры. Подчеркивает талию и создает силуэт песочных часов.',
        shortDescription: 'Корсет для идеальных пропорций фигуры',
        price: 18500,
        categoryId: categoryMap.corsets,
        images: JSON.stringify(['/assets/corsets.jpg', '/assets/719A0649.jpg']),
        colors: JSON.stringify(['#8b0000', '#000000']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
        inStock: true,
        tags: JSON.stringify(['hourglass', 'proportions', 'waist'])
      },
      {
        name: 'Корсет "KATE"',
        slug: 'corset-kate',
        description: 'Изысканный корсет KATE в классическом стиле. Воплощение британской элегантности и утонченности.',
        shortDescription: 'Классический корсет в британском стиле',
        price: 16900,
        salePrice: 12900,
        categoryId: categoryMap.corsets,
        images: JSON.stringify(['/assets/corsets.jpg', '/assets/719A0664.jpg']),
        colors: JSON.stringify(['#000000', '#8b0000', '#ffffff']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
        inStock: true,
        onSale: true,
        tags: JSON.stringify(['classic', 'british', 'elegance'])
      },
      {
        name: 'Корсет "LEA"',
        slug: 'corset-lea',
        description: 'Женственный корсет LEA с деликатными деталями. Создан для особых моментов и торжественных событий.',
        shortDescription: 'Женственный корсет с деликатными деталями',
        price: 17500,
        categoryId: categoryMap.corsets,
        images: JSON.stringify(['/assets/corsets.jpg', '/assets/719A0669.jpg']),
        colors: JSON.stringify(['#ffffff', '#8b0000', '#000000']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
        inStock: true,
        featured: true,
        tags: JSON.stringify(['feminine', 'delicate', 'special'])
      },
      {
        name: 'Корсет "LUNA"',
        slug: 'corset-luna',
        description: 'Загадочный корсет LUNA в темных тонах. Идеален для вечерних выходов и особых случаев.',
        shortDescription: 'Загадочный корсет для вечерних выходов',
        price: 20500,
        categoryId: categoryMap.corsets,
        images: JSON.stringify(['/assets/corsets.jpg', '/assets/719A0683.jpg']),
        colors: JSON.stringify(['#000000', '#1a1a1a', '#2c2c2c']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
        inStock: true,
        featured: true,
        tags: JSON.stringify(['mysterious', 'evening', 'dark'])
      },
      {
        name: 'Корсет "SYMMETRY"',
        slug: 'corset-symmetry',
        description: 'Корсет SYMMETRY с идеальными геометрическими линиями. Современный дизайн для создания безупречного силуэта.',
        shortDescription: 'Корсет с идеальными геометрическими линиями',
        price: 21900,
        categoryId: categoryMap.corsets,
        images: JSON.stringify(['/assets/corsets.jpg', '/assets/0119.jpg', '/assets/0783-2.jpg']),
        colors: JSON.stringify(['#000000', '#ffffff', '#8b0000']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
        inStock: true,
        featured: true,
        tags: JSON.stringify(['geometric', 'modern', 'perfect'])
      },

      // Belts
      {
        name: 'Пояс "Элеганс"',
        slug: 'belt-elegance',
        description: 'Стильный пояс "Элеганс" - идеальное дополнение к любому образу. Изготовлен из качественных материалов.',
        shortDescription: 'Стильный пояс - идеальное дополнение к любому образу',
        price: 11900,
        salePrice: 8900,
        categoryId: categoryMap.belts,
        images: JSON.stringify(['/assets/belts.jpg']),
        colors: JSON.stringify(['#000000', '#8b0000', '#654321']),
        sizes: JSON.stringify(['S', 'M', 'L']),
        inStock: true,
        onSale: true,
        tags: JSON.stringify(['elegant', 'versatile'])
      },
      {
        name: 'Пояс "Вечерний"',
        slug: 'belt-evening',
        description: 'Роскошный пояс с декоративными элементами. Создан для особых вечерних мероприятий.',
        shortDescription: 'Роскошный пояс с декоративными элементами',
        price: 12900,
        categoryId: categoryMap.belts,
        images: JSON.stringify(['/assets/belts.jpg']),
        colors: JSON.stringify(['#000000', '#8b0000']),
        sizes: JSON.stringify(['S', 'M', 'L']),
        inStock: true,
        tags: JSON.stringify(['evening', 'luxury'])
      },

      // Accessories
      {
        name: 'Аксессуар "Шарм"',
        slug: 'accessory-charm',
        description: 'Очаровательный аксессуар "Шарм" добавит изюминку любому наряду. Универсальный и стильный.',
        shortDescription: 'Очаровательный аксессуар добавит изюминку любому наряду',
        price: 8900,
        salePrice: 6900,
        categoryId: categoryMap.accessories,
        images: JSON.stringify(['/assets/accessories.jpg']),
        colors: JSON.stringify(['#000000', '#8b0000']),
        inStock: true,
        onSale: true,
        tags: JSON.stringify(['charm', 'versatile'])
      },

      // Jewelry
      {
        name: 'Украшение "Грейс"',
        slug: 'jewelry-grace',
        description: 'Утонченное украшение "Грейс" - воплощение элегантности и стиля. Создано для истинных ценительниц красоты.',
        shortDescription: 'Утонченное украшение - воплощение элегантности и стиля',
        price: 24900,
        salePrice: 18900,
        categoryId: categoryMap.jewelry,
        images: JSON.stringify(['/assets/jewelry.jpg']),
        colors: JSON.stringify(['#000000', '#8b0000']),
        inStock: true,
        featured: true,
        onSale: true,
        tags: JSON.stringify(['grace', 'elegant', 'premium'])
      },

      // Bags
      {
        name: 'Сумка "Люкс"',
        slug: 'bag-luxury',
        description: 'Роскошная сумка "Люкс" - идеальное сочетание стиля и функциональности. Изготовлена из премиальных материалов.',
        shortDescription: 'Роскошная сумка - идеальное сочетание стиля и функциональности',
        price: 29900,
        salePrice: 24900,
        categoryId: categoryMap.bags,
        images: JSON.stringify(['/assets/bags.jpg']),
        colors: JSON.stringify(['#000000', '#8b0000']),
        inStock: true,
        featured: true,
        onSale: true,
        tags: JSON.stringify(['luxury', 'functional', 'premium'])
      },

      // Cases
      {
        name: 'Чехол "Премиум"',
        slug: 'case-premium',
        description: 'Премиальный чехол "Премиум" обеспечивает надежную защиту и стильный внешний вид. Идеален для ваших ценных вещей.',
        shortDescription: 'Премиальный чехол обеспечивает надежную защиту и стильный внешний вид',
        price: 4900,
        salePrice: 3900,
        categoryId: categoryMap.cases,
        images: JSON.stringify(['/assets/cases.jpg']),
        colors: JSON.stringify(['#000000', '#8b0000']),
        inStock: true,
        onSale: true,
        tags: JSON.stringify(['premium', 'protection'])
      },
    ];

    const insertedProducts = await db.insert(products).values(productData).returning();
    console.log('Products inserted:', insertedProducts.length);

    // Insert collections
    const collectionData = [
      {
        name: 'L\'epatage x Smev',
        slug: 'lepatage-smev',
        description: 'Эксклюзивная коллаборация с брендом Smev',
        featured: true
      },
      {
        name: 'L\'epatage x Krikate',
        slug: 'lepatage-krikate',
        description: 'Совместная коллекция с Krikate'
      },
      {
        name: 'Вечерние образы',
        slug: 'evening-looks',
        description: 'Изысканные образы для особых вечеров',
        featured: true
      },
      {
        name: 'Новые поступления',
        slug: 'new-arrivals',
        description: 'Самые свежие модели нашей коллекции',
        featured: true
      }
    ];

    const insertedCollections = await db.insert(collections).values(collectionData).returning();
    console.log('Collections inserted:', insertedCollections.length);

    // Add some products to collections
    const featuredProducts = insertedProducts.filter(p => 
      ['corset-avegue', 'jewelry-grace', 'bag-luxury'].includes(p.slug)
    );

    if (featuredProducts.length > 0 && insertedCollections.length > 0) {
      const collectionProductData = featuredProducts.map((product, index) => ({
        collectionId: insertedCollections[2].id, // Evening looks collection
        productId: product.id,
        position: index
      }));

      await db.insert(collectionProducts).values(collectionProductData);
      console.log('Collection products linked');
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();