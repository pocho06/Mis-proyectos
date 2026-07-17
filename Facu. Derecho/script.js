const slides = Array.from(document.querySelectorAll("[data-slide]"));
const dots = Array.from(document.querySelectorAll("[data-dot]"));
const prevButton = document.querySelector("[data-prev]");
const nextButton = document.querySelector("[data-next]");
const heroSlider = document.querySelector(".hero-slider");
const comingSoonButtons = Array.from(document.querySelectorAll("[data-coming-soon]"));
const toast = document.querySelector("[data-toast]");
const proposalTrack = document.querySelector("[data-proposal-track]");
const proposalSlides = Array.from(document.querySelectorAll("[data-proposal-slide]"));
const proposalDots = Array.from(document.querySelectorAll("[data-proposal-dot]"));
const proposalPrevButton = document.querySelector("[data-proposal-prev]");
const proposalNextButton = document.querySelector("[data-proposal-next]");
const irregularityToggle = document.querySelector("[data-irregularity-toggle]");
const irregularityClose = document.querySelector("[data-irregularity-close]");
const irregularityPanel = document.querySelector("[data-irregularity-panel]");
const irregularityForm = document.querySelector("[data-irregularity-form]");
const irregularityFeed = document.querySelector("[data-irregularity-feed]");
const installAppButton = document.querySelector("[data-install-app]");
const loginButton = document.querySelector("[data-login-button]");
const loginModal = document.querySelector("[data-login-modal]");
const loginClose = document.querySelector("[data-login-close]");
const loginForm = document.querySelector("[data-login-form]");
const loginDniInput = document.querySelector("[data-login-dni]");
const loginStatus = document.querySelector("[data-login-status]");
const loginGateButton = document.querySelector("[data-login-gate-button]");
const loginKicker = document.querySelector("[data-login-kicker]");
const loginTitle = document.querySelector("[data-login-title]");
const loginCopy = document.querySelector("[data-login-copy]");
const loginLabel = document.querySelector("[data-login-label]");
const loginModeButtons = Array.from(document.querySelectorAll("[data-login-mode-option]"));
const adminOnlyElements = Array.from(document.querySelectorAll("[data-admin-only]"));
const authGate = document.querySelector("[data-auth-gate]");
const authContent = Array.from(document.querySelectorAll("[data-auth-content]"));
const librarySearchInput = document.querySelector("[data-library-search]");
const libraryFilterButtons = Array.from(document.querySelectorAll("[data-library-filter]"));
const libraryCards = Array.from(document.querySelectorAll("[data-library-card]"));
const libraryEmpty = document.querySelector("[data-library-empty]");
const libraryMaterialSlots = Array.from(document.querySelectorAll("[data-material-target]"));
const libraryJumpButtons = Array.from(document.querySelectorAll("[data-library-target]"));
const adminLoginSection = document.querySelector("[data-admin-login]");
const adminPanel = document.querySelector("[data-admin-panel]");
const adminLogoutButton = document.querySelector("[data-admin-logout]");
const adminMaterialForm = document.querySelector("[data-admin-material-form]");
const adminMaterialList = document.querySelector("[data-admin-material-list]");
const adminReportList = document.querySelector("[data-admin-report-list]");
const adminTotalMaterials = document.querySelector("[data-admin-total-materials]");
const adminTotalReports = document.querySelector("[data-admin-total-reports]");
const adminPendingReports = document.querySelector("[data-admin-pending-reports]");
const adminExportMaterials = document.querySelector("[data-admin-export-materials]");
const adminExportReports = document.querySelector("[data-admin-export-reports]");

let currentSlide = 0;
let autoPlayId = null;
let deferredInstallPrompt = null;
let currentLibraryFilter = "all";
let currentLibrarySection = null;
let libraryFocusTimeoutId = null;

const LIBRARY_MATERIALS_KEY = "lyc-library-materials-v1";
const ADMIN_SESSION_KEY = "lyc-admin-session";
const ADMIN_PASSCODE = "1336877";
const LIBRARY_MATERIAL_TARGETS = {
  "historia-a": { label: "Historia A", section: "1° año", category: "years" },
  "historia-b": { label: "Historia B", section: "1° año", category: "years" },
  "contenidos-transversales": { label: "Contenidos Transversales", section: "1° año", category: "years" },
  "destrezas-i": { label: "Destrezas I", section: "1° año", category: "years" },
  "historia-estado-a": { label: "Historia en Teoría del Estado A", section: "1° año", category: "years" },
  "historia-estado-b": { label: "Historia en Teoría del Estado B", section: "1° año", category: "years" },
  "teoria-derecho-justicia-a": { label: "Teoría del Derecho y de la Justicia A", section: "1° año", category: "years" },
  "teoria-derecho-justicia-b": { label: "Teoría del Derecho y de la Justicia B", section: "1° año", category: "years" },
  economia: { label: "Economía", section: "1° año", category: "years" },
  "nociones-economicas": { label: "Nociones Económicas", section: "1° año", category: "years" },
  "year-2": { label: "2° año", section: "Años superiores", category: "years" },
  "year-3": { label: "3° año", section: "Años superiores", category: "years" },
  "year-4": { label: "4° año", section: "Años superiores", category: "years" },
  "year-5": { label: "5° año", section: "Años superiores", category: "years" },
  "year-6": { label: "6° año", section: "Años superiores", category: "years" },
  "optativas-primer-bloque": { label: "Optativas Primer Bloque", section: "Optativas", category: "optativas" },
  "optativas-segundo-bloque": { label: "Optativas Segundo Bloque", section: "Optativas", category: "optativas" },
  "optativas-3": { label: "Optativas 3", section: "Optativas", category: "optativas" },
  "optativas-4": { label: "Optativas 4", section: "Optativas", category: "optativas" },
  "optativas-5": { label: "Optativas 5", section: "Optativas", category: "optativas" },
  "plan-estudio": { label: "Plan de estudio", section: "Recursos", category: "recursos" },
  "codigo-civil": { label: "Código Civil", section: "Recursos", category: "recursos" },
  constitucion: { label: "Constitución", section: "Recursos", category: "recursos" },
};

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

