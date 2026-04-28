"""
Auth Распивошной. Все запросы на корневой URL, action в теле или query.
POST / body={action:register,...} — регистрация
POST / body={action:login,...}    — вход
POST / body={action:logout}       — выход
GET  /?action=me                  — текущий пользователь
v4
"""
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_token_user(headers: dict):
    token = (headers.get('X-Auth-Token') or '').strip()
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.nickname, u.email, u.phone, u.role, u.customer_code FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {'id': row[0], 'nickname': row[1], 'email': row[2], 'phone': row[3], 'role': row[4], 'customer_code': row[5]}


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    params = event.get('queryStringParameters') or {}

    # GET /?action=me
    if method == 'GET':
        action = params.get('action', 'me')
        if action == 'me':
            user = get_token_user(headers)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', '')

        if action == 'register':
            nickname = (body.get('nickname') or '').strip()
            email = (body.get('email') or '').strip().lower()
            phone = (body.get('phone') or '').strip()
            password = body.get('password') or ''
            if not all([nickname, email, phone, password]):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Все поля обязательны'})}
            if len(password) < 6:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}
            conn = get_conn()
            cur = conn.cursor()
            print(f"[register] checking nick={nickname!r} email={email!r} phone={phone!r}")
            cur.execute("SELECT id, nickname, email, phone FROM users WHERE nickname = %s OR email = %s OR phone = %s", (nickname, email, phone))
            existing = cur.fetchone()
            print(f"[register] existing={existing}")
            if existing:
                conn.close()
                return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Ник, email или телефон уже заняты'})}
            try:
                cur.execute(
                    "INSERT INTO users (nickname, email, phone, password_hash) VALUES (%s, %s, %s, %s) RETURNING id, role",
                    (nickname, email, phone, hash_password(password))
                )
            except Exception as e:
                conn.close()
                err_str = str(e).lower()
                if 'unique' in err_str or 'duplicate' in err_str or 'already exists' in err_str:
                    return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Ник, email или телефон уже заняты'})}
                return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Ошибка регистрации: {str(e)[:100]}'})}
            user_id, role = cur.fetchone()
            customer_code = 'AR-' + str(user_id).zfill(5)
            cur.execute("UPDATE users SET customer_code = %s WHERE id = %s", (customer_code, user_id))
            token = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)
            cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (token, user_id, expires))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'token': token,
                'user': {'id': user_id, 'nickname': nickname, 'email': email, 'phone': phone, 'role': role, 'customer_code': customer_code}
            })}

        if action == 'login':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, nickname, email, phone, role, customer_code FROM users WHERE email = %s AND password_hash = %s", (email, hash_password(password)))
            row = cur.fetchone()
            if not row:
                conn.close()
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}
            user_id, nickname, email, phone, role, customer_code = row
            if not customer_code:
                customer_code = 'AR-' + str(user_id).zfill(5)
                cur.execute("UPDATE users SET customer_code = %s WHERE id = %s", (customer_code, user_id))
            token = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)
            cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (token, user_id, expires))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'token': token,
                'user': {'id': user_id, 'nickname': nickname, 'email': email, 'phone': phone, 'role': role, 'customer_code': customer_code}
            })}

        if action == 'telegram_login':
            telegram_id = (body.get('telegram_id') or '').strip()
            if not telegram_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'telegram_id required'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "SELECT id, nickname, email, phone, role, customer_code FROM users WHERE telegram_id = %s",
                (telegram_id,)
            )
            row = cur.fetchone()
            if not row:
                conn.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'User not found'})}
            user_id, nickname, email, phone, role, customer_code = row
            if not customer_code:
                customer_code = 'AR-' + str(user_id).zfill(5)
                cur.execute("UPDATE users SET customer_code = %s WHERE id = %s", (customer_code, user_id))
            token = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)
            cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (token, user_id, expires))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'token': token,
                'user': {'id': user_id, 'nickname': nickname, 'email': email, 'phone': phone, 'role': role, 'customer_code': customer_code}
            })}

        if action == 'generate_link_code':
            user = get_token_user(headers)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            code = secrets.token_hex(4).upper()
            expires = datetime.now() + timedelta(minutes=10)
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("UPDATE telegram_link_codes SET expires_at = NOW() WHERE user_id = %s", (user['id'],))
            cur.execute("INSERT INTO telegram_link_codes (code, user_id, expires_at) VALUES (%s, %s, %s)", (code, user['id'], expires))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'code': code})}

        if action == 'unlink_telegram':
            user = get_token_user(headers)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("UPDATE users SET telegram_id = NULL WHERE id = %s", (user['id'],))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'telegram_status':
            user = get_token_user(headers)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT telegram_id FROM users WHERE id = %s", (user['id'],))
            row = cur.fetchone()
            conn.close()
            linked = bool(row and row[0])
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'linked': linked})}

        if action == 'logout':
            token = (headers.get('X-Auth-Token') or '').strip()
            if token:
                conn = get_conn()
                cur = conn.cursor()
                cur.execute("DELETE FROM sessions WHERE id = %s", (token,))
                conn.commit()
                conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}