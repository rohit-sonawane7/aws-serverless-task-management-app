import { APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuid } from "uuid";
import { createTask } from "../services/dynamoService";
import { generateUploadUrl } from "../services/s3Service";
import { successResponse, errorResponse } from "../utils/response";
import { CreateTaskSchema } from "../validation/taskSchema";

export const main: APIGatewayProxyHandler = async (event: any) => {
    try {
        // 🔹 Authenticated user
        const userId = event.requestContext.authorizer?.userId as string;
        if (!userId) return errorResponse("Unauthorized", 401);

        // 🔹 Request body
        const body = JSON.parse(event.body || "{}");
        // if (!body.title) return errorResponse("Title is required", 400);

        const parsed = CreateTaskSchema.safeParse(body);
        if (!parsed.success) {
            return errorResponse(parsed.error as any, 400);
        }
        // 🔹 Task object
        const taskId = uuid();
        const now = new Date().toISOString();
        const { title, description, status, attachment } = parsed.data;


        const task: any = {
            userId,
            taskId,
            title: title,
            description: description || null,
            status: status || "pending",
            createdAt: now,
            updatedAt: now,
        };

        if (attachment === true) {
            const { uploadUrl, key } = await generateUploadUrl(taskId, userId);
            task.attachmentKey = key;
            task.attachmentUploadUrl = uploadUrl;
        }

        await createTask(task);

        return successResponse(task, 201);
    } catch (err: any) {
        console.error("CreateTask error:", err);
        return errorResponse(err.message || "Failed to create task", 500);
    }
};
