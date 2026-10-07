export type TaskStatus = "pending" | "in-progress" | "completed";

export interface AdminTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  
  dueDate?: Date;
  assignedTo?: string; // Coach/staff ID
  
  category: "Logistics" | "Communication" | "Admin" | "Other";
  
  priority: "low" | "medium" | "high";
  
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
