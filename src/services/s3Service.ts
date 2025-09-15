import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const isOffline = process.env.IS_OFFLINE === "true";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: isOffline ? "http://localhost:4569" : undefined,
  forcePathStyle: !!isOffline,
});

const BUCKET_NAME = process.env.BUCKET_NAME || "task-attachments-dev";

export async function generateUploadUrl(taskId: string, userId: string) {
  const key = `${userId}/${taskId}/attachment`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1h
  return { uploadUrl: url, key };
}

export async function generateDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1h
}
