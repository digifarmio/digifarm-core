import { CognitoIdentityServiceProvider } from "aws-sdk";

export class CognitoManager {
  private readonly cognitoClient: CognitoIdentityServiceProvider;
  private readonly userPoolId: string;

  constructor({
    cognitoClient,
    userPoolId,
  }: {
    cognitoClient: CognitoIdentityServiceProvider;
    userPoolId: string;
  }) {
    this.cognitoClient = cognitoClient;
    this.userPoolId = userPoolId;
  }

  private async processCognitoResponse(
    cognitoResponse: CognitoIdentityServiceProvider.Types.AdminGetUserResponse,
  ) {
    const attributesObject = Object.fromEntries(
      cognitoResponse?.UserAttributes?.map((attr) => [attr.Name, attr.Value]) ||
        [],
    );

    return attributesObject;
  }

  async getUserByUsername<T>(username: string): Promise<T> {
    const result = await this.cognitoClient
      .adminGetUser({
        UserPoolId: this.userPoolId,
        Username: username,
      })
      .promise();

    return this.processCognitoResponse(result) as T;
  }
}

export default CognitoManager;
