import { APIGatewayProxyHandler } from "aws-lambda";
import { listTasks } from "../services/dynamoService";
import { successResponse, errorResponse } from "../utils/response";

export const main: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) return errorResponse("Unauthorized", 401);

    const limit = Number(event.queryStringParameters?.limit || 10);
    const lastKey = event.queryStringParameters?.lastKey
      ? JSON.parse(decodeURIComponent(event.queryStringParameters.lastKey))
      : undefined;

    const result = await listTasks(userId, limit, lastKey);

    return successResponse({
      items: result.Items,
      nextToken: result.LastEvaluatedKey
        ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
        : null,
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to list tasks", 500);
  }
};
