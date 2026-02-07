// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyCik-qO0ic1eNCuIayr-chdGvk4Om3wyWk",
    authDomain: "ingea-final-quinto.firebaseapp.com",
    projectId: "ingea-final-quinto",
    storageBucket: "ingea-final-quinto.firebasestorage.app",
    messagingSenderId: "132873943294",
    appId: "1:132873943294:web:03c95cee6025992fc2cdaf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initial Data (7 materias completas)
const INITIAL_DATA = {
    courses: [
        {
            id: 1,
            name: "Economía de la Producción",
            icon: "🏭",
            progress: 80,
            grade: 8.5,
            professor: "Dr. Álvarez",
            description: "Teoría de la firma, costos de producción y maximización.",
            hasTools: true,
            resources: [], // Array to store course resources
            tasks: []
        },
        {
            id: 2,
            name: "Economía Internacional",
            icon: "🌍",
            progress: 45,
            grade: 9.0,
            professor: "Dra. Jiménez",
            description: "Comercio internacional, balanza de pagos y tipos de cambio.",
            resources: [],
            tasks: []
        },
        {
            id: 3,
            name: "Macroeconomía III",
            icon: "📊",
            progress: 60,
            grade: 7.8,
            professor: "Mtro. Castillo",
            description: "Modelos macroeconómicos dinámicos y política monetaria.",
            description: "Modelos macroeconómicos dinámicos y política monetaria.",
            resources: [],
            tasks: []
        },
        {
            id: 4,
            name: "Imperialismo y Globalización",
            icon: "⚖️",
            progress: 90,
            grade: 9.5,
            professor: "Lic. Rivas",
            description: "Análisis histórico de la globalización.",
            tasks: []
        },
        {
            id: 5,
            name: "Teoría Matemática",
            icon: "📈",
            progress: 30,
            grade: 6.5,
            professor: "Dr. Newton",
            description: "Fundamentos matemáticos para estadística inferencial.",
            hasTools: true,
            tasks: []
        },
        {
            id: 6,
            name: "Econometría I",
            icon: "🔬",
            progress: 50,
            grade: 8.2,
            professor: "Dr. Gauss",
            description: "Modelos de regresión lineal y series de tiempo.",
            tasks: []
        },
        {
            id: 7,
            name: "Práctica Profesional",
            icon: "🐷",
            progress: 20,
            grade: 10.0,
            professor: "Coord. Laboral",
            description: "Prácticas laborales supervisadas.",
            hasTools: true,
            resources: [],
            tasks: []
        }
    ]
};

let currentUser = null;
let currentUserName = null;
let userData = null;
let currentView = 'dashboard';
let selectedCourse = null;
let currentTool = null;

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
        showMainApp();
    } else {
        showLogin();
    }
});

window.showLoginTab = () => {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
};

window.showRegisterTab = () => {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
};

// Wait for DOM to be ready before attaching event listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
} else {
    initializeEventListeners();
}

function initializeEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            document.getElementById('loginError').textContent = 'Error: ' + error.message;
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                data: INITIAL_DATA
            });
        } catch (error) {
            document.getElementById('registerError').textContent = 'Error: ' + error.message;
        }
    });
}

// Global variable to track which course is requesting an upload
let pendingUploadCourseId = null;

// Setup listener for the static file input in HTML
function setupFileUploadListener() {
    const input = document.getElementById('resourceFileInput');
    if (!input) return;

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        e.target.value = ''; // Reset so same file can be selected again

        if (!file || !pendingUploadCourseId) return;

        const courseId = pendingUploadCourseId;
        pendingUploadCourseId = null;

        const btn = document.getElementById('uploadBtn');
        const originalBtnContent = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<span>Subiendo...</span>';

        try {
            const storagePath = `users/${currentUser.uid}/courses/${courseId}/${Date.now()}_${file.name}`;
            const fileRef = storageRef(storage, storagePath);

            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            const newResource = {
                name: file.name,
                url: url,
                type: file.type,
                date: new Date().toISOString(),
                path: storagePath
            };

            const courseIndex = userData.courses.findIndex(c => c.id === courseId);
            if (courseIndex !== -1) {
                if (!userData.courses[courseIndex].resources) {
                    userData.courses[courseIndex].resources = [];
                }
                userData.courses[courseIndex].resources.push(newResource);

                await updateDoc(doc(db, 'users', currentUser.uid), {
                    courses: userData.courses
                });

                renderView();
                alert('Recurso subido correctamente');
            }
        } catch (error) {
            console.error("Error uploading resource:", error);
            alert('Error al subir el recurso: ' + error.message);
            if (btn) btn.innerHTML = originalBtnContent || 'Subir Recurso';
        }
    });
}

// Call setup when DOM is ready
document.addEventListener('DOMContentLoaded', setupFileUploadListener);

window.uploadResource = (courseId) => {
    pendingUploadCourseId = courseId;
    const input = document.getElementById('resourceFileInput');
    if (input) {
        input.click();
    } else {
        alert('Error: No se encontró el input de archivo. Recarga la página.');
    }
};

window.deleteResource = async (courseId, resourceIndex) => {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;

    try {
        const courseIndex = userData.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) return;

        // Ensure resources array exists
        if (!userData.courses[courseIndex].resources) userData.courses[courseIndex].resources = [];

        // Remove from Firestore logic would also ideally remove from Storage
        // For now, we update the data structure. Storage cleanup is separate or can be added.
        userData.courses[courseIndex].resources.splice(resourceIndex, 1);

        await updateDoc(doc(db, 'users', currentUser.uid), {
            courses: userData.courses
        });

        renderView();

    } catch (error) {
        console.error("Error deleting resource:", error);
        alert('Error al eliminar el recurso');
    }
};

