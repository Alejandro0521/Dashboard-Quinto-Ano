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

// Listar items (carpetas y archivos) de un directorio
window.listDriveItems = async function (folderId = 'root') {
    if (!googleDriveState.isConnected) return [];

    try {
        const query = `'${folderId}' in parents and (mimeType='application/vnd.google-apps.folder' or mimeType='application/pdf') and trashed=false`;
        const response = await gapi.client.drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, iconLink)',
            orderBy: 'folder, name'
        });
        return response.result.files || [];
    } catch (error) {
        console.error('Error listando items:', error);
        return [];
    }
};

// Navegación del picker
let currentPickerFolderId = 'root';
let currentPickerPath = [{ id: 'root', name: 'Inicio' }];

// Mostrar selector de Drive (archivos y carpetas)
window.showDrivePicker = async function (courseId, folderId = 'root') {
    currentPickerFolderId = folderId;

    // Si volvemos a root, reiniciar path
    if (folderId === 'root') {
        currentPickerPath = [{ id: 'root', name: 'Inicio' }];
    }

    try {
        const items = await listDriveItems(folderId);

        // Crear o actualizar modal
        let modal = document.getElementById('drive-picker-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'drive-picker-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;
            `;
            document.body.appendChild(modal);
        }

        // Renderizar contenido del modal
        modal.innerHTML = `
            <div style="background: white; border-radius: 1rem; padding: 1.5rem; max-width: 500px; width: 95%; max-height: 85vh; display: flex; flex-direction: column;">
                <div style="margin-bottom: 1rem;">
                    <h3 style="margin: 0 0 0.5rem 0;">Selecciona tu Cuaderno o Carpeta</h3>
                    <div style="display: flex; gap: 0.5rem; color: #737373; font-size: 0.875rem; align-items: center; overflow-x: auto; white-space: nowrap; padding-bottom: 0.5rem;">
                        ${currentPickerPath.map((p, i) => `
                            <span style="cursor: pointer; color: ${i === currentPickerPath.length - 1 ? '#171717' : '#3b82f6'}; font-weight: ${i === currentPickerPath.length - 1 ? '600' : '400'}" 
                                  onclick="navigateToFolder(${courseId}, '${p.id}', ${i})">
                                ${p.name}
                            </span>
                            ${i < currentPickerPath.length - 1 ? '<span>/</span>' : ''}
                        `).join('')}
                    </div>
                </div>

                <div style="flex: 1; overflow-y: auto; border: 1px solid #e5e5e5; border-radius: 0.5rem; margin-bottom: 1rem;">
                    ${items.length === 0 ? `
                        <div style="padding: 2rem; text-align: center; color: #a3a3a3;">
                            <i data-lucide="folder-open" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                            <p>Carpeta vacía</p>
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column;">
                            ${items.map(item => {
            const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
            const icon = isFolder ? 'folder' : 'file-text';
            const color = isFolder ? '#f59e0b' : '#ef4444';
            const action = isFolder
                ? `enterFolder(${courseId}, '${item.id}', '${item.name.replace(/'/g, "\\'")}')`
                : `selectItem(${courseId}, '${item.id}', '${item.name.replace(/'/g, "\\'")}', 'file')`;

            return `
                                    <div onclick="${action}" 
                                        style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.2s;"
                                        onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                                        <i data-lucide="${icon}" style="width: 20px; height: 20px; color: ${color}; flex-shrink: 0;"></i>
                                        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</span>
                                        ${isFolder ? `<i data-lucide="chevron-right" style="width: 16px; height: 16px; color: #d4d4d4;"></i>` : ''}
                                    </div>
                                `;
        }).join('')}
                        </div>
                    `}
                </div>

                <div style="display: flex; gap: 1rem; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 0.5rem;">
                        ${currentPickerFolderId !== 'root' ? `
                            <button onclick="selectItem(${courseId}, '${currentPickerFolderId}', '${currentPickerPath[currentPickerPath.length - 1].name}', 'folder')" 
                                    style="padding: 0.5rem 1rem; background: #e5e5e5; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem;">
                                Seleccionar esta carpeta
                            </button>
                        ` : ''}
                    </div>
                    <button onclick="closeDrivePicker()" style="padding: 0.5rem 1rem; background: #171717; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        lucide.createIcons();
    } catch (error) {
        console.error('Error opening picker:', error);
        alert('Error al cargar elementos de Drive.');
    }
};

window.enterFolder = function (courseId, folderId, folderName) {
    currentPickerPath.push({ id: folderId, name: folderName });
    showDrivePicker(courseId, folderId);
};

window.navigateToFolder = function (courseId, folderId, index) {
    currentPickerPath = currentPickerPath.slice(0, index + 1);
    showDrivePicker(courseId, folderId);
};

window.closeDrivePicker = function () {
    const modal = document.getElementById('drive-picker-modal');
    if (modal) modal.remove();
    currentPickerPath = [{ id: 'root', name: 'Inicio' }];
};

window.selectItem = async function (courseId, itemId, itemName, type) {
    // type: 'file' or 'folder'
    // itemId is effectively folderId in our data structure context
    await saveCourseFolder(courseId, itemId, itemName, type);
    closeDrivePicker();
    if (typeof window.renderView === 'function') window.renderView();
    if (type === 'file') {
        // Force reload to show file preview
        setTimeout(() => window.renderView(), 100);
    } else {
        setTimeout(() => loadCourseNotes(courseId), 100);
    }
};

// MODIFIED: saveCourseFolder to include item type and use consistent keys
window.saveCourseFolder = async function (courseId, folderId, folderName, type = 'folder') {
    googleDriveState.foldersByCourrse[courseId] = {
        folderId: folderId,      // Uniform key
        folderName: folderName,  // Uniform key
        type: type // 'folder' or 'file'
    };

    // Update simple cache if needed or just rely on state

    if (typeof saveUserCourseFolder === 'function') {
        await saveUserCourseFolder(courseId, folderId, folderName, type);
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
                <button onclick="connectAndRefresh(${courseId})" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
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
                <button onclick="showDrivePicker(${courseId})" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
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
                    <span style="color: #737373; font-size: 0.875rem;">${courseFolder.type === 'file' ? 'Archivo:' : 'Carpeta:'}</span>
                    <span style="font-weight: 500;">${courseFolder.folderName || courseFolder.name}</span>
                </div>
                <button onclick="showDrivePicker(${courseId})" style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 0.875rem;">
                    Cambiar ${courseFolder.type === 'file' ? 'archivo' : 'carpeta'}
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

    let files = [];
    // Ensure we use the correct property for ID (local state might have id, Firestore has folderId)
    const targetId = courseFolder.folderId || courseFolder.id;

    if (courseFolder.type === 'file') {
        // If a single file was selected, display it directly
        try {
            const response = await gapi.client.drive.files.get({
                fileId: targetId,
                fields: 'id, name, mimeType, modifiedTime, webViewLink, thumbnailLink'
            });
            files = [response.result];
        } catch (error) {
            console.error('Error fetching single file:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <i data-lucide="alert-triangle" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                    <p>Error al cargar el archivo seleccionado.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
    } else {
        // If a folder was selected, list its contents
        files = await listDriveFiles(targetId);
    }

    if (files.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #737373;">
                <i data-lucide="file-x" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                <p>No hay apuntes en esta carpeta</p>
            </div>
        `;
        lucide.createIcons();
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

// Listar archivos PDF de una carpeta (kept for compatibility with loadCourseNotes)
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

// Aliases for compatibility
window.showFolderPicker = (courseId) => showDrivePicker(courseId, 'root');
window.selectFolder = (courseId, id, name) => selectItem(courseId, id, name, 'folder');
window.closeFolderPicker = window.closeDrivePicker;

// Conectar y refrescar la vista
// Conectar y refrescar la vista
window.connectAndRefresh = async function (courseId) {
    try {
        if (typeof gapi === 'undefined' || !gapi.auth2) {
            alert('Cargando Google Drive... Por favor espera unos segundos e intenta de nuevo.');
            return;
        }
        const success = await connectGoogleDrive();
        if (success) {
            if (typeof window.renderView === 'function') {
                window.renderView();
            }
            // If courseId is provided, open the picker automatically
            if (courseId) {
                setTimeout(() => showDrivePicker(courseId), 500);
            }
        }
    } catch (error) {
        console.error('Error conectando:', error);
        alert('Error al conectar con Google Drive. Intenta de nuevo.');
    }
};

// Inicializar si hay CLIENT_ID configurado
if (GOOGLE_CLIENT_ID) {
    initGoogleDrive();
}
