import { S3Manager } from "..";
import AWS from "aws-sdk";
import { LambdaLog } from "lambda-log";

// Mock S3 and LambdaLog
const mockListObjectsV2 = jest.fn();

jest.mock("aws-sdk", () => {
  const mS3 = {
    getSignedUrlPromise: jest.fn(),
    listObjectsV2: jest.fn(() => ({
      promise: mockListObjectsV2,
    })),
  };
  return {
    S3: jest.fn(() => mS3),
  };
});

jest.mock("lambda-log", () => {
  return {
    LambdaLog: jest.fn().mockImplementation(() => ({
      error: jest.fn(),
    })),
  };
});

describe("S3Manager", () => {
  let s3Manager: S3Manager;
  let mockLogger: LambdaLog;
  let mockS3: AWS.S3;

  beforeEach(() => {
    mockLogger = new LambdaLog();
    mockS3 = new AWS.S3();

    s3Manager = new S3Manager({
      logger: mockLogger,
      s3Client: mockS3,
    });

    jest.clearAllMocks();
  });

  it("should return a signed URL", async () => {
    const signedUrl = "https://signed.url/file.txt";
    (mockS3.getSignedUrlPromise as jest.Mock).mockResolvedValue(signedUrl);

    const result = await s3Manager.getSignedUrl({
      bucket: "my-bucket",
      key: "path/to/file.txt",
      expires: 3600,
    });

    expect(result).toBe(signedUrl);
    expect(mockS3.getSignedUrlPromise).toHaveBeenCalledWith("getObject", {
      Bucket: "my-bucket",
      Key: "path/to/file.txt",
      Expires: 3600,
    });
  });

  it("should throw error and log when signed URL fails", async () => {
    const error = new Error("Something went wrong");
    (mockS3.getSignedUrlPromise as jest.Mock).mockRejectedValue(error);

    await expect(
      s3Manager.getSignedUrl({
        bucket: "my-bucket",
        key: "path/to/file.txt",
        expires: 3600,
      })
    ).rejects.toThrow("Something went wrong");

    expect(mockLogger.error).toHaveBeenCalledWith(error);
  });

  it("should query Sentinel bucket", async () => {
    const mockData = { Contents: [{ Key: "some-key" }] };
    mockListObjectsV2.mockResolvedValue(mockData);

    const result = await s3Manager.querySentinelBucket("my-bucket", "prefix");

    expect(mockS3.listObjectsV2).toHaveBeenCalledWith({
      Bucket: "my-bucket",
      Prefix: "prefix",
      Delimiter: "/",
    });

    expect(result).toEqual(mockData);
  });

  it("should return presigned URL from fileLocation", async () => {
    const signedUrl = "https://signed.url/path/to/file.txt";
    (mockS3.getSignedUrlPromise as jest.Mock).mockResolvedValue(signedUrl);

    const result = await s3Manager.presignedS3Url("my-bucket/path/to/file.txt");

    expect(result).toBe(signedUrl);
    expect(mockS3.getSignedUrlPromise).toHaveBeenCalledWith("getObject", {
      Bucket: "my-bucket",
      Key: "path/to/file.txt",
      Expires: 60 * 60 * 24 * 7,
    });
  });
});
