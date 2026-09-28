-- ============================================================
-- Ведомость материалов эталона Homesteader's Cabin: этап «Пол» (спека 007).
-- Машинная копия раздела «Этап 2. Пол» из ВЕДОМОСТЬ_HomesteadersCabin.md:
-- количества и формулы — те же, что в документе; меняется документ —
-- меняется и этот сид (новой миграцией).
--
-- 1. Материалы этапа — upsert по sku_internal, фиксированные id …05NN.
--    Утеплитель и плёнки — в м² (volume_m3 / weight_kg на 1 м²).
-- 2. Предложения цен — upsert по индексу предложения material_prices_offer_idx
--    (материал, страна, регион, подпись). Только со страницы конкретного
--    товара с датой открытия; у фанеры цена не найдена — предложения нет.
-- 3. Состав этапа «Пол» (stage …312): демо-строки этапа удаляются (в том числе
--    демо-сваи DEMO-PILE-76 — смета фундамента пустеет до спеки 008), строки
--    ведомости вставляются с фиксированными id …06NN.
-- Идемпотентно: повтор не плодит строк и не меняет id, количества и цены.
-- На свежей БД без эталонного проекта тихо пропускается (как 015).
-- ============================================================

do $do$
begin
  if not exists (select 1 from house_projects
                 where id = 'de300000-0000-4000-8000-000000000100') then
    return;
  end if;

  -- 1. Материалы (SKU, объём, вес, хранение — из черновика .tmp/028_…DRAFT.sql)
  insert into materials (id, sku_internal, name, category, unit, volume_m3, weight_kg,
                         lumber_moisture, storage_tip) values
   ('de300000-0000-4000-8000-000000000503', 'LMB-50250-6000-NAT',
    'Доска обрезная 50×250×6000, естественной влажности', 'lumber', 'pcs', 0.075, 52, 'natural',
    'Тяжёлая и длинная: класть ровно, на прокладки через 1 м, иначе прогнётся «бананом».'),
   ('de300000-0000-4000-8000-000000000504', 'LMB-50250-6000-DRY',
    'Доска строганая 50×250×6000, сухая (после строжки 45×240)', 'lumber', 'pcs', 0.072, 44, 'dry',
    'Под навесом, на прокладках, не на солнце — сухая доска трескается по торцам.'),
   ('de300000-0000-4000-8000-000000000511', 'LMB-5050-3000',
    'Брусок обрезной 50×50×3000', 'lumber', 'pcs', 0.0075, 5, 'natural',
    'Тонкий брусок ведёт быстрее всего — держать в связке, под навесом.'),
   ('de300000-0000-4000-8000-000000000512', 'LMB-25100-6000',
    'Доска обрезная 25×100×6000', 'lumber', 'pcs', 0.015, 11, 'natural',
    'Первое, что пригодится: прокладки для штабеля остального леса.'),
   ('de300000-0000-4000-8000-000000000514', 'SHT-PLY-18-SHP',
    'Фанера шпунтованная 18 мм 1220×2440, ФК или ФСФ', 'sheet', 'pcs', 0.0536, 34, null,
    'Только плашмя, на ровной подкладке, под навесом. Поставленная на ребро — выгнется.'),
   -- на 1 м²: 0,1 м³; 20 кг / 5,76 м² = 3,472 кг
   ('de300000-0000-4000-8000-000000000516', 'INS-MW-100',
    'Минвата 100 мм, плиты', 'insulation', 'm2', 0.1, 3.472, null,
    'Держать сухой: намокшая минвата не греет и не сохнет. В упаковке, под крышей.'),
   -- на 1 м²: 0,02 м³ / 70 м² = 0,00029; 5 кг / 70 м² = 0,071
   ('de300000-0000-4000-8000-000000000518', 'MEM-WIND-70',
    'Мембрана ветро-влагозащитная', 'membrane', 'm2', 0.00029, 0.071, null,
    'В упаковке, не на солнце: ультрафиолет портит плёнку.'),
   -- на 1 м²: 0,02 м³ / 70 м² = 0,00029; 4 кг / 70 м² = 0,057
   ('de300000-0000-4000-8000-000000000519', 'MEM-VAPOR-70',
    'Пароизоляционная плёнка', 'membrane', 'm2', 0.00029, 0.057, null,
    'В упаковке, не на солнце.'),
   ('de300000-0000-4000-8000-000000000525', 'FST-NAIL-90',
    'Гвозди строительные 3,5×90', 'fasteners', 'kg', 0.0002, 1, null,
    'В сухом ящике: ржавый гвоздь хуже держит и пачкает доску.'),
   ('de300000-0000-4000-8000-000000000528', 'FST-SCREW-45',
    'Саморезы универсальные 4×45', 'fasteners', 'kg', 0.0002, 1, null,
    'В сухом ящике, коробку не рвать — рассыплются.'),
   ('de300000-0000-4000-8000-000000000529', 'FST-SCREW-75',
    'Саморезы по дереву 4,2×75', 'fasteners', 'kg', 0.0002, 1, null,
    'В сухом ящике.'),
   ('de300000-0000-4000-8000-000000000532', 'FST-HANGER-250',
    'Опора бруса открытая 50×200 (подвес лаги 50×250)', 'fasteners', 'pcs', 0.0005, 0.4, null,
    'В сухом месте, оцинковка не любит грязи.')
  on conflict (sku_internal) do update set
    name = excluded.name,
    category = excluded.category,
    unit = excluded.unit,
    volume_m3 = excluded.volume_m3,
    weight_kg = excluded.weight_kg,
    lumber_moisture = excluded.lumber_moisture,
    storage_tip = excluded.storage_tip;

  -- 2. Предложения: Москва и область, в базе «вся страна» (region_id = null).
  --    retailer — часть имени из retailers для сетей; у этапа «Пол» сетевых
  --    предложений нет, все — базы и магазины (local_base).
  insert into material_prices (material_id, country_code, region_id, price_minor, currency,
                               source_kind, retailer_id, source_label, source_url, checked_at)
  select m.id, 'RU', null, v.price_minor, 'RUB', v.source_kind,
         (select r.id from retailers r
           where r.country_code = 'RU' and v.retailer is not null
             and r.name ilike '%' || v.retailer || '%'
           order by r.name limit 1),
         v.source_label, v.source_url, v.checked_at
    from (values
      ('LMB-50250-6000-NAT', 146200, 'local_base', null::text,
       'ГрандЛесМаркет, Химки · 1 462 ₽/шт ≈ 19 500 ₽/м³',
       'https://himki.grandlesmarket.ru/pilomaterialy/doska/doska-obreznaya/doska-obreznaya-50x250x6000',
       date '2026-09-28'),
      ('LMB-50250-6000-NAT', 245000, 'local_base', null,
       'Доска50, Москва · 2 450 ₽/шт ≈ 32 700 ₽/м³',
       'https://doska50.ru/product/doska-obreznaya-50x250x6000/',
       date '2026-09-28'),
      ('LMB-50250-6000-DRY', 210000, 'local_base', null,
       'ГрандЛесМаркет, Химки · 2 100 ₽/шт ≈ 28 000 ₽/м³',
       'https://grandlesmarket.ru/pilomaterialy/doska/doska-strogannaya-suhaya/doska-strogannaya-50-250-6000-45-240-6000',
       date '2026-09-28'),
      ('LMB-50250-6000-DRY', 290000, 'local_base', null,
       'Доска50, Москва · 2 900 ₽/шт (с НДС 3 500) ≈ 38 700 ₽/м³',
       'https://doska50.ru/product/doska-strogannaya-50h250h6000/',
       date '2026-09-28'),
      ('LMB-5050-3000', 13500, 'local_base', null,
       'СеверЛесМаркет, Химки · 135 ₽/шт ≈ 18 000 ₽/м³',
       'https://severlesmarket.ru/catalog/brusok-obreznoj-gost-8486-86/brusok-obreznoy-50x50x3000/',
       date '2026-09-28'),
      ('LMB-25100-6000', 26000, 'local_base', null,
       'РУС-Лес, Московская обл. · 260 ₽/шт ≈ 17 300 ₽/м³',
       'https://rus-lesdom.ru/pilomaterial/doska-obreznaya-25x100x6000/',
       date '2026-09-28'),
      -- SHT-PLY-18-SHP: цена не найдена — предложения нет, позиция «цена уточняется»
      -- 1 000 ₽ / 2,88 м² = 347,22 ₽/м²
      ('INS-MW-100', 34722, 'local_base', null,
       'Строй Республика, Москва · Роклайт 100 мм, уп. 2,88 м² за 1 000 ₽',
       'https://stroy-respublika.ru/product/roklajt-tehonikol-100-mm/',
       date '2026-09-28'),
      -- 1 233 ₽ / 2,88 м² = 428,13 ₽/м²
      ('INS-MW-100', 42813, 'local_base', null,
       'ТЕХНОНИКОЛЬ (tstn.ru), Москва · Роклайт 100 мм, уп. 2,88 м² за 1 233 ₽',
       'https://www.tstn.ru/product/plita-mineralovatnaya-roklayt-1200kh600kh100-4-sht/',
       date '2026-09-28'),
      -- 2 899 ₽ / 70 м² = 41,41 ₽/м²
      ('MEM-WIND-70', 4141, 'local_base', null,
       'ОптоСтрой, Москва · Изоспан A, рулон 70 м² за 2 899 ₽',
       'https://optostroy.com/products/izospan-A-gidroizolyatsionnaya-vetrozaschitnaya-paropronitsaemaya-membrana-70m2-paroizolyatsiya/',
       date '2026-09-28'),
      -- 4 970 ₽ / 70 м² = 71,00 ₽/м²
      ('MEM-WIND-70', 7100, 'local_base', null,
       'Grand Line · Изоспан A, рулон 70 м² за 4 970 ₽',
       'https://www.grandline.ru/izospan-a-vetro-vlagoizolyatsionnaya-plenka-779.html',
       date '2026-09-28'),
      -- 2 750 ₽ / 70 м² = 39,29 ₽/м²
      ('MEM-VAPOR-70', 3929, 'local_base', null,
       'Мастер-СМ, Москва · Изоспан B, рулон 70 м² за 2 750 ₽',
       'https://www.mastercm.ru/product/izospan-b-paroizolyacionnaya-plenka-70m2/',
       date '2026-09-28'),
      -- 2 787,75 ₽ / 70 м² = 39,83 ₽/м²
      ('MEM-VAPOR-70', 3983, 'local_base', null,
       'ТК-СП, Москва · Изоспан B, рулон 70 м² за 2 787,75 ₽',
       'https://tk-sp.ru/membrana-izospan-b-paroizolyatsiya-70-m2/',
       date '2026-09-28'),
      ('FST-NAIL-90', 15000, 'local_base', null,
       'Стройснаб77, Москва · гвоздь 3,5×90, 150 ₽/кг',
       'https://stroisnab77.ru/catalog/stroitelnye-materialy/krepezh/gvozdi/gvozd-3-5kh90-mm-1-kg/',
       date '2026-09-28'),
      ('FST-SCREW-45', 12700, 'local_base', null,
       'Крепком, Москва · 4×45 жёлтый цинк, фасовка 0,3 кг, 127 ₽/кг',
       'https://krepcom.ru/catalog/samorezy/samorezyi_4_0h45_jeltyie__potay.htm',
       date '2026-09-28'),
      ('FST-SCREW-75', 22400, 'local_base', null,
       'Крепком, Москва · 4,2×75 чёрный, фасовка 1 кг за 224 ₽',
       'https://krepcom.ru/catalog/samorezy/samorezyi_h_75_potay__krupnaya_rezba__oksid.htm',
       date '2026-09-28'),
      ('FST-HANGER-250', 14500, 'local_base', null,
       'Крепком, Москва · опора бруса 50×200×1,8, 145 ₽/шт',
       'https://krepcom.ru/catalog/opori-derzhately/opora-brusa-rask-ovr-r-50-kh-200-kh-76-kh-1-8.htm',
       date '2026-09-28')
    ) as v(sku, price_minor, source_kind, retailer, source_label, source_url, checked_at)
    join materials m on m.sku_internal = v.sku
  on conflict (material_id, country_code,
               coalesce(region_id, '00000000-0000-0000-0000-000000000000'::uuid),
               lower(trim(source_label)))
  do update set
    price_minor = excluded.price_minor,
    currency = excluded.currency,
    source_kind = excluded.source_kind,
    retailer_id = excluded.retailer_id,
    source_url = excluded.source_url,
    checked_at = excluded.checked_at;

  -- 3. Состав этапа «Пол»: всё, чего нет в ведомости, — прочь (демо-строки)
  delete from bom_items
   where stage_id = 'de300000-0000-4000-8000-000000000312'
     and id <> all (array[
       'de300000-0000-4000-8000-000000000601', 'de300000-0000-4000-8000-000000000602',
       'de300000-0000-4000-8000-000000000603', 'de300000-0000-4000-8000-000000000604',
       'de300000-0000-4000-8000-000000000605', 'de300000-0000-4000-8000-000000000606',
       'de300000-0000-4000-8000-000000000607', 'de300000-0000-4000-8000-000000000608',
       'de300000-0000-4000-8000-000000000609', 'de300000-0000-4000-8000-000000000610',
       'de300000-0000-4000-8000-000000000611', 'de300000-0000-4000-8000-000000000612'
     ]::uuid[]);

  insert into bom_items (id, project_id, stage_id, material_id, qty, applies_when)
  select v.id::uuid, 'de300000-0000-4000-8000-000000000100',
         'de300000-0000-4000-8000-000000000312', m.id, v.qty, v.applies_when::jsonb
    from (values
      -- Поперечные: 7315 / 610 = 12 пролётов → 13 шт (2 торцевые + 11 лаг) × 3458 мм,
      -- по одной на доску 6 м → 13; сдвоенная обвязка 2 стороны × 2 слоя = 4 ряда × 7315,
      -- ряд = доска 6000 + вставка 1315 из остатка 2542 → 4; итого 17, +10 % = 18,7 → 19
      ('de300000-0000-4000-8000-000000000601', 'LMB-50250-6000-NAT', 19::numeric, '{"lumber":"natural"}'),
      -- то же, что строка выше: 13 + 4 = 17, +10 % = 18,7 → 19
      ('de300000-0000-4000-8000-000000000602', 'LMB-50250-6000-DRY', 19, '{"lumber":"dry"}'),
      -- 3 полосы по 1220; крайние по 3 листа 2440, средняя ½ + 2 + ½ → 8 + 2 половинки
      -- = 9 листов; +5 % = 9,45 → 10
      ('de300000-0000-4000-8000-000000000603', 'SHT-PLY-18-SHP', 10, '{}'),
      -- два слоя по 100 мм: 26,8 м² × 2 = 53,6; +5 % = 56,3 → 57 м² (адаптация под РФ)
      ('de300000-0000-4000-8000-000000000604', 'INS-MW-100', 57, '{}'),
      -- снизу по лагам: 26,8 м² + 15 % нахлёст = 30,8 → 31 м² (адаптация под РФ)
      ('de300000-0000-4000-8000-000000000605', 'MEM-WIND-70', 31, '{}'),
      -- сверху по лагам: 26,8 м² + 15 % = 30,8 → 31 м² (адаптация под РФ)
      ('de300000-0000-4000-8000-000000000606', 'MEM-VAPOR-70', 31, '{}'),
      -- черепной брусок: 11 лаг × 2 + 2 торцевые × 1 = 24 ряда × 3458 = 83,0 м;
      -- / 3 = 27,7 → 28; +10 % = 30,8 → 31 (адаптация под РФ)
      ('de300000-0000-4000-8000-000000000607', 'LMB-5050-3000', 31, '{}'),
      -- сплошной подбой: 12 пролётов × (3458 / 100 → 35) = 420 отрезков по 560 мм;
      -- 10 из доски 6 м → 42; +10 % = 46,2 → 47 (адаптация под РФ)
      ('de300000-0000-4000-8000-000000000608', 'LMB-25100-6000', 47, '{}'),
      -- по числу лаг × 2: 11 × 2 = 22
      ('de300000-0000-4000-8000-000000000609', 'FST-HANGER-250', 22, '{}'),
      -- углы 4 × 3 = 12; концы лаг 11 × 2 × 2 = 44; сшивка обвязки 2 × 20 × 2 = 80;
      -- черепной брусок 24 × 10 = 240; 376 шт × 6,6 г = 2,48 кг; +15 % = 2,85 → 3,0 кг
      ('de300000-0000-4000-8000-000000000610', 'FST-NAIL-90', 3, '{}'),
      -- подвесы 22 × 2 крыла × 2 = 88 шт × 4,99 г = 0,44 кг; +15 % = 0,505 → 1,0 кг
      ('de300000-0000-4000-8000-000000000611', 'FST-SCREW-75', 1, '{}'),
      -- фанера через 20 см: 13 × 20 = 260; кромки 2 × 38 = 76; стыки 7 × 8 = 56;
      -- 392 шт × 3,94 г = 1,54 кг; +15 % = 1,78 → 2,0 кг
      ('de300000-0000-4000-8000-000000000612', 'FST-SCREW-45', 2, '{}')
    ) as v(id, sku, qty, applies_when)
    join materials m on m.sku_internal = v.sku
  on conflict (id) do update set
    project_id = excluded.project_id,
    stage_id = excluded.stage_id,
    material_id = excluded.material_id,
    qty = excluded.qty,
    applies_when = excluded.applies_when;
end
$do$;