if (installAppButton && isStandaloneApp()) {
  installAppButton.hidden = true;
}

window.addEventListener("beforeinstallprompt", (event) => {
  if (!installAppButton || isStandaloneApp()) return;

  event.preventDefault();
  deferredInstallPrompt = event;
  installAppButton.hidden = false;
});

if (installAppButton) {
  installAppButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      showToast("Usa Agregar a pantalla principal");
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installAppButton.hidden = true;
  });
}

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  if (installAppButton) installAppButton.hidden = true;
  showToast("App instalada");
});

function setSlide(index) {
  if (slides.length === 0) return;

  const safeIndex = (index + slides.length) % slides.length;
  currentSlide = safeIndex;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === safeIndex);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === safeIndex);
  });
}

function nextSlide() {
  setSlide(currentSlide + 1);
}

function prevSlide() {
  setSlide(currentSlide - 1);
}

function stopAutoPlay() {
  if (autoPlayId !== null) {
    window.clearInterval(autoPlayId);
    autoPlayId = null;
  }
}

function startAutoPlay() {
  if (slides.length <= 1) return;
  stopAutoPlay();
  autoPlayId = window.setInterval(nextSlide, 6500);
}

if (prevButton && nextButton && heroSlider) {
  prevButton.addEventListener("click", () => {
    prevSlide();
    startAutoPlay();
  });

  nextButton.addEventListener("click", () => {
    nextSlide();
    startAutoPlay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      setSlide(index);
      startAutoPlay();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      nextSlide();
      startAutoPlay();
    }

    if (event.key === "ArrowLeft") {
      prevSlide();
      startAutoPlay();
    }
  });

  heroSlider.addEventListener("mouseenter", stopAutoPlay);
  heroSlider.addEventListener("mouseleave", startAutoPlay);

  setSlide(0);
  startAutoPlay();
}

let toastTimeoutId = null;

function showToast(message) {
  if (!toast) return;

  window.clearTimeout(toastTimeoutId);
  toast.textContent = message;
  toast.hidden = false;
  window.requestAnimationFrame(() => toast.classList.add("is-visible"));

  toastTimeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      toast.hidden = true;
    }, 180);
  }, 2200);
}

comingSoonButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showToast("Proximamente");
  });
});

function updateLibraryView() {
  if (libraryCards.length === 0) return;

  const query = normalizeText(librarySearchInput?.value || "");
  const usesSectionMenu = libraryJumpButtons.length > 0;
  let visibleCount = 0;

  libraryCards.forEach((card) => {
    const category = card.dataset.libraryCategory || "";
    const section = card.dataset.librarySection || card.id || "";
    const matchesSection = !usesSectionMenu || (currentLibrarySection && section === currentLibrarySection);
    const matchesFilter = currentLibraryFilter === "all" || category === currentLibraryFilter;
    const matchesQuery = !query || normalizeText(card.textContent).includes(query);
    const isVisible = matchesSection && matchesFilter && matchesQuery;

    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  if (libraryEmpty) {
    libraryEmpty.textContent = usesSectionMenu && !currentLibrarySection
      ? "Elegí una opción para ver las materias, optativas o recursos."
      : "No encontramos resultados con esa búsqueda.";
    libraryEmpty.hidden = visibleCount > 0;
  }
}

if (librarySearchInput) {
  librarySearchInput.addEventListener("input", updateLibraryView);
}

libraryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentLibraryFilter = button.dataset.libraryFilter || "all";
    libraryFilterButtons.forEach((filterButton) => {
      filterButton.classList.toggle("is-active", filterButton === button);
    });
    updateLibraryView();
  });
});

updateLibraryView();

