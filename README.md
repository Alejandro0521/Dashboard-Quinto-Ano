# Dashboard Estudiante - Configuración

Esta es una aplicación web simple (HTML + CSS + JavaScript) con autenticación de usuario y base de datos en la nube usando Firebase.

## ✨ Características

- ✅ **7 Materias Completas** con toda la información original
- ✅ **Login/Registro** de usuarios con Firebase Authentication
- ✅ **Base de Datos Personal** - Cada usuario tiene sus propios datos guardados en Firestore
- ✅ **Agregar/Eliminar Tareas**
- ✅ **Editar Calificaciones y Progreso**
- ✅ **Marcar Tareas como Completadas**
- ✅ **Diseño Responsive** - Funciona en móvil y escritorio

## 🔧 Configuración de Firebase

### Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombra tu proyecto (ej: "dashboard-estudiante")
4. Desactiva Google Analytics (opcional)
5. Click en "Crear proyecto"

### Paso 2: Configurar Authentication

1. En el menú lateral, ve a **Authentication**
2. Click en "Comenzar"
3. Habilita **"Correo electrónico/contraseña"**
4. Click en "Guardar"

### Paso 3: Configurar Firestore Database

1. En el menú lateral, ve a **Firestore Database**
2. Click en "Crear base de datos"
3. Selecciona **"Modo de producción"**
4. Elige una ubicación cercana
5. Click en "Habilitar"

### Paso 4: Configurar Reglas de Seguridad

En la pestaña "Reglas" de Firestore, pega estas reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click en "Publicar"

### Paso 5: Obtener Configuración

1. En el menú lateral, click en el ícono de **engranaje ⚙️** > "Configuración del proyecto"
2. Baja hasta **"Tus apps"**
3. Click en el ícono **</>** (Web)
4. Registra tu app con un nombre (ej: "Dashboard Web")
5. **NO marques** "También configura Firebase Hosting"
6. Click en "Registrar app"
7. Copia el objeto `firebaseConfig`

### Paso 6: Actualizar app.js

Abre el archivo `app.js` y reemplaza esta sección:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

Con tu configuración real de Firebase.

## 🚀 Cómo Usar

1. **Abre el archivo** `index.html` en tu navegador
2. **Regístrate** con un correo y contraseña
3. **¡Listo!** Puedes empezar a usar el dashboard

## 📱 Funcionalidades

### Dashboard Principal
- Ver resumen de tareas pendientes
- Ver promedio general
- Click en una materia para ver detalles

### Sección Tareas
- Click en "Agregar Tarea" para crear nuevas tareas
- Click en el checkbox para marcar como completada
- Click en 🗑️ para eliminar

### Sección Progreso
- Ver estadísticas generales
- Click en ✏️ para editar calificación y progreso de cada materia

## 🔒 Datos Guardados

Todos tus datos se guardan automáticamente en Firebase Firestore. Cada usuario tiene su propia base de datos personal y solo puede ver y editar sus propios datos.

## 📝 Notas

- La aplicación funciona 100% en el navegador
- No necesitas servidor ni instalar nada
- Los datos persisten entre sesiones
- Cada usuario tiene sus propios datos independientes

## ❓ Solución de Problemas

Si no ves las 7 materias después de registrarte:
1. Cierra sesión
2. Vuelve a iniciar sesión
3. Las materias deberían aparecer automáticamente

Si los cambios no se guardan:
1. Verifica que Firebase esté configurado correctamente
2. Revisa la consola del navegador (F12) para ver errores
3. Verifica las reglas de Firestore
