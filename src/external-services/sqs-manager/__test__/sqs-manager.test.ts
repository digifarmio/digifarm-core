import AWS from "aws-sdk";
import { QueueManager } from "..";
import { LambdaLog } from "lambda-log";
import lodash from "lodash";
import Bluebird from "bluebird";

// Mocks
jest.mock("lodash", () => ({
  chunk: jest.fn(),
}));

jest.mock("bluebird", () => ({
  map: jest.fn(),
}));

describe("QueueManager", () => {
  const mockLogger = {
    error: jest.fn(),
  } as unknown as LambdaLog;

  const mockSendMessage = jest.fn();
  const mockSendMessageBatch = jest.fn();

  const mockSQS = {
    sendMessage: mockSendMessage,
    sendMessageBatch: mockSendMessageBatch,
  } as unknown as AWS.SQS;

  let queueManager: QueueManager;

  beforeEach(() => {
    jest.clearAllMocks();
    queueManager = new QueueManager({
      logger: mockLogger,
      sqsClient: mockSQS,
    });
  });

  it("should send a single message successfully", async () => {
    const queueUrl = "https://sqs.fake-queue";
    const message = { id: "1", test: true };

    const mockResponse = { MessageId: "123" };
    mockSendMessage.mockReturnValue({
      promise: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await queueManager.sendMessage({ queueUrl, message });

    expect(mockSendMessage).toHaveBeenCalledWith({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    });
    expect(result).toEqual(mockResponse);
  });

  it("should handle sendMessage error and log it", async () => {
    const queueUrl = "https://sqs.fake-queue";
    const message = { id: "1", test: true };
    const error = new Error("SQS send failed");

    mockSendMessage.mockReturnValue({
      promise: jest.fn().mockRejectedValue(error),
    });

    await expect(
      queueManager.sendMessage({ queueUrl, message })
    ).rejects.toThrow("SQS send failed");

    expect(mockLogger.error).toHaveBeenCalledWith(error);
  });

  it("should send bulk messages in chunks and return success/failure results", async () => {
    const queueUrl = "https://sqs.fake-queue";
    const messages = [
      { id: "1", value: "a" },
      { id: "2", value: "b" },
      { id: "3", value: "c" },
    ];

    const chunks = [[messages[0], messages[1]], [messages[2]]];
    (lodash.chunk as jest.Mock).mockReturnValue(chunks);

    const batchResponses = [
      {
        Successful: [{ MessageId: "1", Id: "1" }],
        Failed: [{ Id: "2", Message: "Error" }],
      },
      {
        Successful: [{ MessageId: "3", Id: "3" }],
        Failed: [],
      },
    ];

    (Bluebird.map as jest.Mock).mockImplementation(async (chunks, fn) => {
      return Promise.all(chunks.map(fn));
    });

    mockSendMessageBatch
      .mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue(batchResponses[0]),
      })
      .mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue(batchResponses[1]),
      });

    const { failedMessages, successfulMessages } =
      await queueManager.sendBulkMessages({
        queueUrl,
        messages,
        messageIndexName: "id",
      });

    expect(failedMessages).toEqual(batchResponses[0].Failed);
    expect(successfulMessages).toEqual([
      ...batchResponses[0].Successful,
      ...batchResponses[1].Successful,
    ]);
  });

  it("should log and rethrow error in sendBulkMessages", async () => {
    const queueUrl = "https://sqs.fake-queue";
    const messages = [{ id: "1" }];
    const chunks = [messages];

    (lodash.chunk as jest.Mock).mockReturnValue(chunks);

    const error = new Error("Batch send failed");

    (Bluebird.map as jest.Mock).mockImplementation(async (chunks, fn) => {
      return Promise.all(chunks.map(() => Promise.reject(error)));
    });

    await expect(
      queueManager.sendBulkMessages({
        queueUrl,
        messages,
        messageIndexName: "id",
      })
    ).rejects.toThrow("Batch send failed");

    expect(mockLogger.error).toHaveBeenCalledWith(error);
  });
});
