"""
Регистрация, вход и выход пользователей Распивошной.
POST /register — регистрация (nickname, email, phone, password)
POST /login — вход (email, password)
POST /logout — выход
GET /me — текущий пользователь по сессии
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
        "SELECT u.id, u.nickname, u.email, u.phone, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {'id': row[0], 'nickname': row[1], 'email': row[2], 'phone': row[3], 'role': row[4]}


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Allow-Credentials': 'true',
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
        existing = cur.fetchone()
        if existing:
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Ник, email или телефон уже заняты'})}

        cur.execute(
            "INSERT INTO users (nickname, email, phone, password_hash) VALUES (%s, %s, %s, %s) RETURNING id, role",
            (nickname, email, phone, hash_password(password))
        )
        user_id, role = cur.fetchone()
        session_id = secrets.token_hex(32)
        expires = datetime.now() + timedelta(days=30)
        cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (session_id, user_id, expires))
        conn.commit()
        conn.close()

        resp_headers = {**CORS, 'X-Set-Cookie': f'session={session_id}; Path=/; HttpOnly; Max-Age=2592000'}
        return {'statusCode': 200, 'headers': resp_headers, 'body': json.dumps({
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
        session_id = secrets.token_hex(32)
        expires = datetime.now() + timedelta(days=30)
        cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (session_id, user_id, expires))
        conn.commit()
        conn.close()

        resp_headers = {**CORS, 'X-Set-Cookie': f'session={session_id}; Path=/; HttpOnly; Max-Age=2592000'}
        return {'statusCode': 200, 'headers': resp_headers, 'body': json.dumps({
            'user': {'id': user_id, 'nickname': nickname, 'email': email, 'phone': phone, 'role': role}
        })}

    if path.endswith('/logout') and method == 'POST':
        cookie = headers.get('X-Cookie', '')
        session_id = None
        for part in cookie.split(';'):
            part = part.strip()
            if part.startswith('session='):
                session_id = part[8:]
                break
        if session_id:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("DELETE FROM sessions WHERE id = %s", (session_id,))
            conn.commit()
            conn.close()
        resp_headers = {**CORS, 'X-Set-Cookie': 'session=; Path=/; Max-Age=0'}
        return {'statusCode': 200, 'headers': resp_headers, 'body': json.dumps({'ok': True})}

    if path.endswith('/me') and method == 'GET':
        user = get_session_user(headers)
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
