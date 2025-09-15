#!/bin/bash
set -e

echo "🚀 Starting Task Management API setup..."

# 1. Initialize Node.js project
if [ ! -f package.json ]; then
  echo "📦 Initializing npm project..."
  npm init -y
fi

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

# 7. Add npm scripts
echo "📝 Adding useful npm scripts to package.json..."
npx npm-add-script -k "dev" -v "serverless offline"
npx npm-add-script -k "deploy" -v "serverless deploy"
npx npm-add-script -k "test" -v "vitest --run"
npx npm-add-script -k "localstack" -v "docker-compose up -d"
npx npm-add-script -k "bootstrap-local" -v "bash ./bootstrap-local.sh"

# 8. Create bootstrap-local.sh (to init DynamoDB, S3, Step Functions in LocalStack)
cat <<'EOL' > bootstrap-local.sh
#!/bin/bash
set -e
echo "⚡ Bootstrapping LocalStack resources..."

ENDPOINT="--endpoint-url=http://localhost:4566"
REGION="--region us-east-1"

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

echo "✅ LocalStack bootstrap complete!"
EOL

chmod +x bootstrap-local.sh

echo "🎉 Setup complete! Next steps:"
echo "1. Run 'npm run localstack' to start LocalStack"
echo "2. Run 'npm run bootstrap-local' to create DynamoDB, S3, Step Functions"
echo "3. Run 'npm run dev' to start API locally"
