"""
Регистрация, вход и выход пользователей Распивошной.
POST /register — регистрация (nickname, email, phone, password)
POST /login — вход (email, password)
POST /logout — выход
GET /me — текущий пользователь по токену X-Auth-Token
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
    token = headers.get('X-Auth-Token', '').strip()
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.nickname, u.email, u.phone, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    return {'id': row[0], 'nickname': row[1], 'email': row[2], 'phone': row[3], 'role': row[4]} if row else None


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    headers = event.get('headers') or {}

    if path.endswith('/register') and method == 'POST':
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
        cur.execute("SELECT id FROM users WHERE nickname = %s OR email = %s OR phone = %s", (nickname, email, phone))
        if cur.fetchone():
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Ник, email или телефон уже заняты'})}

        cur.execute(
            "INSERT INTO users (nickname, email, phone, password_hash) VALUES (%s, %s, %s, %s) RETURNING id, role",
            (nickname, email, phone, hash_password(password))
        )
        user_id, role = cur.fetchone()
        token = secrets.token_hex(32)
        expires = datetime.now() + timedelta(days=30)
        cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (token, user_id, expires))
        conn.commit()
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
            'token': token,
            'user': {'id': user_id, 'nickname': nickname, 'email': email, 'phone': phone, 'role': role}
        })}

    if path.endswith('/login') and method == 'POST':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, nickname, email, phone, role FROM users WHERE email = %s AND password_hash = %s", (email, hash_password(password)))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

        user_id, nickname, email, phone, role = row
        token = secrets.token_hex(32)
        expires = datetime.now() + timedelta(days=30)
        cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (token, user_id, expires))
        conn.commit()
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
            'token': token,
            'user': {'id': user_id, 'nickname': nickname, 'email': email, 'phone': phone, 'role': role}
        })}

    if path.endswith('/logout') and method == 'POST':
        token = (headers.get('X-Auth-Token') or '').strip()
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("DELETE FROM sessions WHERE id = %s", (token,))
            conn.commit()
            conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    if path.endswith('/me') and method == 'GET':
        user = get_token_user(headers)
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
