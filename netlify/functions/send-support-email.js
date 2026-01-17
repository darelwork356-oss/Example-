const AWS = require('aws-sdk');

const ses = new AWS.SES({
  accessKeyId: process.env.ZENVIO_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.ZENVIO_AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.ZENVIO_AWS_REGION || process.env.AWS_REGION || 'us-east-2'
});

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
    const { email, problemType, description } = JSON.parse(event.body);

    if (!email || !problemType || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'email, problemType, and description are required' })
      };
    }

    const params = {
      Source: process.env.SUPPORT_EMAIL || 'support@zenvio.app',
      Destination: {
        ToAddresses: [process.env.SUPPORT_EMAIL || 'support@zenvio.app']
      },
      Message: {
        Subject: { Data: `Soporte: ${problemType}` },
        Body: {
          Text: { Data: `Email: ${email}\nTipo: ${problemType}\n\n${description}` }
        }
      }
    };

    await ses.sendEmail(params).promise();

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
