import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCatalog, type Catalog } from '../src/catalog.ts';
import { catalogFixture, IDS } from './fixtures.ts';

const plain = (s: string) => s.replace(/\s/g, ' ');

let catalog: Catalog;
before(async () => {
  catalog = createCatalog(await catalogFixture());
});

describe('listCatalog', () => {
  it('отдаёт все товары с ценой со скидкой, цветами словами и ссылкой', async () => {
    const all = await catalog.listCatalog();
    assert.equal(all.length, 8);
    const v = all.find((p) => p.id === IDS.vivienne)!;
    assert.equal(v.finalPrice, 15900);
    assert.equal(v.salePrice, 15900);
    assert.deepEqual(v.colors, ['черный', 'бордовый', 'белый']);
    assert.equal(v.kind, 'индивидуальный пошив');
    assert.equal(v.url, 'https://lepatage.com/products/corset-vivienne');
  });

  it('фильтрует по категории (slug или по-русски)', async () => {
    assert.equal((await catalog.listCatalog('corsets')).length, 3);
    assert.equal((await catalog.listCatalog('корсеты')).length, 3);
    assert.equal((await catalog.listCatalog('сумки')).length, 1);
  });
});

describe('searchProducts', () => {
  it('«вивьен» (кириллица) находит VIVIENNE и сумку VIVIENE', async () => {
    const ids = (await catalog.searchProducts('вивьен')).map((r) => r.id);
    assert.equal(ids[0], IDS.vivienne);
    assert.ok(ids.includes(IDS.bag));
  });

  it('«VIVIENNE» — точное совпадение первым', async () => {
    const r = await catalog.searchProducts('VIVIENNE');
    assert.equal(r[0].id, IDS.vivienne);
    assert.ok(r[0].score > r[1].score);
  });

  it('«корсет кейт» находит KATE первым', async () => {
    const r = await catalog.searchProducts('корсет кейт');
    assert.equal(r[0].id, IDS.kate);
  });

  it('ё/кавычки не мешают, мусорный запрос — пусто', async () => {
    assert.equal((await catalog.searchProducts('«пояс элеганс»'))[0].id, IDS.belt);
    assert.deepEqual(await catalog.searchProducts('здравствуйте'), []);
  });

  it('не больше 5 результатов', async () => {
    assert.ok((await catalog.searchProducts('корсет пояс сумка чехол')).length <= 5);
  });
});

describe('checkAvailability', () => {
  it('размер не из списка → invalid_option с допустимыми', async () => {
    const r = await catalog.checkAvailability(IDS.vivienne, { size: 'XXL' });
    assert.equal(r.status, 'invalid_option');
    assert.deepEqual(r.invalid?.[0].allowed, ['XS', 'S', 'M', 'L', 'XL']);
  });

  it('цвет словом в любой форме и hex', async () => {
    const a = await catalog.checkAvailability(IDS.vivienne, { size: 'm', color: 'бордовую' });
    assert.equal(a.selected.color, 'бордовый');
    assert.equal(a.selected.size, 'M');
    const b = await catalog.checkAvailability(IDS.vivienne, { color: '#8B0000' });
    assert.equal(b.selected.color, 'бордовый');
    const c = await catalog.checkAvailability(IDS.vivienne, { color: 'зелёный' });
    assert.equal(c.status, 'invalid_option');
  });

  it('индивидуальный пошив → made_to_order со ссылкой /custom-order', async () => {
    const r = await catalog.checkAvailability(IDS.vivienne, { size: 'S', color: 'черный' });
    assert.equal(r.status, 'made_to_order');
    assert.equal(r.source, 'flag');
    assert.equal(r.customOrderUrl, 'https://lepatage.com/custom-order');
  });

  it('снят с продажи → unavailable, неизвестный id → not_found', async () => {
    assert.equal((await catalog.checkAvailability(IDS.hidden)).status, 'unavailable');
    assert.equal((await catalog.checkAvailability(999)).status, 'not_found');
  });

  it('варианты: есть остаток → in_stock с количеством; нулевой → out_of_stock', async () => {
    const black = await catalog.checkAvailability(IDS.studs, { color: 'черный' });
    assert.equal(black.status, 'in_stock');
    assert.equal(black.source, 'variants');
    assert.equal(black.quantity, 2);
    const pink = await catalog.checkAvailability(IDS.studs, { color: 'розовый' });
    assert.equal(pink.status, 'out_of_stock');
    assert.equal(pink.source, 'variants');
  });

  it('вариантов нет → in_stock по флагу с пометкой', async () => {
    const r = await catalog.checkAvailability(IDS.bag, { size: 'M' });
    assert.equal(r.status, 'in_stock');
    assert.equal(r.source, 'flag');
    assert.match(r.note, /остаток по размерам не ведётся/);
    assert.ok(r.ignored?.length, 'размер у сумки игнорируется с пояснением');
  });
});

describe('quote', () => {
  it('2× пояс со скидкой', async () => {
    const q = await catalog.quote([{ productId: IDS.belt, qty: 2, size: 'M', color: 'черный' }]);
    assert.equal(q.errors.length, 0);
    const [line] = q.lines;
    assert.equal(line.unitPrice, 8900);
    assert.equal(line.regularUnitPrice, 11900);
    assert.equal(line.lineTotal, 17800);
    assert.equal(line.lineDiscount, 6000);
    assert.equal(q.subtotal, 17800);
    assert.equal(q.regularSubtotal, 23800);
    assert.equal(q.discountTotal, 6000);
    assert.equal(q.currency, 'RUB');
    assert.equal(plain(q.formatted.subtotal), '17 800 ₽');
    assert.equal(q.delivery, 'уточнит менеджер');
  });

  it('неизвестный товар и плохие qty/размер — в errors, остальное считается', async () => {
    const q = await catalog.quote([
      { productId: 999, qty: 1 },
      { productId: IDS.bag, qty: 1 },
      { productId: IDS.bag, qty: 0 },
      { productId: IDS.belt, qty: 1, size: 'XXL' },
    ]);
    assert.equal(q.lines.length, 1);
    assert.equal(q.subtotal, 29900);
    assert.equal(q.errors.length, 3);
    assert.deepEqual(q.errors[2].allowed?.[0].allowed, ['S', 'M', 'L']);
  });

  it('sale_price больше цены игнорируется', async () => {
    const q = await catalog.quote([{ productId: IDS.oddSale, qty: 3 }]);
    assert.equal(q.lines[0].unitPrice, 5000);
    assert.equal(q.discountTotal, 0);
    assert.equal(q.lines[0].color, 'черный');
  });

  it('цена варианта важнее цены товара', async () => {
    const q = await catalog.quote([
      { productId: IDS.sized, qty: 1, size: 'S' },
      { productId: IDS.sized, qty: 1, size: 'M' },
    ]);
    assert.deepEqual(q.lines.map((l) => l.unitPrice), [7000, 9000]);
    assert.deepEqual(q.lines.map((l) => l.availability), ['in_stock', 'in_stock']);
  });
});
