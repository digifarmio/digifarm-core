import { UsageLogsWriterManager } from "..";
import { ILogger } from "../../log-manager";
import Firehose from "aws-sdk/clients/firehose";
import {
  UsageLog,
  UsageLogBillingType,
  UsageLogMetricFamily,
  UsageLogMetricTypes,
  NewPolygonPayload,
  PartialDRPayload,
} from "@/types";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Helper function to create mock APIGatewayProxyEvent
const createMockAPIGatewayEvent = (
  overrides: Partial<APIGatewayProxyEvent> = {},
): APIGatewayProxyEvent => ({
  requestContext: {
    requestId: "test-request-id",
    accountId: "test-account",
    apiId: "test-api",
    authorizer: null,
    protocol: "HTTP/1.1",
    httpMethod: "GET",
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "127.0.0.1",
      user: null,
      userAgent: null,
      userArn: null,
      clientCert: null,
    },
    path: "/test",
    stage: "test",
    requestTime: "12/Jan/2024:19:03:58 +0000",
    requestTimeEpoch: 1705000000000,
    resourceId: "test-resource",
    resourcePath: "/test",
  },
  queryStringParameters: {
    token: "test-token",
  },
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: "GET",
  isBase64Encoded: false,
  path: "/test",
  pathParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: "/test",
  ...overrides,
});

// Mock Firehose
const mockPutRecord = jest.fn();
const mockFirehoseClient = {
  putRecord: jest.fn(() => ({
    promise: mockPutRecord,
  })),
} as unknown as Firehose;

