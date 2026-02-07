// Google Drive Integration for Course Notes
// Este módulo maneja la conexión con Google Drive para mostrar apuntes

// Configuración de Google API
const GOOGLE_CLIENT_ID = '595886544015-6tvpb2ns16kr81leek5g6bpgu6t5libp.apps.googleusercontent.com';
const GOOGLE_API_KEY = ''; // No necesario para OAuth client-side
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

// Estado de la conexión de Drive
let googleDriveState = {
    isConnected: false,
    accessToken: null,
    userEmail: null,
    foldersByCourrse: {} // {courseId: {folderId, folderName}}
};

// Inicializar Google API
function initGoogleDrive() {
    if (!GOOGLE_CLIENT_ID) {
        console.warn('Google Drive: No se ha configurado CLIENT_ID');
        return;
    }

    // Cargar la librería de Google API
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
        gapi.load('client:auth2', initGoogleClient);
    };
    document.head.appendChild(script);
}

// Inicializar cliente de Google
async function initGoogleClient() {
    try {
        await gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
        });

        // Verificar si ya hay sesión
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance.isSignedIn.get()) {
            googleDriveState.isConnected = true;
            googleDriveState.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
            googleDriveState.userEmail = authInstance.currentUser.get().getBasicProfile().getEmail();
        }
    } catch (error) {
        console.error('Error inicializando Google Drive:', error);
    }
}

// Conectar con Google Drive (OAuth)
window.connectGoogleDrive = async function () {
    if (!GOOGLE_CLIENT_ID) {
        alert('Google Drive no está configurado todavía. Contacta al administrador.');
        return false;
    }

    try {
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signIn();

        googleDriveState.isConnected = true;
        googleDriveState.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
        googleDriveState.userEmail = authInstance.currentUser.get().getBasicProfile().getEmail();

        // Guardar en Firebase para el usuario actual
        if (typeof saveUserDriveConfig === 'function') {
            await saveUserDriveConfig(googleDriveState);
        }

        return true;
    } catch (error) {
        console.error('Error conectando con Google Drive:', error);
        return false;
    }
};

// Desconectar Google Drive
window.disconnectGoogleDrive = async function () {
    try {
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signOut();

        googleDriveState.isConnected = false;
        googleDriveState.accessToken = null;
        googleDriveState.userEmail = null;

        return true;
    } catch (error) {
        console.error('Error desconectando Google Drive:', error);
        return false;
    }
};

// Listar carpetas del usuario
window.listDriveFolders = async function () {
    if (!googleDriveState.isConnected) {
        console.warn('Google Drive no está conectado');
        return [];
    }

    try {
        const response = await gapi.client.drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id, name)',
            orderBy: 'name'
        });

        return response.result.files || [];
    } catch (error) {
        console.error('Error listando carpetas:', error);
        return [];
    }
};

