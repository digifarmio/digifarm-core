# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2025-07-24

### Added

- Add changelog file checking in github action

## [0.1.2] - 2025-07-23

### Added

- Github action for pre merge checking and package release
- Automated version bumping scripts
- Improve typescript support

## [0.1.1] - 2025-07-10

### Fixed

- Typescript error
- Test case error fix

## [0.1.0] - 2025-07-10

### Added

- **Authentication & User Management**
  - `CognitoManager`: AWS Cognito user pool integration for authentication and user management
  - User attribute retrieval and parsing capabilities
  - Structured response processing

- **AWS Service Integrations**
  - `LambdaManager`: AWS Lambda function invocation and response handling
    - Synchronous Lambda invocations
    - Error handling and logging
    - JSON payload serialization
  - `S3Manager`: S3 bucket operations including signed URL generation and Sentinel data querying
    - Signed URL generation for secure file access
    - Sentinel satellite data bucket querying
    - Presigned URL generation from file locations
    - Error handling and logging
  - `SESManager`: Amazon SES email templating and delivery
    - Templated email sending
    - SES template integration
    - Structured template data handling
  - `QueueManager`: SQS message handling with bulk operations support
    - Single message sending
    - Bulk message operations (up to 10 messages per batch)
    - Automatic message chunking
    - Failed/successful message tracking
    - Error handling and logging
  - `LogManager`: Structured logging with CloudWatch integration
    - Structured logging with metadata
    - Multiple log levels (debug, info, warn, error)
    - CloudWatch integration
    - Lambda-optimized logging

- **Usage Analytics**
  - `UsageLogsReadManager`: Read and parse usage logs from S3
    - S3 log file reading
    - Usage log parsing and serialization
    - Support for various usage metrics (DF_LOW_RES, DF_HIGH_RES, DR_COVERAGE, etc.)
    - Billing type support (COUNT, AREA, ZONING_AREA)
  - `UsageLogsWriterManager`: Write usage logs to Kinesis Firehose for analytics
    - Kinesis Firehose integration
    - Specialized logging for different operations
    - Billing type support
    - Performance timing
    - Structured log formatting

- **Notifications**
  - `SlackManager`: Slack channel messaging and notifications
    - Channel message posting
    - Error handling and logging
    - Slack Web API integration

- **Data Access**
  - `UserOrganizationRepository`: DynamoDB-based user and organization data access
    - User-organization relationship queries
    - Token-based organization lookup
    - Organization-based user queries
    - DynamoDB schema unmarshaling

- **Utilities**
  - `schemaUnMarshal`: Helper functions for DynamoDB data transformation
    - DynamoDB key pattern matching
    - Attribute transformation
    - Set value handling
    - Flexible schema support

- **Type Definitions**
  - Complete TypeScript type definitions for all managers and utilities
  - Interface definitions for AWS service integrations
  - Usage log and analytics type definitions
  - User organization data types
  - Slack notification payload types

---

## Development

### Version Bumping

This project includes automated version bumping scripts:

```bash
# Bump patch version (0.1.2 -> 0.1.3)
npm run version:patch

# Bump minor version (0.1.2 -> 0.2.0)
npm run version:minor

# Bump major version (0.1.2 -> 1.0.0)
npm run version:major
```

### Contributing

When contributing to this project, please:

1. Follow the existing changelog format
2. Add entries under the appropriate version section
3. Use clear, descriptive language
4. Include both user-facing changes and internal improvements
5. Update the changelog before releasing a new version

### Changelog Categories

- **Added**: New features, components, or capabilities
- **Changed**: Changes to existing functionality
- **Deprecated**: Features that will be removed in future versions
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes and improvements
- **Security**: Security-related changes and vulnerabilities
