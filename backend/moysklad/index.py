import json
import os
import psycopg2
import requests

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Authorization',
}

MS_BASE = 'https://api.moysklad.ru/api/remap/1.2'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ms_headers():
    token = os.environ.get('MOYSKLAD_TOKEN', '')
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }


def get_token_user(headers):
    # Фронтенд шлёт X-Auth-Token (простой токен, без Bearer)
    token = (
        headers.get('x-auth-token') or
        headers.get('X-Auth-Token') or
        headers.get('x-authorization', '').replace('Bearer ', '') or
        headers.get('X-Authorization', '').replace('Bearer ', '')
    )
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
    if not row:
        return None
    return {'id': row[0], 'role': row[1]}


def require_admin(headers):
    user = get_token_user(headers)
    if not user or user['role'] not in ('admin', 'moderator'):
        return None
    return user


def ms_get(path, params=None):
    r = requests.get(f'{MS_BASE}{path}', headers=ms_headers(), params=params, timeout=20)
    if not r.ok:
        raise RuntimeError(f'МС {r.status_code}: {r.text[:300]}')
    return r.json()


def ms_post(path, data):
    r = requests.post(f'{MS_BASE}{path}', headers=ms_headers(), json=data, timeout=20)
    if not r.ok:
        raise RuntimeError(f'МС {r.status_code}: {r.text[:300]}')
    return r.json()


def ms_put(path, data):
    r = requests.put(f'{MS_BASE}{path}', headers=ms_headers(), json=data, timeout=20)
    if not r.ok:
        raise RuntimeError(f'МС {r.status_code}: {r.text[:300]}')
    return r.json()


def get_price_type_href():
    data = ms_get('/context/companysettings/pricetype')
    # МС возвращает список напрямую для этого эндпоинта
    rows = data if isinstance(data, list) else data.get('rows', [])
    if not rows:
        raise RuntimeError('Не найдены типы цен в МойСклад')
    return rows[0]['meta']['href']


def get_currency_href():
    data = ms_get('/entity/currency')
    rows = data.get('rows', [])
    for r in rows:
        if r.get('isoCode') in ('RUB', 'RUR'):
            return r['meta']['href']
    if rows:
        return rows[0]['meta']['href']
    raise RuntimeError('Не найдена валюта в МойСклад')


def sync_products_to_ms(conn):
    """Синхронизирует товары из БД в МойСклад."""
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, brand, price_per_ml, supplier_id, ext_id FROM products WHERE is_active = TRUE"
    )
    products = cur.fetchall()

    if not products:
        return 0, 0, []

    price_type_href = get_price_type_href()
    currency_href = get_currency_href()

    existing_ids = set()
    offset = 0
    while True:
        data = ms_get('/entity/product', {'limit': 100, 'offset': offset})
        rows = data.get('rows', [])
        for item in rows:
            existing_ids.add(item['id'])
        if len(rows) < 100:
            break
        offset += 100

    created = 0
    updated = 0
    errors = []

    for prod_id, name, brand, price_per_ml, supplier_id, ext_id in products:
        ms_name = f'{brand} — {name}'
        price_kopecks = round(float(price_per_ml) * 100)

        payload = {
            'name': ms_name,
            'code': supplier_id or str(prod_id),
            'article': supplier_id or str(prod_id),
            'salePrices': [
                {
                    'value': price_kopecks,
                    'currency': {'meta': {'href': currency_href, 'type': 'currency', 'mediaType': 'application/json'}},
                    'priceType': {'meta': {'href': price_type_href, 'type': 'pricetype', 'mediaType': 'application/json'}},
                }
            ],
        }

        try:
            if ext_id and ext_id in existing_ids:
                ms_put(f'/entity/product/{ext_id}', payload)
                updated += 1
            else:
                result = ms_post('/entity/product', payload)
                ms_id = result['id']
                cur.execute("UPDATE products SET ext_id = %s WHERE id = %s", (ms_id, prod_id))
                created += 1
        except Exception as e:
            errors.append(f'Товар #{prod_id} ({ms_name}): {str(e)}')

    conn.commit()
    return created, updated, errors


def get_or_create_counterparty(nickname, phone):
    try:
        data = ms_get('/entity/counterparty', {'filter': f'name={nickname}', 'limit': 5})
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
               u.nickname, u.phone,
               p.name, p.brand, p.price_per_ml, p.ext_id
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN products p ON o.product_id = p.id
        WHERE o.id = %s
    """, (order_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise RuntimeError(f'Заказ #{order_id} не найден')

    oid, total_price, volume_ml, confirmed_amount, nickname, phone, prod_name, brand, price_per_ml, ext_id = row

    counterparty_href = get_or_create_counterparty(nickname, phone)

    positions = []
    if ext_id:
        positions.append({
            'quantity': float(volume_ml),
            'price': round(float(price_per_ml) * 100),
            'assortment': {
                'meta': {
                    'href': f'{MS_BASE}/entity/product/{ext_id}',
                    'type': 'product',
                    'mediaType': 'application/json',
                }
            },
        })

    payload = {
        'agent': {'meta': {'href': counterparty_href, 'type': 'counterparty', 'mediaType': 'application/json'}},
        'description': f'{brand} — {prod_name}, {volume_ml} мл. Клиент: {nickname} ({phone})',
    }
    if positions:
        payload['positions'] = positions

    result = ms_post('/entity/customerorder', payload)
    return result['id']


def sync_orders_to_ms(order_ids: list) -> dict:
    """Отправляет список заказов в МойСклад. Пропускает уже отправленные."""
    conn = get_conn()
    cur = conn.cursor()

    placeholders = ','.join(['%s'] * len(order_ids))
    cur.execute(f"""
        SELECT o.id, o.ms_order_id, o.total_price, o.volume_ml,
               u.nickname, u.phone,
               p.name, p.brand, p.price_per_ml, p.ext_id,
               o.status
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN products p ON o.product_id = p.id
        WHERE o.id IN ({placeholders})
    """, order_ids)
    rows = cur.fetchall()

    created = 0
    skipped = 0
    errors = []

    for row in rows:
        oid, ms_order_id, total_price, volume_ml, nickname, phone, prod_name, brand, price_per_ml, ext_id, status = row

        if ms_order_id:
            skipped += 1
            continue

        try:
            counterparty_href = get_or_create_counterparty(nickname, phone)

            positions = []
            if ext_id:
                positions.append({
                    'quantity': float(volume_ml),
                    'price': round(float(price_per_ml) * 100),
                    'assortment': {
                        'meta': {
                            'href': f'{MS_BASE}/entity/product/{ext_id}',
                            'type': 'product',
                            'mediaType': 'application/json',
                        }
                    },
                })

            payload = {
                'agent': {'meta': {'href': counterparty_href, 'type': 'counterparty', 'mediaType': 'application/json'}},
                'description': f'{brand} — {prod_name}, {volume_ml} мл. Клиент: {nickname} ({phone})',
            }
            if positions:
                payload['positions'] = positions

            result = ms_post('/entity/customerorder', payload)
            new_ms_id = result['id']
            cur.execute("UPDATE orders SET ms_order_id = %s WHERE id = %s", (new_ms_id, oid))
            created += 1
        except Exception as e:
            errors.append(f'Заказ #{oid}: {str(e)}')

    conn.commit()
    conn.close()
    return {'created': created, 'skipped': skipped, 'errors': errors}


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

        if action == 'sync_orders':
            order_ids = body.get('order_ids', [])
            if not order_ids:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_ids'})}
            try:
                result = sync_orders_to_ms(order_ids)
            except Exception as e:
                return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': str(e)})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, **result})}

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