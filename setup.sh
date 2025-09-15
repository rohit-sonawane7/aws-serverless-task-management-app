#!/bin/bash
set -e

echo "🚀 Starting Task Management API setup..."

# 1. Initialize Node.js project
if [ ! -f package.json ]; then
  echo "📦 Initializing npm project..."
  npm init -y
fi

echo "Installing temporary serverless@^4.18.2..."
npm i -D serverless@4.18.2


# Step 3: Override it back to serverless@^3.40.0

# 2. Install runtime dependencies
echo "📦 Installing runtime dependencies..."
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb \
            @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
            @aws-sdk/client-sfn \
            jsonwebtoken uuid

# 3. Install dev dependencies
echo "📦 Installing dev dependencies..."
npm install -D typescript ts-node @types/node @types/jsonwebtoken \
               vitest supertest \
               eslint prettier \
               serverless serverless-offline \
               serverless-step-functions \
               npm-add-script

echo "Reverting to serverless@^3.40.0..."
npm i -D serverless@3.40.0

# 4. Create tsconfig.json if not exists
if [ ! -f tsconfig.json ]; then
  echo "📝 Creating tsconfig.json..."
  npx tsc --init --rootDir src --outDir dist --esModuleInterop --resolveJsonModule --strict
fi

# 5. Setup ESLint + Prettier
if [ ! -f .eslintrc.json ]; then
  echo "📝 Creating ESLint config..."
  cat <<EOL > .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint"],
  "env": {
    "node": true,
    "es2021": true
  },
  "rules": {}
}
EOL
fi

if [ ! -f .prettierrc ]; then
  echo "📝 Creating Prettier config..."
  echo '{ "semi": true, "singleQuote": false, "printWidth": 100 }' > .prettierrc
fi

# 6. Create Docker Compose for LocalStack
if [ ! -f docker-compose.yml ]; then
  echo "🐳 Creating docker-compose.yml for LocalStack..."
  cat <<EOL > docker-compose.yml
version: "3.8"
services:
  localstack:
    image: localstack/localstack:latest
    container_name: localstack
    ports:
      - "4566:4566"
      - "4510-4559:4510-4559"
    environment:
      - SERVICES=dynamodb,s3,stepfunctions,cloudwatch,sts,iam
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DEFAULT_REGION=us-east-1
    volumes:
      - "./.localstack:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
EOL
fi


# 8. Create bootstrap-local.sh (to init DynamoDB, S3, Step Functions in LocalStack)
cat <<'EOL' > bootstrap-local.sh
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


chmod +x bootstrap-local.sh

echo "🎉 Setup complete! Next steps:"
echo "1. Run 'npm run localstack' to start LocalStack"
npm run localstack
echo "2. Run 'npm run bootstrap-local' to create DynamoDB, S3, Step Functions"
npm run bootstrap-local
echo "3. Now Run 'npm run dev' to start API locally"
