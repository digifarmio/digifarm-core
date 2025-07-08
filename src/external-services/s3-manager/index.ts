import { LambdaLog } from "lambda-log";
import AWS from "aws-sdk";

export class S3Manager {
  private logger: LambdaLog;
  private s3Client: AWS.S3;

  constructor({ logger, s3Client }: { logger: LambdaLog; s3Client: AWS.S3 }) {
    this.logger = logger;
    this.s3Client = s3Client;
  }

  async getSignedUrl({
    bucket,
    key,
    expires,
  }: {
    bucket: string;
    key: string;
    expires: number;
  }) {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: expires,
    };

    try {
      const url = await this.s3Client.getSignedUrlPromise("getObject", params);
      return url;
    } catch (err) {
      this.logger.error(err as Error);
      throw err;
    }
  }

  async querySentinelBucket(bucket: string, prefix: string, delimiter = "/") {
    const data = this.s3Client
      .listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: delimiter,
      })
      .promise();

    return data;
  }

  async presignedS3Url(fileLocation: string) {
    const [bucket, ...key] = fileLocation.split("/");
    const filePath = key.join("/");

    if (!bucket || !filePath) {
      throw new Error("Invalid file location");
    }

    const signedUrl = await this.getSignedUrl({
      bucket,
      key: filePath,
      expires: 60 * 60 * 24 * 7,
    });

    return signedUrl;
  }
}
