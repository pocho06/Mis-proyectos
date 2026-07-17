const STORAGE_KEY = "trackfit-state-v1";
const AUTH_KEY = "trackfit-session-v1";
const API_ROOT = "/api";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ROUTINE_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const ACTIVITY_LEVELS = ["Sedentario", "Ligero", "Moderado", "Activo", "Muy activo"];
const INTENSITIES = ["Baja", "Media", "Alta"];
const ACTIVITY_TYPES = [
  "Caminata",
  "Correr",
  "Bicicleta",
  "Pádel",
  "Gimnasio",
  "Fuerza en casa",
  "Saltar cuerda",
  "Actividad personalizada",
];

const VIEW_DEFINITIONS = [
  { id: "dashboard", label: "Dashboard", icon: "layout" },
  { id: "peso", label: "Peso", icon: "scale" },
  { id: "ejercicio", label: "Ejercicio", icon: "activity" },
  { id: "rutinas", label: "Rutinas", icon: "calendar" },
  { id: "calorias", label: "Calorías", icon: "flame" },
  { id: "habitos", label: "Hábitos", icon: "checkCircle" },
  { id: "metas", label: "Metas", icon: "target" },
  { id: "estadisticas", label: "Estadísticas", icon: "chart" },
  { id: "logros", label: "Logros", icon: "award" },
  { id: "perfil", label: "Perfil", icon: "user" },
];

const ICONS = {
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
  award: '<circle cx="12" cy="8" r="6"></circle><path d="M15.5 13.2 17 22l-5-3-5 3 1.5-8.8"></path>',
  calendar: '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path>',
  chart: '<path d="M3 3v18h18"></path><path d="m7 15 4-4 3 3 5-7"></path>',
  checkCircle: '<path d="M9 12l2 2 4-4"></path><circle cx="12" cy="12" r="9"></circle>',
  flame: '<path d="M8.5 14.5A4.5 4.5 0 0 0 12 22a4.5 4.5 0 0 0 3.5-7.5c-1.1-1.5-.7-3.3.2-4.6A8.3 8.3 0 0 1 12 2c.2 3.4-2.2 4.7-3.7 6.7-1.6 2.2-1.5 4.1.2 5.8Z"></path>',
  layout: '<rect x="3" y="3" width="7" height="8" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="15" width="7" height="6" rx="1"></rect>',
  left: '<path d="m15 18-6-6 6-6"></path>',
  plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"></path><path d="M20 4v6h-6"></path>',
  right: '<path d="m9 18 6-6-6-6"></path>',
  scale: '<path d="M7 20h10"></path><path d="M6 6h12"></path><path d="M12 6v14"></path><path d="m6 6-3 7h6L6 6Z"></path><path d="m18 6-3 7h6l-3-7Z"></path>',
  target: '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle>',
  trash: '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>',
  user: '<path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="7" r="4"></circle>',
};

const COLLECTION_BY_TYPE = {
  weight: "weights",
  exercise: "exercises",
  routine: "routine",
  calorie: "calories",
  habit: "habits",
  goal: "goals",
};

const API_RESOURCE_BY_TYPE = {
  weight: "weights",
  exercise: "exercises",
  routine: "routine",
  calorie: "calories",
  habit: "habits",
  goal: "goals",
};

