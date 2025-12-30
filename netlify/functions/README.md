# Configuración de Netlify Functions

## Arquitectura
- **Firebase**: Solo autenticación
- **AWS S3**: TODO (datos + imágenes)
- **AWS SES**: Emails
- **Netlify Functions**: Serverless

## Estructura en S3

```
zenvio-storage/
├── notes/
│   └── {userId}/
│       └── {noteId}.json
├── likes/
│   └── {noteId}/
│       └── {userId}.json
├── following/
│   └── {userId}/
│       └── {targetUserId}.json
├── notifications/
│   └── {userId}/
│       └── {notifId}.json
└── images/
    ├── profile/{userId}/
    ├── stories/{userId}/
    └── notes/{userId}/
```

## Variables de Entorno

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BUCKET
SUPPORT_EMAIL
```

## Funciones

- `notes.js` - GET/POST/DELETE notas
- `likes.js` - POST likes
- `following.js` - POST follow/unfollow
- `notifications.js` - GET/POST notificaciones
- `user-stats.js` - GET estadísticas
- `upload-image.js` - POST imágenes
- `send-support-email.js` - POST emails

## Instalación

```bash
cd netlify/functions
npm install
```
