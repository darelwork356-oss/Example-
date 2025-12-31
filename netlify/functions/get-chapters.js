exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const storyId = event.queryStringParameters?.storyId;
  if (!storyId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing storyId' })
    };
  }

  // Este proyecto actualmente carga capítulos desde Firebase en el cliente.
  // Este endpoint existe para evitar errores en llamadas auxiliares
  // (p.ej. recomendaciones basadas en rating) cuando aún no se migraron capítulos a S3.
  return {
    statusCode: 200,
    body: JSON.stringify({ chapters: [] })
  };
};

