"""
Сообщения между клиентом и администратором. v2
GET  /?action=inbox          — входящие/исходящие текущего юзера (чат с поддержкой)
GET  /?action=unread_count   — кол-во непрочитанных
POST / {action:send, body}   — клиент пишет админу
POST / {action:reply, to_user_id, body} — админ пишет юзеру
POST / {action:mark_read, user_id}      — пометить прочитанными (для admin/стороны)
GET  /?action=admin_inbox    — список диалогов для админа (admin only)
GET  /?action=thread&user_id=X — переписка с конкретным юзером (admin only)
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


def get_user(headers: dict):
    token = (headers.get('X-Auth-Token') or '').strip()
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.role, u.nickname FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    return {'id': row[0], 'role': row[1], 'nickname': row[2]} if row else None


def get_admin_id(conn):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1")
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    params = event.get('queryStringParameters') or {}

    user = get_user(headers)
    if not user:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    is_admin = user['role'] in ('admin', 'moderator')

    if method == 'GET':
        action = params.get('action', 'inbox')

        if action == 'unread_count':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "SELECT COUNT(*) FROM messages WHERE to_user_id = %s AND is_read = FALSE",
                (user['id'],)
            )
            count = cur.fetchone()[0]
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'count': int(count)})}

        if action == 'inbox':
            conn = get_conn()
            cur = conn.cursor()
            admin_id = get_admin_id(conn)
            cur.execute("""
                SELECT m.id, m.from_user_id, m.to_user_id, m.body, m.is_read, m.created_at,
                       f.nickname as from_nick, t.nickname as to_nick
                FROM messages m
                JOIN users f ON m.from_user_id = f.id
                JOIN users t ON m.to_user_id = t.id
                WHERE (m.from_user_id = %s OR m.to_user_id = %s)
                  AND (m.from_user_id = %s OR m.to_user_id = %s OR m.from_user_id = %s OR m.to_user_id = %s)
                ORDER BY m.created_at ASC
            """, (user['id'], user['id'], admin_id, admin_id, user['id'], user['id']))
            rows = cur.fetchall()
            cur.execute(
                "UPDATE messages SET is_read = TRUE WHERE to_user_id = %s AND is_read = FALSE",
                (user['id'],)
            )
            conn.commit()
            conn.close()
            msgs = [{
                'id': r[0], 'from_user_id': r[1], 'to_user_id': r[2],
                'body': r[3], 'is_read': r[4], 'created_at': str(r[5]),
                'from_nick': r[6], 'to_nick': r[7],
                'is_mine': r[1] == user['id'],
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(msgs)}

        if action == 'admin_inbox' and is_admin:
            conn = get_conn()
            cur = conn.cursor()
            admin_id = get_admin_id(conn)
            cur.execute("""
                SELECT DISTINCT ON (other_id)
                    other_id,
                    other_nick,
                    last_body,
                    last_at,
                    unread
                FROM (
                    SELECT
                        CASE WHEN m.from_user_id = %s THEN m.to_user_id ELSE m.from_user_id END as other_id,
                        CASE WHEN m.from_user_id = %s THEN t.nickname ELSE f.nickname END as other_nick,
                        m.body as last_body,
                        m.created_at as last_at,
                        CASE WHEN m.to_user_id = %s AND m.is_read = FALSE THEN 1 ELSE 0 END as unread
                    FROM messages m
                    JOIN users f ON m.from_user_id = f.id
                    JOIN users t ON m.to_user_id = t.id
                    WHERE m.from_user_id = %s OR m.to_user_id = %s
                    ORDER BY m.created_at DESC
                ) sub
                ORDER BY other_id, last_at DESC
            """, (admin_id, admin_id, admin_id, admin_id, admin_id))
            rows = cur.fetchall()
            conn.close()
            dialogs = [{'user_id': r[0], 'nickname': r[1], 'last_body': r[2], 'last_at': str(r[3]), 'has_unread': r[4] > 0} for r in rows]
            dialogs.sort(key=lambda x: x['last_at'], reverse=True)
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(dialogs)}

        if action == 'thread' and is_admin:
            other_id = params.get('user_id')
            if not other_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите user_id'})}
            conn = get_conn()
            cur = conn.cursor()
            admin_id = get_admin_id(conn)
            other_id = int(other_id)
            cur.execute("""
                SELECT m.id, m.from_user_id, m.to_user_id, m.body, m.is_read, m.created_at,
                       f.nickname as from_nick, t.nickname as to_nick
                FROM messages m
                JOIN users f ON m.from_user_id = f.id
                JOIN users t ON m.to_user_id = t.id
                WHERE (m.from_user_id = %s AND m.to_user_id = %s)
                   OR (m.from_user_id = %s AND m.to_user_id = %s)
                ORDER BY m.created_at ASC
            """, (admin_id, other_id, other_id, admin_id))
            rows = cur.fetchall()
            cur.execute(
                "UPDATE messages SET is_read = TRUE WHERE to_user_id = %s AND from_user_id = %s AND is_read = FALSE",
                (admin_id, other_id)
            )
            conn.commit()
            conn.close()
            msgs = [{
                'id': r[0], 'from_user_id': r[1], 'to_user_id': r[2],
                'body': r[3], 'is_read': r[4], 'created_at': str(r[5]),
                'from_nick': r[6], 'to_nick': r[7],
                'is_mine': r[1] == admin_id,
            } for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(msgs)}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', '')

        if action == 'send':
            text = (body.get('body') or '').strip()
            if not text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пустое сообщение'})}
            conn = get_conn()
            admin_id = get_admin_id(conn)
            if not admin_id:
                conn.close()
                return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': 'Администратор не найден'})}
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO messages (from_user_id, to_user_id, body) VALUES (%s, %s, %s) RETURNING id, created_at",
                (user['id'], admin_id, text)
            )
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': row[0], 'created_at': str(row[1])})}

        if action == 'reply' and is_admin:
            to_user_id = body.get('to_user_id')
            text = (body.get('body') or '').strip()
            if not to_user_id or not text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите to_user_id и body'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO messages (from_user_id, to_user_id, body) VALUES (%s, %s, %s) RETURNING id, created_at",
                (user['id'], int(to_user_id), text)
            )
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': row[0], 'created_at': str(row[1])})}

        if action == 'broadcast' and is_admin:
            user_ids = body.get('user_ids', [])
            text = (body.get('body') or '').strip()
            if not user_ids or not text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите user_ids и body'})}
            conn = get_conn()
            cur = conn.cursor()
            sent = 0
            for uid in user_ids:
                cur.execute(
                    "INSERT INTO messages (from_user_id, to_user_id, body) VALUES (%s, %s, %s)",
                    (user['id'], int(uid), text)
                )
                sent += 1
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'sent': sent})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}