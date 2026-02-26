/* Autumn Leaves - app.js
  Lógica de gestión de tareas con estética otoñal.
*/

// ---------- Utilidades ----------
const $ = (sel) => document.querySelector(sel);
const formatDateTime = (isoOrDate) => {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  // Formato amigable español
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const safeTrim = (s) => String(s ?? "").trim();

// ---------- Modelo ----------
class Tarea {
  constructor({ id, descripcion, estado = "pendiente", fechaCreacion, fechaLimite = null, eliminada = false }) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = estado; 
    this.fechaCreacion = fechaCreacion ?? new Date().toISOString();
    this.fechaLimite = fechaLimite; 
    this.eliminada = eliminada; 
  }

  cambiarEstado = () => {
    this.estado = this.estado === "pendiente" ? "completada" : "pendiente";
  };

  actualizarDescripcion = (nuevaDescripcion) => {
    const desc = safeTrim(nuevaDescripcion);
    if (desc.length < 3) throw new Error("La nota debe tener al menos 3 caracteres.");
    this.descripcion = desc;
  };

  eliminar = () => {
    this.eliminada = true;
  };

  toJSON = () => ({
    id: this.id,
    descripcion: this.descripcion,
    estado: this.estado,
    fechaCreacion: this.fechaCreacion,
    fechaLimite: this.fechaLimite,
    eliminada: this.eliminada,
  });
}

// ---------- Gestor ----------
class GestorTareas {
  constructor(storageKey = "autumn_leaves_notas") { // Cambiamos la clave de storage
    this.storageKey = storageKey;
    this.tareas = [];
  }

  agregarTarea = ({ descripcion, fechaLimite = null }) => {
    const desc = safeTrim(descripcion);
    if (desc.length < 3) throw new Error("La descripción debe tener al menos 3 caracteres.");

    const id = Date.now(); 
    const nueva = new Tarea({ id, descripcion: desc, fechaLimite });
    this.tareas = [...this.tareas, nueva]; 
    this.guardarEnLocalStorage();
    return nueva;
  };

  editarTarea = (id, nuevaDescripcion) => {
    const tarea = this.obtenerPorId(id);
    if (!tarea) throw new Error("No se encontró la nota a editar.");
    tarea.actualizarDescripcion(nuevaDescripcion);
    this.guardarEnLocalStorage();
  };

  eliminarTarea = (id) => {
    const tarea = this.obtenerPorId(id);
    if (!tarea) return;
    tarea.eliminar();
    this.tareas = this.tareas.filter((t) => t.id !== id);
    this.guardarEnLocalStorage();
  };

  cambiarEstadoTarea = (id) => {
    const tarea = this.obtenerPorId(id);
    if (!tarea) return;
    tarea.cambiarEstado();
    this.guardarEnLocalStorage();
  };

  obtenerPorId = (id) => this.tareas.find((t) => t.id === id);

  limpiarTodo = () => {
    this.tareas = [];
    this.guardarEnLocalStorage();
  };

  guardarEnLocalStorage = () => {
    localStorage.setItem(this.storageKey, JSON.stringify(this.tareas.map((t) => t.toJSON())));
  };

  cargarDesdeLocalStorage = () => {
    const raw = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    this.tareas = raw
      .filter((x) => x && !x.eliminada)
      .map(({ id, descripcion, estado, fechaCreacion, fechaLimite, eliminada }) => {
        return new Tarea({ id, descripcion, estado, fechaCreacion, fechaLimite, eliminada });
      });
  };
}

// ---------- API (JSONPlaceholder) ----------
const API_URL = "https://jsonplaceholder.typicode.com/todos";

