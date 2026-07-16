-- SPEC.md 2.5 foundation_rules — матрица рекомендаций фундамента (SQL дословно из SPEC v1.3)
create table foundation_rules (
  id uuid primary key default gen_random_uuid(),
  soil text not null check (soil in ('clay','loam','sandy_loam','sand','peat','unknown')),
  high_water text not null check (high_water in ('yes','no','unknown')),
  relief text not null check (relief in ('flat','slope')),
  weight_class text not null check (weight_class in ('light','standard')), -- light: hozblok/banya ≤35м², standard: дома
  foundation text not null check (foundation in ('piles','mzlf','columnar')),
  reason_points jsonb not null   -- ["Высокая вода — лента будет мокнуть", "Сваи ставятся за 1 день без бетона", ...]
);
alter table foundation_rules enable row level security;
create policy "fr_read_all" on foundation_rules for select using (true);
create policy "fr_admin" on foundation_rules for all using (is_admin()) with check (is_admin());
-- Сид (полная матрица; правила применяются первым совпадением сверху вниз по этому порядку вставки):
insert into foundation_rules (soil,high_water,relief,weight_class,foundation,reason_points) values
 ('peat','yes','flat','standard','piles','["Торф не держит нагрузку — сваи проходят его до плотного грунта","Бетонная лента на торфе треснет","Монтаж за 1–2 дня без бетонных работ"]'),
 ('peat','yes','flat','light','piles','["Торф не держит нагрузку","Для лёгкой постройки хватит коротких свай"]'),
 ('peat','no','flat','standard','piles','["Торф ненадёжен даже сухой","Сваи проходят его до плотного слоя"]'),
 ('peat','no','flat','light','piles','["Торф ненадёжен","Короткие сваи решают вопрос за день"]'),
 ('peat','yes','slope','standard','piles','["Торф + уклон: только сваи разной длины"]'),
 ('peat','no','slope','standard','piles','["Уклон на торфе выравнивается сваями разной длины"]'),
 ('peat','unknown','flat','standard','piles','["Торф: консервативно — сваи"]'),
 ('clay','yes','flat','standard','piles','["Глина + высокая вода = сильное пучение зимой","Лента потребует дренажа и утепления — дорого и сложно новичку","Сваи ниже глубины промерзания не выпучит"]'),
 ('clay','yes','flat','light','piles','["Пучинистая мокрая глина поднимет столбики","Сваи надёжнее для любой постройки"]'),
 ('clay','no','flat','standard','mzlf','["Сухая глина несёт каркасник уверенно","МЗЛФ с утеплённой отмосткой — классика по СП","Дешевле свай при ровном участке"]'),
 ('clay','no','flat','light','columnar','["Для лёгкой постройки хватит столбчатого","Самый дешёвый вариант","День работы без спецтехники"]'),
 ('clay','unknown','flat','standard','piles','["Неизвестная вода на глине — берём надёжный вариант","Проверите грунт — можно пересчитать"]'),
 ('loam','yes','flat','standard','piles','["Суглинок с водой пучит","Сваи не зависят от пучения"]'),
 ('loam','no','flat','standard','mzlf','["Суглинок без воды — хорошее основание","МЗЛФ дешевле и жёстче для дома"]'),
 ('loam','no','flat','light','columnar','["Лёгкая постройка на сухом суглинке — столбики","Минимум денег и работы"]'),
 ('loam','unknown','flat','standard','piles','["Вода неизвестна — консервативно сваи"]'),
 ('sandy_loam','no','flat','standard','mzlf','["Супесь дренирует воду — пучение слабое","МЗЛФ оптимален по цене/жёсткости"]'),
 ('sandy_loam','yes','flat','standard','piles','["Высокая вода — сваи проще и суше"]'),
 ('sand','no','flat','standard','mzlf','["Песок — лучшее основание: не пучит","МЗЛФ мелкого заложения, экономия бетона"]'),
 ('sand','yes','flat','standard','mzlf','["Песок дренирует — вода не критична","МЗЛФ с подушкой работает и тут"]'),
 ('sand','no','flat','light','columnar','["Лёгкая постройка на песке — столбики, дешевле некуда"]'),
 ('unknown','unknown','flat','standard','piles','["Грунт неизвестен — сваи работают почти везде","Совет: закажите пробное завинчивание одной сваи — это и есть экспресс-геология"]'),
 ('unknown','unknown','flat','light','piles','["Неизвестный грунт — сваи безопаснее"]'),
 ('unknown','unknown','slope','standard','piles','["Уклон: сваи разной длины вместо дорогой планировки участка"]');
-- Правило по коду: если relief='slope' и точного совпадения нет → 'piles'.
