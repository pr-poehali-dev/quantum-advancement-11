"""
Кабинет модератора Распивошной. v2
GET  /?action=orders             — все заказы с фильтром (nick, product, status, delivery)
GET  /?action=payments           — неподтверждённые платежи
GET  /?action=debts              — все активные долги
GET  /?action=archived_orders    — архивные заказы
GET  /?action=admin_products     — список товаров для редактирования (admin)
POST / {action:confirm_payment}         — подтвердить платёж
POST / {action:set_status}              — групповая смена статуса
POST / {action:add_debt}                — добавить долг вручную
POST / {action:resolve_debt}            — закрыть долг
POST / {action:archive_order}           — архивировать один заказ
POST / {action:archive_orders}          — групповая архивация
POST / {action:unarchive_orders}        — разархивация
POST / {action:update_product}          — обновить товар
POST / {action:import_products}         — импорт из Excel
POST / {action:get_delivery_options}    — список вариантов доставки
POST / {action:create_delivery_option}  — добавить вариант
POST / {action:update_delivery_option}  — обновить вариант
POST / {action:delete_delivery_option}  — удалить вариант
"""
import json
import os
import psycopg2
import requests


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
                       o.payment_note, a.name, p.id,
                       o.delivery_option_id, o.delivery_comment,
                       dopt.name, dopt.address, dopt.schedule,
                       u.phone, u.customer_code, o.pickup_batch
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                LEFT JOIN atomizers a ON o.atomizer_id = a.id
                LEFT JOIN delivery_options dopt ON o.delivery_option_id = dopt.id
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
            delivery_filter = (params.get('delivery') or '').strip().lower()
            if delivery_filter:
                conditions.append("LOWER(COALESCE(dopt.name, '')) LIKE %s")
                values.append(f'%{delivery_filter}%')
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
                'delivery_option_id': r[16], 'delivery_comment': r[17],
                'delivery_option_name': r[18], 'delivery_address': r[19], 'delivery_schedule': r[20],
                'phone': r[21], 'customer_code': r[22], 'pickup_batch': r[23],
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

        if action == 'confirmed_payments':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("""
                SELECT o.id, o.created_at, u.id as uid, u.nickname, p.name, p.brand,
                       o.volume_ml, o.total_price, o.payment_amount, o.payment_note, o.payment_date,
                       o.payment_confirmed_amount
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                WHERE o.payment_confirmed = TRUE AND o.is_archived = FALSE
                ORDER BY o.payment_date DESC
                LIMIT 200
            """)
            rows = cur.fetchall()
            conn.close()
            result = []
            for r in rows:
                total = float(r[7])
                paid = float(r[8]) if r[8] else 0
                confirmed = float(r[11]) if r[11] else paid
                result.append({
                    'order_id': r[0], 'created_at': str(r[1]),
                    'user_id': r[2], 'nickname': r[3],
                    'product_name': r[4], 'brand': r[5], 'volume_ml': r[6],
                    'total_price': total, 'payment_amount': paid,
                    'payment_confirmed_amount': confirmed,
                    'payment_note': r[9],
                    'payment_date': str(r[10]) if r[10] else None,
                    'diff': round(confirmed - total, 2),
                })
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(result)}

        if action == 'debts':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("""
                SELECT d.id, d.type, d.amount, d.reason, d.resolved, d.created_at,
                       u.id, u.nickname, d.order_id, d.resolve_note,
                       d.client_request, d.client_card, d.client_request_at
                FROM debts d
                JOIN users u ON d.user_id = u.id
                ORDER BY d.client_request DESC NULLS LAST, d.resolved ASC, d.created_at DESC
            """)
            rows = cur.fetchall()
            conn.close()
            debts = [{
                'id': r[0], 'type': r[1], 'amount': float(r[2]),
                'reason': r[3], 'resolved': r[4], 'created_at': str(r[5]),
                'user_id': r[6], 'nickname': r[7], 'order_id': r[8],
                'resolve_note': r[9],
                'client_request': r[10], 'client_card': r[11],
                'client_request_at': str(r[12]) if r[12] else None,
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
            sort_by = (params.get('sort') or 'created_at').strip()
            sort_dir = 'DESC' if (params.get('dir') or 'desc').lower() == 'desc' else 'ASC'
            ALLOWED_SORT = {'id', 'name', 'brand', 'price_per_ml', 'bottle_ml', 'booked_ml', 'created_at'}
            if sort_by not in ALLOWED_SORT:
                sort_by = 'created_at'
            conn = get_conn()
            cur = conn.cursor()
            query = """
                SELECT p.id, p.name, p.brand, p.price_per_ml, p.bottle_ml, p.booked_ml,
                       p.is_active, p.image_url, p.description, p.concentration, p.category,
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
            query += f" GROUP BY p.id ORDER BY p.{sort_by} {sort_dir}"
            cur.execute(query, values)
            rows = cur.fetchall()
            conn.close()
            products = [{
                'id': r[0], 'name': r[1], 'brand': r[2],
                'price_per_ml': float(r[3]), 'bottle_ml': r[4], 'booked_ml': r[5],
                'is_active': r[6], 'image_url': r[7], 'description': r[8],
                'concentration': r[9] or 'parfum_water', 'category': r[10] or 'decant',
                'active_booked': int(r[11]),
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'products': products, 'count': len(products)})}

        if action == 'users':
            q = (params.get('q') or '').strip().lower()
            conn = get_conn()
            cur = conn.cursor()
            query = """
                SELECT u.id, u.nickname, u.email, u.phone, u.role, u.created_at,
                       u.is_blocked, u.blocked_reason, u.admin_note, u.admin_tags,
                       COUNT(DISTINCT o.id) as order_count,
                       COALESCE(SUM(CASE WHEN o.is_archived = FALSE AND o.status != 'declined' THEN o.total_price ELSE 0 END), 0) as total_spent,
                       u.customer_code
                FROM users u
                LEFT JOIN orders o ON o.user_id = u.id
                WHERE 1=1
            """
            values = []
            if q:
                query += " AND (LOWER(u.nickname) LIKE %s OR LOWER(u.email) LIKE %s OR u.phone LIKE %s)"
                values.extend([f'%{q}%', f'%{q}%', f'%{q}%'])
            query += " GROUP BY u.id ORDER BY u.created_at DESC"
            cur.execute(query, values)
            rows = cur.fetchall()
            conn.close()
            users = [{
                'id': r[0], 'nickname': r[1], 'email': r[2], 'phone': r[3],
                'role': r[4], 'created_at': str(r[5]),
                'is_blocked': r[6], 'blocked_reason': r[7],
                'admin_note': r[8], 'admin_tags': list(r[9]) if r[9] else [],
                'order_count': int(r[10]), 'total_spent': float(r[11]),
                'customer_code': r[12],
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users, 'count': len(users)})}

        if action == 'get_delivery_options':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, name, description, address, schedule, is_active, sort_order FROM delivery_options ORDER BY sort_order ASC")
            rows = cur.fetchall()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([{
                'id': r[0], 'name': r[1], 'description': r[2], 'address': r[3],
                'schedule': r[4], 'is_active': r[5], 'sort_order': r[6],
            } for r in rows])}

        if action == 'get_setting':
            key = (params.get('key') or '').strip()
            if not key:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите key'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT value FROM settings WHERE key = %s", (key,))
            row = cur.fetchone()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'key': key, 'value': row[0] if row else ''})}

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

        if action == 'edit_payment':
            order_id = body.get('order_id')
            payment_amount = body.get('payment_amount')
            payment_date = body.get('payment_date')
            payment_note = body.get('payment_note', '')
            payment_confirmed_amount = body.get('payment_confirmed_amount')
            if not order_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_id'})}
            conn = get_conn()
            cur = conn.cursor()
            fields, values = [], []
            if payment_amount is not None:
                fields.append("payment_amount = %s"); values.append(float(payment_amount))
            if payment_date is not None:
                fields.append("payment_date = %s"); values.append(payment_date)
            if 'payment_note' in body:
                fields.append("payment_note = %s"); values.append(payment_note)
            if payment_confirmed_amount is not None:
                fields.append("payment_confirmed_amount = %s"); values.append(float(payment_confirmed_amount))
            if not fields:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных для обновления'})}
            values.append(int(order_id))
            cur.execute(f"UPDATE orders SET {', '.join(fields)} WHERE id = %s", values)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'delete_payment':
            order_id = body.get('order_id')
            if not order_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_id'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                """UPDATE orders SET payment_amount = NULL, payment_date = NULL, payment_note = NULL,
                   payment_confirmed = FALSE, payment_confirmed_amount = NULL WHERE id = %s""",
                (int(order_id),)
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'edit_debt':
            debt_id = body.get('debt_id')
            if not debt_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите debt_id'})}
            conn = get_conn()
            cur = conn.cursor()
            fields, values = [], []
            if 'amount' in body:
                fields.append("amount = %s"); values.append(float(body['amount']))
            if 'reason' in body:
                fields.append("reason = %s"); values.append(str(body['reason']).strip())
            if 'type' in body and body['type'] in ('client_owes', 'we_owe'):
                fields.append("type = %s"); values.append(body['type'])
            if not fields:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных'})}
            values.append(int(debt_id))
            cur.execute(f"UPDATE debts SET {', '.join(fields)} WHERE id = %s", values)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'resolve_debt_request':
            debt_id = body.get('debt_id')
            resolve_note = (body.get('resolve_note') or '').strip()
            if not debt_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите debt_id'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                """UPDATE debts SET resolved = TRUE, resolved_at = NOW(), resolve_note = %s
                   WHERE id = %s AND client_request IS NOT NULL
                   RETURNING user_id, amount, client_request""",
                (resolve_note or 'Выполнено по запросу клиента', int(debt_id))
            )
            row = cur.fetchone()
            if not row:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Долг не найден или нет запроса'})}
            client_user_id, debt_amount, req_type = row[0], float(row[1]), row[2]
            cur.execute("SELECT id FROM users WHERE is_admin = TRUE LIMIT 1")
            admin_row = cur.fetchone()
            if admin_row:
                admin_id = admin_row[0]
                req_label = 'возврат на карту' if req_type == 'refund' else 'зачёт в счёт заказов'
                note_part = f' ({resolve_note})' if resolve_note and resolve_note != 'Выполнено по запросу клиента' else ''
                msg = f'✅ Ваш запрос на {req_label} на сумму {debt_amount:.2f} ₽ выполнен{note_part}. Долг списан.'
                cur.execute(
                    "INSERT INTO messages (from_user_id, to_user_id, body) VALUES (%s, %s, %s)",
                    (admin_id, client_user_id, msg)
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
            pickup_batch = body.get('pickup_batch')
            if not order_ids or new_status not in ALLOWED_STATUSES:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_ids и корректный status'})}
            conn = get_conn()
            cur = conn.cursor()
            placeholders = ','.join(['%s'] * len(order_ids))
            if new_status == 'delivery' and pickup_batch:
                cur.execute(
                    f"UPDATE orders SET status = %s, pickup_batch = %s, updated_at = NOW() WHERE id IN ({placeholders}) AND is_archived = FALSE",
                    [new_status, int(pickup_batch)] + list(order_ids)
                )
            else:
                cur.execute(
                    f"UPDATE orders SET status = %s, updated_at = NOW() WHERE id IN ({placeholders}) AND is_archived = FALSE",
                    [new_status] + list(order_ids)
                )
            updated = cur.rowcount
            # При переходе в delivery или declined — сбрасываем забронированные мл
            if new_status in ('delivery', 'declined'):
                cur.execute(
                    f"""UPDATE products SET booked_ml = GREATEST(0,
                        booked_ml - (SELECT COALESCE(SUM(o.volume_ml), 0) FROM orders o WHERE o.id IN ({placeholders}) AND o.product_id = products.id)
                    ) WHERE id IN (SELECT DISTINCT product_id FROM orders WHERE id IN ({placeholders}))""",
                    list(order_ids) + list(order_ids)
                )
            # Собираем данные для уведомлений ДО commit
            cur.execute(
                f"""SELECT u.telegram_id, o.id, p.name, p.brand, o.volume_ml
                    FROM orders o
                    JOIN users u ON o.user_id = u.id
                    JOIN products p ON o.product_id = p.id
                    WHERE o.id IN ({placeholders}) AND u.telegram_id IS NOT NULL AND u.telegram_id != ''""",
                list(order_ids)
            )
            notify_rows = cur.fetchall()
            print(f"[notify] status={new_status} order_ids={order_ids} notify_rows={notify_rows}")
            conn.commit()
            conn.close()
            # Отправляем уведомления через бот
            STATUS_LABELS = {
                'accepted': '✅ Принят',
                'fixed': '📋 Зафиксирован',
                'awaiting_payment': '💳 Ожидает оплаты',
                'waiting': '⏳ В ожидании',
                'delivery': '🚚 Готов к выдаче',
                'declined': '❌ Отклонён',
            }
            status_label = STATUS_LABELS.get(new_status, new_status)
            bot_url = os.environ.get('TELEGRAM_BOT_URL', '')
            print(f"[notify] bot_url={bool(bot_url)} rows_count={len(notify_rows)}")
            for row in notify_rows:
                tg_id, order_id, product_name, brand, volume_ml = row
                text = (
                    f"<b>Обновление заказа #{order_id}</b>\n\n"
                    f"<b>{brand} — {product_name}</b>, {volume_ml} мл\n\n"
                    f"Новый статус: {status_label}"
                )
                try:
                    resp = requests.post(
                        f"{bot_url}?action=send",
                        json={"chat_id": tg_id, "text": text, "parse_mode": "HTML"},
                        timeout=5
                    )
                    print(f"[notify] sent to {tg_id}, status={resp.status_code}, body={resp.text[:200]}")
                except Exception as e:
                    print(f"[notify] error sending to {tg_id}: {e}")
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'updated': updated})}

        if action == 'broadcast':
            text = (body.get('text') or '').strip()
            if not text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Текст не может быть пустым'})}
            bot_url = os.environ.get('TELEGRAM_BOT_URL', '')
            if not bot_url:
                return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': 'Бот не настроен'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL AND telegram_id != ''")
            tg_ids = [row[0] for row in cur.fetchall()]
            conn.close()
            sent, failed = 0, 0
            for tg_id in tg_ids:
                try:
                    resp = requests.post(
                        f"{bot_url}?action=send",
                        json={"chat_id": tg_id, "text": text, "parse_mode": "HTML"},
                        timeout=5
                    )
                    if resp.status_code == 200 and 'success' in resp.text:
                        sent += 1
                    else:
                        failed += 1
                        print(f"[broadcast] failed {tg_id}: {resp.text[:100]}")
                except Exception as e:
                    failed += 1
                    print(f"[broadcast] error {tg_id}: {e}")
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'sent': sent, 'failed': failed, 'total': len(tg_ids)})}

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
            if 'concentration' in body and body['concentration'] in ('parfum_water', 'parfum', 'cologne', 'eau_de_toilette'):
                fields.append("concentration = %s")
                values.append(body['concentration'])
            if 'category' in body and body['category'] in ('decant', 'bottle'):
                fields.append("category = %s")
                values.append(body['category'])
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
                concentration = item.get('concentration', 'parfum_water')
                if concentration not in ('parfum_water', 'parfum', 'cologne', 'eau_de_toilette'):
                    concentration = 'parfum_water'
                category = item.get('category', 'decant')
                if category not in ('decant', 'bottle'):
                    category = 'decant'
                cur.execute(
                    "INSERT INTO products (name, brand, description, price_per_ml, bottle_ml, image_url, concentration, category) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (name, brand, description, float(price_per_ml), int(bottle_ml), image_url, concentration, category)
                )
                created += 1
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'created': created, 'updated': updated})}

        if action == 'update_user':
            uid = body.get('user_id')
            if not uid:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите user_id'})}
            conn = get_conn()
            cur = conn.cursor()
            fields, values = [], []
            for field in ('nickname', 'email', 'phone'):
                if field in body:
                    fields.append(f"{field} = %s")
                    values.append(str(body[field]).strip())
            if 'role' in body and body['role'] in ('buyer', 'moderator', 'admin'):
                fields.append("role = %s")
                values.append(body['role'])
            if 'admin_note' in body:
                fields.append("admin_note = %s")
                values.append(body['admin_note'])
            if 'admin_tags' in body:
                tags = [str(t).strip() for t in body['admin_tags'] if str(t).strip()]
                fields.append("admin_tags = %s")
                values.append(tags)
            if not fields:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных'})}
            values.append(int(uid))
            cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", values)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'block_user':
            uid = body.get('user_id')
            is_blocked = body.get('is_blocked', True)
            reason = (body.get('reason') or '').strip()
            if not uid:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите user_id'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET is_blocked = %s, blocked_reason = %s WHERE id = %s",
                (bool(is_blocked), reason if is_blocked else None, int(uid))
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'edit_delivery':
            order_id = body.get('order_id')
            delivery_option_id = body.get('delivery_option_id')
            delivery_comment = (body.get('delivery_comment') or '').strip()
            if not order_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите order_id'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id FROM orders WHERE id = %s AND is_archived = FALSE", (order_id,))
            if not cur.fetchone():
                conn.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Заказ не найден'})}
            cur.execute(
                "UPDATE orders SET delivery_option_id = %s, delivery_comment = %s WHERE id = %s",
                (delivery_option_id or None, delivery_comment or None, order_id)
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'get_delivery_options':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, name, description, address, schedule, is_active, sort_order FROM delivery_options ORDER BY sort_order ASC")
            rows = cur.fetchall()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([{
                'id': r[0], 'name': r[1], 'description': r[2], 'address': r[3],
                'schedule': r[4], 'is_active': r[5], 'sort_order': r[6],
            } for r in rows])}

        if action == 'create_delivery_option':
            name = (body.get('name') or '').strip()
            if not name:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Название обязательно'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO delivery_options (name, description, address, schedule, sort_order, is_active) VALUES (%s, %s, %s, %s, %s, TRUE) RETURNING id",
                (name, body.get('description'), body.get('address'), body.get('schedule'), int(body.get('sort_order') or 0))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': new_id})}

        if action == 'update_delivery_option':
            opt_id = body.get('id')
            if not opt_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите id'})}
            conn = get_conn()
            cur = conn.cursor()
            fields, values = [], []
            for field in ('name', 'description', 'address', 'schedule'):
                if field in body:
                    fields.append(f"{field} = %s")
                    values.append(body[field])
            if 'sort_order' in body:
                fields.append("sort_order = %s")
                values.append(int(body['sort_order'] or 0))
            if 'is_active' in body:
                fields.append("is_active = %s")
                values.append(bool(body['is_active']))
            if not fields:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных'})}
            values.append(int(opt_id))
            cur.execute(f"UPDATE delivery_options SET {', '.join(fields)} WHERE id = %s", values)
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'delete_delivery_option':
            opt_id = body.get('id')
            if not opt_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите id'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("UPDATE orders SET delivery_option_id = NULL WHERE delivery_option_id = %s", (int(opt_id),))
            cur.execute("DELETE FROM delivery_options WHERE id = %s", (int(opt_id),))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'set_setting':
            key = (body.get('key') or '').strip()
            value = body.get('value', '')
            if not key:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите key'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO settings (key, value, updated_at) VALUES (%s, %s, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (key, str(value))
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'delete_user':
            uid = body.get('user_id')
            if not uid:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите user_id'})}
            conn = get_conn()
            cur = conn.cursor()
            uid = int(uid)
            print(f"[delete_user] deleting uid={uid}")
            for tbl in ('sessions', 'messages', 'orders', 'debts', 'forum_comments', 'forum_topics'):
                try:
                    cur.execute(f"DELETE FROM {tbl} WHERE user_id = %s", (uid,))
                except Exception as e:
                    print(f"[delete_user] skip {tbl}: {e}")
                    conn.rollback()
                    conn = get_conn()
                    cur = conn.cursor()
            cur.execute("DELETE FROM users WHERE id = %s", (uid,))
            conn.commit()
            conn.close()
            print(f"[delete_user] done uid={uid}")
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}