const ACTIVITY_CALORIE_MULTIPLIER = {
  Baja: 4.5,
  Media: 7,
  Alta: 10,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

let session = loadSession();
let state = createEmptyState();
let activeView = "dashboard";
let habitMonth = new Date();
let importInput = null;
let usingServer = Boolean(session?.token);
let authMode = "login";

function icon(name) {
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function dateKey(date) {
  const local = stripTime(date);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (value instanceof Date) return stripTime(value);
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(start, end) {
  return Math.round((stripTime(end) - stripTime(start)) / 86400000);
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(parseDate(value));
}

function formatShortDay(value) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(parseDate(value));
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function average(values) {
  const cleanValues = values.filter(Number.isFinite);
  return cleanValues.length ? cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(16).slice(2);
}

function sameId(first, second) {
  return String(first) === String(second);
}

function options(values, selectedValue = "") {
  return values.map((value) => `<option ${value === selectedValue ? "selected" : ""}>${value}</option>`).join("");
}

async function initializeApp() {
  try {
    renderNavigation();
    setupTopbar();
    document.addEventListener("click", handleClick);
    $("#content").addEventListener("submit", handleSubmit);

    if (session?.token) {
      await loadServerState({ silent: true });
    } else {
      render();
    }
  } catch (error) {
    clearSession();
    render();
    showToast("No se pudo iniciar la app.");
  }
}

function renderNavigation() {
  $("#nav").innerHTML = VIEW_DEFINITIONS.map(
    (view) => `
      <button data-view="${view.id}" class="${view.id === activeView ? "active" : ""}" type="button">
        ${icon(view.icon)}${view.label}
      </button>
    `,
  ).join("");
}

function setupTopbar() {
  $("#reset").innerHTML = icon("refresh");
  $("#reset").title = "Recargar datos";
  $("#quick").innerHTML = `${icon("plus")}Registrar peso`;
  $(".actions").insertAdjacentHTML(
    "beforeend",
    `<button class="ghost top-tool" data-export="json" type="button">Exportar</button>
     <button class="ghost top-tool" data-logout="true" type="button">Salir</button>`,
  );

  importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json";
  importInput.hidden = true;
  importInput.addEventListener("change", importData);
  document.body.appendChild(importInput);
}

function showView(viewId) {
  activeView = viewId;
  const view = VIEW_DEFINITIONS.find((item) => item.id === viewId);
  $("#title").textContent = viewId === "dashboard" ? "Dashboard principal" : view?.label || "TrackFit";
  $$('[data-view]').forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  const authenticated = Boolean(session?.token);
  document.body.classList.toggle("auth-mode", !authenticated);
  document.body.classList.toggle("app-mode", authenticated);

  if (!authenticated) {
    $("#content").innerHTML = viewAuth();
    return;
  }

  $("#today").textContent = capitalize(
    new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date()),
  );

  const views = {
    dashboard: viewDashboard,
    peso: viewWeight,
    ejercicio: viewExercise,
    rutinas: viewRoutine,
    calorias: viewCalories,
    habitos: viewHabits,
    metas: viewGoals,
    estadisticas: viewStats,
    logros: viewBadges,
    perfil: viewProfile,
  };

  $("#content").innerHTML = views[activeView]();
}

function viewAuth() {
  const isRegister = authMode === "register";
  return `
    <section class="auth-shell">
      <div class="auth-brand">
        <span class="mark">T</span>
        <div>
          <strong>TrackFit</strong>
          <span>Hábitos y progreso</span>
        </div>
      </div>
      <form class="auth-panel" id="${isRegister ? "registerForm" : "loginForm"}">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${isRegister ? "Crear cuenta" : "Ingresar"}</p>
            <h1>${isRegister ? "Empezar en TrackFit" : "Bienvenido"}</h1>
          </div>
        </div>
        ${isRegister ? `<label>Nombre y apellido<input name="name" autocomplete="name" placeholder="Fabricio Poccioni" required></label>` : ""}
        <label>Email<input name="email" type="email" autocomplete="email" placeholder="fabriciopoccioni1@gmail.com" required></label>
        <label>Contrasena<input name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" minlength="8" title="Minimo 8 caracteres y un caracter especial: - _ . @" required></label>
        ${isRegister ? `<span class="auth-hint">Usa minimo 8 caracteres y al menos uno de estos simbolos: - _ . @</span>` : ""}
        <div id="authError" class="auth-error" hidden></div>
        <button class="primary full" type="submit">${isRegister ? "Crear cuenta" : "Entrar"}</button>
        <button class="ghost full" data-auth-mode="${isRegister ? "login" : "register"}" type="button">
          ${isRegister ? "Ya tengo cuenta" : "Crear cuenta"}
        </button>
      </form>
    </section>
  `;
}
function createEmptyState() {
  return {
    profile: {
      height: 170,
      initialWeight: 80,
      targetWeight: 75,
      age: 30,
      activity: "Moderado",
      calorieGoal: 2200,
    },
    weights: [],
    exercises: [],
    calories: [],
    habits: [],
    routine: [],
    goals: [],
    achievements: [],
  };
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveSession(nextSession) {
  session = nextSession;
  localStorage.setItem(AUTH_KEY, JSON.stringify(nextSession));
}

function clearSession() {
  session = null;
  usingServer = false;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(STORAGE_KEY);
  state = createEmptyState();
}

function showAuthError(message) {
  const box = $("#authError");
  if (!box) return;
  box.textContent = message;
  box.hidden = false;
}

function validateFullName(name) {
  if (name.trim().split(/\s+/).length < 2) {
    throw new Error("Ingresa nombre y apellido.");
  }
}

function validateNewPassword(password) {
  const hasAllowedSpecial = Array.from(password).some((character) => "-_.@".includes(character));
  if (password.length < 8 || !hasAllowedSpecial) {
    throw new Error("La contrasena debe tener minimo 8 caracteres y un caracter especial: - _ . @");
  }
}

function loadState() {
  return createEmptyState();
}

function normalizeState(raw = {}) {
  const defaults = createEmptyState();
  const routine = Array.isArray(raw.routine) ? raw.routine : Array.isArray(raw.routine?.tasks) ? raw.routine.tasks : defaults.routine;

  return {
    profile: { ...defaults.profile, ...(raw.profile || {}) },
    weights: Array.isArray(raw.weights) ? raw.weights : defaults.weights,
    exercises: Array.isArray(raw.exercises) ? raw.exercises : defaults.exercises,
    routine: routine.map(normalizeRoutineTask),
    calories: Array.isArray(raw.calories) ? raw.calories : defaults.calories,
    habits: Array.isArray(raw.habits) ? raw.habits.map(normalizeHabit) : defaults.habits,
    goals: Array.isArray(raw.goals) ? raw.goals.map(normalizeGoal) : defaults.goals,
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
  };
}

function normalizeRoutineTask(task) {
  return {
    ...task,
    day: task.day || task.day_of_week || "Lunes",
    name: task.name || task.activity_name || "Actividad",
    duration: task.duration || task.duration_label || "",
    status: task.status || "Pendiente",
    sortOrder: Number(task.sortOrder || task.sort_order || 0),
  };
}

function normalizeHabit(habit) {
  const completions = {};
  if (Array.isArray(habit.completions)) {
    habit.completions.forEach((completionDate) => {
      completions[completionDate] = true;
    });
  } else {
    Object.assign(completions, habit.completions || {});
  }
  Object.assign(completions, habit.completionMap || {});

  return {
    ...habit,
    frequency: habit.frequency || "Diario",
    completions,
  };
}

function normalizeGoal(goal) {
  return {
    ...goal,
    targetWeight: Number(goal.targetWeight ?? goal.target_weight_kg ?? 0) || undefined,
    date: goal.date || goal.targetDate || goal.target_date || dateKey(new Date()),
  };
}

function saveState() {
  localStorage.removeItem(STORAGE_KEY);
}

function serverStateFromDashboard(data) {
  return {
    profile: data.profile,
    weights: data.weights,
    exercises: data.exercises,
    routine: data.routine?.tasks || data.routine,
    calories: data.calories,
    habits: data.habits,
    goals: data.goals,
    achievements: data.achievements,
  };
}

async function apiRequest(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error("El servidor no respondio con datos validos.");
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      render();
    }
    throw new Error(data?.error || "No se pudo completar la accion.");
  }

  return data;
}
function jsonRequest(method, payload) {
  return {
    method,
    body: JSON.stringify(payload),
  };
}

async function loadServerState({ silent = false } = {}) {
  if (!session?.token) {
    render();
    return false;
  }

  try {
    const dashboard = await apiRequest("/dashboard");
    state = normalizeState(serverStateFromDashboard(dashboard));
    usingServer = true;
    render();
    if (!silent) showToast("Datos cargados desde la base.");
    return true;
  } catch (error) {
    usingServer = false;
    clearSession();
    render();
    if (!silent) showToast(error.message || "No se pudo conectar con el servidor.");
    return false;
  }
}

function sectionTemplate(eyebrow, title, pill, body) {
  return `
    <section>
 <div class="section-title">
        <div>
            <p class="eyebrow">${eyebrow}</p>
            <h2>${title}</h2>
        </div>
        ${pill ? `<span class="pill">${pill}</span>` : ""}
        </div>
        ${body}
    </section>
  `;
}

function summaryCard(label, value, foot, iconName, tone = "") {
  return `
    <article class="card ${tone}">
      <div class="card-top">
        <span class="card-icon">${icon(iconName)}</span>
        <span class="label">${label}</span>
      </div>
      <div>
        <div class="value">${value}</div>
        <div class="foot">${foot}</div>
      </div>
    </article>
  `;
}

function metricCard(label, value) {
  return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`;
}

function panel(title, subtitle, body, extra = "") {
  return `
    <article class="panel">
      <div class="panel-head">
        <div>
          <h3>${title}</h3>
          <span class="muted">${subtitle}</span>
        </div>
        ${extra}
      </div>
      ${body}
    </article>
  `;
}

function tablePanel(title, subtitle, headers, rows) {
  return panel(
    title,
    subtitle,
    `
      <div class="table-wrap">
        <table>
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
  );
}

function rowActions(type, id) {
  return `
    <span class="table-actions">
      <button class="edit" data-edit="${type}" data-id="${id}" type="button">Editar</button>
      <button class="trash" data-del="${type}" data-id="${id}" aria-label="Eliminar" title="Eliminar" type="button">
        ${icon("trash")}
      </button>
    </span>
  `;
}

function chartPanel(title, subtitle, chart) {
  return panel(title, subtitle, `<div class="chart">${chart}</div>`);
}

