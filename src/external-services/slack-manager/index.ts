import { LambdaLog } from "lambda-log";
import { WebClient } from "@slack/web-api";

export type SlackNotificationPayload = {
  text: string;
  channel: string;
};

export class SlackManager {
  private logger: LambdaLog;
  private slackClient: WebClient;

  constructor({
    logger,
    slackClient,
  }: {
    logger: LambdaLog;
    slackClient: WebClient;
  }) {
    this.logger = logger;
    this.slackClient = slackClient;
  }

  async sendNotification({ text, channel }: SlackNotificationPayload) {
    const params = {
      text,
      channel,
    };

    try {
      const data = await this.slackClient.chat.postMessage(params);
      return data;
    } catch (err) {
      this.logger.error(err as Error);
      throw err;
    }
  }
}
