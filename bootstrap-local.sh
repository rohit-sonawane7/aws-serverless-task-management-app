#!/bin/bash
set -e
echo "⚡ Bootstrapping LocalStack resources..."

ENDPOINT="--endpoint-url=http://localhost:4566"
REGION="--region us-east-1"
ENV_FILE=".env"

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack..."
sleep 5

# DynamoDB Table
echo "📂 Creating DynamoDB table (tasksTable)..."
aws dynamodb create-table \
  --table-name tasksTable \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=taskId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=taskId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  $ENDPOINT $REGION || echo "✔️ Table already exists"

# S3 Bucket
echo "🗂️ Creating S3 bucket (task-attachments-dev)..."
aws s3api create-bucket \
  --bucket task-attachments-dev \
  --create-bucket-configuration LocationConstraint=us-east-1 \
  $ENDPOINT $REGION || echo "✔️ Bucket already exists"

# Step Function
echo "🔄 Creating Step Function state machine (taskStatusFlow)..."
STATE_MACHINE_DEF='{
  "Comment": "Task status transition workflow",
  "StartAt": "Pending",
  "States": {
    "Pending": { "Type": "Pass", "Next": "InProgress" },
    "InProgress": { "Type": "Pass", "Next": "Completed" },
    "Completed": { "Type": "Succeed" }
  }
}'
aws stepfunctions create-state-machine \
  --name taskStatusFlow \
  --definition "$STATE_MACHINE_DEF" \
  --role-arn arn:aws:iam::000000000000:role/DummyRole \
  $ENDPOINT $REGION || echo "✔️ State machine already exists"

# Fetch ARN
STATE_MACHINE_ARN=$(aws stepfunctions list-state-machines $ENDPOINT $REGION \
  --query "stateMachines[?name=='taskStatusFlow'].stateMachineArn" \
  --output text)

echo "🔗 State Machine ARN: $STATE_MACHINE_ARN"

# Write to .env
echo "📝 Writing environment variables to $ENV_FILE"
cat > $ENV_FILE <<EOL
IS_OFFLINE=true
TABLE_NAME=tasksTable
BUCKET_NAME=task-attachments-dev
STATE_MACHINE_ARN=$STATE_MACHINE_ARN
JWT_SECRET=mysecret
AWS_REGION=us-east-1
EOL

echo "✅ LocalStack bootstrap complete! Environment saved in $ENV_FILE"