function focusLibrarySection(sectionId) {
  const targetCard = document.getElementById(sectionId);
  if (!targetCard) return;

  if (librarySearchInput) {
    librarySearchInput.value = "";
  }

  currentLibrarySection = sectionId;
  currentLibraryFilter = "all";
  libraryFilterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.libraryFilter === "all");
  });
  updateLibraryView();

  libraryJumpButtons.forEach((button) => {
    const isActive = button.dataset.libraryTarget === sectionId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "true" : "false");
  });

  libraryCards.forEach((card) => card.classList.remove("is-focused"));
  targetCard.hidden = false;
  targetCard.classList.add("is-focused");
  targetCard.scrollIntoView({ behavior: "smooth", block: "start" });

  window.clearTimeout(libraryFocusTimeoutId);
  libraryFocusTimeoutId = window.setTimeout(() => {
    targetCard.classList.remove("is-focused");
  }, 1800);
}

libraryJumpButtons.forEach((button) => {
  button.addEventListener("click", () => {
    focusLibrarySection(button.dataset.libraryTarget);
  });
});

let currentProposal = 0;
let proposalScrollFrame = null;

function updateProposalState(index) {
  if (proposalSlides.length === 0) return;

  const safeIndex = (index + proposalSlides.length) % proposalSlides.length;
  currentProposal = safeIndex;

  proposalSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === safeIndex);
  });

  proposalDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === safeIndex);
  });
}

function setProposal(index) {
  updateProposalState(index);

  if (proposalSlides[currentProposal]) {
    proposalSlides[currentProposal].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }
}

function syncProposalFromScroll() {
  if (!proposalTrack || proposalSlides.length === 0) return;

  const trackCenter = proposalTrack.getBoundingClientRect().left + proposalTrack.clientWidth / 2;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  proposalSlides.forEach((slide, index) => {
    const rect = slide.getBoundingClientRect();
    const slideCenter = rect.left + rect.width / 2;
    const distance = Math.abs(trackCenter - slideCenter);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  updateProposalState(nearestIndex);
}

if (proposalPrevButton && proposalNextButton) {
  proposalPrevButton.addEventListener("click", () => {
    setProposal(currentProposal - 1);
  });

  proposalNextButton.addEventListener("click", () => {
    setProposal(currentProposal + 1);
  });

  proposalDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      setProposal(index);
    });
  });

  if (proposalTrack) {
    proposalTrack.addEventListener("scroll", () => {
      window.cancelAnimationFrame(proposalScrollFrame);
      proposalScrollFrame = window.requestAnimationFrame(syncProposalFromScroll);
    });
  }

  updateProposalState(0);
}

const IRREGULARITY_STORAGE_KEY = "lyc-irregularidades-v1";
const irregularityReactionOptions = ["👍", "⚠️", "👀", "🙌"];
let irregularityPosts = [];

function createLocalId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadIrregularityPosts() {
  try {
    const savedPosts = JSON.parse(localStorage.getItem(IRREGULARITY_STORAGE_KEY) || "[]");
    irregularityPosts = Array.isArray(savedPosts) ? savedPosts : [];
  } catch (error) {
    irregularityPosts = [];
  }
}

function saveIrregularityPosts() {
  localStorage.setItem(IRREGULARITY_STORAGE_KEY, JSON.stringify(irregularityPosts));
}

function formatPostDate(value) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function setIrregularityPanel(open) {
  if (!irregularityPanel || !irregularityToggle) return;
  irregularityPanel.hidden = !open;
  irregularityToggle.setAttribute("aria-expanded", String(open));
}

function renderIrregularityFeed() {
  if (!irregularityFeed) return;

  if (irregularityPosts.length === 0) {
    irregularityFeed.innerHTML = `
      <div class="irregularity-empty">
        Todavía no hay mensajes cargados. El primer reporte puede ayudar a ordenar mejor lo que está pasando.
      </div>
    `;
    return;
  }

  const orderedPosts = [...irregularityPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  irregularityFeed.innerHTML = orderedPosts.map((post) => {
    const reactions = irregularityReactionOptions.map((emoji) => {
      const count = post.reactions?.[emoji] || 0;
      return `
        <button type="button" data-irregularity-reaction="${escapeHtml(emoji)}" data-post-id="${escapeHtml(post.id)}">
          ${escapeHtml(emoji)} ${count}
        </button>
      `;
    }).join("");

    const comments = (post.comments || []).map((comment) => `
      <p class="irregularity-comment">${escapeHtml(comment.text)}</p>
    `).join("");

    const hasContactData = post.dni || post.name || post.email || post.phone;

    return `
      <article class="irregularity-post">
        <div class="irregularity-post-header">
          <strong>Denuncia irregular</strong>
          <time datetime="${escapeHtml(post.createdAt)}">${escapeHtml(formatPostDate(post.createdAt))}</time>
        </div>
        <p class="irregularity-post-message">${escapeHtml(post.message)}</p>
        ${hasContactData ? '<p class="irregularity-meta">Datos opcionales aportados y reservados.</p>' : ''}
        <div class="irregularity-reactions" aria-label="Reacciones">
          ${reactions}
        </div>
        <div class="irregularity-comments">
          ${comments || '<p class="irregularity-comment">Sin comentarios todavía.</p>'}
        </div>
        <form class="irregularity-comment-form" data-irregularity-comment-form data-post-id="${escapeHtml(post.id)}">
          <input name="comment" type="text" maxlength="240" placeholder="Comentar este reporte" required>
          <button type="submit">Comentar</button>
        </form>
      </article>
    `;
  }).join("");
}

if (irregularityToggle && irregularityPanel) {
  irregularityToggle.addEventListener("click", () => {
    setIrregularityPanel(irregularityPanel.hidden);
  });
}

if (irregularityClose) {
  irregularityClose.addEventListener("click", () => {
    setIrregularityPanel(false);
  });
}

if (irregularityForm) {
  irregularityForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(irregularityForm);
    const message = String(formData.get("message") || "").trim();

    if (!message) {
      showToast("Escribi un mensaje");
      return;
    }

    irregularityPosts.push({
      id: createLocalId(),
      message,
      dni: onlyDigits(formData.get("dni")).slice(0, 8),
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      createdAt: new Date().toISOString(),
      reactions: Object.fromEntries(irregularityReactionOptions.map((emoji) => [emoji, 0])),
      comments: [],
    });

    saveIrregularityPosts();
    renderIrregularityFeed();
    irregularityForm.reset();
    showToast("Denuncia enviada");
  });

  const optionalDniInput = irregularityForm.querySelector('input[name="dni"]');
  if (optionalDniInput) {
    optionalDniInput.addEventListener("input", () => {
      optionalDniInput.value = onlyDigits(optionalDniInput.value).slice(0, 8);
    });
  }
}

