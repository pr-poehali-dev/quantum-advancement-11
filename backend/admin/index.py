"""
Кабинет модератора Распивошной.
GET  /?action=orders             — все заказы с фильтром
GET  /?action=payments           — неподтверждённые платежи
GET  /?action=debts              — все активные долги
GET  /?action=archived_orders    — архивные заказы
GET  /?action=admin_products     — список товаров для редактирования (admin)
POST / {action:confirm_payment}  — подтвердить платёж
POST / {action:set_status}       — групповая смена статуса
POST / {action:add_debt}         — добавить долг вручную
POST / {action:resolve_debt}     — закрыть долг
POST / {action:archive_order}    — архивировать один заказ
POST / {action:archive_orders}   — групповая архивация
POST / {action:unarchive_orders} — разархивация
POST / {action:update_product}   — обновить товар (цена, bottle_ml, booked_ml, name, brand)
POST / {action:import_products}  — импорт из Excel: [{id?,name,brand,price_per_ml,bottle_ml,...}]
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
                SELECT o.id, o.created_at, u.nickname, p.name, p.brand,
                       o.volume_ml, o.total_price, o.atomizer_price, o.price_per_ml,
                       o.status, o.pickup_point, o.payment_amount, o.payment_confirmed,
                       o.payment_note, a.name, p.id
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                LEFT JOIN atomizers a ON o.atomizer_id = a.id
                WHERE o.is_archived = FALSE
            """
            conditions, values = [], []
            if nick_filter:
                conditions.append("LOWER(u.nickname) LIKE %s")
                values.append(f'%{nick_filter}%')
            if product_filter:
                conditions.append("(LOWER(p.name) LIKE %s OR LOWER(p.brand) LIKE %s)")
                values.extend([f'%{product_filter}%', f'%{product_filter}%'])
            if status_filter:
                conditions.append("o.status = %s")
                values.append(status_filter)
            if conditions:
                query += " AND " + " AND ".join(conditions)
            query += " ORDER BY o.created_at DESC"
            cur.execute(query, values)
            rows = cur.fetchall()
            conn.close()
            orders = [{
                'id': r[0], 'created_at': str(r[1]), 'nickname': r[2],
                'product_name': r[3], 'brand': r[4], 'volume_ml': r[5],
                'total_price': float(r[6]), 'atomizer_price': float(r[7]),
                'price_per_ml': float(r[8]), 'status': r[9], 'pickup_point': r[10],
                'payment_amount': float(r[11]) if r[11] else None,
                'payment_confirmed': r[12], 'payment_note': r[13],
                'atomizer_name': r[14], 'product_id': r[15],
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'orders': orders,
                'total_sum': round(sum(o['total_price'] for o in orders), 2),
                'total_ml': sum(o['volume_ml'] for o in orders),
                'count': len(orders),
            })}

        if action == 'payments':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("""
                SELECT o.id, o.created_at, u.id as uid, u.nickname, p.name, p.brand,
                       o.volume_ml, o.total_price, o.payment_amount, o.payment_note, o.payment_date
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                WHERE o.payment_amount IS NOT NULL AND o.payment_confirmed = FALSE
                  AND o.is_archived = FALSE
                ORDER BY o.payment_date ASC
            """)
            rows = cur.fetchall()
            conn.close()
            payments = []
            for r in rows:
                total = float(r[7])
                paid = float(r[8])
                payments.append({
                    'order_id': r[0], 'created_at': str(r[1]),
                    'user_id': r[2], 'nickname': r[3],
                    'product_name': r[4], 'brand': r[5], 'volume_ml': r[6],
                    'total_price': total, 'payment_amount': paid,
                    'payment_note': r[9],
                    'payment_date': str(r[10]) if r[10] else None,
                    'diff': round(paid - total, 2),
                })
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(payments)}

        if action == 'debts':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("""
                SELECT d.id, d.type, d.amount, d.reason, d.resolved, d.created_at,
                       u.id, u.nickname, d.order_id, d.resolve_note
                FROM debts d
                JOIN users u ON d.user_id = u.id
                ORDER BY d.resolved ASC, d.created_at DESC
            """)
            rows = cur.fetchall()
            conn.close()
            debts = [{
                'id': r[0], 'type': r[1], 'amount': float(r[2]),
                'reason': r[3], 'resolved': r[4], 'created_at': str(r[5]),
                'user_id': r[6], 'nickname': r[7], 'order_id': r[8],
                'resolve_note': r[9],
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(debts)}

        if action == 'archived_orders':
            nick_filter = (params.get('nick') or '').strip().lower()
            product_filter = (params.get('product') or '').strip().lower()
            conn = get_conn()
            cur = conn.cursor()
            query = """
                SELECT o.id, o.created_at, o.archived_at, u.nickname, p.name, p.brand,
                       o.volume_ml, o.total_price, o.atomizer_price, o.price_per_ml,
                       o.status, o.pickup_point, o.payment_amount, o.payment_confirmed,
                       o.payment_note, a.name, p.id,
                       (SELECT COUNT(*) FROM debts d WHERE d.order_id = o.id AND d.resolved = FALSE) as open_debts
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                LEFT JOIN atomizers a ON o.atomizer_id = a.id
                WHERE o.is_archived = TRUE
            """
            conditions, values = [], []
            if nick_filter:
                conditions.append("LOWER(u.nickname) LIKE %s")
                values.append(f'%{nick_filter}%')
            if product_filter:
                conditions.append("(LOWER(p.name) LIKE %s OR LOWER(p.brand) LIKE %s)")
                values.extend([f'%{product_filter}%', f'%{product_filter}%'])
            if conditions:
                query += " AND " + " AND ".join(conditions)
            query += " ORDER BY o.archived_at DESC"
            cur.execute(query, values)
            rows = cur.fetchall()
            conn.close()
            import datetime
            orders = []
            for r in rows:
                archived_at = r[2]
                delete_at = (archived_at + datetime.timedelta(days=122)) if archived_at else None
                orders.append({
                    'id': r[0], 'created_at': str(r[1]),
                    'archived_at': str(r[2]) if r[2] else None,
                    'delete_at': str(delete_at) if delete_at else None,
                    'nickname': r[3], 'product_name': r[4], 'brand': r[5],
                    'volume_ml': r[6], 'total_price': float(r[7]),
                    'atomizer_price': float(r[8]), 'price_per_ml': float(r[9]),
                    'status': r[10], 'pickup_point': r[11],
                    'payment_amount': float(r[12]) if r[12] else None,
                    'payment_confirmed': r[13], 'payment_note': r[14],
                    'atomizer_name': r[15], 'product_id': r[16],
                    'open_debts': int(r[17]),
                })
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'orders': orders,
                'count': len(orders),
            })}

        if action == 'admin_products':
            name_filter = (params.get('name') or '').strip().lower()
            brand_filter = (params.get('brand') or '').strip().lower()
            conn = get_conn()
            cur = conn.cursor()
            query = """
                SELECT p.id, p.name, p.brand, p.price_per_ml, p.bottle_ml, p.booked_ml,
                       p.is_active, p.image_url, p.description,
                       COALESCE(SUM(CASE WHEN o.status NOT IN ('declined') AND o.is_archived = FALSE THEN o.volume_ml ELSE 0 END), 0) as active_booked
                FROM products p
                LEFT JOIN orders o ON o.product_id = p.id
                WHERE 1=1
            """
            conditions, values = [], []
            if name_filter:
                conditions.append("LOWER(p.name) LIKE %s")
                values.append(f'%{name_filter}%')
            if brand_filter:
                conditions.append("LOWER(p.brand) LIKE %s")
                values.append(f'%{brand_filter}%')
            if conditions:
                query += " AND " + " AND ".join(conditions)
            query += " GROUP BY p.id ORDER BY p.created_at DESC"
            cur.execute(query, values)
            rows = cur.fetchall()
            conn.close()
            products = [{
                'id': r[0], 'name': r[1], 'brand': r[2],
                'price_per_ml': float(r[3]), 'bottle_ml': r[4], 'booked_ml': r[5],
                'is_active': r[6], 'image_url': r[7], 'description': r[8],
                'active_booked': int(r[9]),
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'products': products, 'count': len(products)})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', '')

        if action == 'confirm_payment':
            order_id = body.get('order_id')
            confirmed_amount = body.get('confirmed_amount')  # скорректированная сумма
            debt_note = body.get('debt_note', '')
            if not order_id or confirmed_amount is None:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_id и confirmed_amount'})}

            confirmed_amount = float(confirmed_amount)
            conn = get_conn()
            cur = conn.cursor()

            # Получаем заказ и юзера
            cur.execute(
                "SELECT o.total_price, o.user_id FROM orders o WHERE o.id = %s AND o.is_archived = FALSE",
                (order_id,)
            )
            row = cur.fetchone()
            if not row:
                conn.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Заказ не найден'})}

            total_price = float(row[0])
            user_id = row[1]
            diff = round(confirmed_amount - total_price, 2)

            # Подтверждаем оплату
            cur.execute(
                """UPDATE orders SET payment_confirmed = TRUE, payment_confirmed_amount = %s,
                   status = 'waiting', updated_at = NOW() WHERE id = %s""",
                (confirmed_amount, order_id)
            )

            # Фиксируем долг если есть расхождение
            if diff < -0.01:
                # Клиент недоплатил — он должен нам
                reason = debt_note or f'Недоплата по заказу #{order_id}: нужно {total_price} ₽, поступило {confirmed_amount} ₽'
                cur.execute(
                    "INSERT INTO debts (user_id, order_id, type, amount, reason) VALUES (%s, %s, 'client_owes', %s, %s)",
                    (user_id, order_id, abs(diff), reason)
                )
            elif diff > 0.01:
                # Клиент переплатил — мы должны ему
                reason = debt_note or f'Переплата по заказу #{order_id}: нужно было {total_price} ₽, поступило {confirmed_amount} ₽'
                cur.execute(
                    "INSERT INTO debts (user_id, order_id, type, amount, reason) VALUES (%s, %s, 'we_owe', %s, %s)",
                    (user_id, order_id, diff, reason)
                )

            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'diff': diff})}

        if action == 'add_debt':
            # Ручное добавление долга (напр. товар не пришёл — мы должны)
            user_id = body.get('user_id')
            debt_type = body.get('type')  # 'client_owes' or 'we_owe'
            amount = body.get('amount')
            reason = (body.get('reason') or '').strip()
            order_id = body.get('order_id')
            if not all([user_id, debt_type, amount, reason]):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите user_id, type, amount, reason'})}
            if debt_type not in ('client_owes', 'we_owe'):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'type: client_owes или we_owe'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO debts (user_id, order_id, type, amount, reason) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (int(user_id), order_id, debt_type, float(amount), reason)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': new_id})}

        if action == 'resolve_debt':
            debt_id = body.get('debt_id')
            resolve_note = (body.get('resolve_note') or '').strip()
            if not debt_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите debt_id'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "UPDATE debts SET resolved = TRUE, resolved_at = NOW(), resolve_note = %s WHERE id = %s",
                (resolve_note, debt_id)
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'archive_order':
            order_id = body.get('order_id')
            if not order_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_id'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "UPDATE orders SET is_archived = TRUE, updated_at = NOW() WHERE id = %s AND status IN ('delivery','declined')",
                (order_id,)
            )
            if cur.rowcount == 0:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Архивировать можно только Раздача или Отказано'})}
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'archive_orders':
            order_ids = body.get('order_ids', [])
            if not order_ids or not isinstance(order_ids, list):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_ids'})}
            conn = get_conn()
            cur = conn.cursor()
            placeholders = ','.join(['%s'] * len(order_ids))
            cur.execute(
                f"UPDATE orders SET is_archived = TRUE, archived_at = NOW(), updated_at = NOW() WHERE id IN ({placeholders}) AND is_archived = FALSE",
                list(order_ids)
            )
            archived = cur.rowcount
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'archived': archived})}

        if action == 'unarchive_orders':
            order_ids = body.get('order_ids', [])
            if not order_ids or not isinstance(order_ids, list):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_ids'})}
            conn = get_conn()
            cur = conn.cursor()
            placeholders = ','.join(['%s'] * len(order_ids))
            cur.execute(
                f"UPDATE orders SET is_archived = FALSE, archived_at = NULL, updated_at = NOW() WHERE id IN ({placeholders}) AND is_archived = TRUE",
                list(order_ids)
            )
            restored = cur.rowcount
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'restored': restored})}

        if action == 'set_status':
            order_ids = body.get('order_ids', [])
            new_status = body.get('status', '')
            if not order_ids or new_status not in ALLOWED_STATUSES:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_ids и корректный status'})}
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

        if action == 'update_product':
            product_id = body.get('id')
            if not product_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите id'})}
            conn = get_conn()
            cur = conn.cursor()
            fields, values = [], []
            for field in ('name', 'brand', 'description', 'image_url'):
                if field in body:
                    fields.append(f"{field} = %s")
                    values.append(body[field])
            if 'price_per_ml' in body:
                fields.append("price_per_ml = %s")
                values.append(float(body['price_per_ml']))
            if 'bottle_ml' in body:
                fields.append("bottle_ml = %s")
                values.append(int(body['bottle_ml']))
            if 'booked_ml' in body:
                fields.append("booked_ml = %s")
                values.append(int(body['booked_ml']))
            if 'is_active' in body:
                fields.append("is_active = %s")
                values.append(bool(body['is_active']))
            if not fields:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных для обновления'})}
            values.append(int(product_id))
            cur.execute(f"UPDATE products SET {', '.join(fields)} WHERE id = %s", values)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'import_products':
            items = body.get('items', [])
            if not items or not isinstance(items, list):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите items'})}
            conn = get_conn()
            cur = conn.cursor()
            created, updated = 0, 0
            for item in items:
                pid = item.get('id')
                name = (item.get('name') or '').strip()
                brand = (item.get('brand') or '').strip()
                price_per_ml = item.get('price_per_ml')
                bottle_ml = item.get('bottle_ml')
                if not name or not brand or price_per_ml is None or bottle_ml is None:
                    continue
                if pid:
                    cur.execute("SELECT id FROM products WHERE id = %s", (int(pid),))
                    exists = cur.fetchone()
                    if exists:
                        cur.execute(
                            "UPDATE products SET price_per_ml = %s, bottle_ml = %s WHERE id = %s",
                            (float(price_per_ml), int(bottle_ml), int(pid))
                        )
                        updated += 1
                        continue
                description = (item.get('description') or '').strip()
                image_url = item.get('image_url')
                cur.execute(
                    "INSERT INTO products (name, brand, description, price_per_ml, bottle_ml, image_url) VALUES (%s, %s, %s, %s, %s, %s)",
                    (name, brand, description, float(price_per_ml), int(bottle_ml), image_url)
                )
                created += 1
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'created': created, 'updated': updated})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}