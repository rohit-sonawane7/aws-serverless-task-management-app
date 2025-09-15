import { describe, it, expect } from "vitest";
import { CreateTaskSchema, UpdateTaskSchema, UpdateStatusSchema } from "../src/validation/taskSchema";

describe("Task Validation Schemas", () => {
    // ✅ CreateTaskSchema
    describe("CreateTaskSchema", () => {
        it("should validate a valid task payload", () => {
            const result = CreateTaskSchema.safeParse({
                title: "My Task",
                description: "Details",
                status: "pending",
                attachment: true,
            });
            expect(result.success).toBe(true);
        });

        it("should fail if title is missing", () => {
            const result = CreateTaskSchema.safeParse({
                description: "Details",
            });
            console.log(result);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toContain("Invalid input: expected string, received undefined");
            }
        });

        it("should default status to 'pending' if not provided", () => {
            const result = CreateTaskSchema.safeParse({ title: "My Task" });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.status).toBe("pending");
            }
        });
    });

    // ✅ UpdateTaskSchema
    describe("UpdateTaskSchema", () => {
        it("should validate update payload", () => {
            const result = UpdateTaskSchema.safeParse({
                title: "Updated",
                description: "Changed desc",
            });
            expect(result.success).toBe(true);
        });

        it("should fail if title is empty", () => {
            const result = UpdateTaskSchema.safeParse({
                title: "",
                description: "Changed desc",
            });
            expect(result.success).toBe(false);
        });
    });

    // ✅ UpdateStatusSchema
    describe("UpdateStatusSchema", () => {
        it("should accept valid statuses", () => {
            for (const status of ["pending", "in-progress", "completed"]) {
                const result = UpdateStatusSchema.safeParse({ status });
                expect(result.success).toBe(true);
            }
        });

        it("should reject invalid status", () => {
            const result = UpdateStatusSchema.safeParse({ status: "invalid" });
            expect(result.success).toBe(false);
        });
    });
});