if (irregularityFeed) {
  irregularityFeed.addEventListener("click", (event) => {
    const reactionButton = event.target.closest("[data-irregularity-reaction]");
    if (!reactionButton) return;

    const post = irregularityPosts.find((item) => item.id === reactionButton.dataset.postId);
    const emoji = reactionButton.dataset.irregularityReaction;
    if (!post || !emoji) return;

    post.reactions = post.reactions || {};
    post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
    saveIrregularityPosts();
    renderIrregularityFeed();
  });

  irregularityFeed.addEventListener("submit", (event) => {
    const commentForm = event.target.closest("[data-irregularity-comment-form]");
    if (!commentForm) return;

    event.preventDefault();
    const post = irregularityPosts.find((item) => item.id === commentForm.dataset.postId);
    const commentInput = commentForm.elements.comment;
    const commentText = String(commentInput.value || "").trim();

    if (!post || !commentText) return;

    post.comments = post.comments || [];
    post.comments.push({
      id: createLocalId(),
      text: commentText,
      createdAt: new Date().toISOString(),
    });

    saveIrregularityPosts();
    renderIrregularityFeed();
  });
}

if (irregularityFeed) {
  loadIrregularityPosts();
  renderIrregularityFeed();
}

const padronForm = document.querySelector("[data-padron-form]");
const dniInput = document.querySelector("[data-dni-input]");
const padronStatus = document.querySelector("[data-padron-status]");
const padronResult = document.querySelector("[data-padron-result]");
const PADRON_URL = "padron.csv";
const SESSION_KEY = "libertadCambioSesion";

let padronRecords = [];
let padronLoaded = false;
let padronLoadPromise = null;
let activeSession = null;
let loginMode = "student";

const fieldAliases = {
  dni: ["dni", "d n i", "documento", "n documento", "nro documento", "numero documento"],
  nombre: ["nombre", "nombres", "apellido y nombre", "apellidos y nombres", "alumno", "estudiante"],
  legajo: ["legajo", "nro legajo", "numero legajo"],
  mesa: ["mesa", "n mesa", "nro mesa", "numero mesa", "mesa asignada"],
  orden: ["orden", "n orden", "nro orden", "numero orden"],
  ordenConsejo: ["orden consejo", "orden_consejo", "n orden consejo", "nro orden consejo", "numero orden consejo"],
  lugar: ["lugar", "sede", "establecimiento", "facultad", "escuela"],
  aula: ["aula", "salon", "curso"],
  direccion: ["direccion", "domicilio"],
  horario: ["horario", "hora"],
  anioIngreso: ["anio ingreso", "ano ingreso", "año ingreso", "anio de ingreso", "ano de ingreso", "año de ingreso"],
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function readStorageArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function writeStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readLibraryMaterials() {
  return readStorageArray(LIBRARY_MATERIALS_KEY);
}

function saveLibraryMaterials(materials) {
  writeStorageArray(LIBRARY_MATERIALS_KEY, materials);
}

function getMaterialTargetInfo(material) {
  return LIBRARY_MATERIAL_TARGETS[material.target] || {
    label: material.subject || "Sin destino asignado",
    section: material.year || "",
    category: material.category || "recursos",
  };
}

function getMaterialMeta(material) {
  const target = getMaterialTargetInfo(material);

  return [target.section, target.label, material.type]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" · ");
}

