// Каталог L'EPATAGE поверх БД сайта (только чтение). Каталог читается заново на каждый вызов,
// чтобы бот всегда видел актуальные цены и наличие из админки.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient, type Client, type InValue } from '@libsql/client';

export const SITE_URL = 'https://lepatage.com';
export const CUSTOM_ORDER_URL = `${SITE_URL}/custom-order`;
export const MAX_QTY = 20;

type Db = Pick<Client, 'execute'>;

/** Открывает БД каталога только на чтение: файл должен существовать, запись запрещена PRAGMA query_only. */
export async function openCatalogDb(url: string): Promise<Client> {
  if (url.startsWith('file:') && !url.includes(':memory:')) {
    const path = url.startsWith('file:/') ? fileURLToPath(new URL(url)) : url.slice('file:'.length);
    if (!existsSync(path)) throw new Error(`Каталог не найден: ${path}`);
  }
  const db = createClient({ url });
  await db.execute('PRAGMA query_only = 1');
  return db;
}

// ---------- цвета ----------

interface ColorName {
  name: string;
  aliases: string[];
}

// hex → название словом. Названия графит/антрацит совпадают с src/utils/colorOptions.ts сайта.
export const COLOR_NAMES: Record<string, ColorName> = {
  '#000000': { name: 'черный', aliases: ['black'] },
  '#8b0000': { name: 'бордовый', aliases: ['бордо', 'бургунди', 'винный', 'burgundy'] },
  '#ffffff': { name: 'белый', aliases: ['white'] },
  '#c1783c': { name: 'карамельный', aliases: ['карамель', 'коньячный', 'рыжий', 'caramel'] },
  '#1a1a1a': { name: 'графит', aliases: ['графитовый', 'graphite'] },
  '#2c2c2c': { name: 'антрацит', aliases: ['антрацитовый', 'темно-серый', 'anthracite'] },
  '#654321': { name: 'коричневый', aliases: ['шоколад', 'шоколадный', 'brown'] },
  '#e8b4b8': { name: 'розовый', aliases: ['пудровый', 'пудра', 'pink'] },
  '#e5d3c3': { name: 'бежевый', aliases: ['беж', 'beige'] },
  '#f5f0e8': { name: 'молочный', aliases: ['айвори', 'кремовый', 'ivory', 'cream'] },
  '#a89484': { name: 'серо-бежевый', aliases: ['тауп', 'taupe'] },
};

const HEX_RE = /^#(?:[0-9a-f]{3}){1,2}$/i;

function normalizeHex(value: string): string {
  const v = value.trim().toLowerCase();
  return v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v;
}

interface ColorOption {
  raw: string;
  label: string;
  hex?: string;
}

/** Цвет из БД: "#000000", "Черный|#000000" или просто слово — как parseColorOption на сайте. */
function parseColor(raw: string): ColorOption {
  const parts = raw.split('|').map((p) => p.trim());
  const hexPart = parts.find((p) => HEX_RE.test(p));
  const labelPart = parts.find((p) => p && !HEX_RE.test(p));
  const hex = hexPart ? normalizeHex(hexPart) : undefined;
  const label = labelPart?.toLowerCase() ?? (hex ? COLOR_NAMES[hex]?.name ?? hex : raw);
  return { raw, label, hex };
}

function colorWords(c: ColorOption): string[] {
  const known = c.hex ? COLOR_NAMES[c.hex] : undefined;
  return [c.label, ...(known ? [known.name, ...known.aliases] : [])].map(normalize);
}

/** Насколько слово клиента совпадает с цветом: 2 — точно, 1 — по основе ("черную" → "черный"), 0 — нет. */
function colorMatchScore(input: string, c: ColorOption): number {
  if (HEX_RE.test(input.trim())) return c.hex === normalizeHex(input) ? 2 : 0;
  const q = normalize(input);
  let best = 0;
  for (const w of colorWords(c)) {
    if (q === w) return 2;
    const stem = w.slice(0, Math.max(3, w.length - 2));
    if (q.startsWith(stem)) best = 1;
  }
  return best;
}

function findColor(input: string, options: ColorOption[]): ColorOption | undefined {
  let best: ColorOption | undefined;
  let bestScore = 0;
  for (const c of options) {
    const s = colorMatchScore(input, c);
    if (s > bestScore) [best, bestScore] = [c, s];
  }
  return best;
}

