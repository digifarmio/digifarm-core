import { UsageLogsReadManager } from "..";
import { S3 } from "aws-sdk";
import {
  UsageLog,
  UsageLogMetricTypes,
  UsageLogMetricFamily,
  UsageLogBillingType,
} from "@/types";

// Mock S3
const mockGetObject = jest.fn();

jest.mock("aws-sdk", () => {
  const mS3 = {
    getObject: jest.fn(() => ({
      promise: mockGetObject,
    })),
  };

  return {
    S3: jest.fn(() => mS3),
  };
});

describe("UsageLogsReadManager", () => {
  let usageLogsReadManager: UsageLogsReadManager;
  let mockS3: S3;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3 = new S3();
    usageLogsReadManager = new UsageLogsReadManager({
      s3Client: mockS3,
    });
  });

  describe("constructor", () => {
    it("should initialize with S3 client", () => {
      expect(usageLogsReadManager.s3Client).toBe(mockS3);
    });
  });

  describe("serializeUsageLogs", () => {
    it("should parse valid usage logs from string", () => {
      const mockUsageLog1: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.DF_LOW_RES,
          metric: UsageLogMetricFamily.SUM,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
      };

      const mockUsageLog2: UsageLog = {
        requestId: "req-2",
        source: {
          type: UsageLogMetricTypes.DF_HIGH_RES,
          metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER,
          billingType: UsageLogBillingType.AREA,
        },
        organizationId: "org-2",
        apiKeyId: "key-2",
        timeStamp: 1234567891,
        date: "2023-01-02",
        payload: [
          {
            id: "polygon-1",
            version: "1.0",
            area: 100.5,
            count: 5,
            country: "US",
            mgrs: "10SDA1234567890",
          },
        ],
      };

      const dataObject =
        JSON.stringify(mockUsageLog1) + "$_$" + JSON.stringify(mockUsageLog2);
      const result = usageLogsReadManager.serializeUsageLogs(dataObject);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockUsageLog1);
      expect(result[1]).toEqual(mockUsageLog2);
    });

    it("should handle empty string input", () => {
      const result = usageLogsReadManager.serializeUsageLogs("");
      expect(result).toEqual([]);
    });

    it("should filter out empty entries", () => {
      const mockUsageLog: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.DF_LOW_RES,
          metric: UsageLogMetricFamily.SUM,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
      };

      const dataObject =
        JSON.stringify(mockUsageLog) +
        "$_$" +
        "" +
        "$_$" +
        JSON.stringify(mockUsageLog);
      const result = usageLogsReadManager.serializeUsageLogs(dataObject);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockUsageLog);
      expect(result[1]).toEqual(mockUsageLog);
    });

    it("should not filter out whitespace-only entries (current implementation limitation)", () => {
      const mockUsageLog: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.DF_LOW_RES,
          metric: UsageLogMetricFamily.SUM,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
      };

      const dataObject =
        JSON.stringify(mockUsageLog) +
        "$_$" +
        "   " +
        "$_$" +
        JSON.stringify(mockUsageLog);

      expect(() => {
        usageLogsReadManager.serializeUsageLogs(dataObject);
      }).toThrow();
    });

    it("should handle single log entry", () => {
      const mockUsageLog: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.ZONING,
          metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER,
          billingType: UsageLogBillingType.ZONING_AREA,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
      };

      const dataObject = JSON.stringify(mockUsageLog);
      const result = usageLogsReadManager.serializeUsageLogs(dataObject);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockUsageLog);
    });

    it("should throw error for invalid JSON", () => {
      const invalidDataObject = '{"invalid": json}$_${"valid": "json"}';

      expect(() => {
        usageLogsReadManager.serializeUsageLogs(invalidDataObject);
      }).toThrow();
    });
  });

  describe("getUsageLogs", () => {
    it("should successfully retrieve and parse usage logs from S3", async () => {
      const mockUsageLog: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.DF_LOW_RES,
          metric: UsageLogMetricFamily.SUM,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
      };

      const fileData = JSON.stringify(mockUsageLog);
      mockGetObject.mockResolvedValue({
        Body: fileData,
      });

      const result = await usageLogsReadManager.getUsageLogs(
        "my-bucket/path/to/logs.txt",
      );

      expect(mockS3.getObject).toHaveBeenCalledWith({
        Bucket: "my-bucket",
        Key: "path/to/logs.txt",
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockUsageLog);
    });

    it("should handle multiple logs in file", async () => {
      const mockUsageLog1: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.DF_LOW_RES,
          metric: UsageLogMetricFamily.SUM,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
      };

      const mockUsageLog2: UsageLog = {
        requestId: "req-2",
        source: {
          type: UsageLogMetricTypes.DF_HIGH_RES,
          metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER,
          billingType: UsageLogBillingType.COUNT,
        },
        organizationId: "org-2",
        apiKeyId: "key-2",
        timeStamp: 1234567891,
        date: "2023-01-02",
      };

      const fileData =
        JSON.stringify(mockUsageLog1) + "$_$" + JSON.stringify(mockUsageLog2);
      mockGetObject.mockResolvedValue({
        Body: fileData,
      });

      const result = await usageLogsReadManager.getUsageLogs(
        "my-bucket/path/to/logs.txt",
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockUsageLog1);
      expect(result[1]).toEqual(mockUsageLog2);
    });

    it("should handle empty file content", async () => {
      mockGetObject.mockResolvedValue({
        Body: "",
      });

      const result = await usageLogsReadManager.getUsageLogs(
        "my-bucket/path/to/logs.txt",
      );

      expect(result).toEqual([]);
    });

    it("should handle undefined Body from S3", async () => {
      mockGetObject.mockResolvedValue({
        Body: undefined,
      });

      const result = await usageLogsReadManager.getUsageLogs(
        "my-bucket/path/to/logs.txt",
      );

      expect(result).toEqual([]);
    });

    it("should throw error for invalid path without bucket", async () => {
      await expect(usageLogsReadManager.getUsageLogs("")).rejects.toThrow(
        "Invalid path",
      );
    });

    it("should handle path with only bucket (current implementation behavior)", async () => {
      const mockUsageLog: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.DF_LOW_RES,
          metric: UsageLogMetricFamily.SUM,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
      };

      const fileData = JSON.stringify(mockUsageLog);
      mockGetObject.mockResolvedValue({
        Body: fileData,
      });

      const result = await usageLogsReadManager.getUsageLogs("bucket-only");

      expect(mockS3.getObject).toHaveBeenCalledWith({
        Bucket: "bucket-only",
        Key: "",
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockUsageLog);
    });

    it("should throw error for invalid path with only slash", async () => {
      await expect(usageLogsReadManager.getUsageLogs("/")).rejects.toThrow(
        "Invalid path",
      );
    });

    it("should handle complex nested paths", async () => {
      const mockUsageLog: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.DF_LOW_RES,
          metric: UsageLogMetricFamily.SUM,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
      };

      const fileData = JSON.stringify(mockUsageLog);
      mockGetObject.mockResolvedValue({
        Body: fileData,
      });

      await usageLogsReadManager.getUsageLogs(
        "my-bucket/folder/subfolder/logs.txt",
      );

      expect(mockS3.getObject).toHaveBeenCalledWith({
        Bucket: "my-bucket",
        Key: "folder/subfolder/logs.txt",
      });
    });

    it("should propagate S3 errors", async () => {
      const s3Error = new Error("S3 access denied");
      mockGetObject.mockRejectedValue(s3Error);

      await expect(
        usageLogsReadManager.getUsageLogs("my-bucket/path/to/logs.txt"),
      ).rejects.toThrow("S3 access denied");
    });

    it("should handle logs with payload", async () => {
      const mockUsageLog: UsageLog = {
        requestId: "req-1",
        source: {
          type: UsageLogMetricTypes.DF_HIGH_RES,
          metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER,
          billingType: UsageLogBillingType.AREA,
        },
        organizationId: "org-1",
        apiKeyId: "key-1",
        timeStamp: 1234567890,
        date: "2023-01-01",
        payload: [
          {
            id: "polygon-1",
            version: "1.0",
            area: 150.25,
            count: 3,
            country: "CA",
            mgrs: "10SDA1234567890",
          },
          {
            id: "polygon-2",
            version: "1.1",
            area: 200.75,
            count: 7,
            country: "US",
            mgrs: "10SDA1234567891",
          },
        ],
      };

      const fileData = JSON.stringify(mockUsageLog);
      mockGetObject.mockResolvedValue({
        Body: fileData,
      });

      const result = await usageLogsReadManager.getUsageLogs(
        "my-bucket/path/to/logs.txt",
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockUsageLog);
      expect(result[0]?.payload).toHaveLength(2);
    });
  });
});
