import { useState, useEffect } from "react";
import type { AdminTask } from "@/shared/types";
import "./AdminTodoList.css";

export default function AdminTodoList() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState<"Logistics" | "Communication" | "Admin">("Logistics");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch("/api/tasks");
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask,
          category,
          priority,
          status: "pending",
        }),
      });

      if (response.ok) {
        const createdTask = await response.json();
        setTasks((prev) => [...prev, createdTask]);
        setNewTask("");
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");

  if (isLoading) {
    return <div className="admin-todo-list loading">Loading tasks...</div>;
  }

  return (
    <div className="admin-todo-list">
      <form onSubmit={handleAddTask} className="task-form">
        <div className="form-row">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new task..."
            className="task-input"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
            <option value="Logistics">Logistics</option>
            <option value="Communication">Communication</option>
            <option value="Admin">Admin</option>
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="submit">Add</button>
        </div>
      </form>

      <div className="task-list">
        {pendingTasks.length === 0 ? (
          <p className="empty-state">No pending tasks 🎉</p>
        ) : (
          pendingTasks.map((task) => (
            <div key={task.id} className={`task-item priority-${task.priority}`}>
              <input
                type="checkbox"
                checked={task.status === "completed"}
                onChange={() => handleToggleTask(task.id, task.status)}
                className="task-checkbox"
              />
              <div className="task-content">
                <p className="task-title">{task.title}</p>
                <span className="task-category">{task.category}</span>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="task-delete"
                title="Delete task"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {tasks.filter((t) => t.status === "completed").length > 0 && (
        <div className="completed-section">
          <p className="completed-label">
            Completed ({tasks.filter((t) => t.status === "completed").length})
          </p>
        </div>
      )}
    </div>
  );
}