window.showResourcePreview = (url, type, name) => {
    const modal = document.createElement('div');
    modal.id = 'resourcePreviewModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 1000;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
    `;

    let content = '';

    if (type.includes('image')) {
        content = `<img src="${url}" style="max-width: 90%; max-height: 85%; border-radius: 8px;">`;
    } else if (type.includes('pdf')) {
        content = `<iframe src="${url}" style="width: 90%; height: 85%; border-radius: 8px; background: white; border: none;"></iframe>`;
    } else {
        // Fallback for other files (Office docs, etc.) using Google Docs Viewer
        // Note: Google Docs Viewer works with publicly accessible URLs. 
        // Firebase Storage URLs are public but require the token. Usually works.
        content = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center;">
                <p style="margin-bottom: 1rem;">Vista previa no disponible nativamente para este archivo.</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="${url}" target="_blank" class="btn-primary" style="text-decoration: none;">Descargar Archivo</a>
                    <a href="https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true" target="_blank" class="btn-secondary" style="text-decoration: none;">Intentar abrir con Google Docs</a>
                </div>
            </div>
        `;
    }

    modal.innerHTML = `
        <div style="width: 90%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="color: white; margin: 0; font-weight: 500;">${name}</h3>
            <button onclick="document.getElementById('resourcePreviewModal').remove()" style="background: white; border: none; padding: 0.5rem; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>
        ${content}
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
};

window.logout = async () => {
    await signOut(auth);
};

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    lucide.createIcons();
    navigateTo('dashboard');
}

async function loadUserData() {
    const docRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const docData = docSnap.data();
        userData = docData.data;
        currentUserName = docData.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Estudiante');

        // Migrate/sync user data with latest INITIAL_DATA structure
        let needsUpdate = false;

        // Update each course with new properties from INITIAL_DATA
        userData.courses = userData.courses.map(userCourse => {
            const initialCourse = INITIAL_DATA.courses.find(c => c.id === userCourse.id);
            if (initialCourse) {
                let changed = false;
                let updatedCourse = { ...userCourse };

                // Check if hasTools property needs to be added/updated
                if (initialCourse.hasTools && !userCourse.hasTools) {
                    updatedCourse.hasTools = true;
                    changed = true;
                }

                // Check if resources array is missing (migration for previous feature)
                if (initialCourse.resources && !userCourse.resources) {
                    updatedCourse.resources = [];
                    changed = true;
                }

                // Sync Icon if changed (e.g. pig emoji)
                if (initialCourse.icon !== userCourse.icon) {
                    updatedCourse.icon = initialCourse.icon;
                    changed = true;
                }

                if (changed) {
                    needsUpdate = true;
                    return updatedCourse;
                }
            }
            return userCourse;
        });

        // Save updated data if changes were made
        if (needsUpdate) {
            await saveUserData();
        }
    } else {
        userData = INITIAL_DATA;
        await saveUserData();
    }
}

async function saveUserData() {
    // Use setDoc with merge to ensure document exists and we don't fail on update
    await setDoc(doc(db, 'users', currentUser.uid), {
        data: userData
    }, { merge: true });
}

// Navigation
window.navigateTo = (view) => {
    currentView = view;

    // Update nav buttons
    document.querySelectorAll('.nav-item, .mobile-nav button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });

    renderView();
};

function renderView() {
    const content = document.getElementById('content');

    switch (currentView) {
        case 'dashboard':
            content.innerHTML = renderDashboard();
            break;
        case 'tasks':
            content.innerHTML = renderTasks();
            break;
        case 'stats':
            content.innerHTML = renderStats();
            break;
        case 'course':
            content.innerHTML = renderCourseDetail();
            break;
        case 'tool':
            content.innerHTML = renderTool();
            break;
    }

    lucide.createIcons();
}

// Exponer renderView globalmente para livestock_dashboard.js
window.renderView = renderView;

function renderDashboard() {
    const pendingTasks = userData.courses.flatMap(c =>
        c.tasks.filter(t => t.status !== 'done').map(t => ({ ...t, courseName: c.name, courseIcon: c.icon }))
    ).slice(0, 3);

    const avgGrade = (userData.courses.reduce((sum, c) => sum + c.grade, 0) / userData.courses.length).toFixed(1);

    return `
        <h1 style="font-size: 2rem; font-weight: 300; margin-bottom: 2rem;">Hola, ${currentUserName || 'Estudiante'}.</h1>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 3rem;">
            <div style="background: linear-gradient(135deg, #171717 0%, #404040 100%); color: white; padding: 2rem; border-radius: 1rem;">
                <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 1rem;">Próximas Entregas</h3>
                ${pendingTasks.length > 0 ? pendingTasks.map(t => `
                    <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.75rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 2rem; height: 2rem; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem;">
                            ${t.courseIcon}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.875rem; font-weight: 500;">${t.title}</div>
                            <div style="font-size: 0.625rem; color: rgba(255,255,255,0.6);">${t.courseName}</div>
                        </div>
                        <div style="padding: 0.25rem 0.5rem; background: rgba(0,0,0,0.3); border-radius: 0.25rem; font-size: 0.625rem; font-weight: bold;">
                            ${t.due}
                        </div>
                    </div>
                `).join('') : '<p style="color: rgba(255,255,255,0.6); font-size: 0.875rem; font-style: italic;">¡Todo despejado!</p>'}
            </div>

            <div style="background: white; border: 1px solid #e5e5e5; padding: 1.5rem; border-radius: 1rem;">
                <div style="font-size: 0.625rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Promedio General</div>
                <div style="font-size: 2.5rem; font-weight: 300;">${avgGrade}</div>
            </div>
        </div>

        <h3 style="font-size: 1.125rem; font-weight: 300; margin-bottom: 1rem;">Materias Activas</h3>
            <div class="courses-grid">
                ${userData.courses.map(course => `
                    <div class="course-card" onclick="viewCourse(${course.id})">
                        <div class="course-header">
                            <div class="course-icon">${course.icon}</div>
                        </div>
                        <h3 class="course-name">${course.name}</h3>
                        <p class="course-professor">${course.professor}</p>
                    </div>
                `).join('')}
            </div>
    `;
}

function renderTasks() {
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h1 style="font-size: 2rem; font-weight: 300;">Todas las Tareas</h1>
            <button onclick="openAddTaskModal()" class="btn-primary" style="padding: 0.75rem 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
                Agregar Tarea
            </button>
        </div>
        
        ${userData.courses.map(course => {
        const pendingTasks = course.tasks.filter(t => t.status !== 'done');
        if (pendingTasks.length === 0) return '';

        return `
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.25rem;">${course.icon}</span> ${course.name}
                    </h2>
                    ${pendingTasks.map(task => `
                        <div class="task-item">
                            <div class="task-checkbox ${task.status === 'done' ? 'done' : ''}" onclick="toggleTask(${course.id}, ${task.id})"></div>
                            <div class="task-info">
                                <div class="task-title">${task.title}</div>
                                <div class="task-due">${task.due}</div>
                            </div>
                            <button onclick="deleteTask(${course.id}, ${task.id})" style="background: none; border: none; color: #a3a3a3; cursor: pointer;">
                                <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
    }).join('')}
    `;
}

function renderStats() {
    const avgGrade = (userData.courses.reduce((sum, c) => sum + c.grade, 0) / userData.courses.length).toFixed(1);

    return `
        <h1 style="font-size: 2rem; font-weight: 300; margin-bottom: 2rem;">Estadísticas</h1>
        
        <div class="stats-grid">
            <div class="stat-card primary">
                <div class="stat-label">Promedio General</div>
                <div class="stat-value">${avgGrade}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Materias</div>
                <div class="stat-value">${userData.courses.length}</div>
            </div>
        </div>
        
        ${userData.courses.map(course => `
            <div style="background: white; border: 1px solid #e5e5e5; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <span style="font-size: 1.25rem;">${course.icon}</span>
                    <div style="flex: 1;">
                        <h3 style="font-weight: 500;">${course.name}</h3>
                    </div>
                    <button onclick="openEditCourseModal(${course.id})" style="background: none; border: none; color: #a3a3a3; cursor: pointer;">
                        <i data-lucide="edit-2" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
                <div style="margin-bottom: 1rem;">
                    <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">Calificación</div>
                    <div style="font-size: 1.5rem; font-weight: 300;">${course.grade}</div>
                </div>
            </div>
        `).join('')}
    `;
}

// Helper to control tabs within course view
let currentCourseTab = 'detalles';

window.setCourseTab = (tab) => {
    currentCourseTab = tab;
    renderView();
};

function renderCourseDetail() {
    if (!selectedCourse) return '';

    const tabs = [
        { id: 'detalles', label: 'Detalles', icon: 'info' },
        { id: 'tareas', label: 'Tareas', icon: 'check-square' },
        { id: 'recursos', label: 'Recursos', icon: 'book-open' },
        { id: 'apuntes', label: 'Apuntes', icon: 'notebook-pen' },
        { id: 'herramientas', label: 'Herramientas', icon: 'wrench' }
    ];

    const activeTasks = selectedCourse.tasks.filter(t => t.status !== 'done');
    const completedTasks = selectedCourse.tasks.filter(t => t.status === 'done');

    return `
        <div style="max-width: 48rem; margin: 0 auto;">
            <button onclick="navigateTo('dashboard')" style="background: none; border: none; color: #a3a3a3; cursor: pointer; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                Volver
            </button>
            
            <div style="margin-bottom: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">${selectedCourse.icon}</div>
                <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
                    <input id="courseNameInput" type="text" value="${selectedCourse.name}" style="font-size:1.5rem; font-weight:300; border:none; outline:none; padding:0;">
                    <button onclick="saveCourseName(${selectedCourse.id})" class="btn-primary" style="padding:0.25rem 0.5rem; font-size:0.875rem;">Guardar</button>
                </div>
                <p style="color: #a3a3a3; font-size: 0.875rem;">${selectedCourse.description}</p>
            </div>

            <div style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 1px;">
                ${tabs.map(tab => `
                    <button 
                        onclick="setCourseTab('${tab.id}')"
                        style="
                            padding: 0.75rem 0;
                            margin-bottom: -1px;
                            background: none;
                            border: none;
                            border-bottom: 2px solid ${currentCourseTab === tab.id ? '#171717' : 'transparent'};
                            color: ${currentCourseTab === tab.id ? '#171717' : '#a3a3a3'};
                            font-weight: ${currentCourseTab === tab.id ? '500' : '400'};
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            transition: all 0.2s;
                        "
                    >
                        <i data-lucide="${tab.icon}" style="width: 16px; height: 16px;"></i>
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
            
            <div style="min-height: 200px;">
                ${renderCourseTabContent(activeTasks, completedTasks)}
            </div>
        </div>
    `;
}

function renderCourseTabContent(activeTasks, completedTasks) {
    if (currentCourseTab === 'detalles') {
        return `
            <div style="background: white; border: 1px solid #e5e5e5; padding: 2rem; border-radius: 1rem;">
                <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 1.5rem;">Información General</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                        <div style="padding: 1rem; background: #fafafa; border-radius: 0.5rem;">
                        <div style="font-size: 0.625rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Profesor</div>
                        <input id="courseProfessorInput" type="text" value="${selectedCourse.professor || ''}" onchange="saveCourseContacts(${selectedCourse.id})" class="form-input" style="width:100%; padding:0.5rem; border:1px solid #e5e5e5; border-radius:0.5rem;" />
                    </div>
                    <div style="padding: 1rem; background: #fafafa; border-radius: 0.5rem;">
                        <div style="font-size: 0.625rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Correo</div>
                        <input id="courseProfessorEmail" type="email" value="${selectedCourse.professorEmail || ''}" onchange="saveCourseContacts(${selectedCourse.id})" class="form-input" style="width:100%; padding:0.5rem; border:1px solid #e5e5e5; border-radius:0.5rem;" />
                    </div>
                    <div style="padding: 1rem; background: #fafafa; border-radius: 0.5rem;">
                        <div style="font-size: 0.625rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Teléfono</div>
                        <input id="courseProfessorPhone" type="text" value="${selectedCourse.professorPhone || ''}" onchange="saveCourseContacts(${selectedCourse.id})" class="form-input" style="width:100%; padding:0.5rem; border:1px solid #e5e5e5; border-radius:0.5rem;" />
                    </div>
                </div>
            </div>
        `;
    }

    if (currentCourseTab === 'tareas') {
        return `
            <div>
                <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
                    <button onclick="openAddTaskModal()" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        + Nueva Tarea
                    </button>
                </div>

                ${activeTasks.length === 0 && completedTasks.length === 0 ? `
                    <div style="text-align: center; padding: 3rem; color: #a3a3a3;">
                        <i data-lucide="check-circle" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No hay tareas registradas para esta materia.</p>
                    </div>
                ` : ''}

                ${activeTasks.length > 0 ? `
                    <h4 style="font-size: 0.875rem; color: #a3a3a3; margin-bottom: 1rem; margin-top: 1rem;">Pendientes</h4>
                    ${activeTasks.map(task => `
                        <div class="task-item">
                            <div class="task-checkbox" onclick="toggleTask(${selectedCourse.id}, ${task.id})"></div>
                            <div class="task-info">
                                <div class="task-title">${task.title}</div>
                                <div class="task-due">${task.due}</div>
                            </div>
                            <button onclick="deleteTask(${selectedCourse.id}, ${task.id})" style="background: none; border: none; color: #a3a3a3; cursor: pointer;">
                                <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                            </button>
                        </div>
                    `).join('')}
                ` : ''}

                ${completedTasks.length > 0 ? `
                    <h4 style="font-size: 0.875rem; color: #a3a3a3; margin-bottom: 1rem; margin-top: 2rem;">Completadas</h4>
                    ${completedTasks.map(task => `
                        <div class="task-item" style="opacity: 0.6;">
                            <div class="task-checkbox done" onclick="toggleTask(${selectedCourse.id}, ${task.id})"></div>
                            <div class="task-info">
                                <div class="task-title" style="text-decoration: line-through;">${task.title}</div>
                                <div class="task-due">Completada</div>
                            </div>
                            <button onclick="deleteTask(${selectedCourse.id}, ${task.id})" style="background: none; border: none; color: #a3a3a3; cursor: pointer;">
                                <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                            </button>
                        </div>
                    `).join('')}
                ` : ''}
            </div>
        `;
    }

    if (currentCourseTab === 'recursos') {
        const resources = selectedCourse.resources || [];

        return `
            <div style="padding-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-weight: 600; font-size: 1.125rem;">Material de Clase</h3>
                    <button id="uploadBtn" onclick="uploadResource(${selectedCourse.id})" class="btn-primary" style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="upload" style="width: 16px; height: 16px;"></i>
                        Subir Recurso
                    </button>
                </div>

                ${resources.length === 0 ? `
                    <div style="text-align: center; padding: 4rem 2rem; background: white; border: 1px dashed #e5e5e5; border-radius: 1rem;">
                        <i data-lucide="folder-open" style="width: 48px; height: 48px; color: #d4d4d4; margin-bottom: 1rem;"></i>
                        <h3 style="font-weight: 500; margin-bottom: 0.5rem;">Sin Recursos</h3>
                        <p style="color: #a3a3a3; font-size: 0.875rem;">Sube presentaciones, PDFs o imágenes para esta materia.</p>
                    </div>
                ` : `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                        ${resources.map((resource, index) => {
            let icon = 'file-text';
            if (resource.type.includes('pdf')) icon = 'file-text';
            else if (resource.type.includes('image')) icon = 'image';
            else if (resource.type.includes('presentation') || resource.name.endsWith('.ppt') || resource.name.endsWith('.pptx')) icon = 'presentation';

            return `
                                <div style="background: white; border: 1px solid #e5e5e5; border-radius: 0.75rem; padding: 1rem; position: relative; group;">
                                    <button onclick="deleteResource(${selectedCourse.id}, ${index})" style="position: absolute; top: 0.5rem; right: 0.5rem; background: white; border: 1px solid #e5e5e5; border-radius: 0.375rem; padding: 0.25rem; cursor: pointer; color: #ef4444;">
                                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                    </button>
                                    
                                    <div onclick="showResourcePreview('${resource.url}', '${resource.type}', '${resource.name}')" style="cursor: pointer;">
                                        <div style="background: #f5f5f5; height: 100px; border-radius: 0.5rem; display: flex; justify-content: center; align-items: center; margin-bottom: 0.75rem;">
                                            <i data-lucide="${icon}" style="width: 40px; height: 40px; color: #a3a3a3;"></i>
                                        </div>
                                        <h4 style="font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${resource.name}">${resource.name}</h4>
                                        <p style="font-size: 0.75rem; color: #a3a3a3;">${new Date(resource.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    if (currentCourseTab === 'herramientas') {
        if (!selectedCourse.hasTools) {
            return `
                <div style="text-align: center; padding: 4rem 2rem; background: white; border: 1px solid #e5e5e5; border-radius: 1rem;">
                    <i data-lucide="wrench" style="width: 48px; height: 48px; color: #d4d4d4; margin-bottom: 1rem;"></i>
                    <h3 style="font-weight: 500; margin-bottom: 0.5rem;">Herramientas no disponibles</h3>
                    <p style="color: #a3a3a3; font-size: 0.875rem;">Esta materia no requiere herramientas de cálculo especializadas.</p>
                </div>
            `;
        }

        // Tools for Economía de la Producción (ID 1)
        if (selectedCourse.id === 1) {
            return `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    <div class="hover:border-black" style="background: white; border: 1px solid #e5e5e5; padding: 1.5rem; border-radius: 1rem; transition: all 0.2s; cursor: pointer;">
                        <div style="width: 3rem; height: 3rem; background: #171717; color: white; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <i data-lucide="calculator" style="width: 24px; height: 24px;"></i>
                        </div>
                        <h3 style="font-weight: 500; margin-bottom: 0.5rem;">Calculadora de Producción</h3>
                        <p style="color: #a3a3a3; font-size: 0.875rem; margin-bottom: 1rem;">Analiza funciones Cobb-Douglas y calcula óptimos técnicos.</p>
                        <button onclick="openTool('production_analyzer')" class="btn-primary" style="width: 100%; justify-content: center;">Abrir Herramienta</button>
                    </div>
                
                    <div class="hover:border-black" style="background: white; border: 1px solid #e5e5e5; padding: 1.5rem; border-radius: 1rem; transition: all 0.2s; cursor: pointer;">
                        <div style="width: 3rem; height: 3rem; background: #171717; color: white; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <i data-lucide="dollar-sign" style="width: 24px; height: 24px;"></i>
                        </div>
                        <h3 style="font-weight: 500; margin-bottom: 0.5rem;">Simulador de Costos</h3>
                        <p style="color: #a3a3a3; font-size: 0.875rem; margin-bottom: 1rem;">Calcula costos fijos, variables, totales, medios y marginales.</p>
                        <button onclick="openTool('cost_simulator')" class="btn-primary" style="width: 100%; justify-content: center;">Abrir Herramienta</button>
                    </div>
                </div>
            `;
        }

        // Tools for Teoría Matemática (ID 5)
        if (selectedCourse.id === 5) {
            return `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    <div class="hover:border-black" style="background: white; border: 1px solid #e5e5e5; padding: 1.5rem; border-radius: 1rem; transition: all 0.2s; cursor: pointer;">
                        <div style="width: 3rem; height: 3rem; background: #171717; color: white; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <i data-lucide="circle" style="width: 24px; height: 24px;"></i>
                        </div>
                        <h3 style="font-weight: 500; margin-bottom: 0.5rem;">Calculadora de Teoría de Conjuntos</h3>
                        <p style="color: #a3a3a3; font-size: 0.875rem; margin-bottom: 1rem;">Resuelve operaciones de conjuntos: intersección, unión, diferencia y complemento.</p>
                        <button onclick="openTool('set_theory_calculator')" class="btn-primary" style="width: 100%; justify-content: center;">Abrir Herramienta</button>
                    </div>
                </div>
            `;
        }

        // Tools for Práctica Profesional (ID 7)
        if (selectedCourse.id === 7) {
            return `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    <div class="hover:border-black" style="background: white; border: 1px solid #e5e5e5; padding: 1.5rem; border-radius: 1rem; transition: all 0.2s; cursor: pointer;">
                        <div style="width: 3rem; height: 3rem; background: #171717; color: white; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <i data-lucide="trending-up" style="width: 24px; height: 24px;"></i>
                        </div>
                        <h3 style="font-weight: 500; margin-bottom: 0.5rem;">Dashboard de Precios Pecuarios</h3>
                        <p style="color: #a3a3a3; font-size: 0.875rem; margin-bottom: 1rem;">Consulta precios actuales de ganado y alimentos del SNIIM (México).</p>
                        <button onclick="openTool('livestock_prices')" class="btn-primary" style="width: 100%; justify-content: center;">Abrir Dashboard</button>
                    </div>
                </div>
            `;
        }

        return `<div style="text-align: center; padding: 2rem; color: #a3a3a3;">No hay herramientas disponibles para esta materia.</div>`;
    }

    if (currentCourseTab === 'apuntes') {
        return `
            <div style="background: white; border: 1px solid #e5e5e5; padding: 2rem; border-radius: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-weight: 600; font-size: 1.125rem; margin: 0;">Mis Apuntes</h3>
                    <span style="font-size: 0.75rem; color: #a3a3a3;">Sincronizado con Google Drive</span>
                </div>
                ${typeof renderNotesSection === 'function' ? renderNotesSection(selectedCourse.id) : `
                    <div style="text-align: center; padding: 3rem; color: #737373;">
                        <i data-lucide="cloud-off" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                        <h3 style="margin: 0 0 0.5rem 0; color: #525252;">Google Drive no configurado</h3>
                        <p style="margin: 0; font-size: 0.875rem;">
                            La integración con Google Drive estará disponible próximamente.
                        </p>
                    </div>
                `}
            </div>
        `;
    }
}

// Tool Logic
window.openTool = (toolId) => {
    currentTool = toolId;
    currentView = 'tool';
    renderView();
};

function renderTool() {
    if (currentTool === 'production_analyzer') {
        return renderProductionAnalyzer();
    }
    if (currentTool === 'cost_simulator') {
        return renderCostSimulator();
    }
    if (currentTool === 'set_theory_calculator') {
        return renderSetTheoryCalculator();
    }
    if (currentTool === 'livestock_prices') {
        return renderLivestockPrices();
    }
    return '';
}


// Variables for Calculator State
let analysisState = {
    crop: 'Maíz',
    functionType: 'quadratic', // quadratic, cubic, cobb-douglas
    params: { a: 0, b: 10, c: 0.5, d: 0.02, alpha: 1, beta: 0.5 },
    x: 5,
    result: null
};

// Variables for Cost Simulator State
let costState = {
    product: 'Producto A',
    fixedCost: 1000,
    variableCostPerUnit: 50,
    quantity: 20,
    result: null
};

// Variables for Set Theory Calculator State
let setTheoryState = {
    setA: [],
    setB: [],
    setC: [],
    setD: [],
    universal: [],
    operation: '',
    result: null,
    vennData: null
};

// Estado del dashboard de precios pecuarios
let livestockPricesState = {
    regiones: {},
    feed: {},
    comparacion: null,
    lastUpdate: null,
    loading: false
};


window.setFunctionType = (type) => {
    analysisState.functionType = type;
    analysisState.result = null; // Reset results
    renderView();
};

window.calculateProduction = () => {
    const x = parseFloat(document.getElementById('inputX').value) || 0;
    analysisState.x = x;
    analysisState.crop = document.getElementById('cropType').value;

    let params = { ...analysisState.params };

    // Get current params based on active function type
    if (analysisState.functionType === 'quadratic') {
        params.a = parseFloat(document.getElementById('inputA').value) || 0;
        params.b = parseFloat(document.getElementById('inputB').value) || 0;
        params.c = parseFloat(document.getElementById('inputC').value) || 0;
    } else if (analysisState.functionType === 'cubic') {
        params.a = parseFloat(document.getElementById('inputA').value) || 0;
        params.b = parseFloat(document.getElementById('inputB').value) || 0;
        params.c = parseFloat(document.getElementById('inputC').value) || 0;
        params.d = parseFloat(document.getElementById('inputD').value) || 0;
    } else if (analysisState.functionType === 'cobb-douglas') {
        params.alpha = parseFloat(document.getElementById('inputAlpha').value) || 0;
        params.beta = parseFloat(document.getElementById('inputBeta').value) || 0;
    }

    analysisState.params = params;

    // --- Chart Data Generation Vars ---
    const chartLabels = [];
    const dataQ = [];
    const dataPFP = [];
    const dataPMF = [];
    // ----------------------------------

    // Determine range for graph
    const maxGraphX = Math.max(parseFloat(x) * 1.5, 20);
    const step = maxGraphX / 50;

    for (let i = 0; i <= maxGraphX; i += step) {
        let curX = i;
        let curQ = 0, curPFP = 0, curPMF = 0;

        if (analysisState.functionType === 'quadratic') {
            curQ = params.a + (params.b * curX) - (params.c * curX * curX);
            curPMF = params.b - (2 * params.c * curX);
        } else if (analysisState.functionType === 'cubic') {
            curQ = params.a + (params.b * curX) + (params.c * curX * curX) - (params.d * curX * curX * curX);
            curPMF = params.b + (2 * params.c * curX) - (3 * params.d * curX * curX);
        } else if (analysisState.functionType === 'cobb-douglas') {
            curQ = params.alpha * Math.pow(curX, params.beta);
            curPMF = params.alpha * params.beta * Math.pow(curX, params.beta - 1);
        }

        curPFP = curX !== 0 ? curQ / curX : 0;

        chartLabels.push(curX.toFixed(1));
        dataQ.push(curQ);
        dataPFP.push(curPFP);
        dataPMF.push(curPMF);
    }

    let Q = 0, PFP = 0, PMF = 0, Ep = 0;
    let maxPMF = { x: 0, val: 0 };
    let diminishingStart = 0;

    // Stages Limits
    let stage1End = 0; // Where PFP = PMF (Max PFP)
    let stage2End = 0; // Where PMF = 0 (Max Q)
    let currentStage = 'Desconocida';

    if (analysisState.functionType === 'quadratic') {
        // Q = a + bX - cX² (assuming a=0 for rational stages usually)
        Q = params.a + (params.b * x) - (params.c * x * x);
        PMF = params.b - (2 * params.c * x);
        // Max PMF in quadratic is at X=0 (start) since it's a downward line (b - 2cX)
        maxPMF = { x: 0, val: params.b };
        diminishingStart = 0; // Starts immediately for c > 0

        // Stage 1 End: PFP = PMF. If a=0, PFP = b-cX. PMF = b-2cX.
        // b-cX = b-2cX => cX = 0 => X=0. Stage 1 is instantaneous if a=0.
        // If a!=0, calculate intersect. For simplicitly assuming a=0 behavior or X=0.
        stage1End = 0;

        // Stage 2 End: PMF = 0 => b - 2cX = 0 => X = b / 2c
        stage2End = params.c !== 0 ? params.b / (2 * params.c) : 0;

    } else if (analysisState.functionType === 'cubic') {
        // Q = a + bX + cX² - dX³
        Q = params.a + (params.b * x) + (params.c * x * x) - (params.d * x * x * x);
        PMF = params.b + (2 * params.c * x) - (3 * params.d * x * x);

        // Max PMF vertex X = -2c / (2*-3d) = c / 3d
        let inflexionX = params.c / (3 * params.d);
        if (inflexionX < 0) inflexionX = 0;
        diminishingStart = inflexionX;
        maxPMF = {
            x: inflexionX,
            val: params.b + (2 * params.c * inflexionX) - (3 * params.d * inflexionX * inflexionX)
        };

        // Stage 1 End (Max PFP): X = c / 2d (Derived from PFP=PMF for standard cubic a=0)
        stage1End = params.d !== 0 ? params.c / (2 * params.d) : 0;

        // Stage 2 End (PMF = 0): Roots of -3dX^2 + 2cX + b = 0
        // X = (-2c - sqrt(4c^2 - 4(-3d)b)) / -6d  (USING POSITIVE ROOT)
        if (params.d !== 0) {
            const disc = (4 * params.c * params.c) - (4 * (-3 * params.d) * params.b);
            if (disc >= 0) {
                stage2End = (-2 * params.c - Math.sqrt(disc)) / (-6 * params.d);
            }
        }

    } else if (analysisState.functionType === 'cobb-douglas') {
        Q = params.alpha * Math.pow(x, params.beta);
        PMF = params.alpha * params.beta * Math.pow(x, params.beta - 1);
        maxPMF = params.beta < 1 ? { x: 0, val: Infinity } : { x: '∞', val: '∞' };
        diminishingStart = params.beta < 1 ? 0 : 'N/A';

        // Cobb-Douglas typically doesn't have 3 stages in standard sense (Monotonic)
        // If Beta < 1, always diminishing returns (Stage 2-ish behavior but never PMF<0)
        stage1End = 0;
        stage2End = Infinity;
    }

    // Determine Current Stage
    if (analysisState.functionType === 'cobb-douglas') {
        currentStage = 'Racional (Rend. Decrecientes)';
    } else {
        if (x < stage1End) currentStage = 'Etapa 1 (Irracional)';
        else if (x >= stage1End && x <= stage2End) currentStage = 'Etapa 2 (Racional)';
        else currentStage = 'Etapa 3 (Irracional)';
    }

    PFP = x !== 0 ? Q / x : 0;
    Ep = PFP !== 0 ? PMF / PFP : 0;

    analysisState.result = {
        Q: parseFloat(Q.toFixed(4)), // Parse float to remove trailing zeros if any
        PFP: parseFloat(PFP.toFixed(4)),
        PMF: parseFloat(PMF.toFixed(4)),
        Ep: parseFloat(Ep.toFixed(4)),
        maxPMF,
        diminishingStart: typeof diminishingStart === 'number' ? parseFloat(diminishingStart.toFixed(4)) : diminishingStart,
        stage1End: typeof stage1End === 'number' ? parseFloat(stage1End.toFixed(4)) : stage1End,
        stage2End: typeof stage2End === 'number' ? parseFloat(stage2End.toFixed(4)) : stage2End,
        currentStage
    };

    renderView();
    // Render Chart
    setTimeout(() => {
        if (typeof renderChart === 'function') {
            renderChart(chartLabels, dataQ, dataPFP, dataPMF);
        }
    }, 100);
};

function renderProductionAnalyzer() {
    return `
        <div style="max-width: 64rem; margin: 0 auto; padding-bottom: 4rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                <button onclick="viewCourse(1)" style="background: none; border: none; color: #a3a3a3; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                    Volver al Curso
                </button>
                <div style="font-size: 0.875rem; color: #a3a3a3;">Unidad 1 / Analizador de Funciones</div>
            </div>

            <!-- Header Card (ASCII Header Style) -->
            <div style="background: white; border: 1px solid #e5e5e5; border-radius: 1rem; overflow: hidden; margin-bottom: 2rem;">
                <div style="background: #fafafa; padding: 1rem; border-bottom: 1px solid #e5e5e5; display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">🌾</span>
                    <h2 style="font-size: 1.125rem; font-weight: 500;">Función de Producción Agropecuaria</h2>
                </div>
                
                <div class="analyzer-wrapper" style="padding: 2rem;">
                    <!-- 1. GRAPH SECTION (FULL WIDTH PROTAGONIST) -->
                    ${analysisState.result ? `
                    <div class="chart-container-large">
                        <canvas id="productionChart"></canvas>
                    </div>
                    ` : ''}

                    <!-- 2. CONTROL & METRICS GRID -->
                    <div class="analyzer-grid" style="border-top: ${analysisState.result ? '1px solid #e5e5e5' : 'none'}; padding-top: ${analysisState.result ? '2rem' : '0'};">
                        
                        <!-- LEFT COLUMN: INPUTS -->
                        <div>
                            <h3 style="font-size: 0.875rem; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; margin-bottom: 1rem;">1. Configuración</h3>
                            <div class="form-group">
                                <label>Tipo de cultivo/producción:</label>
                                <select id="cropType" class="form-select" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; margin-bottom: 1rem;">
                                    <option ${analysisState.crop === 'Maíz' ? 'selected' : ''}>Maíz</option>
                                    <option ${analysisState.crop === 'Trigo' ? 'selected' : ''}>Trigo</option>
                                    <option ${analysisState.crop === 'Ganado' ? 'selected' : ''}>Ganado</option>
                                    <option ${analysisState.crop === 'Leche' ? 'selected' : ''}>Leche</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Tipo de Función:</label>
                                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                                    <button onclick="setFunctionType('quadratic')" class="btn-tab ${analysisState.functionType === 'quadratic' ? 'active' : ''}" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; cursor: pointer; ${analysisState.functionType === 'quadratic' ? 'background: #171717; color: white;' : 'background: white;'}">Cuadrática</button>
                                    <button onclick="setFunctionType('cubic')" class="btn-tab ${analysisState.functionType === 'cubic' ? 'active' : ''}" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; cursor: pointer; ${analysisState.functionType === 'cubic' ? 'background: #171717; color: white;' : 'background: white;'}">Cúbica</button>
                                    <button onclick="setFunctionType('cobb-douglas')" class="btn-tab ${analysisState.functionType === 'cobb-douglas' ? 'active' : ''}" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; cursor: pointer; ${analysisState.functionType === 'cobb-douglas' ? 'background: #171717; color: white;' : 'background: white;'}">Cobb-Douglas</button>
                                </div>
                            </div>

                            <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 0.75rem; border: 1px dashed #d4d4d4;">
                                <label style="display: block; margin-bottom: 1rem; font-weight: 500;">Ingresa los coeficientes:</label>
                                ${renderFunctionInputs()}
                                <div class="form-group" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e5e5;">
                                    <label style="display: flex; justify-content: space-between;">
                                        <span>Nivel de Insumo (X)</span>
                                        <span style="color: #a3a3a3; font-size: 0.75rem;">(fertilizante, agua, etc.)</span>
                                    </label>
                                    <input type="number" id="inputX" value="${analysisState.x}" min="0" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                                </div>
                            </div>

                            <button onclick="calculateProduction()" class="btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <i data-lucide="refresh-ccw" style="width: 18px; height: 18px;"></i>
                                Analizar Función
                            </button>
                        </div>

                        <!-- RIGHT COLUMN: METRICS -->
                        <div style="border-left: 1px solid #e5e5e5; padding-left: 2rem;">
                            <h3 style="font-size: 0.875rem; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; margin-bottom: 1rem;">2. Métricas Clave</h3>
                            
                            ${analysisState.result ? `
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <!-- Q Total -->
                                    <div style="padding: 1rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; background: #fafafa;">
                                        <div style="font-size: 0.75rem; color: #737373; margin-bottom: 0.25rem;">PRODUCCIÓN (Q)</div>
                                        <div style="font-size: 1.5rem; font-weight: 600; color: #171717;">${analysisState.result.Q}</div>
                                    </div>

                                    <!-- PFP -->
                                    <div style="padding: 1rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; background: #fafafa;">
                                        <div style="font-size: 0.75rem; color: #737373; margin-bottom: 0.25rem;">PROMEDIO (PFP)</div>
                                        <div style="font-size: 1.5rem; font-weight: 600; color: #171717;">${analysisState.result.PFP}</div>
                                    </div>

                                    <!-- PMF -->
                                    <div style="padding: 1rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; background: #fafafa;">
                                        <div style="font-size: 0.75rem; color: #737373; margin-bottom: 0.25rem;">MARGINAL (PMF)</div>
                                        <div style="font-size: 1.5rem; font-weight: 600; color: #171717;">${analysisState.result.PMF}</div>
                                    </div>

                                    <!-- Elasticity -->
                                    <div style="padding: 1rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; background: #fafafa;">
                                        <div style="font-size: 0.75rem; color: #737373; margin-bottom: 0.25rem;">ELASTICIDAD (Ep)</div>
                                        <div style="font-size: 1.5rem; font-weight: 600; color: #171717;">${analysisState.result.Ep}</div>
                                    </div>

                                    <!-- Additional Stats Full Width -->
                                    <div style="grid-column: span 2; padding: 1rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; background: #fff;">
                                        
                                        <!-- Current Stage Indicator -->
                                        <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #f5f5f5;">
                                            <div style="font-size: 0.75rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Etapa Actual</div>
                                            <div style="font-size: 1.125rem; font-weight: 600; color: #171717;">${analysisState.result.currentStage}</div>
                                        </div>

                                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #525252; margin-bottom: 0.5rem;">
                                            <span>Fin Etapa 1 (Máx PFP)</span>
                                            <span style="font-family: monospace;">X=${analysisState.result.stage1End}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #525252; margin-bottom: 0.5rem;">
                                            <span>Fin Etapa 2 (PMF=0)</span>
                                            <span style="font-family: monospace;">X=${analysisState.result.stage2End}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #525252; margin-top: 1rem; padding-top: 0.5rem; border-top: 1px dashed #e5e5e5;">
                                            <span>Punto Máximo PMF</span>
                                            <span style="font-family: monospace;">X=${typeof analysisState.result.maxPMF.x === 'number' ? parseFloat(analysisState.result.maxPMF.x.toFixed(4)) : analysisState.result.maxPMF.x} | Val=${typeof analysisState.result.maxPMF.val === 'number' ? parseFloat(analysisState.result.maxPMF.val.toFixed(4)) : analysisState.result.maxPMF.val}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #525252; margin-top: 0.5rem;">
                                            <span>Inicio Rend. Decrecientes</span>
                                            <span style="font-family: monospace;">X=${analysisState.result.diminishingStart}</span>
                                        </div>
                                    </div>
                                </div>
                            ` : `
                                <div style="height: 100%; min-height: 200px; display: flex; align-items: center; justify-content: center; color: #a3a3a3; background: #fafafa; border-radius: 1rem; border: 1px dashed #d4d4d4;">
                                    <p>Esperando análisis...</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderFunctionInputs() {
    if (analysisState.functionType === 'quadratic') {
        return `
            <div style="font-family: monospace; margin-bottom: 1rem; color: #666; text-align: center;">Q = a + bX - cX²</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
                <input type="number" id="inputA" placeholder="a" value="${analysisState.params.a}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                <input type="number" id="inputB" placeholder="b" value="${analysisState.params.b}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                <input type="number" id="inputC" placeholder="c" value="${analysisState.params.c}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
            </div>
        `;
    } else if (analysisState.functionType === 'cubic') {
        return `
            <div style="font-family: monospace; margin-bottom: 1rem; color: #666; text-align: center;">Q = a + bX + cX² - dX³</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <input type="number" id="inputA" placeholder="a" value="${analysisState.params.a}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                <input type="number" id="inputB" placeholder="b" value="${analysisState.params.b}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                <input type="number" id="inputC" placeholder="c" value="${analysisState.params.c}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                <input type="number" id="inputD" placeholder="d" value="${analysisState.params.d}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
            </div>
        `;
    } else if (analysisState.functionType === 'cobb-douglas') {
        return `
            <div style="font-family: monospace; margin-bottom: 1rem; color: #666; text-align: center;" title="Q = A * X^β">Q = A · X <sup>β</sup></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div class="form-group">
                    <label style="font-size: 0.75rem;">A (Tecnología)</label>
                    <input type="number" id="inputAlpha" value="${analysisState.params.alpha}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; width: 100%;">
                </div>
                <div class="form-group">
                    <label style="font-size: 0.75rem;">β (Elasticidad)</label>
                    <input type="number" id="inputBeta" value="${analysisState.params.beta}" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; width: 100%;">
                </div>
            </div>
        `;
    }
}

// Cost Simulator Functions
window.calculateCosts = () => {
    const fixedCost = parseFloat(document.getElementById('fixedCost').value) || 0;
    const variableCostPerUnit = parseFloat(document.getElementById('variableCostPerUnit').value) || 0;
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const product = document.getElementById('productType').value;

    costState.fixedCost = fixedCost;
    costState.variableCostPerUnit = variableCostPerUnit;
    costState.quantity = quantity;
    costState.product = product;

    // Calcular costos
    const variableCost = variableCostPerUnit * quantity;
    const totalCost = fixedCost + variableCost;
    const averageCost = quantity > 0 ? totalCost / quantity : 0;
    const averageVariableCost = quantity > 0 ? variableCost / quantity : 0;
    const averageFixedCost = quantity > 0 ? fixedCost / quantity : 0;
    const marginalCost = variableCostPerUnit; // En modelo lineal, CMg = CVu

    // Datos para la gráfica
    const chartLabels = [];
    const dataCT = [];
    const dataCV = [];
    const dataCF = [];
    const dataCMe = [];
    const dataCMg = [];

    const maxQ = Math.max(quantity * 2, 50);
    const step = maxQ / 50;

    for (let q = 0; q <= maxQ; q += step) {
        const cv = variableCostPerUnit * q;
        const ct = fixedCost + cv;
        const cme = q > 0 ? ct / q : 0;
        const cmg = variableCostPerUnit;

        chartLabels.push(q.toFixed(1));
        dataCT.push(ct);
        dataCV.push(cv);
        dataCF.push(fixedCost);
        dataCMe.push(cme);
        dataCMg.push(cmg);
    }

    costState.result = {
        fixedCost: parseFloat(fixedCost.toFixed(2)),
        variableCost: parseFloat(variableCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        averageCost: parseFloat(averageCost.toFixed(2)),
        averageVariableCost: parseFloat(averageVariableCost.toFixed(2)),
        averageFixedCost: parseFloat(averageFixedCost.toFixed(2)),
        marginalCost: parseFloat(marginalCost.toFixed(2)),
        quantity
    };

    renderView();

    // Render Chart
    setTimeout(() => {
        if (typeof renderCostChart === 'function') {
            renderCostChart(chartLabels, dataCT, dataCV, dataCF, dataCMe, dataCMg);
        }
    }, 100);
};

function renderCostSimulator() {
    return `
        <div style="max-width: 64rem; margin: 0 auto; padding-bottom: 4rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                <button onclick="viewCourse(1)" style="background: none; border: none; color: #a3a3a3; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                    Volver al Curso
                </button>
                <div style="font-size: 0.875rem; color: #a3a3a3;">Unidad 2 / Simulador de Costos</div>
            </div>

            <!-- Header Card -->
            <div style="background: white; border: 1px solid #e5e5e5; border-radius: 1rem; overflow: hidden; margin-bottom: 2rem;">
                <div style="background: #fafafa; padding: 1rem; border-bottom: 1px solid #e5e5e5; display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">💰</span>
                    <h2 style="font-size: 1.125rem; font-weight: 500;">Análisis de Costos de Producción</h2>
                </div>
                
                <div class="analyzer-wrapper" style="padding: 2rem;">
                    <!-- GRAPH SECTION -->
                    ${costState.result ? `
                    <div class="chart-container-large">
                        <canvas id="costChart"></canvas>
                    </div>
                    ` : ''}

                    <!-- CONTROL & METRICS GRID -->
                    <div class="analyzer-grid" style="border-top: ${costState.result ? '1px solid #e5e5e5' : 'none'}; padding-top: ${costState.result ? '2rem' : '0'};">
                        
                        <!-- LEFT COLUMN: INPUTS -->
                        <div>
                            <h3 style="font-size: 0.875rem; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; margin-bottom: 1rem;">1. Configuración</h3>
                            
                            <div class="form-group">
                                <label>Tipo de producto:</label>
                                <select id="productType" class="form-select" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; margin-bottom: 1rem;">
                                    <option ${costState.product === 'Producto A' ? 'selected' : ''}>Producto A</option>
                                    <option ${costState.product === 'Producto B' ? 'selected' : ''}>Producto B</option>
                                    <option ${costState.product === 'Servicio' ? 'selected' : ''}>Servicio</option>
                                    <option ${costState.product === 'Manufactura' ? 'selected' : ''}>Manufactura</option>
                                </select>
                            </div>

                            <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 0.75rem; border: 1px dashed #d4d4d4;">
                                <label style="display: block; margin-bottom: 1rem; font-weight: 500;">Parámetros de Costos:</label>
                                
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label style="display: flex; justify-content: space-between;">
                                        <span>Costo Fijo (CF)</span>
                                        <span style="color: #a3a3a3; font-size: 0.75rem;">($)</span>
                                    </label>
                                    <input type="number" id="fixedCost" value="${costState.fixedCost}" min="0" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                                    <p style="color: #737373; font-size: 0.75rem; margin-top: 0.25rem;">No varía con la cantidad producida</p>
                                </div>

                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label style="display: flex; justify-content: space-between;">
                                        <span>Costo Variable Unitario (CVu)</span>
                                        <span style="color: #a3a3a3; font-size: 0.75rem;">($/unidad)</span>
                                    </label>
                                    <input type="number" id="variableCostPerUnit" value="${costState.variableCostPerUnit}" min="0" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                                    <p style="color: #737373; font-size: 0.75rem; margin-top: 0.25rem;">Costo por cada unidad adicional</p>
                                </div>

                                <div class="form-group" style="padding-top: 1rem; border-top: 1px solid #e5e5e5;">
                                    <label style="display: flex; justify-content: space-between;">
                                        <span>Cantidad a Producir (Q)</span>
                                        <span style="color: #a3a3a3; font-size: 0.75rem;">(unidades)</span>
                                    </label>
                                    <input type="number" id="quantity" value="${costState.quantity}" min="0" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                                </div>
                            </div>

                            <button onclick="calculateCosts()" class="btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <i data-lucide="calculator" style="width: 18px; height: 18px;"></i>
                                Calcular Costos
                            </button>
                        </div>

                        <!-- RIGHT COLUMN: METRICS -->
                        <div style="border-left: 1px solid #e5e5e5; padding-left: 2rem;">
                            <h3 style="font-size: 0.875rem; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; margin-bottom: 1rem;">2. Resultados</h3>
                            
                            ${costState.result ? `
                                <div style="display: grid; gap: 1rem;">
                                    <!-- Costos Totales -->
                                    <div style="background: #fafafa; padding: 1.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                                        <h4 style="font-size: 0.75rem; color: #737373; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Costos Totales</h4>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                            <div>
                                                <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">CF</div>
                                                <div style="font-size: 1.25rem; font-weight: 600; color: #dc2626;">$${costState.result.fixedCost}</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">CV</div>
                                                <div style="font-size: 1.25rem; font-weight: 600; color: #f59e0b;">$${costState.result.variableCost}</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">CT</div>
                                                <div style="font-size: 1.25rem; font-weight: 600; color: #171717;">$${costState.result.totalCost}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Costos Medios -->
                                    <div style="background: #fff; padding: 1.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                                        <h4 style="font-size: 0.75rem; color: #737373; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Costos Medios (por unidad)</h4>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                            <div>
                                                <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">CFMe</div>
                                                <div style="font-size: 1.25rem; font-weight: 600; color: #dc2626;">$${costState.result.averageFixedCost}</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">CVMe</div>
                                                <div style="font-size: 1.25rem; font-weight: 600; color: #f59e0b;">$${costState.result.averageVariableCost}</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">CMe</div>
                                                <div style="font-size: 1.25rem; font-weight: 600; color: #171717;">$${costState.result.averageCost}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Costo Marginal -->
                                    <div style="background: #f0fdf4; padding: 1.5rem; border: 2px solid #16a34a; border-radius: 0.5rem;">
                                        <h4 style="font-size: 0.75rem; color: #15803d; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Costo Marginal</h4>
                                        <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                                            <div style="font-size: 2rem; font-weight: 700; color: #16a34a;">$${costState.result.marginalCost}</div>
                                            <div style="font-size: 0.875rem; color: #15803d;">por unidad adicional</div>
                                        </div>
                                    </div>

                                    <!-- Resumen -->
                                    <div style="background: #fafafa; padding: 1rem; border-radius: 0.5rem; border: 1px dashed #d4d4d4;">
                                        <p style="font-size: 0.875rem; color: #525252; line-height: 1.6;">
                                            <strong>Análisis:</strong> Para producir <strong>${costState.result.quantity}</strong> unidades, el costo total es <strong>$${costState.result.totalCost}</strong> 
                                            (CF: $${costState.result.fixedCost} + CV: $${costState.result.variableCost}). 
                                            El costo promedio por unidad es <strong>$${costState.result.averageCost}</strong>.
                                        </p>
                                    </div>
                                </div>
                            ` : `
                                <div style="height: 100%; min-height: 300px; display: flex; align-items: center; justify-content: center; color: #a3a3a3; background: #fafafa; border-radius: 1rem; border: 1px dashed #d4d4d4;">
                                    <p>Configura los parámetros y presiona "Calcular Costos"</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.viewCourse = (courseId) => {
    selectedCourse = userData.courses.find(c => c.id === courseId);
    currentView = 'course';
    renderView();
};

window.closeTool = () => {
    currentTool = null;
    currentView = 'course';
    currentCourseTab = 'herramientas';
    renderView();
};

window.toggleTask = async (courseId, taskId) => {
    const course = userData.courses.find(c => c.id === courseId);
    const task = course.tasks.find(t => t.id === taskId);
    task.status = task.status === 'done' ? 'pending' : 'done';
    await saveUserData();
    renderView();
};

window.deleteTask = async (courseId, taskId) => {
    const course = userData.courses.find(c => c.id === courseId);
    course.tasks = course.tasks.filter(t => t.id !== taskId);
    await saveUserData();
    renderView();
};

window.openAddTaskModal = () => {
    document.getElementById('modals').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <h3>Agregar Tarea</h3>
                <form onsubmit="addTask(event)">
                    <div class="form-group">
                        <label>Materia</label>
                        <select id="taskCourse" required>
                            ${userData.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" id="taskTitle" required>
                    </div>
                    <div class="form-group">
                        <label>Fecha de Entrega</label>
                        <input type="text" id="taskDue" placeholder="Ej: Mañana, Lunes, 25 Oct" required>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" onclick="closeModal()" class="btn-secondary">Cancelar</button>
                        <button type="submit" class="btn-primary">Agregar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
};

window.addTask = async (event) => {
    event.preventDefault();
    const courseId = parseInt(document.getElementById('taskCourse').value);
    const title = document.getElementById('taskTitle').value;
    const due = document.getElementById('taskDue').value;

    const course = userData.courses.find(c => c.id === courseId);
    course.tasks.push({
        id: Date.now(),
        title,
        due,
        status: 'pending'
    });

    await saveUserData();
    closeModal();
    renderView();
};

window.openEditCourseModal = (courseId) => {
    const course = userData.courses.find(c => c.id === courseId);

    document.getElementById('modals').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <h3>Editar ${course.name}</h3>
                <form>
                    <div class="form-group">
                        <label>Profesor</label>
                        <input type="text" id="courseProfessor" value="${course.professor}" onchange="saveCourseContacts(${courseId})" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;" required>
                    </div>
                    <div class="form-group">
                        <label>Correo Profesor</label>
                        <input type="email" id="courseProfessorEmailModal" value="${course.professorEmail || ''}" onchange="saveCourseContacts(${courseId})" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                    </div>
                    <div class="form-group">
                        <label>Teléfono Profesor</label>
                        <input type="text" id="courseProfessorPhoneModal" value="${course.professorPhone || ''}" onchange="saveCourseContacts(${courseId})" class="form-input" style="padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                    </div>
                    <div style="margin-top:0.75rem; font-size:0.9rem; color:#6b6b6b;">Los cambios se guardan automáticamente al editar.</div>
                </form>
            </div>
        </div>
    `;
};

window.updateCourse = async (event, courseId) => {
    event.preventDefault();
    const course = userData.courses.find(c => c.id === courseId);
    course.professor = document.getElementById('courseProfessor').value;
    course.professorEmail = document.getElementById('courseProfessorEmailModal').value;
    course.professorPhone = document.getElementById('courseProfessorPhoneModal').value;

    await saveUserData();
    closeModal();
    renderView();
};

window.saveCourseName = async (courseId) => {
    const input = document.getElementById('courseNameInput');
    if (!input) return;
    const course = userData.courses.find(c => c.id === courseId);
    course.name = input.value.trim() || course.name;
    await saveUserData();
    renderView();
};

window.saveCourseContacts = async (courseId) => {
    const course = userData.courses.find(c => c.id === courseId);
    const prof = document.getElementById('courseProfessorInput') || document.getElementById('courseProfessor');
    const email = document.getElementById('courseProfessorEmail');
    const phone = document.getElementById('courseProfessorPhone');
    if (prof) course.professor = prof.value;
    if (email) course.professorEmail = email.value;
    if (phone) course.professorPhone = phone.value;
    await saveUserData();
    renderView();
};

// NOTE: uploadResource is defined earlier in the file (line ~237) and uses the static HTML file input

function showToast(message, success = true, duration = 3000) {
    const id = 'toast-' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.textContent = message;
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '20px';
    el.style.padding = '0.75rem 1rem';
    el.style.background = success ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)';
    el.style.color = 'white';
    el.style.borderRadius = '0.5rem';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    el.style.zIndex = 9999;
    el.style.fontSize = '0.9rem';
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

window.closeModal = (event) => {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('modals').innerHTML = '';
    }
};

lucide.createIcons();

// Chart Instance
// Chart Instance
let productionChart = null;

window.renderChart = (labels, dataQ, dataPFP, dataPMF) => {
    const ctx = document.getElementById('productionChart');
    if (!ctx) return;

    if (productionChart) {
        productionChart.destroy();
    }

    productionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Producción Total (Q)',
                    data: dataQ,
                    borderColor: '#2563eb', // Blue
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Producto Promedio (PFP)',
                    data: dataPFP,
                    borderColor: '#16a34a', // Green
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Producto Marginal (PMF)',
                    data: dataPMF,
                    borderColor: '#dc2626', // Red
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    title: { display: true, text: 'Insumo Variable (X)' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Producción (Q)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'PFP / PMF' }, // Separate axis for marginal/average values usually smaller
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Chart Instance for Cost Simulator
let costChart = null;

window.renderCostChart = (labels, dataCT, dataCV, dataCF, dataCMe, dataCMg) => {
    const ctx = document.getElementById('costChart');
    if (!ctx) return;

    if (costChart) {
        costChart.destroy();
    }

    costChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Costo Total (CT)',
                    data: dataCT,
                    borderColor: '#171717', // Black
                    backgroundColor: 'rgba(23, 23, 23, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Costo Variable (CV)',
                    data: dataCV,
                    borderColor: '#f59e0b', // Orange
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Costo Fijo (CF)',
                    data: dataCF,
                    borderColor: '#dc2626', // Red
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0,
                    yAxisID: 'y'
                },
                {
                    label: 'Costo Medio (CMe)',
                    data: dataCMe,
                    borderColor: '#2563eb', // Blue
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Costo Marginal (CMg)',
                    data: dataCMg,
                    borderColor: '#16a34a', // Green
                    borderWidth: 2,
                    borderDash: [3, 3],
                    tension: 0,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    title: { display: true, text: 'Cantidad (Q)' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Costos Totales ($)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Costos Medios/Marginales ($/unidad)' },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                }
            }
        }
    });
}

// ============================================
// SET THEORY CALCULATOR
// ============================================

// Helper function to parse set input
window.parseSetInput = (input) => {
    if (!input || input.trim() === '') return [];

    // Remove braces if present
    input = input.replace(/[{}]/g, '');

    // Split by comma and parse
    const elements = input.split(',').map(item => {
        item = item.trim();
        // Try to parse as number
        const num = parseFloat(item);
        return isNaN(num) ? item : num;
    }).filter(item => item !== '');

    // Remove duplicates and sort
    return [...new Set(elements)].sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
    });
};

// Set operations
window.setIntersection = (setA, setB) => {
    return setA.filter(x => setB.includes(x));
};

window.setUnion = (setA, setB) => {
    return [...new Set([...setA, ...setB])].sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
    });
};

window.setDifference = (setA, setB) => {
    return setA.filter(x => !setB.includes(x));
};

window.setComplement = (setA, universal) => {
    return universal.filter(x => !setA.includes(x));
};

// Format set for display
window.formatSet = (set) => {
    if (!set || set.length === 0) return '∅';
    return '{' + set.join(', ') + '}';
};

// Calculate set operation
window.calculateSetOperation = () => {
    // Parse inputs
    const inputA = document.getElementById('setAInput').value;
    const inputB = document.getElementById('setBInput').value;
    const inputC = document.getElementById('setCInput').value;
    const inputD = document.getElementById('setDInput').value;
    const inputU = document.getElementById('setUInput').value;
    const operation = document.getElementById('operationSelect').value;

    setTheoryState.setA = parseSetInput(inputA);
    setTheoryState.setB = parseSetInput(inputB);
    setTheoryState.setC = parseSetInput(inputC);
    setTheoryState.setD = parseSetInput(inputD);
    setTheoryState.universal = parseSetInput(inputU);
    setTheoryState.operation = operation;

    const A = setTheoryState.setA;
    const B = setTheoryState.setB;
    const C = setTheoryState.setC;
    const D = setTheoryState.setD;
    const U = setTheoryState.universal;

    let result = [];
    let explanation = '';

    // Perform operation based on selection
    switch (operation) {
        case 'A∩B':
            result = setIntersection(A, B);
            explanation = 'Elementos que están en A Y en B';
            break;
        case 'A∪B':
            result = setUnion(A, B);
            explanation = 'Elementos que están en A O en B (o en ambos)';
            break;
        case 'A-B':
            result = setDifference(A, B);
            explanation = 'Elementos que están en A pero NO en B';
            break;
        case 'B-A':
            result = setDifference(B, A);
            explanation = 'Elementos que están en B pero NO en A';
            break;
        case 'A\'':
            result = setComplement(A, U);
            explanation = 'Complemento de A (elementos del universo que NO están en A)';
            break;
        case 'C∩A':
            result = setIntersection(C, A);
            explanation = 'Elementos que están en C Y en A';
            break;
        case 'C∪D':
            result = setUnion(C, D);
            explanation = 'Elementos que están en C O en D';
            break;
        case 'C-A':
            result = setDifference(C, A);
            explanation = 'Elementos que están en C pero NO en A';
            break;
        case '(A∩B)-(A∩D)':
            const AB = setIntersection(A, B);
            const AD = setIntersection(A, D);
            result = setDifference(AB, AD);
            explanation = 'Elementos en (A∩B) que NO están en (A∩D)';
            break;
        case '(B∩D)\'∩C':
            const BD = setIntersection(B, D);
            const BDcomp = setComplement(BD, U);
            result = setIntersection(BDcomp, C);
            explanation = 'Elementos del complemento de (B∩D) que están en C';
            break;
        case '(A-B)\'∩C':
            const AmB = setDifference(A, B);
            const AmBcomp = setComplement(AmB, U);
            result = setIntersection(AmBcomp, C);
            explanation = 'Elementos del complemento de (A-B) que están en C';
            break;
        case '(C-A)∩D':
            const CmA = setDifference(C, A);
            result = setIntersection(CmA, D);
            explanation = 'Elementos en (C-A) que también están en D';
            break;
        case '(A∩D)-C':
            const ADint = setIntersection(A, D);
            result = setDifference(ADint, C);
            explanation = 'Elementos en (A∩D) que NO están en C';
            break;
        case '(A∩B)\'-(C∩D)\'':
            const ABint = setIntersection(A, B);
            const ABcomp = setComplement(ABint, U);
            const CDint = setIntersection(C, D);
            const CDcomp = setComplement(CDint, U);
            result = setDifference(ABcomp, CDcomp);
            explanation = 'Complemento de (A∩B) menos el complemento de (C∩D)';
            break;
        default:
            result = [];
            explanation = 'Selecciona una operación';
    }

    setTheoryState.result = {
        set: result,
        formatted: formatSet(result),
        explanation: explanation,
        cardinality: result.length
    };

    renderView();
};

function renderSetTheoryCalculator() {
    return `
        <div style="max-width: 64rem; margin: 0 auto; padding-bottom: 4rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                <button onclick="viewCourse(5)" style="background: none; border: none; color: #a3a3a3; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                    Volver al Curso
                </button>
                <div style="font-size: 0.875rem; color: #a3a3a3;">Teoría Matemática / Teoría de Conjuntos</div>
            </div>

            <!-- Header Card -->
            <div style="background: white; border: 1px solid #e5e5e5; border-radius: 1rem; overflow: hidden; margin-bottom: 2rem;">
                <div style="background: #fafafa; padding: 1rem; border-bottom: 1px solid #e5e5e5; display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">⊕</span>
                    <h2 style="font-size: 1.125rem; font-weight: 500;">Calculadora de Teoría de Conjuntos</h2>
                </div>
                
                <div style="padding: 2rem;">
                    <!-- Set Definitions -->
                    <h3 style="font-size: 0.875rem; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; margin-bottom: 1rem;">1. Define los Conjuntos</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Conjunto A</label>
                            <input type="text" id="setAInput" placeholder="2,3,5,7,11,13,17" value="${setTheoryState.setA.join(',')}" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; font-family: monospace;">
                            <div style="font-size: 0.75rem; color: #a3a3a3; margin-top: 0.25rem;">Ejemplo: 1,2,3,4,5</div>
                        </div>
                        
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Conjunto B</label>
                            <input type="text" id="setBInput" placeholder="5,6,7,8,9,10" value="${setTheoryState.setB.join(',')}" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; font-family: monospace;">
                        </div>
                        
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Conjunto C</label>
                            <input type="text" id="setCInput" placeholder="0,1,2,3,4,5,6,7,8,9" value="${setTheoryState.setC.join(',')}" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; font-family: monospace;">
                        </div>
                        
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Conjunto D</label>
                            <input type="text" id="setDInput" placeholder="-6,-4,-2,0,2,4,6,8,10,12" value="${setTheoryState.setD.join(',')}" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; font-family: monospace;">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Conjunto Universal (U) <span style="color: #a3a3a3; font-weight: 400;">(opcional, para complementos)</span></label>
                        <input type="text" id="setUInput" placeholder="Todos los elementos posibles" value="${setTheoryState.universal.join(',')}" class="form-input" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; font-family: monospace;">
                    </div>
                    
                    <!-- Operation Selection -->
                    <h3 style="font-size: 0.875rem; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; margin-bottom: 1rem;">2. Selecciona la Operación</h3>
                    
                    <div style="margin-bottom: 2rem;">
                        <select id="operationSelect" class="form-select" style="width: 100%; padding: 0.75rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; font-size: 1rem;">
                            <optgroup label="Operaciones Básicas">
                                <option value="A∩B" ${setTheoryState.operation === 'A∩B' ? 'selected' : ''}>A ∩ B (Intersección)</option>
                                <option value="A∪B" ${setTheoryState.operation === 'A∪B' ? 'selected' : ''}>A ∪ B (Unión)</option>
                                <option value="A-B" ${setTheoryState.operation === 'A-B' ? 'selected' : ''}>A - B (Diferencia)</option>
                                <option value="B-A" ${setTheoryState.operation === 'B-A' ? 'selected' : ''}>B - A (Diferencia)</option>
                                <option value="A'" ${setTheoryState.operation === "A'" ? 'selected' : ''}>A' (Complemento de A)</option>
                            </optgroup>
                            <optgroup label="Otras Combinaciones">
                                <option value="C∩A" ${setTheoryState.operation === 'C∩A' ? 'selected' : ''}>C ∩ A</option>
                                <option value="C∪D" ${setTheoryState.operation === 'C∪D' ? 'selected' : ''}>C ∪ D</option>
                                <option value="C-A" ${setTheoryState.operation === 'C-A' ? 'selected' : ''}>C - A</option>
                            </optgroup>
                            <optgroup label="Operaciones Compuestas">
                                <option value="(A∩B)-(A∩D)" ${setTheoryState.operation === '(A∩B)-(A∩D)' ? 'selected' : ''}>(A ∩ B) - (A ∩ D)</option>
                                <option value="(B∩D)'∩C" ${setTheoryState.operation === "(B∩D)'∩C" ? 'selected' : ''}>(B ∩ D)' ∩ C</option>
                                <option value="(A-B)'∩C" ${setTheoryState.operation === "(A-B)'∩C" ? 'selected' : ''}>(A - B)' ∩ C</option>
                                <option value="(C-A)∩D" ${setTheoryState.operation === '(C-A)∩D' ? 'selected' : ''}>(C - A) ∩ D</option>
                                <option value="(A∩D)-C" ${setTheoryState.operation === '(A∩D)-C' ? 'selected' : ''}>(A ∩ D) - C</option>
                                <option value="(A∩B)'-(C∩D)'" ${setTheoryState.operation === "(A∩B)'-(C∩D)'" ? 'selected' : ''}>(A ∩ B)' - (C ∩ D)'</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <button onclick="calculateSetOperation()" class="btn-primary" style="width: 100%; padding: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <i data-lucide="play" style="width: 18px; height: 18px;"></i>
                        Calcular
                    </button>
                    
                    <!-- Results -->
                    ${setTheoryState.result ? `
                        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e5e5;">
                            <h3 style="font-size: 0.875rem; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; margin-bottom: 1rem;">3. Resultado</h3>
                            
                            <div style="background: #fafafa; padding: 2rem; border-radius: 0.75rem; border: 2px solid #171717;">
                                <div style="font-size: 0.875rem; color: #737373; margin-bottom: 0.5rem;">Operación: ${setTheoryState.operation}</div>
                                <div style="font-size: 2rem; font-weight: 300; font-family: monospace; margin-bottom: 1rem; color: #171717;">${setTheoryState.result.formatted}</div>
                                <div style="font-size: 0.875rem; color: #525252; margin-bottom: 0.5rem;">${setTheoryState.result.explanation}</div>
                                <div style="font-size: 0.75rem; color: #a3a3a3;">Cardinalidad: ${setTheoryState.result.cardinality} elemento(s)</div>
                            </div>
                            
                            <!-- Current Sets Display -->
                            <div style="margin-top: 1.5rem; padding: 1.5rem; background: white; border: 1px solid #e5e5e5; border-radius: 0.75rem;">
                                <h4 style="font-size: 0.875rem; font-weight: 500; margin-bottom: 1rem;">Conjuntos Actuales:</h4>
                                <div style="display: grid; gap: 0.5rem; font-family: monospace; font-size: 0.875rem;">
                                    ${setTheoryState.setA.length > 0 ? `<div><span style="font-weight: 600;">A =</span> ${formatSet(setTheoryState.setA)}</div>` : ''}
                                    ${setTheoryState.setB.length > 0 ? `<div><span style="font-weight: 600;">B =</span> ${formatSet(setTheoryState.setB)}</div>` : ''}
                                    ${setTheoryState.setC.length > 0 ? `<div><span style="font-weight: 600;">C =</span> ${formatSet(setTheoryState.setC)}</div>` : ''}
                                    ${setTheoryState.setD.length > 0 ? `<div><span style="font-weight: 600;">D =</span> ${formatSet(setTheoryState.setD)}</div>` : ''}
                                    ${setTheoryState.universal.length > 0 ? `<div><span style="font-weight: 600;">U =</span> ${formatSet(setTheoryState.universal)}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div style="margin-top: 2rem; padding: 3rem; text-align: center; background: #fafafa; border-radius: 0.75rem; border: 1px dashed #d4d4d4;">
                            <i data-lucide="info" style="width: 48px; height: 48px; color: #d4d4d4; margin-bottom: 1rem;"></i>
                            <p style="color: #a3a3a3;">Define los conjuntos y selecciona una operación para ver el resultado.</p>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Quick Examples -->
            <div style="background: white; border: 1px solid #e5e5e5; border-radius: 1rem; padding: 1.5rem;">
                <h3 style="font-size: 1rem; font-weight: 500; margin-bottom: 1rem;">💡 Ejemplos Rápidos</h3>
                <div style="display: grid; gap: 0.75rem; font-size: 0.875rem;">
                    <div style="padding: 0.75rem; background: #fafafa; border-radius: 0.5rem;">
                        <strong>Ejercicio 1:</strong> A = {2,3,5,7,11,13,17}, B = {5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30}
                        <br><span style="color: #737373;">Calcula A ∩ B → Resultado: {5,7,11,13,17}</span>
                    </div>
                    <div style="padding: 0.75rem; background: #fafafa; border-radius: 0.5rem;">
                        <strong>Ejercicio 2:</strong> C = {0,1,2,3,4,5,6,7,8,9}, A = {2,3,5,7,11,13,17}
                        <br><span style="color: #737373;">Calcula C - A → Resultado: {0,1,4,6,8,9}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Nota: renderLivestockPrices y loadLivestockPrices están definidos en livestock_dashboard.js

