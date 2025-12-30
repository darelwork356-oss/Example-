# Configuración de Netlify Functions

## Variables de Entorno Requeridas

Configura estas variables en Netlify Dashboard > Site settings > Environment variables:

### Base de Datos
- `DATABASE_URL`: URL de conexión a PostgreSQL

### AWS
- `AWS_ACCESS_KEY_ID`: Access Key de AWS
- `AWS_SECRET_ACCESS_KEY`: Secret Key de AWS
- `AWS_REGION`: Región de AWS (ej: us-east-1)
- `AWS_S3_BUCKET`: Nombre del bucket S3

### Email
- `SUPPORT_EMAIL`: Email para recibir mensajes de soporte

## Instalación

```bash
cd netlify/functions
npm install
```

## Funciones Disponibles

- `like-note.js` - Dar like a notas
- `upload-image.js` - Subir imágenes a S3
- `get-notes.js` - Obtener notas
- `upload-note.js` - Crear notas
- `delete-note.js` - Eliminar notas
- `manage-following.js` - Seguir/dejar de seguir usuarios
- `send-support-email.js` - Enviar emails de soporte
- `get-user-stats.js` - Obtener estadísticas de usuario
- `get-stories.js` - Obtener historias
- `get-chapters.js` - Obtener capítulos
- `manage-notifications.js` - Gestionar notificaciones
- `check-user-limits.js` - Verificar límites de usuario

## Esquema de Base de Datos Requerido

Ver `schema.sql` para la estructura completa de tablas.
