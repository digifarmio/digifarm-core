import { Lambda } from "aws-sdk";

export class LambdaManager {
  private lambdaClient: Lambda;

  constructor({ lambdaClient }: { lambdaClient: Lambda }) {
    this.lambdaClient = lambdaClient;
  }

  async getResponse({
    functionName,
    payload,
  }: {
    functionName: string;
    payload: Record<string, unknown>;
  }) {
    const params = {
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(payload),
    };

    return await this.lambdaClient.invoke(params).promise();
  }
}