// Mock Logger
const mockLogger: ILogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("UsageLogsWriterManager Testing", () => {
  let usageLogsWriterManager: UsageLogsWriterManager;
  const deliveryStreamName = "test-delivery-stream";

  beforeEach(() => {
    jest.clearAllMocks();
    usageLogsWriterManager = new UsageLogsWriterManager({
      logger: mockLogger,
      firehoseClient: mockFirehoseClient,
      deliveryStreamName,
    });
  });

  describe("constructor", () => {
    it("should initialize with correct parameters", () => {
      expect(usageLogsWriterManager).toBeInstanceOf(UsageLogsWriterManager);
    });
  });

  describe("writeUsageLog", () => {
    const mockUsageLog: UsageLog = {
      requestId: "test-request-id",
      source: {
        metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER,
        type: UsageLogMetricTypes.DF_HIGH_RES,
        billingType: UsageLogBillingType.COUNT,
      },
      organizationId: "test-org-id",
      apiKeyId: "test-api-key",
      timeStamp: Date.now(),
      date: "2024-01-01",
      payload: [],
    };

    it("should successfully write usage log to Firehose", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLog(mockUsageLog);

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: `${JSON.stringify(mockUsageLog)}$_$`,
        },
      });
    });

    it("should handle Firehose errors", async () => {
      const error = new Error("Firehose error");
      mockPutRecord.mockRejectedValue(error);

      await expect(
        usageLogsWriterManager.writeUsageLog(mockUsageLog),
      ).rejects.toThrow("Firehose error");
    });
  });

  describe("writeUsageLogForGetDelineatedFields", () => {
    const mockEvent = createMockAPIGatewayEvent({
      queryStringParameters: {
        token: "test-token",
        billing: "by_haa",
      },
    });

    const mockFeatures: NewPolygonPayload[] = [
      {
        id: "feature-1",
        version: "1.0",
        area: 100,
        count: 5,
        country: "US",
        mgrs: "15S",
      },
    ];

    it("should write usage log with AREA billing type when billing=by_haa", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForGetDelineatedFields(
        mockEvent,
        mockFeatures,
      );

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: expect.stringContaining('"billingType":"AREA"'),
        },
      });
    });

    it("should write usage log with COUNT billing type when billing is not by_haa", async () => {
      const eventWithoutBilling = {
        ...mockEvent,
        queryStringParameters: {
          token: "test-token",
        },
      };

      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForGetDelineatedFields(
        eventWithoutBilling,
        mockFeatures,
      );

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: expect.stringContaining('"billingType":"COUNT"'),
        },
      });
    });

    it("should handle empty features array", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForGetDelineatedFields(
        mockEvent,
        [],
      );
    });

    it("should handle missing queryStringParameters", async () => {
      const eventWithoutParams = {
        ...mockEvent,
        queryStringParameters: null,
      };

      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForGetDelineatedFields(
        eventWithoutParams,
        mockFeatures,
      );

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: expect.stringContaining('"organizationId":""'),
        },
      });
    });
  });

  describe("writeUsageLogForGetDelineatedFieldsByLocation", () => {
    const mockEvent = createMockAPIGatewayEvent({
      queryStringParameters: {
        token: "test-token",
      },
    });

    const mockFeatures: NewPolygonPayload[] = [
      {
        id: "feature-1",
        version: "1.0",
        area: 100,
        count: 5,
        country: "US",
        mgrs: "15S",
      },
    ];

    it("should write usage log with COUNT billing type", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForGetDelineatedFieldsByLocation(
        mockEvent,
        mockFeatures,
      );

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: expect.stringContaining('"billingType":"COUNT"'),
        },
      });
    });

    it("should handle empty features array", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForGetDelineatedFieldsByLocation(
        mockEvent,
        [],
      );
    });
  });

  describe("writeUsageLogForGetDelineatedFieldsById", () => {
    const mockEvent = createMockAPIGatewayEvent({
      queryStringParameters: {
        token: "test-token",
      },
    });

    const mockFeatures: NewPolygonPayload[] = [
      {
        id: "feature-1",
        version: "1.0",
        area: 100,
        count: 5,
        country: "US",
        mgrs: "15S",
      },
    ];

    it("should write usage log with COUNT billing type", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForGetDelineatedFieldsById(
        mockEvent,
        mockFeatures,
      );

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: expect.stringContaining('"billingType":"COUNT"'),
        },
      });
    });

    it("should handle empty features array", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForGetDelineatedFieldsById(
        mockEvent,
        [],
      );
    });
  });

  describe("writeUsageLogForPDRImagery", () => {
    const mockFeatures: PartialDRPayload[] = [
      {
        subscriptionId: "sub-123",
        version: "1.0",
        area: 100,
        date: "2024-01-01",
        dataSource: "sentinel",
        mgrs: "15S",
      },
    ];

    const organizationId = "test-org-id";

    it("should write usage log for PDR imagery", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForPDRImagery(
        mockFeatures,
        organizationId,
      );

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: expect.stringContaining('"metric":"SUM"'),
        },
      });
    });

    it("should handle empty features array", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForPDRImagery(
        [],
        organizationId,
      );
    });

    it("should use first subscriptionId as requestId when features exist", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForPDRImagery(
        mockFeatures,
        organizationId,
      );

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: expect.stringContaining('"requestId":"sub-123"'),
        },
      });
    });

    it("should use empty string as requestId when features array is empty", async () => {
      mockPutRecord.mockResolvedValue({ RecordId: "test-record-id" });

      await usageLogsWriterManager.writeUsageLogForPDRImagery(
        [],
        organizationId,
      );

      expect(mockFirehoseClient.putRecord).toHaveBeenCalledWith({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: expect.stringContaining('"requestId":""'),
        },
      });
    });
  });

  describe("error handling", () => {
    it("should propagate errors from writeUsageLog", async () => {
      const error = new Error("Firehose error");
      mockPutRecord.mockRejectedValue(error);

      const mockEvent = createMockAPIGatewayEvent({
        queryStringParameters: {
          token: "test-token",
        },
      });

      await expect(
        usageLogsWriterManager.writeUsageLogForGetDelineatedFields(
          mockEvent,
          [],
        ),
      ).rejects.toThrow("Firehose error");
    });
  });
});
