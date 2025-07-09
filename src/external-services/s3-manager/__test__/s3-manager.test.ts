import { S3Manager } from "..";
import { S3 } from "aws-sdk";

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

describe("S3Manager Testing", () => {
  let s3Manager: S3Manager;
  let mockS3: S3;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3 = new S3();

    s3Manager = new S3Manager({
      s3Client: mockS3,
    });
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
  });

  it("should call getSignedUrlPromise with the correct parameters", async () => {
    await s3Manager.getSignedUrl({
      bucket: "my-bucket",
      key: "path/to/file.txt",
      expires: 3600,
    });

    expect(mockS3.getSignedUrlPromise).toHaveBeenCalledWith("getObject", {
      Bucket: "my-bucket",
      Key: "path/to/file.txt",
      Expires: 3600,
    });
  });

  it("should query Sentinel bucket", async () => {
    const mockData = { Contents: [{ Key: "some-key" }] };
    mockListObjectsV2.mockResolvedValue(mockData);

    const result = await s3Manager.querySentinelBucket("my-bucket", "prefix");

    expect(result).toEqual(mockData);
  });

  it("should call listObjectsV2 with the correct parameters", async () => {
    await s3Manager.querySentinelBucket("my-bucket", "prefix");

    expect(mockS3.listObjectsV2).toHaveBeenCalledWith({
      Bucket: "my-bucket",
      Prefix: "prefix",
      Delimiter: "/",
    });
  });

  it("should return presigned URL from fileLocation", async () => {
    const signedUrl = "https://signed.url/path/to/file.txt";
    (mockS3.getSignedUrlPromise as jest.Mock).mockResolvedValue(signedUrl);

    const result = await s3Manager.presignedS3Url("my-bucket/path/to/file.txt");

    expect(result).toBe(signedUrl);
  });

  it("should call getSignedUrlPromise with the correct parameters", async () => {
    await s3Manager.presignedS3Url("my-bucket/path/to/file.txt");

    expect(mockS3.getSignedUrlPromise).toHaveBeenCalledWith("getObject", {
      Bucket: "my-bucket",
      Key: "path/to/file.txt",
      Expires: 60 * 60 * 24 * 7,
    });
  });
});
