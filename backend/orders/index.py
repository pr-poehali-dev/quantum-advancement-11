"""
Заказы Распивошной.
GET  /?action=my                   — мои заказы
GET  /?action=my_debts             — мои долги
GET  /?action=delivery_options     — список вариантов доставки
POST / body={action:place,...}     — оформить заказ
POST / body={action:delete,...}    — удалить (accepted/fixed)
POST / body={action:archive,...}   — архивировать (delivery/declined)
POST / body={action:pay,...}       — отметить оплату
POST / body={action:set_delivery}  — выбрать/изменить вариант доставки (waiting)
POST / body={action:debt_request}  — запрос возврата/зачёта
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

EDITABLE_STATUSES = ('accepted', 'fixed')
PAYMENT_STATUSES = ('awaiting_payment',)
ARCHIVABLE_STATUSES = ('delivery', 'declined')


def get_session_user(headers: dict):
    token = (headers.get('X-Auth-Token') or '').strip()
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.nickname, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    return {'id': row[0], 'nickname': row[1], 'role': row[2]} if row else None


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
    """Обработчик заказов клиента"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    params = event.get('queryStringParameters') or {}
    user = get_session_user(headers)

    if not user:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Необходима авторизация'})}

    if method == 'GET':
        action = params.get('action', 'my')

        if action == 'delivery_options':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "SELECT id, name, description, address, schedule FROM delivery_options WHERE is_active = TRUE ORDER BY sort_order ASC"
            )
            rows = cur.fetchall()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([{
                'id': r[0], 'name': r[1], 'description': r[2], 'address': r[3], 'schedule': r[4],
            } for r in rows])}

        if action == 'my':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                """SELECT o.id, p.name, p.brand, p.image_url, o.volume_ml, o.price_per_ml, o.atomizer_price, o.total_price,
                          o.status, o.payment_confirmed, o.pickup_point, o.created_at,
                          a.name as atomizer_name, o.payment_amount, o.payment_date, o.payment_note, p.id as product_id,
                          o.delivery_option_id, o.delivery_comment,
                          dopt.name as delivery_option_name, dopt.address as delivery_address, dopt.schedule as delivery_schedule
                   FROM orders o
                   JOIN products p ON o.product_id = p.id
                   LEFT JOIN atomizers a ON o.atomizer_id = a.id
                   LEFT JOIN delivery_options dopt ON o.delivery_option_id = dopt.id
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
                    'pickup_point': r[10], 'created_at': str(r[11]), 'atomizer_name': r[12],
                    'payment_amount': float(r[13]) if r[13] else None,
                    'payment_date': str(r[14]) if r[14] else None,
                    'payment_note': r[15],
                    'product_id': r[16],
                    'delivery_option_id': r[17],
                    'delivery_comment': r[18],
                    'delivery_option_name': r[19],
                    'delivery_address': r[20],
                    'delivery_schedule': r[21],
                })
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(orders)}

        if action == 'my_debts':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                """SELECT id, type, amount, reason, resolved, created_at,
                          client_request, client_card, client_request_at, order_id, resolve_note
                   FROM debts WHERE user_id = %s ORDER BY resolved ASC, created_at DESC""",
                (user['id'],)
            )
            rows = cur.fetchall()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([{
                'id': r[0], 'type': r[1], 'amount': float(r[2]),
                'reason': r[3], 'resolved': r[4], 'created_at': str(r[5]),
                'client_request': r[6], 'client_card': r[7],
                'client_request_at': str(r[8]) if r[8] else None,
                'order_id': r[9], 'resolve_note': r[10],
            } for r in rows])}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'place')

        if action == 'place':
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
                'order_id': order_id, 'product_name': prod_name,
                'volume_ml': volume_ml, 'price_per_ml': float(price_per_ml),
                'atomizer': atomizer, 'total_price': total,
            })}

        if action == 'delete':
            order_id = body.get('order_id')
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, status, volume_ml, product_id FROM orders WHERE id = %s AND user_id = %s", (order_id, user['id']))
            order = cur.fetchone()
            if not order:
                conn.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Заказ не найден'})}
            if order[1] not in EDITABLE_STATUSES:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя удалить на этом статусе'})}
            cur.execute("UPDATE products SET booked_ml = GREATEST(0, booked_ml - %s) WHERE id = %s", (order[2], order[3]))
            cur.execute("UPDATE orders SET is_archived = TRUE, status = 'declined' WHERE id = %s", (order_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'archive':
            order_id = body.get('order_id')
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, status FROM orders WHERE id = %s AND user_id = %s", (order_id, user['id']))
            order = cur.fetchone()
            if not order or order[1] not in ARCHIVABLE_STATUSES:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя архивировать'})}
            cur.execute("UPDATE orders SET is_archived = TRUE, archived_at = NOW() WHERE id = %s", (order_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'pay':
            order_ids = body.get('order_ids') or ([body.get('order_id')] if body.get('order_id') else [])
            payment_amount = body.get('payment_amount')
            payment_note = body.get('payment_note', '')
            payment_date = body.get('payment_date')  # ISO строка от клиента, напр. "2025-01-15T14:30"
            if not order_ids or not payment_amount:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите заказы и сумму'})}
            if not payment_date:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите дату и время платежа'})}
            conn = get_conn()
            cur = conn.cursor()
            placeholders = ','.join(['%s'] * len(order_ids))
            cur.execute(
                f"SELECT id FROM orders WHERE id IN ({placeholders}) AND user_id = %s AND status = ANY(%s)",
                list(order_ids) + [user['id'], list(PAYMENT_STATUSES)]
            )
            valid_ids = [r[0] for r in cur.fetchall()]
            if not valid_ids:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет заказов, ожидающих оплаты'})}
            ph2 = ','.join(['%s'] * len(valid_ids))
            cur.execute(
                f"UPDATE orders SET payment_amount = %s, payment_date = %s, payment_note = %s WHERE id IN ({ph2})",
                [float(payment_amount), payment_date, payment_note] + valid_ids
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'set_delivery':
            order_ids = body.get('order_ids') or ([body.get('order_id')] if body.get('order_id') else [])
            delivery_option_id = body.get('delivery_option_id')
            delivery_comment = (body.get('delivery_comment') or '').strip()
            if not order_ids or not delivery_option_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите заказы и вариант доставки'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id FROM delivery_options WHERE id = %s AND is_active = TRUE", (delivery_option_id,))
            if not cur.fetchone():
                conn.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Вариант доставки не найден'})}
            placeholders = ','.join(['%s'] * len(order_ids))
            cur.execute(
                f"SELECT id FROM orders WHERE id IN ({placeholders}) AND user_id = %s AND status = 'waiting'",
                list(order_ids) + [user['id']]
            )
            valid_ids = [r[0] for r in cur.fetchall()]
            if not valid_ids:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет подходящих заказов'})}
            ph2 = ','.join(['%s'] * len(valid_ids))
            cur.execute(
                f"UPDATE orders SET delivery_option_id = %s, delivery_comment = %s WHERE id IN ({ph2})",
                [delivery_option_id, delivery_comment or None] + valid_ids
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'updated': len(valid_ids)})}

        if action == 'debt_request':
            debt_id = body.get('debt_id')
            request_type = body.get('request_type')
            card = (body.get('card') or '').strip()
            if not debt_id or request_type not in ('refund', 'credit'):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите debt_id и request_type (refund/credit)'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, type FROM debts WHERE id = %s AND user_id = %s AND resolved = FALSE", (debt_id, user['id']))
            debt = cur.fetchone()
            if not debt or debt[1] != 'we_owe':
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Долг не найден или уже закрыт'})}
            cur.execute(
                "UPDATE debts SET client_request = %s, client_card = %s, client_request_at = NOW() WHERE id = %s",
                (request_type, card or None, debt_id)
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Unknown action'})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}