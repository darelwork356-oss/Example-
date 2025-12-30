# Configuración de Netlify Functions

## Arquitectura
- **Firebase**: Autenticación + Base de datos (Realtime Database)
- **AWS S3**: Almacenamiento de imágenes
- **AWS SES**: Envío de emails
- **Netlify Functions**: Serverless para operaciones con AWS

## Variables de Entorno Requeridas

Configura en Netlify Dashboard > Site settings > Environment variables:

### AWS
- `AWS_ACCESS_KEY_ID`: Access Key de AWS
- `AWS_SECRET_ACCESS_KEY`: Secret Key de AWS
- `AWS_REGION`: Región (ej: us-east-1)
- `AWS_S3_BUCKET`: Nombre del bucket S3

### Email
- `SUPPORT_EMAIL`: Email para soporte (debe estar verificado en AWS SES)

## Instalación

```bash
cd netlify/functions
npm install
```

## Funciones Disponibles

- `upload-image.js` - Subir imágenes a AWS S3
- `send-support-email.js` - Enviar emails vía AWS SES

## Configuración AWS

### S3 Bucket
1. Crear bucket en AWS S3
2. Configurar permisos públicos para lectura
3. Habilitar CORS

### SES (Simple Email Service)
1. Verificar email de soporte
2. Solicitar salir del sandbox (producción)

## Datos
Todo se almacena en **Firebase Realtime Database**:
- Usuarios
- Historias
- Notas
- Likes
- Seguidores
- Notificaciones