// Listar archivos PDF de una carpeta
window.listDriveFiles = async function (folderId) {
    if (!googleDriveState.isConnected) {
        console.warn('Google Drive no está conectado');
        return [];
    }

    try {
        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and (mimeType='application/pdf' or mimeType contains 'image/') and trashed=false`,
            fields: 'files(id, name, mimeType, modifiedTime, webViewLink, thumbnailLink)',
            orderBy: 'modifiedTime desc'
        });

        return response.result.files || [];
    } catch (error) {
        console.error('Error listando archivos:', error);
        return [];
    }
};

// Obtener link de preview de un archivo
window.getDriveFilePreview = function (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
};

// Guardar configuración de carpeta para una materia
window.saveCourseFolder = async function (courseId, folderId, folderName) {
    googleDriveState.foldersByCourrse[courseId] = { folderId, folderName };

    // Guardar en Firebase
    if (typeof saveUserCourseFolder === 'function') {
        await saveUserCourseFolder(courseId, folderId, folderName);
    }
};

// Obtener carpeta configurada para una materia
window.getCourseFolder = function (courseId) {
    return googleDriveState.foldersByCourrse[courseId] || null;
};

// Verificar si Drive está conectado
window.isDriveConnected = function () {
    return googleDriveState.isConnected;
};

// Obtener email del usuario de Drive
window.getDriveUserEmail = function () {
    return googleDriveState.userEmail;
};

// Renderizar sección de apuntes para una materia
window.renderNotesSection = function (courseId) {
    const isConnected = isDriveConnected();
    const courseFolder = getCourseFolder(courseId);

    if (!GOOGLE_CLIENT_ID) {
        // Google Drive no configurado - mostrar mensaje
        return `
            <div style="text-align: center; padding: 3rem; color: #737373;">
                <i data-lucide="cloud-off" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <h3 style="margin: 0 0 0.5rem 0; color: #525252;">Google Drive no configurado</h3>
                <p style="margin: 0; font-size: 0.875rem;">
                    La integración con Google Drive estará disponible próximamente.
                </p>
            </div>
        `;
    }

    if (!isConnected) {
        // Mostrar botón para conectar
        return `
            <div style="text-align: center; padding: 3rem;">
                <i data-lucide="cloud" style="width: 48px; height: 48px; color: #3b82f6; margin-bottom: 1rem;"></i>
                <h3 style="margin: 0 0 0.5rem 0;">Conecta tu Google Drive</h3>
                <p style="color: #737373; margin: 0 0 1.5rem 0; font-size: 0.875rem;">
                    Sincroniza tus apuntes de GoodNotes automáticamente
                </p>
                <button onclick="connectAndRefresh()" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="link" style="width: 16px; height: 16px;"></i>
                    Conectar Google Drive
                </button>
            </div>
        `;
    }

    if (!courseFolder) {
        // Mostrar selector de carpeta
        return `
            <div style="text-align: center; padding: 3rem;">
                <i data-lucide="folder" style="width: 48px; height: 48px; color: #f59e0b; margin-bottom: 1rem;"></i>
                <h3 style="margin: 0 0 0.5rem 0;">Selecciona la carpeta de apuntes</h3>
                <p style="color: #737373; margin: 0 0 1.5rem 0; font-size: 0.875rem;">
                    Conectado como: ${getDriveUserEmail()}
                </p>
                <button onclick="showFolderPicker(${courseId})" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="folder-open" style="width: 16px; height: 16px;"></i>
                    Seleccionar carpeta
                </button>
            </div>
        `;
    }

    // Mostrar archivos de la carpeta
    return `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <span style="color: #737373; font-size: 0.875rem;">Carpeta:</span>
                    <span style="font-weight: 500;">${courseFolder.folderName}</span>
                </div>
                <button onclick="showFolderPicker(${courseId})" style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 0.875rem;">
                    Cambiar carpeta
                </button>
            </div>
            <div id="notes-files-${courseId}" style="display: grid; gap: 1rem;">
                <div style="text-align: center; padding: 2rem; color: #737373;">
                    <i data-lucide="loader" style="width: 24px; height: 24px; animation: spin 1s linear infinite;"></i>
                    <p>Cargando apuntes...</p>
                </div>
            </div>
        </div>
    `;
};

// Cargar y mostrar archivos de una carpeta
window.loadCourseNotes = async function (courseId) {
    const courseFolder = getCourseFolder(courseId);
    if (!courseFolder) return;

    const container = document.getElementById(`notes-files-${courseId}`);
    if (!container) return;

    const files = await listDriveFiles(courseFolder.folderId);

    if (files.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #737373;">
                <i data-lucide="file-x" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                <p>No hay apuntes en esta carpeta</p>
            </div>
        `;
        return;
    }

    container.innerHTML = files.map(file => `
        <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1rem; display: flex; align-items: center; gap: 1rem;">
            <i data-lucide="${file.mimeType === 'application/pdf' ? 'file-text' : 'image'}" style="width: 24px; height: 24px; color: #ef4444;"></i>
            <div style="flex: 1;">
                <div style="font-weight: 500;">${file.name}</div>
                <div style="font-size: 0.75rem; color: #737373;">
                    ${new Date(file.modifiedTime).toLocaleDateString('es-MX')}
                </div>
            </div>
            <a href="${file.webViewLink}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 0.875rem;">
                Abrir
            </a>
        </div>
    `).join('');

    lucide.createIcons();
};

// Conectar y refrescar la vista
window.connectAndRefresh = async function () {
    try {
        // Verificar si gapi está cargado
        if (typeof gapi === 'undefined' || !gapi.auth2) {
            alert('Cargando Google Drive... Por favor espera unos segundos e intenta de nuevo.');
            return;
        }

        const success = await connectGoogleDrive();
        if (success && typeof window.renderView === 'function') {
            window.renderView();
        }
    } catch (error) {
        console.error('Error conectando:', error);
        alert('Error al conectar con Google Drive. Intenta de nuevo.');
    }
};

// Mostrar selector de carpetas
window.showFolderPicker = async function (courseId) {
    try {
        const folders = await listDriveFolders();

        if (folders.length === 0) {
            alert('No se encontraron carpetas en tu Google Drive.');
            return;
        }

        // Crear modal para seleccionar carpeta
        const modal = document.createElement('div');
        modal.id = 'folder-picker-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 1rem; padding: 2rem; max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin: 0 0 1rem 0;">Selecciona una carpeta</h3>
                <p style="color: #737373; font-size: 0.875rem; margin-bottom: 1.5rem;">
                    Elige la carpeta donde guardas los apuntes de esta materia
                </p>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;">
                    ${folders.map(folder => `
                        <button onclick="selectFolder(${courseId}, '${folder.id}', '${folder.name.replace(/'/g, "\\'")}')" 
                            style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.5rem; cursor: pointer; text-align: left; transition: all 0.2s;"
                            onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#fafafa'">
                            <i data-lucide="folder" style="width: 20px; height: 20px; color: #f59e0b; flex-shrink: 0;"></i>
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${folder.name}</span>
                        </button>
                    `).join('')}
                </div>
                <button onclick="closeFolderPicker()" style="margin-top: 1rem; width: 100%; padding: 0.75rem; background: #737373; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                    Cancelar
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        lucide.createIcons();
    } catch (error) {
        console.error('Error mostrando carpetas:', error);
        alert('Error al cargar las carpetas.');
    }
};

// Seleccionar una carpeta
window.selectFolder = async function (courseId, folderId, folderName) {
    await saveCourseFolder(courseId, folderId, folderName);
    closeFolderPicker();
    if (typeof window.renderView === 'function') {
        window.renderView();
    }
    // Cargar los archivos de la carpeta
    setTimeout(() => loadCourseNotes(courseId), 100);
};

// Cerrar el modal de carpetas
window.closeFolderPicker = function () {
    const modal = document.getElementById('folder-picker-modal');
    if (modal) {
        modal.remove();
    }
};

// Inicializar si hay CLIENT_ID configurado
if (GOOGLE_CLIENT_ID) {
    initGoogleDrive();
}
