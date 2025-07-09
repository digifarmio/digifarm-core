import { S3 } from "aws-sdk";

export class S3Manager {
  private s3Client: S3;

  constructor({ s3Client }: { s3Client: S3 }) {
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

    return await this.s3Client.getSignedUrlPromise("getObject", params);
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