function formHeader(title, subtitle) {
  return `
    <div class="panel-head">
      <div>
        <h3>${title}</h3>
        <span class="muted">${subtitle}</span>
      </div>
    </div>
  `;
}
function viewDashboard() {
  const metrics = calculateMetrics();
  const goal = getNextGoal();
  const goalStatus = goal ? analyzeGoal(goal) : null;
  const todayName = DAYS[new Date().getDay()];
  const todayTasks = state.routine.filter((task) => task.day === todayName);

  const cards = [
    summaryCard("Peso actual", `${formatNumber(metrics.currentWeight, 1)} kg`, "Último registro", "scale", "good"),
    summaryCard("Objetivo", `${formatNumber(state.profile.targetWeight, 1)} kg`, `${formatNumber(metrics.remainingKg, 1)} kg restantes`, "target"),
    summaryCard("Progreso", `${formatNumber(metrics.progress)}%`, `${formatNumber(metrics.kgLost, 1)} kg perdidos`, "chart", "good"),
    summaryCard("Racha", `${metrics.streak} días`, "Hábitos consecutivos", "flame", "hot"),
    summaryCard("IMC actual", formatNumber(metrics.bmi, 1), bmiLabel(metrics.bmi), "activity"),
    summaryCard("Calorías objetivo", `${state.profile.calorieGoal} kcal`, "Meta diaria", "flame", "warn"),
    summaryCard("Progreso mensual", `${formatNumber(metrics.monthlyProgress)}%`, "Sobre el plan", "calendar", "good"),
    summaryCard("Próxima meta", metrics.nextGoalTitle, metrics.nextGoalDate, "award"),
  ].join("");

  const todayRoutine = todayTasks.length
    ? todayTasks.map((task) => `<div class="mini-row"><strong>${escapeHtml(task.name)}</strong><span>${task.status}</span></div>`).join("")
    : `<div class="mini-row"><strong>Descanso</strong><span>Sin tareas para hoy</span></div>`;

  return sectionTemplate(
    "Vista general",
    "Panel principal",
    `${formatNumber(metrics.monthlyLoss, 1)} kg este mes`,
    `
      <div class="grid summary">${cards}</div>
      <div class="grid two">
        ${panel(
          "Evolución del peso",
          `${formatNumber(metrics.kgLost, 1)} kg perdidos desde el inicio`,
          `<button class="ghost" data-jump="peso" type="button">Ver peso</button>`,
        ).replace(`<button class="ghost" data-jump="peso" type="button">Ver peso</button>`, `
          <button class="ghost" data-jump="peso" type="button">Ver peso</button>
          <div class="chart">${lineChart(weightSeries(), { suffix: " kg", target: state.profile.targetWeight })}</div>
        `)}
        ${panel(
          "Próxima meta",
          "Ritmo y estado",
          goal ? nextGoalTemplate(goal, goalStatus) : `<div class="empty">No hay metas activas.</div>`,
          `<span class="panel-icon">${icon("target")}</span>`,
        )}
      </div>
      <div class="grid three">
        ${panel(
          "Rutina semanal",
          `${formatNumber(metrics.routineCompletion)}% semanal`,
          `<div class="progress"><span style="width:${metrics.routineCompletion}%"></span></div><div class="mini">${todayRoutine}</div>`,
        )}
        ${panel(
          "Calorías",
          `${state.profile.calorieGoal} kcal objetivo`,
          `<div class="chart small">${barChart(recentCalories(7), { suffix: " kcal", target: state.profile.calorieGoal })}</div>`,
        )}
        ${panel(
          "Hábitos",
          `${metrics.streak} días consecutivos`,
          `<div class="dots">${habitDotsTemplate()}</div>`,
        )}
      </div>
    `,
  );
}

function nextGoalTemplate(goal, analysis) {
  return `
    <div class="goal-main">
      <div>
        <span class="muted">${escapeHtml(goal.title)}</span>
        <strong>${formatNumber(analysis.progress)}%</strong>
      </div>
      <div class="progress"><span style="width:${clamp(analysis.progress, 0, 100)}%"></span></div>
      <div class="goal-stats">
        <div><span>Ritmo necesario</span><strong>${analysis.requiredPace}</strong></div>
        <div><span>Ritmo actual</span><strong>${analysis.currentPace}</strong></div>
        <div><span>Fecha objetivo</span><strong>${formatShortDate(goal.date)}</strong></div>
        <div><span>Estimada</span><strong>${analysis.estimatedDate}</strong></div>
      </div>
    </div>
  `;
}

function habitDotsTemplate() {
  return Array.from({ length: 14 }, (_, index) => {
    const date = dateKey(addDays(new Date(), index - 13));
    return `<span class="dot ${hasAnyHabitCompletion(date) ? "done" : ""}" title="${formatShortDate(date)}"></span>`;
  }).join("");
}

function viewWeight() {
  const metrics = calculateMetrics();
  const prediction = predictWeight();
  const rows = sortByDate(state.weights).reverse().map((entry) => `
    <tr>
      <td>${formatShortDate(entry.date)}</td>
      <td><strong>${formatNumber(entry.weight, 1)} kg</strong></td>
      <td>${escapeHtml(entry.notes || "Sin observaciones")}</td>
      <td>${rowActions("weight", entry.id)}</td>
    </tr>
  `).join("");

  return sectionTemplate(
    "Seguimiento",
    "Peso",
    prediction.targetDate ? `Meta estimada: ${prediction.targetDate}` : `30 días: ${formatNumber(prediction.futureWeight, 1)} kg`,
    `
      <div class="grid formgrid">
        <form class="panel" id="weightForm">
          ${formHeader("Nuevo registro", "Fecha, peso y observaciones")}
          <label>Fecha<input name="date" type="date" value="${dateKey(new Date())}" required></label>
          <label>Peso<input name="weight" type="number" min="35" max="250" step="0.1" required></label>
          <label>Observaciones<textarea name="notes" placeholder="Entreno, descanso, energía..."></textarea></label>
          <button class="primary full">Guardar peso</button>
        </form>
        ${panel(
          "Evolución diaria",
          `Semanal ${formatNumber(metrics.weeklyAverage, 1)} kg · Mensual ${formatNumber(metrics.monthlyAverage, 1)} kg`,
          `<div class="chart tall">${lineChart(weightSeries(), { suffix: " kg", target: state.profile.targetWeight })}</div>`,
        )}
      </div>
      <div class="grid metrics">
        ${metricCard("Promedio semanal", `${formatNumber(metrics.weeklyAverage, 1)} kg`)}
        ${metricCard("Promedio mensual", `${formatNumber(metrics.monthlyAverage, 1)} kg`)}
        ${metricCard("Predicción 30 días", `${formatNumber(prediction.futureWeight, 1)} kg`)}
        ${metricCard("Comparación objetivo", `${formatNumber(metrics.remainingKg, 1)} kg restantes`)}
      </div>
      ${tablePanel("Historial", "Registros recientes", ["Fecha", "Peso", "Observaciones", ""], rows)}
    `,
  );
}

