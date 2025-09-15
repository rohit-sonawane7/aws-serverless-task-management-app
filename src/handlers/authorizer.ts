import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from "aws-lambda";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecret"; // fallback for local dev

export async function main(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  try {
    const token = event.authorizationToken?.replace("Bearer ", "");

    if (!token) {
      throw new Error("No token provided");
    }

    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Success → allow
    return generatePolicy("user", "Allow", event.methodArn, decoded.userId);
  } catch (err) {
    console.error("Auth error:", err);
    // Deny if invalid
    return generatePolicy("user", "Deny", event.methodArn);
  }
}

// Helper: generate IAM policy
function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  userId?: string
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: userId ? { userId } : {},
  };
}
