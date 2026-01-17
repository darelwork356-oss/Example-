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

    const { imageData, fileName, userId, timestamp, contentType, imageType } = JSON.parse(event.body);

    if (!imageData || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'imageData and userId are required' })
      };
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const key = `${imageType || 'images'}/${userId}/${timestamp || Date.now()}_${fileName || 'image.jpg'}`;

    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'image/jpeg',
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ imageUrl: result.Location })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