// ---------- нормализация, транслит, нечёткий поиск ----------

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/["'«»“”„`‘’]/g, '')
    .replace(/[^\p{L}\p{N}-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/**
 * Латинские формы токена. Сравнение идёт в латинице, поэтому кириллица↔латиница работает в обе стороны:
 * «вивьен» → vivien / viven, «VIVIENNE» → vivienne. Для «ь» даём и «i» (Вивьен = Vivienne).
 */
function latinForms(token: string): string[] {
  const base = [...token].map((ch) => CYR_TO_LAT[ch] ?? ch).join('');
  if (!token.includes('ь')) return [base];
  return [base, [...token].map((ch) => (ch === 'ь' ? 'i' : CYR_TO_LAT[ch] ?? ch)).join('')];
}

/** Согласный «скелет» для произношения: kate ~ кейт (kt), croco ~ кроко (krk). */
function skeleton(lat: string): string {
  return lat
    .replace(/ck|c|q/g, 'k')
    .replace(/w/g, 'v')
    .replace(/x/g, 'ks')
    .replace(/ph/g, 'f')
    .replace(/kh/g, 'h')
    .replace(/[aeiouyj-]/g, '')
    .replace(/(.)\1+/g, '$1');
}

function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

export function dice(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.length || !B.length) return 0;
  const counts = new Map<string, number>();
  for (const g of B) counts.set(g, (counts.get(g) ?? 0) + 1);
  let common = 0;
  for (const g of A) {
    const n = counts.get(g) ?? 0;
    if (n > 0) {
      common++;
      counts.set(g, n - 1);
    }
  }
  return (2 * common) / (A.length + B.length);
}

const FUZZY_THRESHOLD = 0.5;

function tokenScore(q: string, t: string): number {
  if (q === t) return 1;
  if (q.length >= 3 && t.length >= 3 && (t.startsWith(q) || q.startsWith(t))) return 0.9;
  if (q.length >= 3 && t.includes(q)) return 0.8;
  const sq = skeleton(q);
  if (q.length >= 3 && sq.length >= 2 && sq === skeleton(t)) return 0.75;
  const d = dice(q, t);
  return d >= FUZZY_THRESHOLD ? d * 0.7 : 0;
}

function bestScore(qForms: string[], tokens: string[]): number {
  let best = 0;
  for (const q of qForms) for (const t of tokens) best = Math.max(best, tokenScore(q, t));
  return best;
}

const STOPWORDS = new Set(
  'а в во и или на по под с со у к ко о об от до за из для ли не ну же бы есть нет мне меня можно хочу хотела хотел ' +
    'какой какая какие какую сколько стоит стоят цена цену наличии наличие есть размер размера размеры цвет цвете цвета ' +
    'пожалуйста здравствуйте добрый день вечер привет подскажите скажите'.split(' '),
);

function tokens(s: string | null | undefined): string[] {
  return s ? normalize(s.replace(/-/g, ' ')).split(' ').filter(Boolean).flatMap(latinForms) : [];
}

// ---------- загрузка ----------

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  sizes: string[];
  colors: ColorOption[];
  models: string[];
  tags: string[];
  inStock: boolean;
  readyMade: boolean;
  material: string | null;
  shortDescription: string | null;
}

interface VariantRow {
  size: string | null;
  color: string | null;
  sku: string | null;
  price: number | null;
  stock: number;
}

function parseList(v: unknown): string[] {
  if (typeof v !== 'string' || !v.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    // не JSON — список через запятую
  }
  return v.split(',').map((x) => x.trim()).filter(Boolean);
}

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v));

async function loadProducts(db: Db, where = '', args: InValue[] = []): Promise<ProductRow[]> {
  const rs = await db.execute({
    sql: `SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.sizes, p.colors, p.models, p.tags,
                 p.in_stock, p.is_ready_made, p.material, p.short_description,
                 c.slug AS category_slug, c.name AS category_name
          FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}
          ORDER BY p.id`,
    args,
  });
  return rs.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    slug: String(r.slug),
    price: Number(r.price),
    salePrice: num(r.sale_price),
    categorySlug: r.category_slug === null ? null : String(r.category_slug),
    categoryName: r.category_name === null ? null : String(r.category_name),
    sizes: parseList(r.sizes),
    colors: parseList(r.colors).map(parseColor),
    models: parseList(r.models),
    tags: parseList(r.tags),
    inStock: r.in_stock === null ? true : Number(r.in_stock) !== 0,
    readyMade: Number(r.is_ready_made ?? 0) !== 0,
    material: r.material === null ? null : String(r.material),
    shortDescription: r.short_description === null ? null : String(r.short_description),
  }));
}

