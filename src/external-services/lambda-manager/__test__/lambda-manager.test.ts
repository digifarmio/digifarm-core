import { Lambda } from "aws-sdk";
import { LambdaManager } from "..";

jest.mock("aws-sdk", () => {
  const LambdaMock = jest.fn(() => ({
    invoke: jest.fn(),
  }));

  return {
    Lambda: LambdaMock,
  };
});

describe("LambdaManager Testing", () => {
  const mockResponse = { StatusCode: 200, Payload: '{"message":"ok"}' };

  let lambdaManager: LambdaManager;
  let mockInvoke: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const lambdaClient = new Lambda();
    mockInvoke = lambdaClient.invoke as jest.Mock;

    mockInvoke.mockReturnValue({
      promise: jest.fn().mockResolvedValue(mockResponse),
    });

    lambdaManager = new LambdaManager({
      lambdaClient,
    });
  });

  it("should call invoke with the correct parameters", async () => {
    const payload = { key: "value" };

    await lambdaManager.getResponse({
      functionName: "test-function",
      payload,
    });

    expect(mockInvoke).toHaveBeenCalledWith({
      FunctionName: "test-function",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(payload),
    });
  });

  it("should return the lambda response", async () => {
    const response = await lambdaManager.getResponse({
      functionName: "test-function",
      payload: { key: "value" },
    });

    expect(response).toEqual(mockResponse);
  });
});
