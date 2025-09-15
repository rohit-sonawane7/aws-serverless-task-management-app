import { APIGatewayProxyHandler } from "aws-lambda";
import { updateTask } from "../services/dynamoService";
import { successResponse, errorResponse } from "../utils/response";
import { UpdateTaskSchema } from "../validation/taskSchema";

export const main: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) return errorResponse("Unauthorized", 401);

    const taskId = event.pathParameters?.id;
    if (!taskId) return errorResponse("Task ID required", 400);

    const body = JSON.parse(event.body || "{}");
    const parsed = UpdateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error as any, 400);
    }
    // if (!body.title) return errorResponse("Title is required", 400);

    const updated = await updateTask(userId, taskId, parsed.data);
    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update task", 500);
  }
};
