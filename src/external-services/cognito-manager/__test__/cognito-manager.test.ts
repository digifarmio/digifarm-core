import { CognitoIdentityServiceProvider } from "aws-sdk";
import CognitoManager from "..";

jest.mock("aws-sdk", () => {
  const mAdminGetUser = jest.fn();
  const mCognitoIdentityServiceProvider = jest.fn(() => ({
    adminGetUser: mAdminGetUser,
  }));

  return {
    CognitoIdentityServiceProvider: mCognitoIdentityServiceProvider,
  };
});

describe("CognitoManager", () => {
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
    // Clear and reset mocks
    jest.clearAllMocks();

    const cognitoClient = new CognitoIdentityServiceProvider() as any;
    mockAdminGetUser = cognitoClient.adminGetUser;

    mockAdminGetUser.mockReturnValue({
      promise: jest.fn().mockResolvedValue(mockResponse),
    });

    cognitoManager = new CognitoManager({
      cognitoClient,
      userPoolId: mockUserPoolId,
    });
  });

  it("should return parsed user attributes", async () => {
    const result = await cognitoManager.getUserByUsername(mockUsername);

    expect(mockAdminGetUser).toHaveBeenCalledWith({
      UserPoolId: mockUserPoolId,
      Username: mockUsername,
    });

    expect(result).toEqual({
      email: "test@example.com",
      sub: "abc-123",
    });
  });
});
