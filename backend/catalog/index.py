"""
Каталог ароматов Распивошной. Все запросы на GET /?action=...
GET /?action=list&sort=filling&category=decant — список товаров
GET /?action=product&id=1     — карточка товара
GET /?action=atomizers         — список атомайзеров
POST / body={action:create,...} — создать товар (admin/moderator)
POST / body={action:update,...} — обновить товар (admin/moderator)

category: decant (отливанты) | bottle (полноразмерные флаконы)
concentration: parfum_water | parfum | cologne | eau_de_toilette
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

CONCENTRATIONS = ('parfum_water', 'parfum', 'cologne', 'eau_de_toilette')
CATEGORIES = ('decant', 'bottle')


def get_session_user(headers: dict):
    token = (headers.get('X-Auth-Token') or '').strip()
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    return {'id': row[0], 'role': row[1]} if row else None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    headers = event.get('headers') or {}
    action = params.get('action', 'list')

    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':

        if action == 'atomizers':
            cur.execute("SELECT id, name, min_ml, max_ml, price FROM atomizers ORDER BY min_ml")
            rows = cur.fetchall()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([
                {'id': r[0], 'name': r[1], 'min_ml': r[2], 'max_ml': r[3], 'price': float(r[4])} for r in rows
            ])}

        if action == 'product':
            product_id = params.get('id')
            if not product_id:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите id'})}
            cur.execute(
                "SELECT id, name, brand, description, price_per_ml, bottle_ml, booked_ml, image_url, concentration, category FROM products WHERE id = %s AND is_active = TRUE",
                (int(product_id),)
            )
            row = cur.fetchone()
            conn.close()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Товар не найден'})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'id': row[0], 'name': row[1], 'brand': row[2], 'description': row[3],
                'price_per_ml': float(row[4]), 'bottle_ml': row[5], 'booked_ml': row[6],
                'available_ml': row[5] - row[6], 'image_url': row[7],
                'fill_percent': round(row[6] / row[5] * 100) if row[5] else 0,
                'concentration': row[8] or 'parfum_water',
                'category': row[9] or 'decant',
            })}

        # action == 'list'
        sort = params.get('sort', '')
        category_filter = params.get('category', '')
        query = "SELECT id, name, brand, description, price_per_ml, bottle_ml, booked_ml, image_url, concentration, category FROM products WHERE is_active = TRUE"
        if category_filter in CATEGORIES:
            query += f" AND category = '{category_filter}'"
        if sort == 'filling':
            query += " ORDER BY (booked_ml::float / NULLIF(bottle_ml, 0)) DESC"
        elif sort == 'price_asc':
            query += " ORDER BY price_per_ml ASC"
        elif sort == 'price_desc':
            query += " ORDER BY price_per_ml DESC"
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
                'fill_percent': round(r[6] / r[5] * 100) if r[5] else 0,
                'concentration': r[8] or 'parfum_water',
                'category': r[9] or 'decant',
            })
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(products)}

    if method == 'POST':
        user = get_session_user(headers)
        if not user or user['role'] not in ('admin', 'moderator'):
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Доступ запрещён'})}

        body = json.loads(event.get('body') or '{}')
        post_action = body.get('action', 'create')

        if post_action == 'update':
            product_id = body.get('id')
            if not product_id:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите id'})}
            fields, values = [], []
            for field in ('name', 'brand', 'description', 'image_url'):
                if field in body:
                    fields.append(f"{field} = %s")
                    values.append(body[field])
            for field in ('price_per_ml', 'bottle_ml'):
                if field in body:
                    fields.append(f"{field} = %s")
                    values.append(float(body[field]) if field == 'price_per_ml' else int(body[field]))
            if 'concentration' in body and body['concentration'] in CONCENTRATIONS:
                fields.append("concentration = %s")
                values.append(body['concentration'])
            if 'category' in body and body['category'] in CATEGORIES:
                fields.append("category = %s")
                values.append(body['category'])
            if not fields:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных'})}
            values.append(int(product_id))
            cur.execute(f"UPDATE products SET {', '.join(fields)} WHERE id = %s", values)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # create
        name = body.get('name', '').strip()
        brand = body.get('brand', '').strip()
        price_per_ml = body.get('price_per_ml')
        bottle_ml = body.get('bottle_ml')
        if not all([name, brand, price_per_ml, bottle_ml]):
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните название, бренд, цену и объём'})}
        concentration = body.get('concentration', 'parfum_water')
        if concentration not in CONCENTRATIONS:
            concentration = 'parfum_water'
        category = body.get('category', 'decant')
        if category not in CATEGORIES:
            category = 'decant'
        cur.execute(
            "INSERT INTO products (name, brand, description, price_per_ml, bottle_ml, image_url, concentration, category) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (name, brand, body.get('description', ''), float(price_per_ml), int(bottle_ml), body.get('image_url'), concentration, category)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'id': new_id})}

    conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
