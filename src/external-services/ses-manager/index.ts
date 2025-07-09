import { SES } from "aws-sdk";

export class SESManager {
  private readonly sesClient: SES;

  constructor({ sesClient }: { sesClient: SES }) {
    this.sesClient = sesClient;
  }

  async sendEmailUsingTemplate({
    sourceEmail,
    destinationEmail,
    templateName,
    templateData,
  }: {
    sourceEmail: string;
    destinationEmail: string;
    templateName: string;
    templateData: Record<string, string | number>;
  }) {
    return await this.sesClient
      .sendTemplatedEmail({
        Source: sourceEmail,
        Destination: {
          ToAddresses: [destinationEmail],
        },
        Template: templateName,
        TemplateData: JSON.stringify(templateData),
      })
      .promise();
  }
}
