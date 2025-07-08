import { LambdaManager } from "..";
import AWS from "aws-sdk";
import { LambdaLog } from "lambda-log";

// Mock AWS Lambda class
jest.mock("aws-sdk", () => {
  const invokeMock = jest.fn();
  const LambdaMock = jest.fn(() => ({
    invoke: invokeMock,
  }));

  return {
    Lambda: LambdaMock,
  };
});

// Create a mock logger
const mockLogger = {
  error: jest.fn(),
} as unknown as LambdaLog;

describe("LambdaManager", () => {
  let lambdaManager: LambdaManager;
  let mockInvoke: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const lambdaClient = new AWS.Lambda() as any;
    mockInvoke = lambdaClient.invoke;

    lambdaManager = new LambdaManager({
      logger: mockLogger,
      lambdaClient,
    });
  });

  it("should return lambda response on success", async () => {
    const mockResponse = { StatusCode: 200, Payload: '{"message":"ok"}' };
    mockInvoke.mockReturnValue({
      promise: jest.fn().mockResolvedValue(mockResponse),
    });

    const payload = { key: "value" };
    const response = await lambdaManager.getResponse({
      functionName: "test-function",
      payload,
    });

    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: "test-function",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(payload),
    });
    expect(response).toEqual(mockResponse);
  });

  it("should log and throw on lambda invoke failure", async () => {
    const error = new Error("Lambda invocation failed");
    mockInvoke.mockReturnValue({
      promise: jest.fn().mockRejectedValue(error),
    });

    await expect(
      lambdaManager.getResponse({
        functionName: "test-function",
        payload: { test: 1 },
      })
    ).rejects.toThrow("Lambda invocation failed");

    expect(mockLogger.error).toHaveBeenCalledWith(error);
  });
});
