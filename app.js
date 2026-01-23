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
            tasks: [
                { id: 101, title: "Análisis de Costos", due: "Mañana", status: "pending" },
                { id: 102, title: "Lectura Cap. 4", due: "Viernes", status: "done" }
            ]
        },
        {
            id: 2,
            name: "Economía Internacional",
            icon: "🌍",
            progress: 45,
            grade: 9.0,
            professor: "Dra. Jiménez",
            description: "Comercio internacional, balanza de pagos y tipos de cambio.",
            tasks: [
                { id: 201, title: "Ensayo sobre Aranceles", due: "25 Oct", status: "pending" }
            ]
        },
        {
            id: 3,
            name: "Macroeconomía III",
            icon: "📊",
            progress: 60,
            grade: 7.8,
            professor: "Mtro. Castillo",
            description: "Modelos macroeconómicos dinámicos y política monetaria.",
            tasks: [
                { id: 301, title: "Modelo IS-LM Avanzado", due: "Hoy", status: "urgent" },
                { id: 302, title: "Quiz Sorpresa", due: "Ayer", status: "done" }
            ]
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
            tasks: [
                { id: 501, title: "Problelario #3", due: "Lunes", status: "pending" }
            ]
        },
        {
            id: 6,
            name: "Econometría I",
            icon: "🔬",
            progress: 50,
            grade: 8.2,
            professor: "Dr. Gauss",
            description: "Modelos de regresión lineal y series de tiempo.",
            tasks: [
                { id: 601, title: "Regresión Lineal Simple", due: "Jueves", status: "pending" },
                { id: 602, title: "Instalar STATA/R", due: "Pasado", status: "done" }
            ]
        },
        {
            id: 7,
            name: "Práctica Profesional",
            icon: "💼",
            progress: 20,
            grade: 10.0,
            professor: "Coord. Laboral",
            description: "Prácticas laborales supervisadas.",
            tasks: [
                { id: 701, title: "Reporte Mensual", due: "30 Oct", status: "pending" }
            ]
        }
    ]
};

let currentUser = null;
let userData = null;
let currentView = 'dashboard';
let selectedCourse = null;

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

function renderCourseDetail() {
    if (!selectedCourse) return '';

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
            
            <div style="background: white; border: 1px solid #e5e5e5; padding: 2rem; border-radius: 1rem;">
                <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 1rem;">Detalles</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="padding: 1rem; background: #fafafa; border-radius: 0.5rem;">
                        <div style="font-size: 0.625rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Calificación</div>
                        <div style="font-size: 1.5rem; font-weight: 300;">${selectedCourse.grade}</div>
                    </div>
                    <div style="padding: 1rem; background: #fafafa; border-radius: 0.5rem;">
                        <div style="font-size: 0.625rem; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Asistencia</div>
                        <div style="font-size: 1.5rem; font-weight: 300;">92%</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// CRUD Operations
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
