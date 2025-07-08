import { LambdaLog } from "lambda-log";
import AWS from "aws-sdk";
import lodash from "lodash";
import { Promise as BluebirdPromise } from "bluebird";
import { Polygon } from "geojson";

export type ViableImageryVerifierPayloadType = {
  targetPayload: Record<string, unknown>;
  params: {
    bbox: Polygon;
    checkStartTime: string;
    checkEndTime: string;
    problematicAreaPercentage: number;
    startTime: string;
    endTime?: string;
  };
  target: string;
  messageId: string;
};

export type PartialDRErrorPayloadType = {
  targetPayload: Record<string, unknown>;
  params: {
    imageryId: string;
    failedAt: Date;
    errorMessage: string;
  };
  target: string;
  messageId: string;
};

export class QueueManager {
  private logger: LambdaLog;
  private sqsClient: AWS.SQS;

  constructor({
    logger,
    sqsClient,
  }: {
    logger: LambdaLog;
    sqsClient: AWS.SQS;
  }) {
    this.logger = logger;
    this.sqsClient = sqsClient;
  }

  async sendMessage({
    queueUrl,
    message,
  }: {
    queueUrl: string;
    message: Record<string, unknown>;
  }) {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    };

    try {
      const data = await this.sqsClient.sendMessage(params).promise();
      return data;
    } catch (err) {
      this.logger.error(err as Error);
      throw err;
    }
  }

  // This function takes messages, an array of arbitrary length, and sends them to the queueUrl using sendMessageBatch function. sendMessageBatch takes maximum 10 messages at a time. So we need to chunk the messages array into chunks of 10 messages each and send them to the queueUrl.
  // The response of sendMessageBatch is an array of objects, each object representing the result of sending a message. We need to check the result of each message and return back a failed array and a successful array for all the messages.
  // We use lodash to chunk the messages array into chunks of 10 messages each.
  // Use Promise.map to iterate over each chunk and send them to the queueUrl using sendMessageBatch function.
  async sendBulkMessages({
    queueUrl,
    messages,
    messageIndexName,
  }: {
    queueUrl: string;
    messages: Record<string, unknown>[];
    messageIndexName: string;
  }) {
    const chunkedMessages = lodash.chunk(messages, 10);

    const failedEntries = await BluebirdPromise.map(
      chunkedMessages,
      async (chunk) => {
        const params = {
          QueueUrl: queueUrl,
          Entries: chunk.map((message) => ({
            Id: message[messageIndexName] as string,
            MessageBody: JSON.stringify(message),
          })),
        };

        try {
          const data = await this.sqsClient.sendMessageBatch(params).promise();
          return data;
        } catch (err) {
          this.logger.error(err as Error);
          throw err;
        }
      }
    );

    const failedMessages = failedEntries
      .map((failedEntry) => failedEntry.Failed)
      .flat();

    const successfulMessages = failedEntries
      .map((failedEntry) => failedEntry.Successful)
      .flat();

    return { failedMessages, successfulMessages };
  }
}
