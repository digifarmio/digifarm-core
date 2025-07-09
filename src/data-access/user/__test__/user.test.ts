import { DynamoDB } from "aws-sdk";
import { UserOrganizationRepository } from "..";

jest.mock("aws-sdk", () => {
  const mDocumentClient = jest.fn(() => ({
    query: jest.fn(),
  }));

  return {
    DynamoDB: {
      DocumentClient: mDocumentClient,
    },
  };
});

describe("UserOrganizationRepository Testing", () => {
  const mockTableName = "mock-user-organization-table";
  const mockUserId = "user-123";
  const mockTokenId = "token-456";
  const mockOrganizationId = "org-789";

  const mockUserOrganization = {
    Token: "test-token",
    Type: "user",
    Name: "Test User",
    organizationId: mockOrganizationId,
    userId: mockUserId,
  };

  const mockDynamoItem = {
    PK: `USERID#${mockUserId}`,
    SK: `ORG#${mockOrganizationId}`,
    Token: "test-token",
    Type: "user",
    Name: "Test User",
  };

  let userOrgRepository: UserOrganizationRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const dynamoDocClient = new DynamoDB.DocumentClient();
    mockQuery = dynamoDocClient.query as jest.Mock;

    userOrgRepository = new UserOrganizationRepository({
      userOrganizationTable: mockTableName,
      dynamoDocClient,
    });
  });

  describe("getUserOrganizationsById", () => {
    it("should call query with correct parameters for getUserOrganizationsById", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [mockDynamoItem],
        }),
      });

      await userOrgRepository.getUserOrganizationsById(mockUserId);

      expect(mockQuery).toHaveBeenCalledWith({
        TableName: mockTableName,
        KeyConditionExpression: "PK = :pk and begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USERID#${mockUserId}`,
          ":sk": "ORG#",
        },
      });
    });

    it("should return user organization when found", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [mockDynamoItem],
        }),
      });

      const result = await userOrgRepository.getUserOrganizationsById(
        mockUserId
      );

      expect(result).toEqual(mockUserOrganization);
    });

    it("should return undefined when no user organization found", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [],
        }),
      });

      const result = await userOrgRepository.getUserOrganizationsById(
        mockUserId
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when Items is undefined", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: undefined,
        }),
      });

      const result = await userOrgRepository.getUserOrganizationsById(
        mockUserId
      );

      expect(result).toBeUndefined();
    });

    it("should handle DynamoDB query errors", async () => {
      const mockError = new Error("DynamoDB query failed");
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(mockError),
      });

      await expect(
        userOrgRepository.getUserOrganizationsById(mockUserId)
      ).rejects.toThrow("DynamoDB query failed");
    });
  });

  describe("getOrganizationsByToken", () => {
    it("should call query with correct parameters for getOrganizationsByToken", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [mockDynamoItem],
        }),
      });

      await userOrgRepository.getOrganizationsByToken(mockTokenId);

      expect(mockQuery).toHaveBeenCalledWith({
        TableName: mockTableName,
        IndexName: "SK-index",
        KeyConditionExpression: "SK = :sk",
        ExpressionAttributeValues: {
          ":sk": `TOKENID#V0#${mockTokenId}`,
        },
      });
    });

    it("should return organization when found by token", async () => {
      const tokenDynamoItem = {
        PK: `USERID#${mockUserId}`,
        SK: `TOKENID#V0#${mockTokenId}`,
        Token: "test-token",
        Type: "user",
        Name: "Test User",
      };

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [tokenDynamoItem],
        }),
      });

      const result = await userOrgRepository.getOrganizationsByToken(
        mockTokenId
      );

      expect(result).toEqual({
        Token: "test-token",
        Type: "user",
        Name: "Test User",
        userId: mockUserId,
      });
    });

    it("should return undefined when no organization found by token", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [],
        }),
      });

      const result = await userOrgRepository.getOrganizationsByToken(
        mockTokenId
      );

      expect(result).toBeUndefined();
    });

    it("should handle DynamoDB query errors for token lookup", async () => {
      const mockError = new Error("DynamoDB query failed");
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(mockError),
      });

      await expect(
        userOrgRepository.getOrganizationsByToken(mockTokenId)
      ).rejects.toThrow("DynamoDB query failed");
    });
  });

  describe("getUserByOrganizationId", () => {
    it("should call query with correct parameters for getUserByOrganizationId", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [mockDynamoItem],
        }),
      });

      await userOrgRepository.getUserByOrganizationId(mockOrganizationId);

      expect(mockQuery).toHaveBeenCalledWith({
        TableName: mockTableName,
        IndexName: "SK-index",
        KeyConditionExpression: "SK = :sk",
        ExpressionAttributeValues: {
          ":sk": `ORG#${mockOrganizationId}`,
        },
      });
    });

    it("should return users when found by organization ID", async () => {
      const user1DynamoItem = {
        PK: `USERID#user-1`,
        SK: `ORG#${mockOrganizationId}`,
        Token: "token-1",
        Type: "user",
        Name: "User 1",
      };

      const user2DynamoItem = {
        PK: `USERID#user-2`,
        SK: `ORG#${mockOrganizationId}`,
        Token: "token-2",
        Type: "user",
        Name: "User 2",
      };

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [user1DynamoItem, user2DynamoItem],
        }),
      });

      const result = await userOrgRepository.getUserByOrganizationId(
        mockOrganizationId
      );

      expect(result).toEqual([
        {
          Token: "token-1",
          Type: "user",
          Name: "User 1",
          organizationId: mockOrganizationId,
          userId: "user-1",
        },
        {
          Token: "token-2",
          Type: "user",
          Name: "User 2",
          organizationId: mockOrganizationId,
          userId: "user-2",
        },
      ]);
    });

    it("should return empty array when no users found for organization", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [],
        }),
      });

      const result = await userOrgRepository.getUserByOrganizationId(
        mockOrganizationId
      );

      expect(result).toEqual([]);
    });

    it("should return undefined when Items is undefined", async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: undefined,
        }),
      });

      const result = await userOrgRepository.getUserByOrganizationId(
        mockOrganizationId
      );

      expect(result).toBeUndefined();
    });

    it("should handle DynamoDB query errors for organization lookup", async () => {
      const mockError = new Error("DynamoDB query failed");
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(mockError),
      });

      await expect(
        userOrgRepository.getUserByOrganizationId(mockOrganizationId)
      ).rejects.toThrow("DynamoDB query failed");
    });
  });

  describe("constructor", () => {
    it("should initialize with correct parameters", () => {
      const dynamoDocClient = new DynamoDB.DocumentClient();
      const repository = new UserOrganizationRepository({
        userOrganizationTable: mockTableName,
        dynamoDocClient,
      });

      expect(repository).toBeInstanceOf(UserOrganizationRepository);
    });
  });
});
