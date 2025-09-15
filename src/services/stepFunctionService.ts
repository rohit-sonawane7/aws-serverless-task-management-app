import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const isOffline = process.env.IS_OFFLINE === "true";
const endpoint = isOffline ? "http://localhost:4566" : undefined;

// Hardcoded ARN for LocalStack (default account = 000000000000)
const localArn = "arn:aws:states:us-east-1:000000000000:stateMachine:taskStatusFlow";

const sfn = new SFNClient({ region: "us-east-1", endpoint });

export async function startStatusWorkflow(taskId: string, userId: string, status: string) {
  const stateMachineArn = isOffline
    ? localArn
    : process.env.STATE_MACHINE_ARN;

  if (!stateMachineArn) throw new Error("STATE_MACHINE_ARN not configured");

  const input = JSON.stringify({ taskId, userId, status });

  const res = await sfn.send(
    new StartExecutionCommand({
      stateMachineArn,
      input,
    })
  );

  return res.executionArn;
}