function viewExercise() {
  const exercise = exerciseMetrics();
  const rows = sortByDate(state.exercises).reverse().map((entry) => `
    <tr>
      <td>${formatShortDate(entry.date)}</td>
      <td><strong>${escapeHtml(entry.type)}</strong></td>
      <td>${entry.duration} min</td>
      <td>${entry.intensity}</td>
      <td>${entry.calories} kcal</td>
      <td>${rowActions("exercise", entry.id)}</td>
    </tr>
  `).join("");

  return sectionTemplate(
    "Actividad física",
    "Ejercicio",
    `${exercise.totalWorkouts} entrenamientos`,
    `
      <div class="grid formgrid">
        <form class="panel" id="exerciseForm">
          ${formHeader("Registrar actividad", "Tipo, duración e intensidad")}
          <label>Fecha<input name="date" type="date" value="${dateKey(new Date())}" required></label>
          <label>Tipo<select name="type">${options(ACTIVITY_TYPES)}</select></label>
          <div class="row">
            <label>Duración<input name="duration" type="number" min="1" max="360" required></label>
            <label>Intensidad<select name="intensity">${options(INTENSITIES, "Media")}</select></label>
          </div>
          <label>Calorías estimadas<input name="calories" type="number" min="0" placeholder="Automático si queda vacío"></label>
          <label>Notas<textarea name="notes"></textarea></label>
          <button class="primary full">Guardar actividad</button>
        </form>
        ${panel(
          "Horas entrenadas",
          `${formatNumber(exercise.totalHours, 1)} horas totales`,
          `<div class="chart tall">${barChart(exerciseByDay(14, "hours"), { suffix: " h", color: "green" })}</div>`,
        )}
      </div>
      <div class="grid metrics">
        ${metricCard("Horas entrenadas", `${formatNumber(exercise.totalHours, 1)} h`)}
        ${metricCard("Actividad favorita", exercise.favorite || "Sin datos")}
        ${metricCard("Calorías quemadas", `${formatNumber(exercise.totalCalories)} kcal`)}
        ${metricCard("Completados", exercise.totalWorkouts)}
      </div>
      ${tablePanel("Actividades", "Últimos entrenamientos", ["Fecha", "Actividad", "Duración", "Intensidad", "Calorías", ""], rows)}
    `,
  );
}
function viewRoutine() {
  const metrics = calculateMetrics();
  const daysBoard = ROUTINE_DAYS.map((day) => {
    const tasks = state.routine.filter((task) => task.day === day);
    const content = tasks.length
      ? tasks.map(routineTaskTemplate).join("")
      : `<div class="task"><strong>Descanso</strong><span class="muted">Sin actividad programada</span></div>`;

    return `
      <article class="day-card">
        <h3>${day}</h3>
        <span class="muted">${tasks.length} actividades</span>
        <div class="tasks">${content}</div>
      </article>
    `;
  }).join("");

  return sectionTemplate(
    "Plan semanal",
    "Rutina Objetivo 85 kg",
    `${formatNumber(metrics.routineCompletion)}% completado`,
    `
      <div class="grid formgrid">
        <form class="panel" id="routineForm">
          ${formHeader("Agregar actividad", "Planifica la semana")}
          <label>Día<select name="day">${options(ROUTINE_DAYS)}</select></label>
          <label>Actividad<input name="name" maxlength="50" required placeholder="Caminata, fuerza, pádel..."></label>
          <label>Duración<input name="duration" maxlength="30" placeholder="45 min"></label>
          <button class="primary full">Sumar a la rutina</button>
        </form>
        ${panel(
          "Cumplimiento semanal",
          `${countRoutineStatus("Completada")} de ${state.routine.length} actividades completas`,
          `<div class="ringbox">
            <svg viewBox="0 0 120 120">
              <circle class="ring-bg" cx="60" cy="60" r="50"></circle>
              <circle class="ring" cx="60" cy="60" r="50" style="stroke-dashoffset:${314 - (314 * metrics.routineCompletion) / 100}"></circle>
            </svg>
            <div><strong>${formatNumber(metrics.routineCompletion)}%</strong><span class="muted">completado</span></div>
          </div>`,
        )}
      </div>
      <div class="toolbar"><button class="ghost" data-reset-routine="true" type="button">Reiniciar semana</button></div>
      <div class="routine">${daysBoard}</div>
    `,
  );
}

function routineTaskTemplate(task) {
  return `
    <div class="task">
      <strong>${escapeHtml(task.name)}</strong>
      <span class="muted">${escapeHtml(task.duration || "Sin duración")}</span>
      <div class="task-actions">
        <button class="status" data-status-id="${task.id}" data-status="${task.status}" type="button">${task.status}</button>
        <button class="danger" data-del="routine" data-id="${task.id}" type="button">${icon("trash")}</button>
      </div>
    </div>
  `;
}

function viewCalories() {
  const calories = calorieMetrics();
  const rows = sortByDate(state.calories).reverse().map((entry) => `
    <tr>
      <td>${formatShortDate(entry.date)}</td>
      <td><strong>${entry.calories} kcal</strong></td>
      <td>${entry.protein || 0} g</td>
      <td>${entry.carbs || 0} g</td>
      <td>${entry.fat || 0} g</td>
      <td>${rowActions("calorie", entry.id)}</td>
    </tr>
  `).join("");

  return sectionTemplate(
    "Nutrición",
    "Calorías",
    `${state.profile.calorieGoal} kcal diarias`,
    `
      <div class="grid formgrid">
        <form class="panel" id="calorieForm">
          ${formHeader("Registro diario", "Calorías y macronutrientes")}
          <label>Fecha<input name="date" type="date" value="${dateKey(new Date())}" required></label>
          <label>Calorías consumidas<input name="calories" type="number" min="0" max="8000" required></label>
          <div class="row three">
            <label>Proteínas<input name="protein" type="number" min="0"></label>
            <label>Carbohidratos<input name="carbs" type="number" min="0"></label>
            <label>Grasas<input name="fat" type="number" min="0"></label>
          </div>
          <button class="primary full">Guardar nutrición</button>
        </form>
        ${panel(
          "Consumo semanal",
          `Promedio semanal ${formatNumber(calories.weeklyAverage)} kcal`,
          `<div class="chart tall">${barChart(recentCalories(14), { suffix: " kcal", target: state.profile.calorieGoal })}</div>`,
        )}
      </div>
      <div class="grid metrics">
        ${metricCard("Objetivo diario", `${state.profile.calorieGoal} kcal`)}
        ${metricCard("Promedio semanal", `${formatNumber(calories.weeklyAverage)} kcal`)}
        ${metricCard("Días cumplidos", calories.daysMet)}
        ${metricCard("Déficit estimado", `${formatNumber(calories.estimatedDeficit)} kcal`)}
      </div>
      ${tablePanel("Historial nutricional", "Registros recientes", ["Fecha", "Calorías", "Proteínas", "Carbohidratos", "Grasas", ""], rows)}
    `,
  );
}

function viewHabits() {
  const year = habitMonth.getFullYear();
  const month = habitMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = capitalize(new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(habitMonth));
  const calendar = habitCalendarTemplate(year, month, daysInMonth);

  return sectionTemplate(
    "Constancia",
    "Hábitos",
    `<span class="seg"><button data-month="prev" type="button">${icon("left")}</button><span>${monthLabel}</span><button data-month="next" type="button">${icon("right")}</button></span>`,
    `
      <div class="grid formgrid">
        <form class="panel" id="habitForm">
          ${formHeader("Crear hábito", "Acciones diarias")}
          <label>Nombre<input name="name" maxlength="60" required placeholder="Tomar 3 litros de agua"></label>
          <label>Frecuencia<select name="frequency">${options(["Diario", "Lunes a viernes", "Personalizado"])}</select></label>
          <button class="primary full">Crear hábito</button>
        </form>
        ${panel(
          "Racha actual",
          `${habitMonthCompletion(year, month)}% del mes`,
          `<div class="streak"><div><strong>${habitStreak()}</strong><span class="muted">días consecutivos</span></div></div>`,
        )}
      </div>
      ${panel(
        "Calendario de hábitos",
        "Marca cada día completado",
        `<div class="habit-scroll"><div class="habit-grid">${calendar}</div></div>`,
      )}
    `,
  );
}

function habitCalendarTemplate(year, month, daysInMonth) {
  const header = `
    <div class="habit-row head" style="--days:${daysInMonth}">
      <span>Hábito</span>
      ${Array.from({ length: daysInMonth }, (_, index) => `<span>${index + 1}</span>`).join("")}
      <span>Total</span>
    </div>
  `;

  const rows = state.habits.map((habit) => {
    let total = 0;
    const cells = Array.from({ length: daysInMonth }, (_, index) => {
      const date = dateKey(new Date(year, month, index + 1));
      const done = Boolean(habit.completions[date]);
      if (done) total += 1;
      return `<button class="habit-cell ${done ? "done" : ""}" data-habit="${habit.id}" data-date="${date}" type="button">${done ? "✓" : ""}</button>`;
    }).join("");

    return `
      <div class="habit-row" style="--days:${daysInMonth}">
        <div class="habit-name"><span>${escapeHtml(habit.name)}</span>${rowActions("habit", habit.id)}</div>
        ${cells}
        <span class="habit-total">${total}/${daysInMonth}</span>
      </div>
    `;
  }).join("");

  return header + rows;
}
function viewGoals() {
  const metrics = calculateMetrics();
  const goals = state.goals.slice().sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(goalCardTemplate).join("");

  return sectionTemplate(
    "Objetivos",
    "Metas",
    `${formatNumber(metrics.progress)}% del objetivo principal`,
    `
      <div class="grid formgrid">
        <form class="panel" id="goalForm">
          ${formHeader("Nueva meta", "Corto, mediano o largo plazo")}
          <label>Meta<input name="title" maxlength="70" required placeholder="Llegar a 85 kg"></label>
          <label>Peso objetivo<input name="targetWeight" type="number" min="35" max="250" step="0.1"></label>
          <label>Fecha objetivo<input name="date" type="date" value="2026-09-30" required></label>
          <button class="primary full">Crear meta</button>
        </form>
        ${panel(
          "Proyección",
          predictWeight().targetDate || "Sin tendencia",
          `<div class="chart tall">${lineChart(goalSeries(), { suffix: " kg", target: state.profile.targetWeight })}</div>`,
        )}
      </div>
      <div class="grid goals">${goals}</div>
    `,
  );
}

