import { APIGatewayProxyHandler } from "aws-lambda";
import { getTask } from "../services/dynamoService";
import { successResponse, errorResponse } from "../utils/response";

export const main: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) return errorResponse("Unauthorized", 401);

    const taskId = event.pathParameters?.id;
    if (!taskId) return errorResponse("Task ID required", 400);

    const task = await getTask(userId, taskId);
    if (!task) return errorResponse("Task not found", 404);

    return successResponse(task);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch task", 500);
  }
};
