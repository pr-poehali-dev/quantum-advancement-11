"""
Загрузка изображения товара в S3.
POST / { image_b64: string, filename: string } — загружает и возвращает CDN URL
"""
import json
import os
import base64
import uuid
import boto3
from botocore.exceptions import ClientError


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

ALLOWED_TYPES = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    image_b64 = body.get('image_b64', '')
    filename = body.get('filename', 'image.jpg').lower()

    if not image_b64:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет изображения'})}

    ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'jpg'
    if ext not in ALLOWED_TYPES:
        ext = 'jpg'
    content_type = ALLOWED_TYPES[ext]

    # Декодируем base64
    try:
        if ',' in image_b64:
            image_b64 = image_b64.split(',', 1)[1]
        image_data = base64.b64decode(image_b64)
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неверный формат изображения'})}

    # Проверяем размер (max 5MB)
    if len(image_data) > 5 * 1024 * 1024:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Файл слишком большой (макс. 5 МБ)'})}

    key = f"products/{uuid.uuid4().hex}.{ext}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    s3.put_object(
        Bucket='files',
        Key=key,
        Body=image_data,
        ContentType=content_type,
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'url': cdn_url})}
