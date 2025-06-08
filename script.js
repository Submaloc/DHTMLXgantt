gantt.config.date_format = "%Y-%m-%d";

gantt.config.columns = [
  { name: "text", label: "Название", tree: true, width: '*' },
  { name: "start_date", label: "Начало", align: "center" },
  { name: "duration", label: "Длительность", align: "center" }
];


gantt.types = {
  project: "project",
  phase: "phase",
  task: "task",
  assignment: "assignment"
};


gantt.getChildrenTypes = function(type) {
  switch(type) {
    case gantt.types.project:
      return [gantt.types.phase, gantt.types.task, gantt.types.assignment];
    case gantt.types.phase:
      return [gantt.types.task, gantt.types.assignment];
    case gantt.types.task:
      return [gantt.types.assignment];
    case gantt.types.assignment:
      return [];
    default:
      return [];
  }
};


gantt.config.lightbox.sections = [];


gantt.showLightbox = function(id) {
  const task = gantt.getTask(id);

  if (task.type === gantt.types.assignment) return;

  const types = gantt.getChildrenTypes(task.type);

  const typeOptions = types
    .map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`)
    .join("");

  const form = document.createElement("div");
  form.className = "gantt_modal_box";
  form.style.position = "fixed";
  form.style.top = "50%";
  form.style.left = "50%";
  form.style.transform = "translate(-50%, -50%)";
  form.style.background = "#fff";
  form.style.border = "1px solid #ccc";
  form.style.zIndex = 1000;
  form.style.padding = "20px";
  form.innerHTML = `
    <label>Тип:</label>
    <select id="new_task_type">${typeOptions}</select><br><br>
    <label>Название:</label>
    <input type="text" id="new_task_text" style="width: 100%;"><br><br>
    <label>Длительность (часы):</label>
    <input type="number" id="new_task_duration" value="8"><br><br>
    <button id="create_task_btn">Создать</button>
    <button id="cancel_task_btn">Отмена</button>
  `;

  document.body.appendChild(form);

  const createBtn = form.querySelector("#create_task_btn");
  const cancelBtn = form.querySelector("#cancel_task_btn");

  const closeModal = () => {
    if (form && form.parentNode) {
      form.parentNode.removeChild(form);
    }
  };

  createBtn.onclick = () => {
    const type = form.querySelector("#new_task_type").value;
    const text = form.querySelector("#new_task_text").value;
    const duration = parseInt(form.querySelector("#new_task_duration").value) || 8;

    if (!text.trim()) {
      gantt.message({ type: "error", text: "Введите название задачи" });
      return;
    }

    const newTask = {
      id: gantt.uid(),
      text,
      type,
      duration,
      start_date: gantt.getTask(id).start_date,
      parent: id
    };

    gantt.addTask(newTask, id);
    closeModal();
  };

  cancelBtn.onclick = () => {
    closeModal();
  };
};


gantt.attachEvent("onBeforeTaskAdd", function(id, task) {
  const parent = gantt.getTask(task.parent);
  if (parent && parent.type === gantt.types.assignment) {
    alert("Нельзя добавлять подзадачи к assignment");
    return false;
  }
  return true;
});


gantt.init("gantt_here");

gantt.parse({
  data: [
    {
      id: 1, text: "Запуск мобильного приложения", type: "project", start_date: "2025-06-01", duration: 20, open: true
    },
    {
      id: 2, text: "Дизайн UI/UX", type: "phase", start_date: "2025-06-01", duration: 5, parent: 1, open: true
    },
    {
      id: 3, text: "Создать макеты экрана входа", type: "task", start_date: "2025-06-01", duration: 2, parent: 2, open: true
    },
    { id: 4, text: "Дизайнер Аня — 8 часов", type: "assignment", start_date: "2025-06-01", duration: 1, parent: 3 },
    { id: 5, text: "Дизайнер Борис — 6 часов", type: "assignment", start_date: "2025-06-01", duration: 1, parent: 3 },
    {
      id: 6, text: "Создать макеты экрана регистрации", type: "task", start_date: "2025-06-02", duration: 2, parent: 2, open: true
    },
    { id: 7, text: "Дизайнер Аня — 16 часов", type: "assignment", start_date: "2025-06-02", duration: 2, parent: 6 },

    {
      id: 8, text: "Разработка", type: "phase", start_date: "2025-06-06", duration: 7, parent: 1, open: true
    },
    { id: 9, text: "Разработка экрана входа", type: "task", start_date: "2025-06-06", duration: 3, parent: 8 },
    { id: 10, text: "Разработка экрана регистрации", type: "task", start_date: "2025-06-09", duration: 3, parent: 8 },

    {
      id: 11, text: "Тестирование", type: "phase", start_date: "2025-06-13", duration: 3, parent: 1, open: true
    },
    { id: 12, text: "Тестирование экранов", type: "task", start_date: "2025-06-13", duration: 2, parent: 11, open: true },
    { id: 13, text: "Тестировщик Ирина — 20 часов", type: "assignment", start_date: "2025-06-13", duration: 3, parent: 12 }
  ]
});
