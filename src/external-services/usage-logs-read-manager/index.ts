import S3 from "aws-sdk/clients/s3";
import { IUsageLogsManager, UsageLog } from "@/types";

export class UsageLogsReadManager implements IUsageLogsManager {
  s3Client: S3;

  constructor({ s3Client }: { s3Client: S3 }) {
    this.s3Client = s3Client;
  }

  serializeUsageLogs(dataObject: string): UsageLog[] {
    const logs = dataObject.split("$_$");
    // TODO: Add sanitizer here to discard any json that doesn't follow the shape
    return logs.filter((e) => e).map((e) => JSON.parse(e) as UsageLog);
  }

  async getUsageLogs(path: string) {
    const [bucket, ...key] = path.split("/");

    if (!bucket || !key) {
      throw new Error("Invalid path");
    }

    const params = {
      Bucket: bucket,
      Key: key.join("/"),
    };

    // Should we catch the error here? Maybe
    const file = await this.s3Client.getObject(params).promise();
    const fileData = file.Body?.toString("utf8") || "";

    return this.serializeUsageLogs(fileData);
  }
}