function goalCardTemplate(goal) {
  const analysis = analyzeGoal(goal);
  return `
    <article class="goal-card">
      <div class="panel-head">
        <div>
          <h3>${escapeHtml(goal.title)}</h3>
          <span>${formatShortDate(goal.date)}</span>
        </div>
        ${rowActions("goal", goal.id)}
      </div>
      <div class="progress"><span style="width:${clamp(analysis.progress, 0, 100)}%"></span></div>
      <div class="goal-detail">
        <div><span>Ritmo necesario</span><strong>${analysis.requiredPace}</strong></div>
        <div><span>Ritmo actual</span><strong>${analysis.currentPace}</strong></div>
        <div><span>Progreso</span><strong>${formatNumber(analysis.progress)}%</strong></div>
        <div><span>Estimación</span><strong>${analysis.estimatedDate}</strong></div>
      </div>
    </article>
  `;
}

function viewStats() {
  const metrics = calculateMetrics();
  return sectionTemplate(
    "Análisis",
    "Estadísticas avanzadas",
    `${formatNumber(metrics.monthlyProgress)}% del plan mensual`,
    `
      <div class="grid analytics">
        ${chartPanel("Peso", "Evolución", lineChart(weightSeries(), { suffix: " kg", target: state.profile.targetWeight }))}
        ${chartPanel("IMC", "Evolución", lineChart(bmiSeries(), { suffix: " IMC", color: "blue" }))}
        ${chartPanel("Entrenamiento", "Horas", barChart(exerciseByDay(21, "hours"), { suffix: " h", color: "green" }))}
        ${chartPanel("Calorías consumidas", "Diario", barChart(recentCalories(21), { suffix: " kcal", target: state.profile.calorieGoal }))}
        ${chartPanel("Calorías quemadas", "Ejercicio", barChart(exerciseByDay(21, "calories"), { suffix: " kcal", color: "coral" }))}
        ${chartPanel("Cumplimiento de hábitos", "Mensual", barChart(habitSeries(21), { suffix: "%", target: 80, color: "green" }))}
      </div>
    `,
  );
}

function viewBadges() {
  const metrics = calculateMetrics();
  const exercise = exerciseMetrics();
  const achievements = [
    ["Primer entrenamiento", "Registraste tu primera actividad física.", exercise.totalWorkouts >= 1],
    ["7 días consecutivos", "Sostuviste hábitos durante una semana.", metrics.streak >= 7],
    ["Primer kilo perdido", "Ya bajaste al menos 1 kg desde el inicio.", metrics.kgLost >= 1],
    ["5 kilos perdidos", "Superaste la marca de 5 kg perdidos.", metrics.kgLost >= 5],
    ["30 días seguidos", "Una racha larga de disciplina diaria.", metrics.streak >= 30],
    ["Meta alcanzada", "Llegaste a tu peso objetivo principal.", metrics.currentWeight <= state.profile.targetWeight],
  ];
  const unlocked = achievements.filter((achievement) => achievement[2]).length;
  const cards = achievements.map(([title, description, isUnlocked]) => `
    <article class="badge ${isUnlocked ? "unlocked" : "locked"}">
      <div class="badge-icon">${icon("award")}</div>
      <div>
        <h3>${title}</h3>
        <span>${description}</span>
      </div>
      <strong>${isUnlocked ? "Desbloqueado" : "Pendiente"}</strong>
    </article>
  `).join("");

  return sectionTemplate("Recompensas", "Logros", `${unlocked}/${achievements.length} desbloqueadas`, `<div class="grid badges">${cards}</div>`);
}

function viewProfile() {
  const metrics = calculateMetrics();
  const summary = [
    ["Altura", `${state.profile.height} cm`],
    ["Peso inicial", `${formatNumber(state.profile.initialWeight, 1)} kg`],
    ["Peso actual", `${formatNumber(metrics.currentWeight, 1)} kg`],
    ["Peso objetivo", `${formatNumber(state.profile.targetWeight, 1)} kg`],
    ["Edad", `${state.profile.age} años`],
    ["Nivel de actividad", state.profile.activity],
    ["IMC", formatNumber(metrics.bmi, 1)],
    ["Calorías recomendadas", `${recommendedCalories()} kcal`],
    ["Progreso total", `${formatNumber(metrics.progress)}%`],
    ["Tiempo estimado", predictWeight().targetDate || "Sin tendencia"],
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");

  return sectionTemplate(
    "Cuenta",
    "Perfil de usuario",
    `${formatNumber(metrics.progress)}% de progreso total`,
    `
      <div class="grid formgrid">
        <form class="panel" id="profileForm">
          ${formHeader("Información personal", "Datos para los cálculos")}
          <div class="row">
            <label>Altura<input name="height" type="number" value="${state.profile.height}" min="120" max="230" required></label>
            <label>Edad<input name="age" type="number" value="${state.profile.age}" min="12" max="100" required></label>
          </div>
          <div class="row">
            <label>Peso inicial<input name="initialWeight" type="number" value="${state.profile.initialWeight}" min="35" max="250" step="0.1" required></label>
            <label>Peso objetivo<input name="targetWeight" type="number" value="${state.profile.targetWeight}" min="35" max="250" step="0.1" required></label>
          </div>
          <label>Nivel de actividad<select name="activity">${options(ACTIVITY_LEVELS, state.profile.activity)}</select></label>
          <label>Calorías objetivo<input name="calorieGoal" type="number" value="${state.profile.calorieGoal}" min="1000" max="6000" step="50" required></label>
          <button class="primary full">Guardar perfil</button>
        </form>
        ${panel(
          "Resumen corporal",
          `${bmiLabel(metrics.bmi)} · ${formatNumber(metrics.remainingKg, 1)} kg restantes`,
          `<div class="profile-grid">${summary}</div>`,
        )}
      </div>
    `,
  );
}
async function handleClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  try {
    if (button.dataset.authMode) {
      authMode = button.dataset.authMode;
      render();
      return;
    }
    if (button.dataset.logout) return await logoutUser();
    if (!session?.token) return;

    if (button.dataset.view) return showView(button.dataset.view);
    if (button.dataset.jump) return showView(button.dataset.jump);
    if (button.dataset.export) return exportData();
    if (button.dataset.edit) return await editItem(button.dataset.edit, button.dataset.id);
    if (button.dataset.resetRoutine) return await resetRoutineWeek();
    if (button.id === "reset") return await reloadData();
    if (button.dataset.month) return moveHabitMonth(button.dataset.month);
    if (button.dataset.statusId) return await cycleRoutineStatus(button.dataset.statusId);
    if (button.dataset.habit) return await toggleHabitCompletion(button.dataset.habit, button.dataset.date);
    if (button.dataset.del) return await deleteItem(button.dataset.del, button.dataset.id);
  } catch (error) {
    showToast(error.message || "No se pudo completar la accion.");
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const handlers = {
    loginForm: loginUser,
    registerForm: registerUser,
    weightForm: saveWeightEntry,
    exerciseForm: saveExerciseEntry,
    routineForm: saveRoutineTask,
    calorieForm: saveCalorieEntry,
    habitForm: saveHabit,
    goalForm: saveGoal,
    profileForm: saveProfile,
  };
  const handler = handlers[form.id];
  if (!handler) return;

  try {
    await handler(formData);
    if (form.id === "loginForm" || form.id === "registerForm") return;
    await loadServerState({ silent: true });
    showToast("Guardado correctamente.");
  } catch (error) {
    showToast(error.message || "No se pudo guardar.");
  }
}

async function loginUser(formData) {
  const response = await apiRequest("/auth/login", jsonRequest("POST", {
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  }));
  saveSession(response);
  usingServer = true;
  await loadServerState({ silent: true });
  showToast("Sesion iniciada.");
}

async function registerUser(formData) {
  const response = await apiRequest("/auth/register", jsonRequest("POST", {
    name,
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  }));
  saveSession(response);
  usingServer = true;
  await loadServerState({ silent: true });
  showToast("Cuenta creada.");
}

async function logoutUser() {
  if (session?.token) {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      // La sesion local se limpia aunque el servidor ya no este disponible.
    }
  }
  clearSession();
  render();
  showToast("Sesion cerrada.");
}

