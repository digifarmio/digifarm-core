import { CognitoIdentityServiceProvider } from "aws-sdk";
import CognitoManager from "..";

jest.mock("aws-sdk", () => {
  const mCognitoIdentityServiceProvider = jest.fn(() => ({
    adminGetUser: jest.fn(),
  }));

  return {
    CognitoIdentityServiceProvider: mCognitoIdentityServiceProvider,
  };
});

describe("CognitoManager Testing", () => {
  const mockUserPoolId = "mock-user-pool-id";
  const mockUsername = "mock-username";

  const mockResponse = {
    Username: mockUsername,
    UserAttributes: [
      { Name: "email", Value: "test@example.com" },
      { Name: "sub", Value: "abc-123" },
    ],
  };

  let cognitoManager: CognitoManager;
  let mockAdminGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const cognitoClient = new CognitoIdentityServiceProvider();

    mockAdminGetUser = cognitoClient.adminGetUser as jest.Mock;

    mockAdminGetUser.mockReturnValue({
      promise: jest.fn().mockResolvedValue(mockResponse),
    });

    cognitoManager = new CognitoManager({
      cognitoClient,
      userPoolId: mockUserPoolId,
    });
  });

  it("should call adminGetUser with the correct parameters", async () => {
    await cognitoManager.getUserByUsername(mockUsername);

    expect(mockAdminGetUser).toHaveBeenCalledWith({
      UserPoolId: mockUserPoolId,
      Username: mockUsername,
    });
  });

  it("should return parsed user attributes", async () => {
    const result = await cognitoManager.getUserByUsername(mockUsername);

    expect(result).toEqual({
      email: "test@example.com",
      sub: "abc-123",
    });
  });
});
