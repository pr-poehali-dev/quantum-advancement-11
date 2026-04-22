"""
Кабинет модератора Распивошной.
GET  /?action=orders&nick=...&product=...&status=... — все заказы с фильтром
POST / body={action:set_status, order_ids:[...], status:...} — групповая смена статуса
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

ALLOWED_STATUSES = ('accepted', 'fixed', 'awaiting_payment', 'waiting', 'delivery', 'declined')


def get_admin_user(headers: dict):
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
    if not row or row[1] not in ('admin', 'moderator'):
        return None
    return {'id': row[0], 'role': row[1]}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    params = event.get('queryStringParameters') or {}

    user = get_admin_user(headers)
    if not user:
        return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Доступ запрещён'})}

    if method == 'GET':
        action = params.get('action', 'orders')

        if action == 'orders':
            nick_filter = (params.get('nick') or '').strip().lower()
            product_filter = (params.get('product') or '').strip().lower()
            status_filter = (params.get('status') or '').strip()

            conn = get_conn()
            cur = conn.cursor()

            query = """
                SELECT o.id, o.created_at, u.nickname, p.name as product_name, p.brand,
                       o.volume_ml, o.total_price, o.atomizer_price, o.price_per_ml,
                       o.status, o.pickup_point, o.payment_amount, o.payment_confirmed,
                       o.payment_note, a.name as atomizer_name, p.id as product_id
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                LEFT JOIN atomizers a ON o.atomizer_id = a.id
                WHERE o.is_archived = FALSE
            """
            conditions = []
            values = []

            if nick_filter:
                conditions.append("LOWER(u.nickname) LIKE %s")
                values.append(f'%{nick_filter}%')
            if product_filter:
                conditions.append("(LOWER(p.name) LIKE %s OR LOWER(p.brand) LIKE %s)")
                values.append(f'%{product_filter}%')
                values.append(f'%{product_filter}%')
            if status_filter:
                conditions.append("o.status = %s")
                values.append(status_filter)

            if conditions:
                query += " AND " + " AND ".join(conditions)

            query += " ORDER BY o.created_at DESC"

            cur.execute(query, values)
            rows = cur.fetchall()
            conn.close()

            orders = []
            for r in rows:
                orders.append({
                    'id': r[0],
                    'created_at': str(r[1]),
                    'nickname': r[2],
                    'product_name': r[3],
                    'brand': r[4],
                    'volume_ml': r[5],
                    'total_price': float(r[6]),
                    'atomizer_price': float(r[7]),
                    'price_per_ml': float(r[8]),
                    'status': r[9],
                    'pickup_point': r[10],
                    'payment_amount': float(r[11]) if r[11] else None,
                    'payment_confirmed': r[12],
                    'payment_note': r[13],
                    'atomizer_name': r[14],
                    'product_id': r[15],
                })

            total_sum = sum(o['total_price'] for o in orders)
            total_ml = sum(o['volume_ml'] for o in orders)

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'orders': orders,
                'total_sum': round(total_sum, 2),
                'total_ml': total_ml,
                'count': len(orders),
            })}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', '')

        if action == 'confirm_payment':
            order_id = body.get('order_id')
            if not order_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_id'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "UPDATE orders SET payment_confirmed = TRUE, status = 'waiting', updated_at = NOW() WHERE id = %s AND is_archived = FALSE",
                (order_id,)
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'set_status':
            order_ids = body.get('order_ids', [])
            new_status = body.get('status', '')

            if not order_ids or not new_status:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_ids и status'})}
            if new_status not in ALLOWED_STATUSES:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': f'Недопустимый статус: {new_status}'})}
            if not isinstance(order_ids, list) or len(order_ids) == 0:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'order_ids должен быть непустым списком'})}

            conn = get_conn()
            cur = conn.cursor()
            placeholders = ','.join(['%s'] * len(order_ids))
            cur.execute(
                f"UPDATE orders SET status = %s, updated_at = NOW() WHERE id IN ({placeholders}) AND is_archived = FALSE",
                [new_status] + list(order_ids)
            )
            updated = cur.rowcount
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'updated': updated})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}