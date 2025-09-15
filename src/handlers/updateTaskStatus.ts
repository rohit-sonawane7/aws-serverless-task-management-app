import { APIGatewayProxyHandler } from "aws-lambda";
import { updateStatus } from "../services/dynamoService";
import { startStatusWorkflow } from "../services/stepFunctionService";
import { successResponse, errorResponse } from "../utils/response";
import { UpdateStatusSchema } from "../validation/taskSchema";

export const main: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.userId as string;
    if (!userId) return errorResponse("Unauthorized", 401);

    const taskId = event.pathParameters?.id;
    if (!taskId) return errorResponse("Task ID is required", 400);

    const body = JSON.parse(event.body || "{}");
    if (!body.status) return errorResponse("Status is required", 400);

    const parsed = UpdateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error as any, 400);
    }

    const { status } = parsed.data;

    // 🔹 Update task in DynamoDB
    const updated = await updateStatus(userId, taskId, status);

    // 🔹 Start Step Function workflow
    const executionArn = await startStatusWorkflow(taskId, userId, status);

    return successResponse({
      ...updated,
      workflowExecutionArn: executionArn,
    });
  } catch (err: any) {
    console.error("UpdateTaskStatus error:", err);
    return errorResponse(err.message || "Failed to update status", 500);
  }
};
