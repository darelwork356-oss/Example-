const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET = process.env.AWS_S3_BUCKET;

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { userId, limit = 50 } = event.queryStringParameters || {};
      
      const params = {
        Bucket: BUCKET,
        Prefix: userId ? `notes/${userId}/` : 'notes/'
      };
      
      const data = await s3.listObjectsV2(params).promise();
      const notes = await Promise.all(
        data.Contents.slice(0, parseInt(limit)).map(async (item) => {
          const obj = await s3.getObject({ Bucket: BUCKET, Key: item.Key }).promise();
          return JSON.parse(obj.Body.toString());
        })
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ notes: notes.sort((a, b) => b.timestamp - a.timestamp) })
      };
    }

    if (event.httpMethod === 'POST') {
      const { content, userId, username, imageUrl } = JSON.parse(event.body);
      
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const note = {
        id: noteId,
        userId,
        username,
        content,
        imageUrl: imageUrl || null,
        timestamp: Date.now(),
        likes: 0
      };
      
      await s3.putObject({
        Bucket: BUCKET,
        Key: `notes/${userId}/${noteId}.json`,
        Body: JSON.stringify(note),
        ContentType: 'application/json'
      }).promise();
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, note })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const { noteId, userId } = JSON.parse(event.body);
      
      await s3.deleteObject({
        Bucket: BUCKET,
        Key: `notes/${userId}/${noteId}.json`
      }).promise();
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
