# Digifarm Core

[![npm version](https://badge.fury.io/js/@digifarmio%2Fcore.svg)](https://badge.fury.io/js/@digifarmio%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18.0.0](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A comprehensive TypeScript library providing core functionality for the Digifarm API services, including AWS service integrations, data access patterns, and utility functions.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [External Services](#external-services)
- [Data Access](#data-access)
- [Helpers](#helpers)
- [Usage Examples](#usage-examples)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)

## 🎯 Overview

Digifarm Core is a TypeScript library that provides a unified interface for interacting with various AWS services and external APIs. It includes managers for AWS Cognito, Lambda, S3, SES, SQS, CloudWatch Logs, and Slack integrations, along with data access patterns for user and organization management.

## ✨ Features

### 🔐 Authentication & User Management

- **CognitoManager**: AWS Cognito user pool integration for authentication and user management
- **UserOrganizationRepository**: DynamoDB-based user and organization data access

### ☁️ AWS Service Integrations

- **LambdaManager**: AWS Lambda function invocation and response handling
- **S3Manager**: S3 bucket operations including signed URL generation and Sentinel data querying
- **SESManager**: Amazon SES email templating and delivery
- **QueueManager**: SQS message handling with bulk operations support
- **LogManager**: Structured logging with CloudWatch integration

### 📊 Usage Analytics

- **UsageLogsReadManager**: Read and parse usage logs from S3
- **UsageLogsWriterManager**: Write usage logs to Kinesis Firehose for analytics

### 🔔 Notifications

- **SlackManager**: Slack channel messaging and notifications

### 🛠️ Utilities

- **Schema Unmarshaling**: Helper functions for DynamoDB data transformation

## 📦 Installation

```bash
npm install @digifarm/core
```

or

```bash
npm add @digifarm/core
```

## 🏗️ Project Structure

```
src/
├── data-access/                                # Data access layer
│   └── user/                                   # User organization repository
├── external-services/                          # AWS and external service managers
│   ├── cognito-manager/                        # AWS Cognito integration
│   ├── lambda-manager/                         # AWS Lambda integration
│   ├── log-manager/                            # CloudWatch logging
│   ├── s3-manager/                             # S3 operations
│   ├── ses-manager/                            # SES email service
│   ├── slack-manager/                          # Slack notifications
│   ├── sqs-manager/                            # SQS queue management
│   ├── usage-logs-read-manager/                # Usage log reading system
│   └── usage-logs-writer-manager/              # Usage log writing system
├── helpers/                                    # Utility functions
└── types/                                      # TypeScript type definitions
```

The library is organized into three main categories:

1. **External Services** (`src/external-services/`): AWS and third-party service integrations
2. **Data Access** (`src/data-access/`): Database access patterns and repositories
3. **Helpers** (`src/helpers/`): Utility functions and data transformation helpers

## 🔧 External Services

### CognitoManager

Handles AWS Cognito user pool operations for authentication and user management.

```typescript
import { CognitoManager } from "@digifarm/core";
import { CognitoIdentityServiceProvider } from "aws-sdk";

const cognitoClient = new CognitoIdentityServiceProvider();
const cognitoManager = new CognitoManager({
  cognitoClient,
  userPoolId: "your-user-pool-id",
});

// Get user by username
const userAttributes = await cognitoManager.getUserByUsername("username");
```

**Features:**

- User attribute retrieval and parsing
- Admin user operations
- Structured response processing

### LambdaManager

Manages AWS Lambda function invocations with error handling and logging.

```typescript
import { LambdaManager } from "@digifarm/core";
import AWS from "aws-sdk";

const lambdaClient = new AWS.Lambda();
const lambdaManager = new LambdaManager({ lambdaClient });

// Invoke Lambda function
const response = await lambdaManager.getResponse({
  functionName: "my-function",
  payload: { key: "value" },
});
```

**Features:**

- Synchronous Lambda invocations
- Error handling and logging
- JSON payload serialization

### S3Manager

Provides S3 bucket operations including signed URL generation and Sentinel data querying.

```typescript
import { S3Manager } from "@digifarm/core";
import AWS from "aws-sdk";

const s3Client = new AWS.S3();
const s3Manager = new S3Manager({ s3Client });

// Generate signed URL
const signedUrl = await s3Manager.getSignedUrl({
  bucket: "my-bucket",
  key: "path/to/file.jpg",
  expires: 3600,
});

// Query Sentinel bucket
const objects = await s3Manager.querySentinelBucket("bucket", "prefix");

// Generate presigned URL from file location
const presignedUrl = await s3Manager.presignedS3Url("bucket/path/to/file.jpg");
```

**Features:**

- Signed URL generation for secure file access
- Sentinel satellite data bucket querying
- Presigned URL generation from file locations
- Error handling and logging

### SESManager

Handles Amazon SES email templating and delivery.

```typescript
import { SESManager } from "@digifarm/core";
import { SES } from "aws-sdk";

const sesClient = new SES();
const sesManager = new SESManager({ sesClient });

// Send templated email
await sesManager.sendEmailUsingTemplate({
  sourceEmail: "noreply@example.com",
  destinationEmail: "user@example.com",
  templateName: "welcome-template",
  templateData: { name: "John", company: "Digifarm" },
});
```

**Features:**

- Templated email sending
- SES template integration
- Structured template data handling

### QueueManager

Manages SQS message operations with support for bulk message handling.

```typescript
import { QueueManager } from "@digifarm/core";
import AWS from "aws-sdk";

const sqsClient = new AWS.SQS();
const queueManager = new QueueManager({ sqsClient });

// Send single message
await queueManager.sendMessage({
  queueUrl: "https://sqs.region.amazonaws.com/queue-url",
  message: { data: "value" },
});

// Send bulk messages
const { failedMessages, successfulMessages } =
  await queueManager.sendBulkMessages({
    queueUrl: "https://sqs.region.amazonaws.com/queue-url",
    messages: [
      { id: "1", data: "value1" },
      { id: "2", data: "value2" },
    ],
    messageIndexName: "id",
  });
```

**Features:**

- Single message sending
- Bulk message operations (up to 10 messages per batch)
- Automatic message chunking
- Failed/successful message tracking
- Error handling and logging

### SlackManager

Provides Slack channel messaging and notification capabilities.

```typescript
import { SlackManager } from "@digifarm/core";
import { WebClient } from "@slack/web-api";

const slackClient = new WebClient("your-slack-token");
const slackManager = new SlackManager({ slackClient });

// Send notification
await slackManager.sendNotification({
  text: "Hello from Digifarm!",
  channel: "#general",
});
```

**Features:**

- Channel message posting
- Error handling and logging
- Slack Web API integration

### LogManager

Provides structured logging with CloudWatch integration.

```typescript
import { LogManager } from "@digifarm/core";
import { LambdaLog } from "lambda-log";

const lambdaLog = new LambdaLog();
const logManager = new LogManager({ lambdaLog });

// Log messages with metadata
logManager.info("User logged in", { userId: "123", timestamp: Date.now() });
logManager.error("An error occurred", {
  error: "details",
  context: "user-action",
});
logManager.debug("Debug information", { data: "value" });
logManager.warn("Warning message", { warning: "details" });
```

**Features:**

- Structured logging with metadata
- Multiple log levels (debug, info, warn, error)
- CloudWatch integration
- Lambda-optimized logging

### UsageLogsReadManager

Reads and parses usage logs from S3 for analytics and billing purposes.

```typescript
import { UsageLogsReadManager } from "@digifarm/core";
import S3 from "aws-sdk/clients/s3";

const s3Client = new S3();
const usageLogsReader = new UsageLogsReadManager({ s3Client });

// Read usage logs from S3
const usageLogs = await usageLogsReader.getUsageLogs("bucket/path/to/logs.txt");
```

**Features:**

- S3 log file reading
- Usage log parsing and serialization
- Support for various usage metrics (DF_LOW_RES, DF_HIGH_RES, DR_COVERAGE, etc.)
- Billing type support (COUNT, AREA, ZONING_AREA)

### UsageLogsWriterManager

Writes usage logs to Kinesis Firehose for analytics and billing.

```typescript
import { UsageLogsWriterManager } from "@digifarm/core";
import Firehose from "aws-sdk/clients/firehose";

const firehoseClient = new Firehose();
const logger = new LogManager({ lambdaLog });
const usageLogsWriter = new UsageLogsWriterManager({
  logger,
  firehoseClient,
  deliveryStreamName: "usage-logs-stream",
});

// Write usage log
await usageLogsWriter.writeUsageLog({
  requestId: "req-123",
  source: { metric: "SUM", type: "DF_LOW_RES" },
  organizationId: "org-123",
  apiKeyId: "key-123",
  timeStamp: Date.now(),
  date: "2024-01-01",
});

// Write specific usage logs for different operations
await usageLogsWriter.writeUsageLogForGetDelineatedFields(event, features);
await usageLogsWriter.writeUsageLogForPDRImagery(features, organizationId);
```

**Features:**

- Kinesis Firehose integration
- Specialized logging for different operations
- Billing type support
- Performance timing
- Structured log formatting

## 💾 Data Access

### UserOrganizationRepository

Provides DynamoDB-based data access for user and organization management.

```typescript
import { UserOrganizationRepository } from "@digifarm/core";
import { DynamoDB } from "aws-sdk";

const dynamoDocClient = new DynamoDB.DocumentClient();
const userOrgRepo = new UserOrganizationRepository({
  userOrganizationTable: "user-organization-table",
  dynamoDocClient,
});

// Get user organizations by user ID
const userOrgs = await userOrgRepo.getUserOrganizationsById("user-123");

// Get organizations by token
const org = await userOrgRepo.getOrganizationsByToken("token-123");

// Get users by organization ID
const users = await userOrgRepo.getUserByOrganizationId("org-123");
```

**Features:**

- User-organization relationship queries
- Token-based organization lookup
- Organization-based user queries
- DynamoDB schema unmarshaling

## 🛠️ Helpers

### Schema Unmarshaling

Provides utility functions for transforming DynamoDB data structures.

```typescript
import { schemaUnMarshal } from "@digifarm/core";

// Transform DynamoDB item
const transformedItem = schemaUnMarshal({
  PK: "USERID#123",
  SK: "ORG#456",
  Name: "John Doe",
  Type: "user",
});
```

**Features:**

- DynamoDB key pattern matching
- Attribute transformation
- Set value handling
- Flexible schema support

## 📝 Usage Examples

### Complete Setup Example

```typescript
import {
  CognitoManager,
  LambdaManager,
  S3Manager,
  SESManager,
  QueueManager,
  SlackManager,
  LogManager,
  UsageLogsReadManager,
  UsageLogsWriterManager,
  UserOrganizationRepository,
} from "@digifarm/core";
import AWS from "aws-sdk";
import { LambdaLog } from "lambda-log";
import { WebClient } from "@slack/web-api";

// Initialize AWS clients
const cognitoClient = new AWS.CognitoIdentityServiceProvider();
const lambdaClient = new AWS.Lambda();
const s3Client = new AWS.S3();
const sesClient = new AWS.SES();
const sqsClient = new AWS.SQS();
const firehoseClient = new AWS.Firehose();
const dynamoDocClient = new AWS.DynamoDB.DocumentClient();

// Initialize logger
const lambdaLog = new LambdaLog();
const logger = new LogManager({ lambdaLog });

// Initialize managers
const cognitoManager = new CognitoManager({
  cognitoClient,
  userPoolId: "your-user-pool-id",
});

const lambdaManager = new LambdaManager({ lambdaClient });
const s3Manager = new S3Manager({ s3Client });
const sesManager = new SESManager({ sesClient });
const queueManager = new QueueManager({ sqsClient });

const slackClient = new WebClient("your-slack-token");
const slackManager = new SlackManager({ slackClient });

const usageLogsReader = new UsageLogsReadManager({ s3Client });
const usageLogsWriter = new UsageLogsWriterManager({
  logger,
  firehoseClient,
  deliveryStreamName: "usage-logs-stream",
});

const userOrgRepo = new UserOrganizationRepository({
  userOrganizationTable: "user-organization-table",
  dynamoDocClient,
});

// Use the managers
async function processUserRequest(userId: string) {
  try {
    // Get user information
    const user = await cognitoManager.getUserByUsername(userId);
    const userOrgs = await userOrgRepo.getUserOrganizationsById(userId);

    // Process with Lambda
    const result = await lambdaManager.getResponse({
      functionName: "process-user-data",
      payload: { userId, userOrgs },
    });

    // Send notification
    await slackManager.sendNotification({
      text: `Processed user ${userId}`,
      channel: "#notifications",
    });

    // Log usage
    await usageLogsWriter.writeUsageLog({
      requestId: "req-123",
      source: { metric: "SUM", type: "DF_LOW_RES" },
      organizationId: userOrgs.organizationId,
      apiKeyId: userOrgs.Token,
      timeStamp: Date.now(),
      date: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    logger.error("Error processing user request", { error, userId });
    throw error;
  }
}
```

## 🚀 Development

### Prerequisites

- Node.js >= 18.0.0
- NPM

### Setup

```bash
# Clone the repository
git clone https://github.com/digifarmio/digifarm-core.git
cd digifarm-core

# Install dependencies
npm install

# Build the project
npm build

# Run tests
npm test
```

### Build Configuration

The project uses `tsup` for building with the following configuration:

- **Entry**: `index.ts`
- **Formats**: CommonJS and ES modules
- **Output**: TypeScript declarations, source maps, and minified code
- **Target**: ES2022

### TypeScript Configuration

- **Target**: ES2022
- **Module**: ESNext
- **Strict**: Enabled
- **Declaration**: Generated
- **Source Maps**: Enabled

## 🧪 Testing

The project includes comprehensive test coverage for all managers and utilities.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests in watch mode
npm test:watch
```

### Test Structure

- Tests are located in `__test__` directories alongside source files
- Jest is used as the testing framework
- AWS SDK mocks are provided for testing
- Each manager has corresponding test files

## 🤝 Contributing

1. Clone the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for new functionality
- Ensure all tests pass before submitting PR
- Use conventional commit messages
