import { SES } from "aws-sdk";
import { SESManager } from "..";

// Mock AWS SES
jest.mock("aws-sdk", () => {
  const sendTemplatedEmailMock = jest.fn();
  const SESMock = jest.fn(() => ({
    sendTemplatedEmail: sendTemplatedEmailMock,
  }));

  return { SES: SESMock };
});

describe("SESManager Testing", () => {
  let sesManager: SESManager;
  let mockSendTemplatedEmail: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const sesClient = new SES();
    mockSendTemplatedEmail = sesClient.sendTemplatedEmail as jest.Mock;

    sesManager = new SESManager({ sesClient });
  });

  it("should call sendTemplatedEmail with correct params", async () => {
    const input = {
      sourceEmail: "sender@example.com",
      destinationEmail: "receiver@example.com",
      templateName: "MyTemplate",
      templateData: { name: "John", code: 1234 },
    };

    mockSendTemplatedEmail.mockReturnValue({
      promise: jest.fn().mockResolvedValue({ MessageId: "abc-123" }),
    });

    await sesManager.sendEmailUsingTemplate(input);
  });

  it("should call sendTemplatedEmail with correct params", async () => {
    const input = {
      sourceEmail: "sender@example.com",
      destinationEmail: "receiver@example.com",
      templateName: "MyTemplate",
      templateData: { name: "John", code: 1234 },
    };

    await sesManager.sendEmailUsingTemplate(input);

    expect(mockSendTemplatedEmail).toHaveBeenCalledWith({
      Source: input.sourceEmail,
      Destination: {
        ToAddresses: [input.destinationEmail],
      },
      Template: input.templateName,
      TemplateData: JSON.stringify(input.templateData),
    });
  });

  it("should throw if sendTemplatedEmail fails", async () => {
    const error = new Error("SES failure");

    mockSendTemplatedEmail.mockReturnValue({
      promise: jest.fn().mockRejectedValue(error),
    });

    await expect(
      sesManager.sendEmailUsingTemplate({
        sourceEmail: "a@example.com",
        destinationEmail: "b@example.com",
        templateName: "T1",
        templateData: { foo: "bar" },
      })
    ).rejects.toThrow("SES failure");
  });
});
