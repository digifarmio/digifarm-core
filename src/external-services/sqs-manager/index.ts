import { SQS } from "aws-sdk";
import lodash from "lodash";
import { Promise as BluebirdPromise } from "bluebird";

export class QueueManager {
  private sqsClient: SQS;

  constructor({ sqsClient }: { sqsClient: SQS }) {
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

    return await this.sqsClient.sendMessage(params).promise();
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

        return await this.sqsClient.sendMessageBatch(params).promise();
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
