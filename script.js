gantt.config.date_format = "%Y-%m-%d";

gantt.config.columns = [
  { name: "text", label: "Name", tree: true, width: 300 }, 
  { name: "start_date", label: "Start", align: "center", width: 100 }, 
  { name: "end_date", label: "End", align: "center", width: 100 } 
];

gantt.types = {
  project: "project",
  phase: "phase",
  task: "task",
  assignment: "assignment"
};

gantt.getChildrenTypes = function(type) {
  switch (type) {
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
  const typeOptions = types.map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("");

  const form = document.createElement("div");
  form.className = "gantt_modal_box";
  form.innerHTML =
    `<label>Type:</label>
     <select id="new_task_type">${typeOptions}</select>

     <label>Name:</label>
     <input type="text" id="new_task_text">

     <label>Task start (yyyy-mm-dd):</label>
     <input type="text" id="new_task_start" placeholder="2025-06-01">

     <label>Task end (yyyy-mm-dd):</label>
     <input type="text" id="new_task_end" placeholder="2025-06-03">

     <label>Resource:</label>
     <input type="text" id="new_task_resource" placeholder="John Smith">

     <button id="create_task_btn">Create</button>
     <button id="cancel_task_btn">Cancel</button>`;

  document.body.appendChild(form);

  form.querySelector("#create_task_btn").onclick = () => {
    const type = form.querySelector("#new_task_type").value;
    const text = form.querySelector("#new_task_text").value.trim();
    const startStr = form.querySelector("#new_task_start").value.trim();
    const endStr = form.querySelector("#new_task_end").value.trim();
    const resource = form.querySelector("#new_task_resource").value.trim();

    if (!text || !startStr || !endStr) {
      gantt.message({ type: "error", text: "Please fill in all fields" });
      return;
    }

    const startDate = gantt.date.parseDate(startStr, gantt.config.date_format);
    const endDate = gantt.date.parseDate(endStr, gantt.config.date_format);

    if (!startDate || !endDate || startDate >= endDate) {
      gantt.message({ type: "error", text: "Invalid dates" });
      return;
    }

    const duration = gantt.calculateDuration({
      start_date: startDate,
      end_date: endDate
    });

    const newTask = {
      id: gantt.uid(),
      text: resource ? `${text} — ${resource}` : text,
      type,
      start_date: startDate,
      end_date: endDate,
      duration,
      parent: id
    };

    gantt.addTask(newTask, id);
    form.remove();
  };

  form.querySelector("#cancel_task_btn").onclick = () => form.remove();
};

gantt.attachEvent("onBeforeTaskAdd", function(id, task) {
  const parent = gantt.getTask(task.parent);
  if (parent && parent.type === gantt.types.assignment) {
    alert("Cannot add subtasks to an assignment");
    return false;
  }
  return true;
});

gantt.attachEvent("onBeforeLinkAdd", function(id, link) {
  const sourceTask = gantt.getTask(link.source);
  const targetTask = gantt.getTask(link.target);

  if (sourceTask.type === gantt.types.assignment || targetTask.type === gantt.types.assignment) {
    alert("Links with Assignment type tasks are not allowed");
    return false;
  }
  return true;
});

gantt.templates.task_class = function(start, end, task) {
  return "type_" + task.type;
};

gantt.templates.columns = {};
gantt.templates.columns["end_date"] = function(task) {
  if (task.end_date) {
    return gantt.templates.date_grid(task.end_date);
  }
  return "";
};

let syncAssignmentsOnDrag = true;

const toggleButton = document.createElement("button");
toggleButton.textContent = "Assignment Sync: ON";
toggleButton.className = "btn-sync-toggle";
toggleButton.onclick = () => {
  syncAssignmentsOnDrag = !syncAssignmentsOnDrag;
  toggleButton.textContent = `Assignment Sync: ${syncAssignmentsOnDrag ? "ON" : "OFF"}`;
};
document.body.appendChild(toggleButton);

gantt.attachEvent("onTaskDrag", function(id, mode, task, original) {
  if (!syncAssignmentsOnDrag || mode !== "move") return true;

  const diff = task.start_date - original.start_date;

  if (task.type !== gantt.types.assignment) {
    gantt.eachTask(function(child) {
      if (child.type === gantt.types.assignment && gantt.isChildOf(child.id, task.id)) {
        child.start_date = new Date(+child.start_date + diff);
        gantt.updateTask(child.id);
      }
    });
  }

  return true;
});

const convertButton = document.createElement("button");
convertButton.textContent = "Convert baseline";
convertButton.className = "btn-convert-baseline";
convertButton.onclick = () => {
  const tasks = gantt.getTaskByTime();

  tasks.forEach(task => {
    if (task.baselines && task.baselines.length) {
      const oldTaskId = task.id;

      task.type = gantt.types.project;
      gantt.updateTask(oldTaskId);

      task.baselines.forEach(b => {
        const newTask = {
          id: gantt.uid(),
          text: b.text,
          type: gantt.types.task,
          start_date: b.start_date,
          duration: b.duration,
          parent: oldTaskId
        };
        gantt.addTask(newTask);
      });

      delete task.baselines;
    }
  });

  gantt.message("Conversion completed");
};
document.body.appendChild(convertButton);

gantt.init("gantt_here");

gantt.parse({
  data: [
    {
      id: 1, text: "Mobile App Launch", type: "project", start_date: "2025-06-01", end_date: "2025-06-21", open: true
    },
    {
      id: 2, text: "UI/UX Design", type: "phase", start_date: "2025-06-01", end_date: "2025-06-06", parent: 1, open: true
    },
    {
      id: 3,
      text: "Create login screen mockups",
      type: "task",
      start_date: "2025-06-01",
      end_date: "2025-06-03",
      parent: 2,
      open: true,
      baselines: [
        { text: "Plan A", start_date: "2025-05-30", duration: 2 },
        { text: "Plan B", start_date: "2025-05-31", duration: 2 }
      ]
    },
    { id: 4, text: "Designer Anna — 8 hours", type: "assignment", start_date: "2025-06-01", end_date: "2025-06-02", parent: 3 },
    { id: 5, text: "Designer Boris — 6 hours", type: "assignment", start_date: "2025-06-01", end_date: "2025-06-02", parent: 3 },
    {
      id: 6, text: "Create registration screen mockups", type: "task", start_date: "2025-06-02", end_date: "2025-06-04", parent: 2, open: true
    },
    { id: 7, text: "Designer Anna — 16 hours", type: "assignment", start_date: "2025-06-02", end_date: "2025-06-04", parent: 6 },
    {
      id: 8, text: "Development", type: "phase", start_date: "2025-06-06", end_date: "2025-06-13", parent: 1, open: true
    },
    { id: 9, text: "Login screen development", type: "task", start_date: "2025-06-06", end_date: "2025-06-09", parent: 8 },
    { id: 10, text: "Registration screen development", type: "task", start_date: "2025-06-09", end_date: "2025-06-12", parent: 8 },
    {
      id: 11, text: "Testing", type: "phase", start_date: "2025-06-13", end_date: "2025-06-16", parent: 1, open: true
    },
    { id: 12, text: "Screen testing", type: "task", start_date: "2025-06-13", end_date: "2025-06-15", parent: 11, open: true },
    { id: 13, text: "Tester Irina — 20 hours", type: "assignment", start_date: "2025-06-13", end_date: "2025-06-16", parent: 12 }
  ]
});