async function saveWeightEntry(formData) {
  return apiRequest("/weights", jsonRequest("POST", {
    date: String(formData.get("date")),
    weight: Number(formData.get("weight")),
    notes: String(formData.get("notes") || "").trim(),
  }));
}

async function saveExerciseEntry(formData) {
  const duration = Number(formData.get("duration"));
  const intensity = String(formData.get("intensity"));
  const calories = Number(formData.get("calories")) || Math.round(duration * (ACTIVITY_CALORIE_MULTIPLIER[intensity] || 7));
  return apiRequest("/exercises", jsonRequest("POST", {
    date: String(formData.get("date")),
    type: String(formData.get("type")),
    duration,
    intensity,
    calories,
    notes: String(formData.get("notes") || ""),
  }));
}

async function saveRoutineTask(formData) {
  return apiRequest("/routine", jsonRequest("POST", {
    day: String(formData.get("day")),
    name: String(formData.get("name")).trim(),
    duration: String(formData.get("duration") || "").trim(),
    status: "Pendiente",
  }));
}

async function saveCalorieEntry(formData) {
  return apiRequest("/calories", jsonRequest("POST", {
    date: String(formData.get("date")),
    calories: Number(formData.get("calories")),
    protein: Number(formData.get("protein")) || 0,
    carbs: Number(formData.get("carbs")) || 0,
    fat: Number(formData.get("fat")) || 0,
  }));
}

async function saveHabit(formData) {
  return apiRequest("/habits", jsonRequest("POST", {
    name: String(formData.get("name")).trim(),
    frequency: String(formData.get("frequency")),
  }));
}

async function saveGoal(formData) {
  const date = String(formData.get("date"));
  return apiRequest("/goals", jsonRequest("POST", {
    title: String(formData.get("title")).trim(),
    targetWeight: Number(formData.get("targetWeight")) || state.profile.targetWeight,
    targetDate: date,
    date,
  }));
}

async function saveProfile(formData) {
  return apiRequest("/profile", jsonRequest("PUT", {
    height: Number(formData.get("height")),
    initialWeight: Number(formData.get("initialWeight")),
    targetWeight: Number(formData.get("targetWeight")),
    age: Number(formData.get("age")),
    activity: String(formData.get("activity")),
    calorieGoal: Number(formData.get("calorieGoal")),
  }));
}

async function reloadData() {
  await loadServerState({ silent: true });
  showToast("Datos recargados desde la base.");
}

async function resetRoutineWeek() {
  await Promise.all(
    state.routine.map((task) => apiRequest(`/routine/${task.id}`, jsonRequest("PUT", { ...task, status: "Pendiente" }))),
  );
  await loadServerState({ silent: true });
  showToast("Rutina semanal reiniciada.");
}

function moveHabitMonth(direction) {
  const amount = direction === "next" ? 1 : -1;
  habitMonth = new Date(habitMonth.getFullYear(), habitMonth.getMonth() + amount, 1);
  render();
}

async function cycleRoutineStatus(taskId) {
  const task = state.routine.find((item) => sameId(item.id, taskId));
  if (!task) return;
  const status = task.status === "Pendiente" ? "En progreso" : task.status === "En progreso" ? "Completada" : "Pendiente";
  await apiRequest(`/routine/${task.id}`, jsonRequest("PUT", { ...task, status }));
  await loadServerState({ silent: true });
}

async function toggleHabitCompletion(habitId, completionDate) {
  const habit = state.habits.find((item) => sameId(item.id, habitId));
  if (!habit) return;
  await apiRequest(`/habits/${habit.id}/toggle`, jsonRequest("POST", { date: completionDate }));
  await loadServerState({ silent: true });
}

async function deleteItem(type, id) {
  const resourceName = API_RESOURCE_BY_TYPE[type];
  if (!resourceName) return;
  await apiRequest(`/${resourceName}/${id}`, { method: "DELETE" });
  await loadServerState({ silent: true });
  showToast("Elemento eliminado.");
}

