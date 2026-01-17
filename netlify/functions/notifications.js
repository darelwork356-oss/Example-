const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.ZENVIO_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.ZENVIO_AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.ZENVIO_AWS_REGION || process.env.AWS_REGION || 'us-east-2'
});

const BUCKET = process.env.ZENVIO_AWS_S3_BUCKET || process.env.AWS_S3_BUCKET;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  try {
    if (!BUCKET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Missing S3 bucket configuration' })
      };
    }

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod === 'GET') {
      const { userId } = event.queryStringParameters || {};

      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'userId is required' })
        };
      }

      const data = await s3.listObjectsV2({
        Bucket: BUCKET,
        Prefix: `notifications/${userId}/`
      }).promise();

      if (!data.Contents || data.Contents.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ notifications: [] })
        };
      }

      const notifications = await Promise.all(
        data.Contents.map(async (item) => {
          try {
            const obj = await s3.getObject({ Bucket: BUCKET, Key: item.Key }).promise();
            return JSON.parse(obj.Body.toString());
          } catch (err) {
            console.error('Error reading notification:', item.Key, err);
            return null;
          }
        })
      );

      const validNotifications = notifications
        .filter(n => n !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ notifications: validNotifications })
      };
    }

    if (event.httpMethod === 'POST') {
      const { userId, type, message, fromUserId } = JSON.parse(event.body);

      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'userId is required' })
        };
      }

      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notifId,
        userId,
        type,
        message,
        fromUserId,
        timestamp: Date.now(),
        read: false
      };

      await s3.putObject({
        Bucket: BUCKET,
        Key: `notifications/${userId}/${notifId}.json`,
        Body: JSON.stringify(notification),
        ContentType: 'application/json'
      }).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
