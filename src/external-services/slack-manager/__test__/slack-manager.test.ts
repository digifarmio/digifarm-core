import { SlackManager, SlackNotificationPayload } from "..";
import { WebClient } from "@slack/web-api";
import { LambdaLog } from "lambda-log";

describe("SlackManager", () => {
  const mockLogger = {
    error: jest.fn(),
  } as unknown as LambdaLog;

  const postMessageMock = jest.fn();
  const mockSlackClient = {
    chat: {
      postMessage: postMessageMock,
    },
  } as unknown as WebClient;

  let slackManager: SlackManager;

  beforeEach(() => {
    jest.clearAllMocks();
    slackManager = new SlackManager({
      logger: mockLogger,
      slackClient: mockSlackClient,
    });
  });

  it("should send Slack notification successfully", async () => {
    const payload: SlackNotificationPayload = {
      text: "Hello, Slack!",
      channel: "#general",
    };

    const mockResponse = { ok: true, ts: "1234567890.123456" };

    postMessageMock.mockResolvedValue(mockResponse);

    const result = await slackManager.sendNotification(payload);

    expect(postMessageMock).toHaveBeenCalledWith({
      text: payload.text,
      channel: payload.channel,
    });

    expect(result).toBe(mockResponse);
  });

  it("should log and throw error on failure", async () => {
    const error = new Error("Slack API error");

    postMessageMock.mockRejectedValue(error);

    const payload: SlackNotificationPayload = {
      text: "Failing message",
      channel: "#errors",
    };

    await expect(slackManager.sendNotification(payload)).rejects.toThrow(
      "Slack API error"
    );

    expect(mockLogger.error).toHaveBeenCalledWith(error);
  });
});
