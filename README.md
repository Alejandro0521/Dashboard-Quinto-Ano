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