function renderPublicLibraryMaterials() {
  if (libraryMaterialSlots.length === 0) return;

  const materials = readLibraryMaterials()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  libraryMaterialSlots.forEach((slot) => {
    const target = slot.dataset.materialTarget || "";
    const targetMaterials = materials.filter((material) => material.target === target);
    const countLabel = slot.closest("[data-library-item]")?.querySelector("[data-material-count]");

    if (countLabel) {
      countLabel.dataset.emptyText = countLabel.dataset.emptyText || countLabel.textContent;
      countLabel.textContent = targetMaterials.length > 0
        ? `${targetMaterials.length} material${targetMaterials.length === 1 ? "" : "es"}`
        : countLabel.dataset.emptyText || "Material pendiente";
    }

    slot.innerHTML = targetMaterials.map((material) => {
      const link = String(material.url || "").trim();

      return `
        <article class="library-upload">
          <div>
            <strong>${escapeHtml(material.title)}</strong>
            <span>${escapeHtml(material.type || "Material")}</span>
          </div>
          ${material.description ? `<p>${escapeHtml(material.description)}</p>` : ""}
          ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir material</a>` : '<small>Sin link cargado</small>'}
        </article>
      `;
    }).join("");
  });

  updateLibraryView();
}

function formatAdminDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function isAdminUnlocked() {
  return isAdminSession();
}


function readAdminReports() {
  return readStorageArray(IRREGULARITY_STORAGE_KEY);
}

function saveAdminReports(reports) {
  writeStorageArray(IRREGULARITY_STORAGE_KEY, reports);
  irregularityPosts = reports;
}

function renderAdminDashboard() {
  const materials = readLibraryMaterials();
  const reports = readAdminReports();
  const pendingReports = reports.filter((report) => report.status !== "reviewed");

  if (adminTotalMaterials) adminTotalMaterials.textContent = String(materials.length);
  if (adminTotalReports) adminTotalReports.textContent = String(reports.length);
  if (adminPendingReports) adminPendingReports.textContent = String(pendingReports.length);
}

function renderAdminMaterials() {
  if (!adminMaterialList) return;

  const materials = readLibraryMaterials()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (materials.length === 0) {
    adminMaterialList.innerHTML = '<div class="admin-empty">Todavia no hay materiales cargados.</div>';
    renderAdminDashboard();
    return;
  }

  adminMaterialList.innerHTML = materials.map((material) => {
    const meta = getMaterialMeta(material) || "Sin categoria detallada";

    return `
      <article class="admin-item">
        <div class="admin-item-top">
          <div>
            <strong>${escapeHtml(material.title)}</strong>
            <span>${escapeHtml(meta)}</span>
          </div>
          <span class="admin-badge">${escapeHtml(material.category || "recursos")}</span>
        </div>
        ${material.description ? `<p>${escapeHtml(material.description)}</p>` : ""}
        ${material.url ? `<a href="${escapeHtml(material.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(material.url)}</a>` : '<small>Sin link cargado</small>'}
        <div class="admin-actions">
          <button type="button" data-admin-delete-material="${escapeHtml(material.id)}">Eliminar</button>
        </div>
      </article>
    `;
  }).join("");

  renderAdminDashboard();
}

function renderAdminReports() {
  if (!adminReportList) return;

  const reports = readAdminReports()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (reports.length === 0) {
    adminReportList.innerHTML = '<div class="admin-empty">Todavia no hay denuncias ni recomendaciones.</div>';
    renderAdminDashboard();
    return;
  }

  adminReportList.innerHTML = reports.map((report) => {
    const status = report.status === "reviewed" ? "Revisado" : "Pendiente";
    const contactData = [
      ["DNI", report.dni],
      ["Nombre", report.name],
      ["Mail", report.email],
      ["Telefono", report.phone],
    ].filter(([, value]) => value);
    const reactions = Object.entries(report.reactions || {})
      .filter(([, count]) => Number(count) > 0)
      .map(([emoji, count]) => `${emoji} ${count}`)
      .join(" ");
    const comments = (report.comments || []).map((comment) => `
      <li>${escapeHtml(comment.text)} <span>${escapeHtml(formatAdminDate(comment.createdAt))}</span></li>
    `).join("");

    return `
      <article class="admin-item ${report.status === "reviewed" ? "is-reviewed" : ""}">
        <div class="admin-item-top">
          <div>
            <strong>Reporte ${escapeHtml(status)}</strong>
            <span>${escapeHtml(formatAdminDate(report.createdAt))}</span>
          </div>
          <span class="admin-badge">${escapeHtml(status)}</span>
        </div>

        <p>${escapeHtml(report.message)}</p>

        ${contactData.length ? `
          <dl class="admin-mini-list">
            ${contactData.map(([label, value]) => `
              <div>
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(value)}</dd>
              </div>
            `).join("")}
          </dl>
        ` : '<small>Mensaje sin datos personales.</small>'}

        ${reactions ? `<p class="admin-reactions">${escapeHtml(reactions)}</p>` : ""}
        ${comments ? `<ul class="admin-comments">${comments}</ul>` : ""}

        <form class="admin-reply-form" data-admin-reply-form data-report-id="${escapeHtml(report.id)}">
          <label>
            Respuesta del admin
            <textarea name="reply" rows="3" maxlength="300" placeholder="Escribir una respuesta interna o publica">${escapeHtml(report.adminReply || "")}</textarea>
          </label>
          <button type="submit">Guardar respuesta</button>
        </form>

        <div class="admin-actions">
          <button type="button" data-admin-mark-report="${escapeHtml(report.id)}">${report.status === "reviewed" ? "Marcar pendiente" : "Marcar revisado"}</button>
          <button type="button" data-admin-delete-report="${escapeHtml(report.id)}">Eliminar</button>
        </div>
      </article>
    `;
  }).join("");

  renderAdminDashboard();
}

function renderAdminPanelState() {
  if (!adminLoginSection && !adminPanel) return;

  const unlocked = isAdminUnlocked();

  if (adminLoginSection) adminLoginSection.hidden = unlocked;
  if (adminPanel) adminPanel.hidden = !unlocked;
  if (adminLogoutButton) adminLogoutButton.hidden = !unlocked;

  if (unlocked) {
    renderAdminMaterials();
    renderAdminReports();
  } else if (adminLoginSection) {
    window.requestAnimationFrame(() => loginButton?.focus());
  }
}

renderPublicLibraryMaterials();


if (adminLogoutButton) {
  adminLogoutButton.addEventListener("click", () => {
    clearSession();
    showToast("Sesión cerrada");
  });
}

if (adminMaterialForm) {
  adminMaterialForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(adminMaterialForm);
    const title = String(formData.get("title") || "").trim();
    const target = String(formData.get("target") || "").trim();
    const targetInfo = LIBRARY_MATERIAL_TARGETS[target];

    if (!title) {
      showToast("Falta el titulo");
      return;
    }

    if (!targetInfo) {
      showToast("Elegí dónde se carga");
      return;
    }

    const materials = readLibraryMaterials();

    materials.push({
      id: createLocalId(),
      title,
      target,
      category: targetInfo.category,
      year: targetInfo.section,
      subject: targetInfo.label,
      type: String(formData.get("type") || "Link").trim(),
      url: String(formData.get("url") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      createdAt: new Date().toISOString(),
    });

    saveLibraryMaterials(materials);
    adminMaterialForm.reset();
    renderAdminMaterials();
    renderPublicLibraryMaterials();
    showToast("Material guardado");
  });
}

if (adminMaterialList) {
  adminMaterialList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-admin-delete-material]");
    if (!deleteButton) return;

    const materials = readLibraryMaterials()
      .filter((material) => material.id !== deleteButton.dataset.adminDeleteMaterial);

    saveLibraryMaterials(materials);
    renderAdminMaterials();
    renderPublicLibraryMaterials();
    showToast("Material eliminado");
  });
}

if (adminReportList) {
  adminReportList.addEventListener("click", (event) => {
    const markButton = event.target.closest("[data-admin-mark-report]");
    const deleteButton = event.target.closest("[data-admin-delete-report]");

    if (!markButton && !deleteButton) return;

    let reports = readAdminReports();

    if (markButton) {
      reports = reports.map((report) => {
        if (report.id !== markButton.dataset.adminMarkReport) return report;
        return {
          ...report,
          status: report.status === "reviewed" ? "pending" : "reviewed",
        };
      });
      showToast("Estado actualizado");
    }

    if (deleteButton) {
      reports = reports.filter((report) => report.id !== deleteButton.dataset.adminDeleteReport);
      showToast("Reporte eliminado");
    }

    saveAdminReports(reports);
    renderAdminReports();
    if (irregularityFeed) renderIrregularityFeed();
  });

  adminReportList.addEventListener("submit", (event) => {
    const replyForm = event.target.closest("[data-admin-reply-form]");
    if (!replyForm) return;

    event.preventDefault();

    const reply = String(new FormData(replyForm).get("reply") || "").trim();
    const reports = readAdminReports().map((report) => {
      if (report.id !== replyForm.dataset.reportId) return report;

      return {
        ...report,
        adminReply: reply,
        status: "reviewed",
        repliedAt: new Date().toISOString(),
      };
    });

    saveAdminReports(reports);
    renderAdminReports();
    showToast("Respuesta guardada");
  });
}

if (adminExportMaterials) {
  adminExportMaterials.addEventListener("click", () => {
    downloadJsonFile(readLibraryMaterials(), "materiales-biblioteca.json");
  });
}

if (adminExportReports) {
  adminExportReports.addEventListener("click", () => {
    downloadJsonFile(readAdminReports(), "reportes-libertad-cambio.json");
  });
}

renderAdminPanelState();

function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (words[0]?.[0] || "L") + (words[1]?.[0] || "C");
}

function setLoginStatus(message, tone = "neutral") {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.dataset.tone = tone;
}

function isAdminSession() {
  return activeSession?.role === "admin";
}

function renderAdminOnlyElements() {
  adminOnlyElements.forEach((element) => {
    element.hidden = !isAdminSession();
  });
}

function clearSession() {
  activeSession = null;

  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (error) {

  }

  renderLoginButton();
  renderAuthGate();
  renderAdminPanelState();
}

function setLoginMode(mode) {
  loginMode = mode === "admin" ? "admin" : "student";
  const isAdminMode = loginMode === "admin";

  loginModeButtons.forEach((button) => {
    const isActive = button.dataset.loginModeOption === loginMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (loginKicker) loginKicker.textContent = isAdminMode ? "Acceso administrador" : "Acceso estudiantes";
  if (loginTitle) loginTitle.textContent = isAdminMode ? "Ingresar clave" : "Ingresar DNI";
  if (loginCopy) {
    loginCopy.textContent = isAdminMode
      ? "Entrá con la clave del equipo para abrir el perfil administrador."
      : "Usá tu DNI sin puntos ni espacios para entrar con los datos del padrón.";
  }
  if (loginLabel) loginLabel.textContent = isAdminMode ? "Clave de administrador" : "DNI";

  if (loginDniInput) {
    loginDniInput.value = "";
    loginDniInput.name = isAdminMode ? "passcode" : "dni";
    loginDniInput.type = isAdminMode ? "password" : "text";
    loginDniInput.inputMode = "numeric";
    loginDniInput.autocomplete = isAdminMode ? "current-password" : "off";
    loginDniInput.maxLength = isAdminMode ? 7 : 8;
    loginDniInput.placeholder = isAdminMode ? "1336877" : "12345678";
  }

  setLoginStatus("");
}

function readStoredSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    const session = stored ? JSON.parse(stored) : null;

    if (session && !session.role) {
      session.role = "student";
    }

    return session;
  } catch (error) {
    return null;
  }
}

function saveSession(record) {
  activeSession = {
    role: "student",
    dni: record.dni,
    nombre: record.nombre || "Estudiante",
  };

  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
  } catch (error) {

  }
}

function saveAdminSession() {
  activeSession = {
    role: "admin",
    dni: "admin",
    nombre: "Administrador",
  };

  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  } catch (error) {

  }
}

function renderLoginButton() {
  renderAdminOnlyElements();

  if (!loginButton) return;

  loginButton.classList.toggle("is-admin", isAdminSession());

  if (!activeSession) {
    loginButton.classList.remove("is-logged-in");
    loginButton.innerHTML = "Iniciar sesión";
    loginButton.setAttribute("aria-label", "Iniciar sesión");
    return;
  }

  const initials = isAdminSession()
    ? "AD"
    : getInitials(activeSession.nombre).toLocaleUpperCase("es-AR");
  const profileName = isAdminSession() ? "Administrador" : activeSession.nombre;

  loginButton.classList.add("is-logged-in");
  loginButton.innerHTML = `
    <span class="login-initials" aria-hidden="true">${escapeHtml(initials)}</span>
    <span class="login-name">${escapeHtml(profileName)}</span>
  `;
  loginButton.setAttribute("aria-label", `Sesión iniciada como ${profileName}`);
}

function renderAuthGate() {
  const isLoggedIn = Boolean(activeSession);

  if (authGate) {
    authGate.hidden = isLoggedIn;
  }

  authContent.forEach((element) => {
    element.hidden = !isLoggedIn;
  });

  if (isLoggedIn) {
    updateLibraryView();
  }
}

function openLoginModal(mode = activeSession?.role || "student") {
  if (!loginModal) return;

  setLoginMode(mode);
  loginModal.hidden = false;
  setLoginStatus("");
  window.requestAnimationFrame(() => loginDniInput?.focus());
}

function closeLoginModal() {
  if (!loginModal) return;

  loginModal.hidden = true;
  if (loginForm) loginForm.reset();
  setLoginStatus("");
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const options = [",", ";", "\t"];

  return options.reduce((best, delimiter) => {
    const count = firstLine.split(delimiter).length;
    return count > best.count ? { delimiter, count } : best;
  }, { delimiter: ",", count: 0 }).delimiter;
}

function parseCsv(text) {
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);

  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeText);

  return rows.slice(1).map((values) => {
    return headers.reduce((record, header, index) => {
      record[header] = values[index] || "";
      return record;
    }, {});
  });
}

function getField(record, aliases) {
  const normalizedAliases = aliases.map(normalizeText);
  const key = Object.keys(record).find((recordKey) => normalizedAliases.includes(recordKey));
  return key ? record[key] : "";
}

function mapPadronRecord(record) {
  return {
    dni: onlyDigits(getField(record, fieldAliases.dni)),
    nombre: getField(record, fieldAliases.nombre),
    legajo: getField(record, fieldAliases.legajo),
    mesa: getField(record, fieldAliases.mesa),
    orden: getField(record, fieldAliases.orden),
    ordenConsejo: getField(record, fieldAliases.ordenConsejo),
    lugar: getField(record, fieldAliases.lugar),
    aula: getField(record, fieldAliases.aula),
    direccion: getField(record, fieldAliases.direccion),
    horario: getField(record, fieldAliases.horario),
    anioIngreso: getField(record, fieldAliases.anioIngreso),
  };
}

function setStatus(message, tone = "neutral") {
  if (!padronStatus) return;
  padronStatus.textContent = message;
  padronStatus.dataset.tone = tone;
}

function hideResult() {
  if (!padronResult) return;
  padronResult.hidden = true;
  padronResult.innerHTML = "";
}

function showResult(record) {
  if (!padronResult) return;

  const details = [
    ["Orden Centro", record.orden || "No figura"],
    ["Orden Consejo", record.ordenConsejo || "No figura"],
    ["Mesa", record.mesa],
    ["Aula", record.aula],
    ["Lugar", record.lugar],
    ["Año de ingreso", record.anioIngreso],
    ["Direccion", record.direccion],
    ["Horario", record.horario],
    ["Legajo", record.legajo],
  ].filter(([, value]) => value);

  padronResult.innerHTML = `
    <p class="result-eyebrow">Resultado encontrado</p>
    <h3>${escapeHtml(record.nombre || "Estudiante habilitado")}</h3>
    <dl>
      ${details.map(([label, value]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>
      `).join("")}
    </dl>
    <div class="result-brand" aria-label="Libertad y Cambio">
      <img src="imagen/logo-donde-votas.png" alt="Libertad y Cambio" loading="lazy" decoding="async">
    </div>
  `;

  padronResult.hidden = false;
}

async function loadPadron() {
  if (padronLoadPromise) return padronLoadPromise;

  padronLoadPromise = (async () => {
    const response = await fetch(PADRON_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("No se pudo cargar el padron");
    }

    const text = await response.text();
    padronRecords = parseCsv(text)
      .map(mapPadronRecord)
      .filter((record) => record.dni);

    padronLoaded = true;
    setStatus(`Padron cargado: ${padronRecords.length} registros disponibles.`);
    return padronRecords;
  })();

  try {
    return await padronLoadPromise;
  } catch (error) {
    padronLoaded = false;
    padronLoadPromise = null;
    setStatus("No encontre padron.csv. Coloca el archivo en la carpeta principal de la pagina.", "error");
    throw error;
  }
}

if (dniInput) {
  dniInput.addEventListener("input", () => {
    dniInput.value = onlyDigits(dniInput.value).slice(0, 8);
    hideResult();
  });
}

if (padronForm) {
  padronForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dni = onlyDigits(dniInput?.value);
    hideResult();

    if (!/^\d{7,8}$/.test(dni)) {
      setStatus("Ingresá un DNI válido, sin puntos ni espacios.", "error");
      return;
    }

    if (!padronLoaded) {
      try {
        setStatus("Cargando padrón...");
        await loadPadron();
      } catch (error) {
        setStatus("No se pudo cargar el padrón. Intentá de nuevo.", "error");
        return;
      }
    }

    const record = padronRecords.find((item) => item.dni === dni);

    if (!record) {
      setStatus("No encontramos ese DNI en el padrón cargado.", "error");
      return;
    }

    setStatus("Consulta realizada correctamente.", "success");
    showResult(record);
  });
}

activeSession = readStoredSession();
renderLoginButton();
renderAuthGate();
renderAdminPanelState();

if (loginDniInput) {
  loginDniInput.addEventListener("input", () => {
    if (loginMode === "student") {
      loginDniInput.value = onlyDigits(loginDniInput.value).slice(0, 8);
    }
    setLoginStatus("");
  });
}

if (loginButton) {
  loginButton.addEventListener("click", () => {
    openLoginModal(activeSession?.role || "student");
  });
}

if (loginGateButton) {
  loginGateButton.addEventListener("click", () => {
    openLoginModal(loginGateButton.dataset.loginMode || "student");
  });
}

loginModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLoginMode(button.dataset.loginModeOption || "student");
  });
});