const recuperarTareasAPI = async (limit = 3) => { // Traemos menos para que parezca más una "sugerencia"
  try {
    const res = await fetch(`${API_URL}?_limit=${limit}`);
    if (!res.ok) throw new Error(`GET falló: ${res.status}`);
    const data = await res.json();
    return data; 
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const guardarTareaAPI = async (tarea) => {
  try {
    const payload = { title: tarea.descripcion, completed: tarea.estado === "completada", userId: 1 };
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`POST falló: ${res.status}`);
    return await res.json(); 
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// ---------- UI State ----------
const gestor = new GestorTareas();
gestor.cargarDesdeLocalStorage();

const els = {
  form: $("#taskForm"),
  taskDesc: $("#taskDesc"),
  taskDeadline: $("#taskDeadline"),
  addBtn: $("#addBtn"),
  syncBtn: $("#syncBtn"),
  clearBtn: $("#clearBtn"),
  taskList: $("#taskList"),
  emptyState: $("#emptyState"),
  helperText: $("#helperText"),
  searchInput: $("#searchInput"),
  filterSelect: $("#filterSelect"),
  toast: $("#toast"),
};

let ui = { search: "", filter: "todas", editingId: null };

// ---------- Notificaciones (Soft) ----------
const showHelper = (msg) => { els.helperText.textContent = msg ?? ""; };

const toast = (msg, ms = 2500) => {
  els.toast.textContent = msg;
  els.toast.style.opacity = '1';
  setTimeout(() => {
    els.toast.style.opacity = '0';
    setTimeout(() => { if (els.toast.textContent === msg) els.toast.textContent = ""; }, 300);
  }, ms);
};

// ---------- Render ----------
const getCountdownBadge = (tarea) => {
  if (!tarea.fechaLimite) return null; // No mostramos nada si no hay fecha

  const now = Date.now();
  const end = new Date(tarea.fechaLimite).getTime();
  const diff = end - now;

  if (diff <= 0) return { text: "Tiempo cumplido", cls: "badge--danger" };

  const totalSec = Math.floor(diff / 1000);
  const min = Math.floor(totalSec / 60);
  
  if (min < 60) return { text: `Quedan ${min} min`, cls: "badge--warn" };
  
  const horas = Math.floor(min / 60);
  if (horas < 24) return { text: `Queda ${horas} hora${horas>1?'s':''}`, cls: "" };

  const dias = Math.floor(horas / 24);
  return { text: `Quedan ${dias} día${dias>1?'s':''}`, cls: "" };
};

const render = () => {
  const search = safeTrim(ui.search).toLowerCase();
  const filter = ui.filter;

  const tareasVisibles = gestor.tareas.filter((t) => {
    const matchSearch = t.descripcion.toLowerCase().includes(search);
    const matchFilter = filter === "todas" ? true : t.estado === filter;
    return matchSearch && matchFilter;
  });

  els.taskList.innerHTML = "";

  if (tareasVisibles.length === 0) {
    els.emptyState.style.display = "block";
  } else {
    els.emptyState.style.display = "none";
  }

  tareasVisibles.forEach((tarea) => {
    const li = document.createElement("li");
    li.className = "task";
    li.dataset.id = String(tarea.id);

    // mouseover efecto suave
    li.addEventListener("mouseover", () => li.classList.add("task--hover"));
    li.addEventListener("mouseout", () => li.classList.remove("task--hover"));

    const left = document.createElement("div");
    left.className = "task__left";

    // Título / Edición inline
    const titleContainer = document.createElement("div");
    titleContainer.className = "task__title-container";
    
    if (ui.editingId === tarea.id) {
      const editInput = document.createElement("input");
      editInput.className = "note-form__input note-form__input--edit";
      editInput.value = tarea.descripcion;
      editInput.autofocus = true;

      editInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") onSaveEdit(tarea.id, editInput.value);
        if (e.key === "Escape") { ui.editingId = null; render(); }
      });
      titleContainer.appendChild(editInput);
    } else {
      const title = document.createElement("p");
      title.className = "task__title";
      title.textContent = tarea.descripcion;
      // Estilo tachado si está completada
      if (tarea.estado === "completada") title.style.textDecoration = "line-through"; title.style.opacity = "0.7";
      titleContainer.appendChild(title);
    }

    // Meta información (creación)
    const meta = document.createElement("p");
    meta.className = "task__meta";
    meta.textContent = `Añadida: ${formatDateTime(tarea.fechaCreacion)}`;

    // Contenedor de Badges
    const badges = document.createElement("div");
    badges.className = "badges-container";

    // Badge Estado
    const statusBadge = document.createElement("span");
    statusBadge.className = `badge ${tarea.estado === "completada" ? "badge--ok" : ""}`;
    statusBadge.textContent = tarea.estado === "completada" ? "Completada ✅" : "Pendiente";
    badges.appendChild(statusBadge);

    // Badge Cuenta regresiva
    const cd = getCountdownBadge(tarea);
    if (cd) {
      const deadlineBadge = document.createElement("span");
      deadlineBadge.className = `badge ${cd.cls}`;
      deadlineBadge.textContent = cd.text;
      badges.appendChild(deadlineBadge);
    }

    left.appendChild(titleContainer);
    left.appendChild(meta);
    left.appendChild(badges);

    // Acciones de la nota
    const actions = document.createElement("div");
    actions.className = "task__actions";

    // Si está editando, mostramos botones Guardar/Cancelar
    if (ui.editingId === tarea.id) {
      const btnSave = document.createElement("button");
      btnSave.className = "btn btn--solid btn--task-save";
      btnSave.textContent = "Guardar Cambios";
      btnSave.addEventListener("click", () => {
        const input = li.querySelector("input.note-form__input--edit");
        onSaveEdit(tarea.id, input?.value);
      });

      const btnCancel = document.createElement("button");
      btnCancel.className = "btn btn--task-action btn--task-cancel";
      btnCancel.textContent = "Cancelar";
      btnCancel.addEventListener("click", () => { ui.editingId = null; render(); });

      actions.appendChild(btnSave);
      actions.appendChild(btnCancel);
    } else {
      // Botones normales
      const btnToggle = document.createElement("button");
      btnToggle.className = `btn btn--task-action ${tarea.estado === "pendiente" ? 'btn--solid' : ''}`;
      btnToggle.textContent = tarea.estado === "pendiente" ? "Marcar como hecha" : "Reabrir nota";
      btnToggle.addEventListener("click", () => { gestor.cambiarEstadoTarea(tarea.id); render(); });

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn btn--task-action";
      btnEdit.textContent = "Editar descripción";
      btnEdit.disabled = ui.editingId !== null;
      btnEdit.addEventListener("click", () => { ui.editingId = tarea.id; render(); });

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn btn--task-danger";
      btnDelete.textContent = "Eliminar nota";
      btnDelete.addEventListener("click", () => {
        // Un confirm más amigable
        if(confirm("¿Seguro que deseas eliminar esta nota?")) {
            gestor.eliminarTarea(tarea.id);
            toast("Nota eliminada con éxito");
            render();
        }
      });

      actions.appendChild(btnToggle);
      actions.appendChild(btnEdit);
      actions.appendChild(btnDelete);
    }

    li.appendChild(left);
    li.appendChild(actions);
    els.taskList.appendChild(li);
  });
};

// ---------- Handlers ----------
const setFormLoading = (isLoading, message = "") => {
  els.addBtn.disabled = isLoading;
  els.syncBtn.disabled = isLoading;
  els.clearBtn.disabled = isLoading;
  els.taskDesc.disabled = isLoading;
  els.taskDeadline.disabled = isLoading;
  showHelper(message);
};

const onSaveEdit = (id, value) => {
  try {
    gestor.editarTarea(id, value);
    ui.editingId = null;
    toast("Nota actualizada");
    render();
  } catch (e) {
    showHelper(e.message);
  }
};

// submit: agrega con retardo real (setTimeout)
els.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const descripcion = safeTrim(els.taskDesc.value);
  const fechaLimite = els.taskDeadline.value ? new Date(els.taskDeadline.value).toISOString() : null;

  if (descripcion.length < 3) {
    showHelper("Escribe una descripción de al menos 3 caracteres.");
    return;
  }

  setFormLoading(true, "Añadiendo tu nota...");
  setTimeout(() => {
    try {
      gestor.agregarTarea({ descripcion, fechaLimite });
      els.taskDesc.value = "";
      els.taskDeadline.value = "";
      showHelper("");
      toast("Nota guardada 🍂", 2000);
      render();
    } catch (err) {
      showHelper(err.message);
    } finally {
      setFormLoading(false, "");
    }
  }, 1000); // Un retardo más corto para mejor UX
});

