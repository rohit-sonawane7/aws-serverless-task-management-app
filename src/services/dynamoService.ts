import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const isOffline = process.env.IS_OFFLINE === "true";

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: isOffline ? "http://localhost:4566" : undefined, // LocalStack
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

const TableName = process.env.TABLE_NAME || "tasksTable";

// 🔹 Create Task
export async function createTask(task: any) {
  await docClient.send(new PutCommand({ TableName, Item: task }));
  return task;
}

// 🔹 Get Task
export async function getTask(userId: string, taskId: string) {
  const res = await docClient.send(
    new GetCommand({
      TableName,
      Key: { userId, taskId },
    })
  );
  return res.Item;
}

// 🔹 List Tasks (with pagination)
export async function listTasks(userId: string, limit = 10, lastKey?: any) {
  const res = await docClient.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
      Limit: limit,
      ExclusiveStartKey: lastKey,
    })
  );
  return res;
}

// 🔹 Update Task (title/description)
export async function updateTask(userId: string, taskId: string, updates: any) {
  const res = await docClient.send(
    new UpdateCommand({
      TableName,
      Key: { userId, taskId },
      UpdateExpression: "set #t = :t, description = :d, updatedAt = :u",
      ExpressionAttributeNames: { "#t": "title" },
      ExpressionAttributeValues: {
        ":t": updates.title,
        ":d": updates.description || null,
        ":u": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );
  return res.Attributes;
}

// 🔹 Delete Task
export async function deleteTask(userId: string, taskId: string) {
  await docClient.send(
    new DeleteCommand({
      TableName,
      Key: { userId, taskId },
    })
  );
}

// 🔹 Update Status
export async function updateStatus(userId: string, taskId: string, status: string) {
  const res = await docClient.send(
    new UpdateCommand({
      TableName,
      Key: { userId, taskId },
      UpdateExpression: "set #s = :s, updatedAt = :u",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": status,
        ":u": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );
  return res.Attributes;
}
