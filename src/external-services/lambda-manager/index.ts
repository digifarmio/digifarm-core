import { LambdaLog } from "lambda-log";
import AWS from "aws-sdk";

export class LambdaManager {
  private logger: LambdaLog;
  private lambdaClient: AWS.Lambda;

  constructor({
    logger,
    lambdaClient,
  }: {
    logger: LambdaLog;
    lambdaClient: AWS.Lambda;
  }) {
    this.logger = logger;
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

    try {
      const data = await this.lambdaClient.invoke(params).promise();
      return data;
    } catch (err) {
      this.logger.error(err as Error);
      throw err;
    }
  }
}
