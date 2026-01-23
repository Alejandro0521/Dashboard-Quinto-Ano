// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
            icon: "💼",
            progress: 20,
            grade: 10.0,
            professor: "Coord. Laboral",
            description: "Prácticas laborales supervisadas.",
            tasks: []
        }
    ]
};

let currentUser = null;
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

// Login Functions
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
        userData = docSnap.data().data;
    } else {
        userData = INITIAL_DATA;
        await saveUserData();
    }
}

async function saveUserData() {
    await updateDoc(doc(db, 'users', currentUser.uid), {
        data: userData
    });
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

function renderDashboard() {
    const pendingTasks = userData.courses.flatMap(c =>
        c.tasks.filter(t => t.status !== 'done').map(t => ({ ...t, courseName: c.name, courseIcon: c.icon }))
    ).slice(0, 3);

    const avgGrade = (userData.courses.reduce((sum, c) => sum + c.grade, 0) / userData.courses.length).toFixed(1);

    return `
        <h1 style="font-size: 2rem; font-weight: 300; margin-bottom: 2rem;">Hola, Estudiante.</h1>
        
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
                        <div style="padding: 0.25rem 0.5rem; background: ${t.status === 'urgent' ? '#ef4444' : 'rgba(0,0,0,0.3)'}; border-radius: 0.25rem; font-size: 0.625rem; font-weight: bold;">
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
                        <div class="course-grade">${course.grade}</div>
                    </div>
                    <h3 class="course-name">${course.name}</h3>
                    <p class="course-professor">${course.professor}</p>
                    <div class="course-progress">
                        <div class="course-progress-bar" style="width: ${course.progress}%"></div>
                    </div>
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
    const avgProgress = Math.round(userData.courses.reduce((sum, c) => sum + c.progress, 0) / userData.courses.length);

    return `
        <h1 style="font-size: 2rem; font-weight: 300; margin-bottom: 2rem;">Estadísticas</h1>
        
        <div class="stats-grid">
            <div class="stat-card primary">
                <div class="stat-label">Promedio General</div>
                <div class="stat-value">${avgGrade}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Progreso Promedio</div>
                <div class="stat-value">${avgProgress}%</div>
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
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">Calificación</div>
                        <div style="font-size: 1.5rem; font-weight: 300;">${course.grade}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #a3a3a3; margin-bottom: 0.25rem;">Progreso</div>
                        <div style="font-size: 1.5rem; font-weight: 300;">${course.progress}%</div>
                    </div>
                </div>
                <div class="course-progress" style="height: 0.5rem;">
                    <div class="course-progress-bar" style="width: ${course.progress}%"></div>
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
                <h1 style="font-size: 2rem; font-weight: 300; margin-bottom: 0.5rem;">${selectedCourse.name}</h1>
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
                        <div style="font-size: 1.125rem; font-weight: 500;">${selectedCourse.professor}</div>
                    </div>
                    <div style="padding: 1rem; background: #fafafa; border-radius: 0.5rem;">
                        <div style="font-size: 0.625rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Calificación Actual</div>
                        <div style="font-size: 1.5rem; font-weight: 300;">${selectedCourse.grade}</div>
                    </div>
                    <div style="padding: 1rem; background: #fafafa; border-radius: 0.5rem;">
                        <div style="font-size: 0.625rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Progreso</div>
                        <div style="font-size: 1.5rem; font-weight: 300;">${selectedCourse.progress}%</div>
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
        return `
            <div style="text-align: center; padding: 4rem 2rem; background: white; border: 1px dashed #e5e5e5; border-radius: 1rem;">
                <i data-lucide="folder-open" style="width: 48px; height: 48px; color: #d4d4d4; margin-bottom: 1rem;"></i>
                <h3 style="font-weight: 500; margin-bottom: 0.5rem;">Sin Recursos</h3>
                <p style="color: #a3a3a3; font-size: 0.875rem;">Aún no se han cargado documentos o enlaces para esta materia.</p>
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
                
                <div style="background: white; border: 1px solid #e5e5e5; padding: 1.5rem; border-radius: 1rem; opacity: 0.6;">
                    <div style="width: 3rem; height: 3rem; background: #f5f5f5; color: #a3a3a3; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                        <i data-lucide="lock" style="width: 24px; height: 24px;"></i>
                    </div>
                    <h3 style="font-weight: 500; margin-bottom: 0.5rem;">Simulador de Costos</h3>
                    <p style="color: #a3a3a3; font-size: 0.875rem; margin-bottom: 1rem;">Próximamente disponible en el segundo parcial.</p>
                </div>
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
                
                <div style="padding: 2rem;">
                    <!-- 1. GRAPH SECTION (FULL WIDTH PROTAGONIST) -->
                    ${analysisState.result ? `
                    <div style="margin-bottom: 2rem; padding: 1rem; background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; height: 450px; position: relative;">
                        <canvas id="productionChart"></canvas>
                    </div>
                    ` : ''}

                    <!-- 2. CONTROL & METRICS GRID -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; border-top: ${analysisState.result ? '1px solid #e5e5e5' : 'none'}; padding-top: ${analysisState.result ? '2rem' : '0'};">
                        
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
                                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
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
                                    <div style="grid-column: span 2; padding: 1rem; border: 1px solid #e5e5e5; border-radius: 0.5rem;">
                                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #525252; margin-bottom: 0.5rem; border-bottom: 1px solid #f5f5f5; padding-bottom: 0.5rem;">
                                            <span>Max PMF</span>
                                            <span style="font-family: monospace;">X=${typeof analysisState.result.maxPMF.x === 'number' ? analysisState.result.maxPMF.x.toFixed(2) : analysisState.result.maxPMF.x} | Val=${typeof analysisState.result.maxPMF.val === 'number' ? analysisState.result.maxPMF.val.toFixed(2) : analysisState.result.maxPMF.val}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #525252;">
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
window.viewCourse = (courseId) => {
    selectedCourse = userData.courses.find(c => c.id === courseId);
    currentView = 'course';
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
                <form onsubmit="updateCourse(event, ${courseId})">
                    <div class="form-group">
                        <label>Calificación (0-10)</label>
                        <input type="number" step="0.1" min="0" max="10" id="courseGrade" value="${course.grade}" required>
                    </div>
                    <div class="form-group">
                        <label>Progreso (%)</label>
                        <input type="number" min="0" max="100" id="courseProgress" value="${course.progress}" required>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" onclick="closeModal()" class="btn-secondary">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
};

window.updateCourse = async (event, courseId) => {
    event.preventDefault();
    const course = userData.courses.find(c => c.id === courseId);
    course.grade = parseFloat(document.getElementById('courseGrade').value);
    course.progress = parseInt(document.getElementById('courseProgress').value);

    await saveUserData();
    closeModal();
    renderView();
};

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
