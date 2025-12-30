const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET = process.env.AWS_S3_BUCKET;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = event.queryStringParameters || {};
    
    const [notes, followers, following] = await Promise.all([
      s3.listObjectsV2({ Bucket: BUCKET, Prefix: `notes/${userId}/` }).promise(),
      s3.listObjectsV2({ Bucket: BUCKET, Prefix: `followers/${userId}/` }).promise(),
      s3.listObjectsV2({ Bucket: BUCKET, Prefix: `following/${userId}/` }).promise()
    ]);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        notes: notes.KeyCount,
        followers: followers.KeyCount,
        following: following.KeyCount
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
