import { WebClient } from "@slack/web-api";
import { SlackNotificationPayload } from "@/types";

export class SlackManager {
  private slackClient: WebClient;

  constructor({ slackClient }: { slackClient: WebClient }) {
    this.slackClient = slackClient;
  }

  async sendNotification({ text, channel }: SlackNotificationPayload) {
    const params = {
      text,
      channel,
    };

    return await this.slackClient.chat.postMessage(params);
  }
}
