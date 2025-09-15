import { z } from "zod";

export const TaskStatusEnum = z.enum(["pending", "in-progress", "completed"]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: TaskStatusEnum.default("pending"),
  attachment: z.boolean().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const UpdateStatusSchema = z.object({
  status: TaskStatusEnum,
});
