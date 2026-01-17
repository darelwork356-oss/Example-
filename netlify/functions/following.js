const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.ZENVIO_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.ZENVIO_AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.ZENVIO_AWS_REGION || process.env.AWS_REGION || 'us-east-2'
});

const BUCKET = process.env.ZENVIO_AWS_S3_BUCKET || process.env.AWS_S3_BUCKET;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    if (!BUCKET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Missing S3 bucket configuration' })
      };
    }

    const { userId, targetUserId, action } = JSON.parse(event.body);

    if (!userId || !targetUserId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId and targetUserId are required' })
      };
    }

    const followKey = `following/${userId}/${targetUserId}.json`;

    if (action === 'follow') {
      await s3.putObject({
        Bucket: BUCKET,
        Key: followKey,
        Body: JSON.stringify({ userId, targetUserId, timestamp: Date.now() }),
        ContentType: 'application/json'
      }).promise();
    } else if (action === 'unfollow') {
      await s3.deleteObject({
        Bucket: BUCKET,
        Key: followKey
      }).promise();
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action. Use "follow" or "unfollow"' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
