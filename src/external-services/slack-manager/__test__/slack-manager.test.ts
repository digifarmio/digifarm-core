import { WebClient } from "@slack/web-api";
import { SlackManager } from "..";
import { SlackNotificationPayload } from "@/types";

describe("SlackManager Testing", () => {
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

    expect(result).toBe(mockResponse);
  });

  it("should call postMessage with correct params", async () => {
    const payload: SlackNotificationPayload = {
      text: "Hello, Slack!",
      channel: "#general",
    };

    await slackManager.sendNotification(payload);

    expect(postMessageMock).toHaveBeenCalledWith({
      text: payload.text,
      channel: payload.channel,
    });
  });

  it("should throw error on failure", async () => {
    const error = new Error("Slack API error");

    postMessageMock.mockRejectedValue(error);

    const payload: SlackNotificationPayload = {
      text: "Failing message",
      channel: "#errors",
    };

    await expect(slackManager.sendNotification(payload)).rejects.toThrow(
      "Slack API error"
    );
  });
});
