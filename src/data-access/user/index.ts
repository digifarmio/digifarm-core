import { DynamoDB } from "aws-sdk";
import { schemaUnMarshal } from "@/helpers/schemaUnmarshal";
import { UserOrganization } from "@/types";

export class UserOrganizationRepository {
  private userOrganizationTable: string;
  private dynamoDocClient: DynamoDB.DocumentClient;

  constructor({
    userOrganizationTable,
    dynamoDocClient,
  }: {
    userOrganizationTable: string;
    dynamoDocClient: DynamoDB.DocumentClient;
  }) {
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

    const users = result.Items?.map(schemaUnMarshal) as {
      userId: string;
      organizationId: string;
    }[];

    return users;
  }
}