async function loadProduct(db: Db, id: number): Promise<ProductRow | undefined> {
  return (await loadProducts(db, 'WHERE p.id = ?', [id]))[0];
}

async function loadVariants(db: Db, productId: number): Promise<VariantRow[]> {
  const rs = await db.execute({
    sql: 'SELECT size, color, sku, price, stock FROM product_variants WHERE product_id = ?',
    args: [productId],
  });
  return rs.rows.map((r) => ({
    size: r.size === null ? null : String(r.size),
    color: r.color === null ? null : String(r.color),
    sku: r.sku === null ? null : String(r.sku),
    price: num(r.price),
    stock: Number(r.stock ?? 0),
  }));
}

// ---------- представление ----------

const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
export const formatRub = (n: number): string => rub.format(n);

/** Цена как на сайте: скидочная, если она задана и меньше обычной. */
function effectivePrice(p: ProductRow): number {
  return p.salePrice !== null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export interface CatalogItem {
  id: number;
  name: string;
  category: string | null;
  categoryName: string | null;
  price: number;
  salePrice: number | null;
  finalPrice: number;
  priceText: string;
  sizes: string[];
  colors: string[];
  models: string[];
  readyMade: boolean;
  kind: 'готовое изделие' | 'индивидуальный пошив';
  inStock: boolean;
  url: string;
}

function toItem(p: ProductRow): CatalogItem {
  const final = effectivePrice(p);
  return {
    id: p.id,
    name: p.name,
    category: p.categorySlug,
    categoryName: p.categoryName,
    price: p.price,
    salePrice: final < p.price ? final : null,
    finalPrice: final,
    priceText: final < p.price ? `${formatRub(final)} (вместо ${formatRub(p.price)})` : formatRub(final),
    sizes: p.sizes,
    colors: p.colors.map((c) => c.label),
    models: p.models,
    readyMade: p.readyMade,
    kind: p.readyMade ? 'готовое изделие' : 'индивидуальный пошив',
    inStock: p.inStock,
    url: `${SITE_URL}/products/${p.slug}`,
  };
}

// ---------- опции ----------

interface Selection {
  size?: string;
  color?: string;
  model?: string;
}

interface InvalidOption {
  option: 'size' | 'color' | 'model';
  value: string;
  allowed: string[];
}

interface ResolvedSelection {
  size?: string;
  color?: ColorOption;
  model?: string;
  invalid: InvalidOption[];
  ignored: string[];
  missing: Array<'size' | 'color' | 'model'>;
}

const eqi = (a: string, b: string) => normalize(a) === normalize(b);

function resolveSelection(p: ProductRow, sel: Selection): ResolvedSelection {
  const out: ResolvedSelection = { invalid: [], ignored: [], missing: [] };
  const pick = (option: 'size' | 'model', value: string | undefined, allowed: string[], label: string) => {
    if (!value?.trim()) {
      if (allowed.length > 1) out.missing.push(option);
      else if (allowed.length === 1) out[option] = allowed[0];
      return;
    }
    if (!allowed.length) return void out.ignored.push(`${label} «${value}» — у товара нет выбора`);
    const found = allowed.find((a) => eqi(a, value));
    if (found) out[option] = found;
    else out.invalid.push({ option, value, allowed });
  };
  pick('size', sel.size, p.sizes, 'размер');
  pick('model', sel.model, p.models, 'модель');

  if (!sel.color?.trim()) {
    if (p.colors.length > 1) out.missing.push('color');
    else if (p.colors.length === 1) out.color = p.colors[0];
  } else if (!p.colors.length) {
    out.ignored.push(`цвет «${sel.color}» — у товара нет выбора`);
  } else {
    const found = findColor(sel.color, p.colors);
    if (found) out.color = found;
    else out.invalid.push({ option: 'color', value: sel.color, allowed: p.colors.map((c) => c.label) });
  }
  return out;
}

function variantMatches(v: VariantRow, sel: ResolvedSelection): boolean {
  if (sel.size && v.size && !eqi(v.size, sel.size)) return false;
  if (sel.color && v.color && !colorMatchScore(parseColor(v.color).hex ?? v.color, sel.color)) return false;
  return true;
}

// ---------- наличие ----------

export type AvailabilityStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'made_to_order'
  | 'unavailable'
  | 'invalid_option'
  | 'not_found';

export interface Availability {
  productId: number;
  name?: string;
  status: AvailabilityStatus;
  source: 'variants' | 'flag';
  quantity?: number;
  selected: { size?: string; color?: string; model?: string };
  invalid?: InvalidOption[];
  missing?: Array<'size' | 'color' | 'model'>;
  ignored?: string[];
  options?: { sizes: string[]; colors: string[]; models: string[] };
  note: string;
  url?: string;
  customOrderUrl?: string;
}

async function availabilityFor(db: Db, p: ProductRow, sel: ResolvedSelection): Promise<Availability> {
  const variants = await loadVariants(db, p.id);
  const base = {
    productId: p.id,
    name: p.name,
    selected: { size: sel.size, color: sel.color?.label, model: sel.model },
    options: { sizes: p.sizes, colors: p.colors.map((c) => c.label), models: p.models },
    url: `${SITE_URL}/products/${p.slug}`,
    ...(sel.missing.length ? { missing: sel.missing } : {}),
    ...(sel.ignored.length ? { ignored: sel.ignored } : {}),
  };
  if (sel.invalid.length) {
    const what = sel.invalid.map((i) => `${i.option} «${i.value}» (доступно: ${i.allowed.join(', ')})`).join('; ');
    return { ...base, status: 'invalid_option', source: variants.length ? 'variants' : 'flag', invalid: sel.invalid, note: `Нет такой опции: ${what}` };
  }
  if (!p.inStock) {
    return { ...base, status: 'unavailable', source: 'flag', note: 'Товар снят с продажи / недоступен для заказа' };
  }
  const stock = variants.filter((v) => variantMatches(v, sel)).reduce((s, v) => s + Math.max(0, v.stock), 0);
  if (stock > 0) {
    return { ...base, status: 'in_stock', source: 'variants', quantity: stock, note: `В наличии: ${stock} шт.` };
  }
  if (!p.readyMade) {
    return {
      ...base,
      status: 'made_to_order',
      source: variants.length ? 'variants' : 'flag',
      customOrderUrl: CUSTOM_ORDER_URL,
      note: 'Шьётся индивидуально по меркам; сроки и детали уточнит менеджер',
    };
  }
  if (variants.length) {
    return { ...base, status: 'out_of_stock', source: 'variants', quantity: 0, note: 'Сейчас нет в наличии в выбранном варианте' };
  }
  return { ...base, status: 'in_stock', source: 'flag', note: 'В наличии по данным сайта; остаток по размерам не ведётся' };
}

// ---------- расчёт ----------

export interface QuoteItemInput extends Selection {
  productId: number;
  qty: number;
}

export interface QuoteLine {
  productId: number;
  name: string;
  qty: number;
  size?: string;
  color?: string;
  model?: string;
  unitPrice: number;
  regularUnitPrice: number;
  unitDiscount: number;
  lineTotal: number;
  lineDiscount: number;
  availability: AvailabilityStatus;
  availabilityNote: string;
  url: string;
  text: string;
}

export interface Quote {
  lines: QuoteLine[];
  errors: Array<{ productId: number; error: string; allowed?: InvalidOption[] }>;
  subtotal: number;
  regularSubtotal: number;
  discountTotal: number;
  currency: 'RUB';
  formatted: { subtotal: string; regularSubtotal: string; discountTotal: string };
  delivery: 'уточнит менеджер';
}

export function createCatalog(db: Db) {
  async function listCatalog(category?: string): Promise<CatalogItem[]> {
    const all = await loadProducts(db);
    if (!category?.trim()) return all.map(toItem);
    const q = normalize(category);
    const hit = (s: string | null) => {
      if (!s) return false;
      const n = normalize(s);
      return n === q || (q.length >= 4 && (n.startsWith(q) || q.startsWith(n.slice(0, Math.max(4, n.length - 2)))));
    };
    return all.filter((p) => hit(p.categorySlug) || hit(p.categoryName)).map(toItem);
  }

  async function searchProducts(query: string, limit = 5): Promise<Array<CatalogItem & { score: number }>> {
    const qTokens = normalize(query.replace(/-/g, ' '))
      .split(' ')
      .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
      .map(latinForms);
    if (!qTokens.length) return [];
    const all = await loadProducts(db);
    const scored = all.map((p) => {
      const nameTokens = [...tokens(p.name), ...tokens(p.slug)];
      const catTokens = [...tokens(p.categorySlug), ...tokens(p.categoryName)];
      const tagTokens = p.tags.flatMap(tokens);
      let score = 0;
      for (const q of qTokens) {
        score += Math.max(bestScore(q, nameTokens), bestScore(q, catTokens) * 0.7, bestScore(q, tagTokens) * 0.5);
      }
      return { p, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || a.p.id - b.p.id)
      .slice(0, limit)
      .map(({ p, score }) => ({ ...toItem(p), score: Math.round(score * 100) / 100 }));
  }

  async function checkAvailability(productId: number, sel: Selection = {}): Promise<Availability> {
    const p = await loadProduct(db, productId);
    if (!p) return { productId, status: 'not_found', source: 'flag', selected: {}, note: 'Товар с таким id не найден' };
    return availabilityFor(db, p, resolveSelection(p, sel));
  }

  async function quote(items: QuoteItemInput[]): Promise<Quote> {
    const lines: QuoteLine[] = [];
    const errors: Quote['errors'] = [];
    for (const item of items) {
      if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > MAX_QTY) {
        errors.push({ productId: item.productId, error: `Количество должно быть от 1 до ${MAX_QTY}` });
        continue;
      }
      const p = await loadProduct(db, item.productId);
      if (!p) {
        errors.push({ productId: item.productId, error: 'Товар с таким id не найден' });
        continue;
      }
      const sel = resolveSelection(p, item);
      if (sel.invalid.length) {
        errors.push({ productId: p.id, error: `Нет такой опции у «${p.name}»`, allowed: sel.invalid });
        continue;
      }
      const avail = await availabilityFor(db, p, sel);
      const variantPrice = (await loadVariants(db, p.id)).find((v) => variantMatches(v, sel) && v.price !== null && v.price > 0)?.price;
      const unit = variantPrice ?? effectivePrice(p);
      const regular = variantPrice ?? p.price;
      const lineTotal = unit * item.qty;
      const lineDiscount = (regular - unit) * item.qty;
      const opts = [sel.size && `размер ${sel.size}`, sel.color && `цвет ${sel.color.label}`, sel.model && `модель ${sel.model}`]
        .filter(Boolean)
        .join(', ');
      lines.push({
        productId: p.id,
        name: p.name,
        qty: item.qty,
        size: sel.size,
        color: sel.color?.label,
        model: sel.model,
        unitPrice: unit,
        regularUnitPrice: regular,
        unitDiscount: regular - unit,
        lineTotal,
        lineDiscount,
        availability: avail.status,
        availabilityNote: avail.note,
        url: `${SITE_URL}/products/${p.slug}`,
        text:
          `${p.name}${opts ? ` (${opts})` : ''} × ${item.qty} — ${formatRub(lineTotal)}` +
          (lineDiscount > 0 ? ` (вместо ${formatRub(regular * item.qty)}, скидка ${formatRub(lineDiscount)})` : ''),
      });
    }
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const discountTotal = lines.reduce((s, l) => s + l.lineDiscount, 0);
    return {
      lines,
      errors,
      subtotal,
      regularSubtotal: subtotal + discountTotal,
      discountTotal,
      currency: 'RUB',
      formatted: {
        subtotal: formatRub(subtotal),
        regularSubtotal: formatRub(subtotal + discountTotal),
        discountTotal: formatRub(discountTotal),
      },
      delivery: 'уточнит менеджер',
    };
  }

  return { listCatalog, searchProducts, checkAvailability, quote };
}

export type Catalog = ReturnType<typeof createCatalog>;
