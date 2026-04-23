"""
Каталог ароматов + Форум Распивошной.
GET /?action=list&sort=filling&category=decant — список товаров
GET /?action=product&id=1     — карточка товара
GET /?action=atomizers         — список атомайзеров
GET /?action=topics            — список тем форума
GET /?action=topic&id=X        — тема + комментарии
POST / body={action:create,...}        — создать товар (admin/moderator)
POST / body={action:update,...}        — обновить товар (admin/moderator)
POST / body={action:create_topic,...}  — создать тему форума (admin/moderator)
POST / body={action:edit_topic,...}    — редактировать тему (admin/moderator)
POST / body={action:delete_topic,...}  — удалить тему (admin/moderator)
POST / body={action:pin_topic,...}     — закрепить/открепить (admin/moderator)
POST / body={action:close_topic,...}   — закрыть/открыть тему (admin/moderator)
POST / body={action:add_comment,...}   — добавить комментарий (авторизован)
POST / body={action:delete_comment,..} — удалить комментарий (admin/moderator или свой)

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
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
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


def get_auth_user(headers: dict):
    """Авторизация через X-Auth-Token + X-User-Id (токен авторизации, не сессия)."""
    token = (headers.get('x-auth-token') or headers.get('X-Auth-Token') or '').strip()
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    if not token or not user_id:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, nickname, role FROM users WHERE id = %s AND auth_token = %s",
        (int(user_id), token)
    )
    row = cur.fetchone()
    conn.close()
    return {'id': row[0], 'nickname': row[1], 'role': row[2]} if row else None


def is_admin(user):
    return user and user['role'] in ('admin', 'moderator')


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

        if action == 'topics':
            cur.execute("""
                SELECT t.id, t.title, t.body, t.is_pinned, t.is_closed,
                       t.comments_count, t.created_at, t.updated_at, u.nickname
                FROM forum_topics t
                JOIN users u ON t.author_id = u.id
                ORDER BY t.is_pinned DESC, t.created_at DESC
            """)
            rows = cur.fetchall()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([{
                'id': r[0], 'title': r[1], 'body': r[2],
                'is_pinned': r[3], 'is_closed': r[4], 'comments_count': r[5],
                'created_at': str(r[6]), 'updated_at': str(r[7]), 'author_nickname': r[8],
            } for r in rows])}

        if action == 'topic':
            topic_id = params.get('id')
            if not topic_id:
                conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите id'})}
            cur.execute("""
                SELECT t.id, t.title, t.body, t.is_pinned, t.is_closed,
                       t.comments_count, t.created_at, t.updated_at, u.nickname, t.author_id
                FROM forum_topics t JOIN users u ON t.author_id = u.id
                WHERE t.id = %s
            """, (int(topic_id),))
            row = cur.fetchone()
            if not row:
                conn.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Тема не найдена'})}
            topic = {
                'id': row[0], 'title': row[1], 'body': row[2],
                'is_pinned': row[3], 'is_closed': row[4], 'comments_count': row[5],
                'created_at': str(row[6]), 'updated_at': str(row[7]),
                'author_nickname': row[8], 'author_id': row[9],
            }
            cur.execute("""
                SELECT c.id, c.body, c.created_at, u.nickname, u.id, u.role
                FROM forum_comments c JOIN users u ON c.author_id = u.id
                WHERE c.topic_id = %s ORDER BY c.created_at ASC
            """, (int(topic_id),))
            comments = [{
                'id': r[0], 'body': r[1], 'created_at': str(r[2]),
                'author_nickname': r[3], 'author_id': r[4], 'author_role': r[5],
            } for r in cur.fetchall()]
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'topic': topic, 'comments': comments})}

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