if (loginClose) {
  loginClose.addEventListener("click", closeLoginModal);
}

if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) closeLoginModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && loginModal && !loginModal.hidden) {
    closeLoginModal();
  }
});

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (loginMode === "admin") {
      const passcode = onlyDigits(loginDniInput?.value).slice(0, 7);

      if (passcode !== ADMIN_PASSCODE) {
        setLoginStatus("Clave de administrador incorrecta.", "error");
        return;
      }

      saveAdminSession();
      renderLoginButton();
      renderAuthGate();
      renderAdminPanelState();
      setLoginStatus("Sesión de administrador iniciada.", "success");
      closeLoginModal();
      showToast("Perfil administrador activo");
      return;
    }

    const dni = onlyDigits(loginDniInput?.value);

    if (!/^\d{7,8}$/.test(dni)) {
      setLoginStatus("Ingresá un DNI válido, sin puntos ni espacios.", "error");
      return;
    }

    try {
      setLoginStatus("Verificando padrón...");
      await loadPadron();

      const record = padronRecords.find((item) => item.dni === dni);

      if (!record) {
        setLoginStatus("Ese DNI no figura en el padrón cargado.", "error");
        return;
      }

      saveSession(record);
      renderLoginButton();
      renderAuthGate();
      renderAdminPanelState();
      setLoginStatus("Sesión iniciada correctamente.", "success");
      closeLoginModal();
      showToast(`Hola ${record.nombre}`);
    } catch (error) {
      setLoginStatus("No se pudo cargar el padrón. Intentá de nuevo.", "error");
    }
  });
}

if (padronForm) {
  loadPadron().catch(() => {});
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      
    });
  });
}














