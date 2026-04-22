"""
Каталог ароматов Распивошной.
GET / — список товаров (с шкалой мл)
GET /{id} — карточка товара
GET /atomizers — список атомайзеров
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}

    conn = get_conn()
    cur = conn.cursor()

    if path.endswith('/atomizers'):
        cur.execute("SELECT id, name, min_ml, max_ml, price FROM atomizers ORDER BY min_ml")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([
            {'id': r[0], 'name': r[1], 'min_ml': r[2], 'max_ml': r[3], 'price': float(r[4])} for r in rows
        ])}

    # /catalog/{id}
    parts = path.rstrip('/').split('/')
    if parts and parts[-1].isdigit():
        product_id = int(parts[-1])
        cur.execute(
            "SELECT id, name, brand, description, price_per_ml, bottle_ml, booked_ml, image_url FROM products WHERE id = %s AND is_active = TRUE",
            (product_id,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Товар не найден'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
            'id': row[0], 'name': row[1], 'brand': row[2], 'description': row[3],
            'price_per_ml': float(row[4]), 'bottle_ml': row[5], 'booked_ml': row[6],
            'available_ml': row[5] - row[6], 'image_url': row[7]
        })}

    # Список товаров с фильтрацией
    sort = params.get('sort', '')
    query = "SELECT id, name, brand, description, price_per_ml, bottle_ml, booked_ml, image_url FROM products WHERE is_active = TRUE"
    if sort == 'filling':
        query += " ORDER BY (booked_ml::float / NULLIF(bottle_ml, 0)) DESC"
    else:
        query += " ORDER BY created_at DESC"

    cur.execute(query)
    rows = cur.fetchall()
    conn.close()

    products = []
    for r in rows:
        products.append({
            'id': r[0], 'name': r[1], 'brand': r[2], 'description': r[3],
            'price_per_ml': float(r[4]), 'bottle_ml': r[5], 'booked_ml': r[6],
            'available_ml': r[5] - r[6], 'image_url': r[7],
            'fill_percent': round(r[6] / r[5] * 100) if r[5] else 0
        })

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(products)}
