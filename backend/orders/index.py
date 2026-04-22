"""
Заказы Распивошной.
POST /place — оформить заказ (требует авторизации)
GET /my — мои заказы (требует авторизации)
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def get_session_user(headers: dict):
    cookie = headers.get('X-Cookie', '') or headers.get('cookie', '')
    session_id = None
    for part in cookie.split(';'):
        part = part.strip()
        if part.startswith('session='):
            session_id = part[8:]
            break
    if not session_id:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.nickname, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {'id': row[0], 'nickname': row[1], 'role': row[2]}


def get_atomizer(cur, volume_ml: int):
    cur.execute(
        "SELECT id, name, price FROM atomizers WHERE min_ml <= %s AND max_ml >= %s LIMIT 1",
        (volume_ml, volume_ml)
    )
    row = cur.fetchone()
    if row:
        return {'id': row[0], 'name': row[1], 'price': float(row[2])}
    cur.execute("SELECT id, name, price FROM atomizers ORDER BY min_ml DESC LIMIT 1")
    row = cur.fetchone()
    return {'id': row[0], 'name': row[1], 'price': float(row[2])} if row else None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    user = get_session_user(headers)

    if not user:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Необходима авторизация'})}

    body = json.loads(event.get('body') or '{}')

    # POST /place — оформить заказ
    if path.endswith('/place') and method == 'POST':
        product_id = body.get('product_id')
        volume_ml = body.get('volume_ml')

        if not product_id or not volume_ml or int(volume_ml) < 1:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите товар и объём (от 1 мл)'})}

        volume_ml = int(volume_ml)
        conn = get_conn()
        cur = conn.cursor()

        cur.execute("SELECT id, name, price_per_ml, bottle_ml, booked_ml FROM products WHERE id = %s AND is_active = TRUE", (product_id,))
        product = cur.fetchone()
        if not product:
            conn.close()
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Товар не найден'})}

        prod_id, prod_name, price_per_ml, bottle_ml, booked_ml = product
        available = bottle_ml - booked_ml
        if volume_ml > available:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': f'Доступно только {available} мл'})}

        atomizer = get_atomizer(cur, volume_ml)
        atomizer_id = atomizer['id'] if atomizer else None
        atomizer_price = atomizer['price'] if atomizer else 0

        total = round(float(price_per_ml) * volume_ml + atomizer_price, 2)

        cur.execute(
            """INSERT INTO orders (user_id, product_id, atomizer_id, volume_ml, price_per_ml, atomizer_price, total_price, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'accepted') RETURNING id""",
            (user['id'], prod_id, atomizer_id, volume_ml, float(price_per_ml), atomizer_price, total)
        )
        order_id = cur.fetchone()[0]

        cur.execute("UPDATE products SET booked_ml = booked_ml + %s WHERE id = %s", (volume_ml, prod_id))
        conn.commit()
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
            'order_id': order_id,
            'product_name': prod_name,
            'volume_ml': volume_ml,
            'price_per_ml': float(price_per_ml),
            'atomizer': atomizer,
            'total_price': total,
        })}

    # GET /my — мои заказы
    if path.endswith('/my') and method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            """SELECT o.id, p.name, p.brand, p.image_url, o.volume_ml, o.price_per_ml, o.atomizer_price, o.total_price,
                      o.status, o.payment_confirmed, o.pickup_point, o.created_at,
                      a.name as atomizer_name
               FROM orders o
               JOIN products p ON o.product_id = p.id
               LEFT JOIN atomizers a ON o.atomizer_id = a.id
               WHERE o.user_id = %s AND o.is_archived = FALSE
               ORDER BY o.created_at DESC""",
            (user['id'],)
        )
        rows = cur.fetchall()
        conn.close()

        orders = []
        for r in rows:
            orders.append({
                'id': r[0], 'product_name': r[1], 'brand': r[2], 'image_url': r[3],
                'volume_ml': r[4], 'price_per_ml': float(r[5]), 'atomizer_price': float(r[6]),
                'total_price': float(r[7]), 'status': r[8], 'payment_confirmed': r[9],
                'pickup_point': r[10], 'created_at': str(r[11]), 'atomizer_name': r[12]
            })

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(orders)}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
