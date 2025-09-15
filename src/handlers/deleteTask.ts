import { APIGatewayProxyHandler } from "aws-lambda";
import { deleteTask } from "../services/dynamoService";
import { successResponse, errorResponse } from "../utils/response";

export const main: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) return errorResponse("Unauthorized", 401);

    const taskId = event.pathParameters?.id;
    if (!taskId) return errorResponse("Task ID required", 400);

    await deleteTask(userId, taskId);
    return successResponse({ message: "Task deleted" });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to delete task", 500);
  }
};
