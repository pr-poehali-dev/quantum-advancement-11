-- Обновляем цены и диапазоны атомайзеров под новые условия
UPDATE atomizers SET min_ml=1,  max_ml=3,    price=40, name='Флакон 1–3 мл'    WHERE id=1;
UPDATE atomizers SET min_ml=4,  max_ml=10,   price=50, name='Флакон 4–10 мл'   WHERE id=2;
UPDATE atomizers SET min_ml=11, max_ml=15,   price=80, name='Флакон 11–15 мл'  WHERE id=3;
UPDATE atomizers SET min_ml=16, max_ml=9999, price=90, name='Флакон от 16 мл'  WHERE id=4;