function exportData() {
  const payload = { version: 1, exportedAt: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trackfit-respaldo-${dateKey(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Respaldo exportado.");
}

function importData(event) {
  event.target.value = "";
  showToast("La importacion a la base se agregara en una siguiente etapa.");
}

function promptValue(label, value) {
  const result = prompt(label, value ?? "");
  return result === null ? null : String(result).trim();
}

async function editItem(type, id) {
  const collection = state[COLLECTION_BY_TYPE[type]];
  const item = collection?.find((entry) => sameId(entry.id, id));
  if (!item) return;

  const editors = {
    weight: editWeightEntry,
    exercise: editExerciseEntry,
    calorie: editCalorieEntry,
    habit: editHabit,
    goal: editGoal,
  };

  const changed = editors[type]?.(item);
  if (!changed) return;

  await updateServerItem(type, item);
  await loadServerState({ silent: true });

  showToast("Registro actualizado.");
}

async function updateServerItem(type, item) {
  const resourceName = API_RESOURCE_BY_TYPE[type];
  if (!resourceName) return;
  const payload = type === "goal" ? { ...item, targetDate: item.date } : item;
  await apiRequest(`/${resourceName}/${item.id}`, jsonRequest("PUT", payload));
}

function editWeightEntry(item) {
  const date = promptValue("Fecha", item.date);
  if (!date) return false;
  const weight = promptValue("Peso", item.weight);
  if (weight === null) return false;
  const notes = promptValue("Observaciones", item.notes || "");
  if (notes === null) return false;

  item.date = date;
  item.weight = Number(weight);
  item.notes = notes;
  return true;
}

function editExerciseEntry(item) {
  const date = promptValue("Fecha", item.date);
  if (!date) return false;
  const type = promptValue("Actividad", item.type);
  if (!type) return false;
  const duration = promptValue("Duración en minutos", item.duration);
  if (duration === null) return false;
  const intensity = promptValue("Intensidad", item.intensity || "Media");
  if (intensity === null) return false;
  const calories = promptValue("Calorías", item.calories);
  if (calories === null) return false;

  item.date = date;
  item.type = type;
  item.duration = Number(duration);
  item.intensity = intensity || "Media";
  item.calories = Number(calories) || 0;
  return true;
}

function editCalorieEntry(item) {
  const date = promptValue("Fecha", item.date);
  if (!date) return false;
  const calories = promptValue("Calorías", item.calories);
  if (calories === null) return false;
  const protein = promptValue("Proteínas", item.protein || 0);
  if (protein === null) return false;
  const carbs = promptValue("Carbohidratos", item.carbs || 0);
  if (carbs === null) return false;
  const fat = promptValue("Grasas", item.fat || 0);
  if (fat === null) return false;

  item.date = date;
  item.calories = Number(calories) || 0;
  item.protein = Number(protein) || 0;
  item.carbs = Number(carbs) || 0;
  item.fat = Number(fat) || 0;
  return true;
}

function editHabit(item) {
  const name = promptValue("Hábito", item.name);
  if (!name) return false;
  const frequency = promptValue("Frecuencia", item.frequency || "Diario");
  if (frequency === null) return false;

  item.name = name;
  item.frequency = frequency || "Diario";
  return true;
}

function editGoal(item) {
  const title = promptValue("Meta", item.title);
  if (!title) return false;
  const target = promptValue("Peso objetivo", item.targetWeight || state.profile.targetWeight);
  if (target === null) return false;
  const date = promptValue("Fecha objetivo", item.date);
  if (!date) return false;

  item.title = title;
  item.targetWeight = Number(target) || state.profile.targetWeight;
  item.date = date;
  return true;
}
function upsertByDate(collection, item) {
  const index = collection.findIndex((entry) => entry.date === item.date);
  if (index >= 0) collection[index] = { ...collection[index], ...item, id: collection[index].id };
  else collection.push(item);
}

function sortByDate(collection) {
  return collection.slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

function currentWeight() {
  const sorted = sortByDate(state.weights);
  return sorted.length ? sorted.at(-1).weight : state.profile.initialWeight;
}

function hasAnyHabitCompletion(completionDate) {
  return state.habits.some((habit) => habit.completions[completionDate]);
}

function habitStreak() {
  let streak = 0;
  let cursor = stripTime(new Date());
  for (let index = 0; index < 365; index += 1) {
    if (!hasAnyHabitCompletion(dateKey(cursor))) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function countRoutineStatus(status) {
  return state.routine.filter((task) => task.status === status).length;
}

function routineCompletion() {
  return state.routine.length ? (countRoutineStatus("Completada") / state.routine.length) * 100 : 0;
}

function getNextGoal() {
  const today = stripTime(new Date());
  return state.goals
    .filter((goal) => parseDate(goal.date) >= today)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))[0];
}

function bmiLabel(bmi) {
  if (bmi < 18.5) return "Bajo peso";
  if (bmi < 25) return "Rango saludable";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidad";
}

function calculateMetrics() {
  const weight = currentWeight();
  const kgLost = Math.max(0, state.profile.initialWeight - weight);
  const totalToLose = Math.max(0.1, state.profile.initialWeight - state.profile.targetWeight);
  const sortedWeights = sortByDate(state.weights);
  const now = new Date();
  const weeklyWeights = sortedWeights.filter((entry) => daysBetween(parseDate(entry.date), now) <= 7);
  const monthlyWeights = sortedWeights.filter((entry) => daysBetween(parseDate(entry.date), now) <= 30);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weightsThisMonth = sortedWeights.filter((entry) => parseDate(entry.date) >= monthStart);
  const monthlyLoss = weightsThisMonth.length >= 2 ? weightsThisMonth[0].weight - weightsThisMonth.at(-1).weight : 0;
  const nextGoal = getNextGoal();

  return {
    currentWeight: weight,
    kgLost,
    progress: clamp((kgLost / totalToLose) * 100, 0, 100),
    remainingKg: Math.max(0, weight - state.profile.targetWeight),
    bmi: weight / (state.profile.height / 100) ** 2,
    streak: habitStreak(),
    routineCompletion: routineCompletion(),
    weeklyAverage: average(weeklyWeights.map((entry) => entry.weight)) || weight,
    monthlyAverage: average(monthlyWeights.map((entry) => entry.weight)) || weight,
    monthlyLoss,
    monthlyProgress: clamp((monthlyLoss / 2.5) * 100, 0, 100),
    nextGoalTitle: nextGoal ? nextGoal.title.replace("Llegar a ", "") : "Sin meta",
    nextGoalDate: nextGoal ? formatShortDate(nextGoal.date) : "Crea una meta",
  };
}

function exerciseMetrics() {
  const totalMinutes = state.exercises.reduce((sum, entry) => sum + Number(entry.duration || 0), 0);
  const totalCalories = state.exercises.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
  const byType = {};
  state.exercises.forEach((entry) => {
    byType[entry.type] = (byType[entry.type] || 0) + 1;
  });
  const favorite = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  return {
    totalWorkouts: state.exercises.length,
    totalHours: totalMinutes / 60,
    totalCalories,
    favorite,
  };
}

function calorieMetrics() {
  const recent = state.calories.filter((entry) => daysBetween(parseDate(entry.date), new Date()) <= 7);
  return {
    weeklyAverage: average(recent.map((entry) => Number(entry.calories || 0))),
    daysMet: state.calories.filter((entry) => Number(entry.calories) <= state.profile.calorieGoal).length,
    estimatedDeficit: recent.reduce((sum, entry) => sum + (state.profile.calorieGoal - Number(entry.calories || 0)), 0),
  };
}

function habitMonthCompletion(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let completed = 0;
  const total = Math.max(1, daysInMonth * Math.max(1, state.habits.length));

  state.habits.forEach((habit) => {
    for (let day = 1; day <= daysInMonth; day += 1) {
      if (habit.completions[dateKey(new Date(year, month, day))]) completed += 1;
    }
  });

  return Math.round((completed / total) * 100);
}
function weightSlope() {
  const recentWeights = sortByDate(state.weights).slice(-8);
  if (recentWeights.length < 2) return 0;

  const firstDate = parseDate(recentWeights[0].date);
  const points = recentWeights.map((entry) => ({ x: daysBetween(firstDate, parseDate(entry.date)), y: entry.weight }));
  const meanX = average(points.map((point) => point.x));
  const meanY = average(points.map((point) => point.y));
  const numerator = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  return denominator ? numerator / denominator : 0;
}

function targetDate(targetWeight, slope) {
  const weight = currentWeight();
  if (slope >= 0 || weight <= targetWeight) return weight <= targetWeight ? "Alcanzada" : "";
  const days = Math.ceil((targetWeight - weight) / slope);
  return Number.isFinite(days) && days >= 0 && days < 1500 ? formatShortDate(dateKey(addDays(new Date(), days))) : "";
}

function predictWeight() {
  const slope = weightSlope();
  return {
    futureWeight: Math.max(0, currentWeight() + slope * 30),
    targetDate: targetDate(state.profile.targetWeight, slope),
  };
}

function analyzeGoal(goal) {
  const weight = currentWeight();
  const targetWeight = Number(goal.targetWeight || state.profile.targetWeight);
  const totalToLose = Math.max(0.1, state.profile.initialWeight - targetWeight);
  const lost = Math.max(0, state.profile.initialWeight - weight);
  const daysRemaining = Math.max(1, daysBetween(new Date(), parseDate(goal.date)));
  const slope = weightSlope();

  return {
    progress: clamp((lost / totalToLose) * 100, 0, 100),
    requiredPace: `${formatNumber(Math.max(0, ((weight - targetWeight) / daysRemaining) * 7), 2)} kg/sem`,
    currentPace: `${formatNumber(Math.max(0, -slope * 7), 2)} kg/sem`,
    estimatedDate: targetDate(targetWeight, slope) || "Sin tendencia",
  };
}

function recommendedCalories() {
  const activityMultipliers = {
    Sedentario: 1.2,
    Ligero: 1.375,
    Moderado: 1.55,
    Activo: 1.725,
    "Muy activo": 1.9,
  };
  const bmr = 10 * currentWeight() + 6.25 * state.profile.height - 5 * state.profile.age + 5;
  return Math.round((bmr * (activityMultipliers[state.profile.activity] || 1.55) - 500) / 10) * 10;
}

function weightSeries() {
  return sortByDate(state.weights).map((entry) => ({ label: formatShortDate(entry.date), value: entry.weight }));
}

function bmiSeries() {
  return sortByDate(state.weights).map((entry) => ({
    label: formatShortDate(entry.date),
    value: entry.weight / (state.profile.height / 100) ** 2,
  }));
}

function recentCalories(days) {
  return Array.from({ length: days }, (_, index) => {
    const date = dateKey(addDays(new Date(), index - days + 1));
    const entry = state.calories.find((item) => item.date === date);
    return { label: formatShortDay(date), value: entry ? Number(entry.calories || 0) : 0 };
  });
}

function exerciseByDay(days, type) {
  return Array.from({ length: days }, (_, index) => {
    const date = dateKey(addDays(new Date(), index - days + 1));
    const entries = state.exercises.filter((entry) => entry.date === date);
    const value = entries.reduce((sum, entry) => {
      return sum + (type === "hours" ? Number(entry.duration || 0) / 60 : Number(entry.calories || 0));
    }, 0);
    return { label: formatShortDay(date), value };
  });
}

function habitSeries(days) {
  return Array.from({ length: days }, (_, index) => {
    const date = dateKey(addDays(new Date(), index - days + 1));
    const completed = state.habits.filter((habit) => habit.completions[date]).length;
    return { label: formatShortDay(date), value: state.habits.length ? (completed / state.habits.length) * 100 : 0 };
  });
}

function goalSeries() {
  const series = weightSeries();
  series.push({ label: "30 días", value: predictWeight().futureWeight });
  return series;
}
function lineChart(series, options = {}) {
  const data = series.filter((point) => Number.isFinite(point.value));
  if (data.length < 2) return `<div class="empty">Aún no hay datos suficientes.</div>`;

  const size = { width: 760, height: 300 };
  const padding = { top: 24, right: 24, bottom: 42, left: 48 };
  const values = data.map((point) => point.value);
  if (Number.isFinite(options.target)) values.push(options.target);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  const yMin = min - spread * 0.18;
  const yMax = max + spread * 0.18;
  const innerWidth = size.width - padding.left - padding.right;
  const innerHeight = size.height - padding.top - padding.bottom;

  const points = data.map((point, index) => ({
    ...point,
    x: padding.left + (innerWidth * index) / Math.max(1, data.length - 1),
    y: padding.top + innerHeight - ((point.value - yMin) / (yMax - yMin)) * innerHeight,
  }));

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + innerHeight} ${polyline} ${padding.left + innerWidth},${padding.top + innerHeight}`;
  const targetY = Number.isFinite(options.target)
    ? padding.top + innerHeight - ((options.target - yMin) / (yMax - yMin)) * innerHeight
    : null;

  return `
    <svg class="line" viewBox="0 0 ${size.width} ${size.height}" preserveAspectRatio="none">
      ${chartGrid(size, padding, innerHeight)}
      <line class="axis" x1="${padding.left}" y1="${padding.top + innerHeight}" x2="${size.width - padding.right}" y2="${padding.top + innerHeight}"></line>
      ${targetY !== null ? `<line class="axis" x1="${padding.left}" y1="${targetY}" x2="${size.width - padding.right}" y2="${targetY}" stroke-dasharray="6 7"></line>` : ""}
      <polygon class="area" points="${area}"></polygon>
      <polyline class="linepath ${options.color === "blue" ? "blue" : ""}" points="${polyline}"></polyline>
      ${points.map((point) => `<circle class="point" cx="${point.x}" cy="${point.y}" r="4"><title>${point.label}: ${formatNumber(point.value, 1)}${options.suffix || ""}</title></circle>`).join("")}
      ${axisLabels(points, size.height)}
      <text class="clabel" x="12" y="${padding.top + 6}">${formatNumber(yMax, 1)}${options.suffix || ""}</text>
      <text class="clabel" x="12" y="${padding.top + innerHeight}">${formatNumber(yMin, 1)}${options.suffix || ""}</text>
    </svg>
  `;
}

function barChart(series, options = {}) {
  const data = series.filter((point) => Number.isFinite(point.value));
  if (!data.length) return `<div class="empty">Aún no hay datos suficientes.</div>`;

  const size = { width: 760, height: 300 };
  const padding = { top: 24, right: 24, bottom: 42, left: 48 };
  const values = data.map((point) => point.value);
  if (Number.isFinite(options.target)) values.push(options.target);

  const max = Math.max(1, ...values);
  const innerWidth = size.width - padding.left - padding.right;
  const innerHeight = size.height - padding.top - padding.bottom;
  const gap = 6;
  const barWidth = Math.max(8, innerWidth / data.length - gap);
  const targetY = Number.isFinite(options.target) ? padding.top + innerHeight - (options.target / max) * innerHeight : null;
  const colorClass = options.color === "green" ? "green" : options.color === "coral" ? "coral" : "";

  return `
    <svg class="bars" viewBox="0 0 ${size.width} ${size.height}" preserveAspectRatio="none">
      ${chartGrid(size, padding, innerHeight)}
      <line class="axis" x1="${padding.left}" y1="${padding.top + innerHeight}" x2="${size.width - padding.right}" y2="${padding.top + innerHeight}"></line>
      ${targetY !== null ? `<line class="axis" x1="${padding.left}" y1="${targetY}" x2="${size.width - padding.right}" y2="${targetY}" stroke-dasharray="6 7"></line>` : ""}
      ${data.map((point, index) => {
        const x = padding.left + (innerWidth * index) / data.length + gap / 2;
        const height = (point.value / max) * innerHeight;
        const y = padding.top + innerHeight - height;
        return `<rect class="bar ${colorClass}" x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="5"><title>${point.label}: ${formatNumber(point.value, point.value < 10 ? 1 : 0)}${options.suffix || ""}</title></rect>`;
      }).join("")}
      ${axisLabels(data.map((point, index) => ({ ...point, x: padding.left + (innerWidth * index) / data.length + barWidth / 2 })), size.height)}
      <text class="clabel" x="12" y="${padding.top + 6}">${formatNumber(max)}${options.suffix || ""}</text>
    </svg>
  `;
}

function chartGrid(size, padding, innerHeight) {
  return [0, 1, 2, 3].map((tick) => {
    const y = padding.top + (innerHeight * tick) / 3;
    return `<line class="gridline" x1="${padding.left}" y1="${y}" x2="${size.width - padding.right}" y2="${y}"></line>`;
  }).join("");
}

function axisLabels(points, height) {
  return points.map((point, index) => {
    const interval = Math.ceil(points.length / 5);
    const show = index === 0 || index === points.length - 1 || index % interval === 0;
    return show ? `<text class="clabel" x="${point.x}" y="${height - 14}" text-anchor="middle">${point.label}</text>` : "";
  }).join("");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

initializeApp();