// keyup: búsqueda
els.searchInput.addEventListener("keyup", (e) => {
  ui.search = e.target.value;
  render();
});

els.filterSelect.addEventListener("change", (e) => {
  ui.filter = e.target.value;
  render();
});

els.clearBtn.addEventListener("click", () => {
  const ok = confirm("¿Seguro que deseas borrar todas tus notas guardadas?");
  if (!ok) return;
  gestor.limpiarTodo();
  ui.editingId = null;
  toast("Lista limpiada");
  render();
});

els.syncBtn.addEventListener("click", async () => {
  try {
    setFormLoading(true, "Sincronizando sugerencias...");
    const data = await recuperarTareasAPI(3);

    data.forEach(({ title }) => {
      gestor.agregarTarea({ descripcion: `💡 ${title}`, fechaLimite: null });
    });

    toast("Sincronización completada ✅");
    render();
  } catch {
    toast("Error de conexión ❌");
  } finally {
    setFormLoading(false, "");
  }
});

// ---------- Contador regresivo global (setInterval) ----------
setInterval(() => {
  const hasDeadline = gestor.tareas.some((t) => t.fechaLimite && t.estado === 'pendiente');
  if (hasDeadline) render(); // Solo re-renderiza si hay pendientes con fecha
}, 10000); // Actualizamos cada 10 segundos, no cada segundo, para suavidad.

// Inicial
render();
