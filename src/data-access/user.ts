import type { ILogger } from "../external-services/log-manager";
import { DynamoDB } from "aws-sdk";
import { schemaUnMarshal } from "../helpers/schemaUnmarshal";

export type UserOrganization = {
  Token: string;
  Type: string;
  Name: string;
  organizationId: string;
};

export class UserOrganizationRepository {
  private logger: ILogger;
  private userOrganizationTable: string;
  private dynamoDocClient: DynamoDB.DocumentClient;

  constructor({
    logger,
    userOrganizationTable,
    dynamoDocClient,
  }: {
    logger: ILogger;
    userOrganizationTable: string;
    dynamoDocClient: DynamoDB.DocumentClient;
  }) {
    this.logger = logger;
    this.userOrganizationTable = userOrganizationTable;
    this.dynamoDocClient = dynamoDocClient;
  }

  async getUserOrganizationsById(userId: string): Promise<UserOrganization> {
    const result = await this.dynamoDocClient
      .query({
        TableName: this.userOrganizationTable,
        KeyConditionExpression: "PK = :pk and begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USERID#${userId}`,
          ":sk": "ORG#",
        },
      })
      .promise();

    const userOrgs = result.Items?.map(schemaUnMarshal);
    this.logger.info("User organizations", { userOrgs });
    return userOrgs?.[0];
  }

  async getOrganizationsByToken(tokenId: string): Promise<UserOrganization> {
    const result = await this.dynamoDocClient
      .query({
        TableName: this.userOrganizationTable,
        IndexName: "SK-index",
        KeyConditionExpression: "SK = :sk",
        ExpressionAttributeValues: {
          ":sk": `TOKENID#V0#${tokenId}`,
        },
      })
      .promise();

    const userOrgs = result.Items?.map(schemaUnMarshal);
    this.logger.info("User organizations", { userOrgs });
    return userOrgs?.[0];
  }

  async getUserByOrganizationId(organizationId: string) {
    const result = await this.dynamoDocClient
      .query({
        TableName: this.userOrganizationTable,
        IndexName: "SK-index",
        KeyConditionExpression: "SK = :sk",
        ExpressionAttributeValues: {
          ":sk": `ORG#${organizationId}`,
        },
      })
      .promise();

    this.logger.info("User organization result", { result });

    const users = result.Items?.map(schemaUnMarshal) as {
      userId: string;
      organizationId: string;
    }[];

    this.logger.info("Users", { users });

    return users;
  }
}
