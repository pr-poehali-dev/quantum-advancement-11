import json
import os
import psycopg2
import requests

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
}

MS_BASE = 'https://api.moysklad.ru/api/remap/1.2'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ms_headers():
    token = os.environ.get('MOYSKLAD_TOKEN', '')
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
    }


def get_token_user(headers):
    auth = headers.get('x-authorization') or headers.get('X-Authorization') or ''
    if not auth.startswith('Bearer '):
        return None
    token = auth[7:]
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {'id': row[0], 'role': row[1]}


def require_admin(headers):
    user = get_token_user(headers)
    if not user or user['role'] not in ('admin', 'moderator'):
        return None
    return user


def ms_get(path, params=None):
    r = requests.get(f'{MS_BASE}{path}', headers=ms_headers(), params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def ms_post(path, data):
    r = requests.post(f'{MS_BASE}{path}', headers=ms_headers(), json=data, timeout=15)
    r.raise_for_status()
    return r.json()


def ms_put(path, data):
    r = requests.put(f'{MS_BASE}{path}', headers=ms_headers(), json=data, timeout=15)
    r.raise_for_status()
    return r.json()


def sync_products_to_ms(conn):
    """Синхронизирует товары из БД в МойСклад. Возвращает (created, updated, errors)."""
    cur = conn.cursor()
    cur.execute("SELECT id, name, brand, price_per_ml, supplier_id, ext_id FROM products WHERE is_active = TRUE")
    products = cur.fetchall()

    existing = {}
    try:
        data = ms_get('/entity/product', {'limit': 1000, 'offset': 0})
        for item in data.get('rows', []):
            existing[item['id']] = item
    except Exception as e:
        raise RuntimeError(f'Ошибка получения товаров из МС: {e}')

    created = 0
    updated = 0
    errors = []

    for prod_id, name, brand, price_per_ml, supplier_id, ext_id in products:
        # Имя товара: "Бренд — Название"
        ms_name = f'{brand} — {name}'
        price_kopecks = round(float(price_per_ml) * 100)

        payload = {
            'name': ms_name,
            'code': supplier_id or str(prod_id),
            'article': supplier_id or str(prod_id),
            'salePrices': [
                {
                    'value': price_kopecks,
                    'currency': {'meta': {'href': f'{MS_BASE}/entity/currency', 'type': 'currency', 'mediaType': 'application/json'}},
                    'priceType': {'meta': {'href': f'{MS_BASE}/context/companysettings/pricetype/', 'type': 'pricetype', 'mediaType': 'application/json'}},
                }
            ],
        }

        try:
            if ext_id and ext_id in existing:
                ms_put(f'/entity/product/{ext_id}', payload)
                updated += 1
            else:
                result = ms_post('/entity/product', payload)
                ms_id = result['id']
                cur.execute("UPDATE products SET ext_id = %s WHERE id = %s", (ms_id, prod_id))
                created += 1
        except Exception as e:
            errors.append(f'Товар #{prod_id} ({ms_name}): {e}')

    conn.commit()
    return created, updated, errors


def get_or_create_counterparty(nickname, phone):
    """Находит или создаёт контрагента в МС по нику."""
    try:
        data = ms_get('/entity/counterparty', {'filter': f'name={nickname}', 'limit': 1})
        rows = data.get('rows', [])
        if rows:
            return rows[0]['meta']['href']
    except Exception:
        pass

    payload = {'name': nickname}
    if phone:
        payload['phone'] = phone
    result = ms_post('/entity/counterparty', payload)
    return result['meta']['href']


def create_customerorder_in_ms(order_id):
    """Создаёт заказ покупателя в МойСклад после подтверждения оплаты."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT o.id, o.total_price, o.volume_ml, o.payment_confirmed_amount,
               u.nickname, u.phone, u.email,
               p.name, p.brand, p.price_per_ml, p.ext_id, p.supplier_id
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN products p ON o.product_id = p.id
        WHERE o.id = %s
    """, (order_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise RuntimeError(f'Заказ #{order_id} не найден')

    (oid, total_price, volume_ml, confirmed_amount,
     nickname, phone, email, prod_name, brand, price_per_ml, ext_id, supplier_id) = row

    counterparty_href = get_or_create_counterparty(nickname, phone)

    positions = []
    if ext_id:
        positions.append({
            'quantity': volume_ml,
            'price': round(float(price_per_ml) * 100),
            'assortment': {
                'meta': {
                    'href': f'{MS_BASE}/entity/product/{ext_id}',
                    'type': 'product',
                    'mediaType': 'application/json',
                }
            },
        })

    sum_kopecks = round(float(confirmed_amount or total_price) * 100)

    payload = {
        'name': f'Заказ #{oid} — {nickname}',
        'agent': {'meta': {'href': counterparty_href, 'type': 'counterparty', 'mediaType': 'application/json'}},
        'description': f'{brand} — {prod_name}, {volume_ml} мл. Клиент: {nickname} ({phone})',
        'sum': sum_kopecks,
    }
    if positions:
        payload['positions'] = positions

    result = ms_post('/entity/customerorder', payload)
    return result['id']


def handler(event: dict, context) -> dict:
    """Интеграция с МойСклад: синхронизация товаров и создание заказов."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    if method == 'POST':
        user = require_admin(headers)
        if not user:
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

        body = {}
        if event.get('body'):
            body = json.loads(event['body'])

        action = body.get('action', '')

        if action == 'sync_products':
            conn = get_conn()
            try:
                created, updated, errors = sync_products_to_ms(conn)
            except Exception as e:
                conn.close()
                return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': str(e)})}
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'ok': True, 'created': created, 'updated': updated, 'errors': errors
            })}

        if action == 'create_order':
            order_id = body.get('order_id')
            if not order_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_id'})}
            try:
                ms_order_id = create_customerorder_in_ms(order_id)
            except Exception as e:
                return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': str(e)})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'ms_order_id': ms_order_id})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестный action'})}

    if method == 'GET':
        action = params.get('action', '')

        if action == 'check':
            user = require_admin(headers)
            if not user:
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}
            try:
                data = ms_get('/context/employee')
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                    'ok': True, 'name': data.get('name', ''), 'account': data.get('accountName', '')
                })}
            except Exception as e:
                return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': str(e)})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
