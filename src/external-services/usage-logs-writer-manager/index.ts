import type { ILogger } from "../log-manager";
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

export class UsageLogsWriterManager {
  private logger: ILogger;
  private firehoseClient: Firehose;
  private deliveryStreamName: string;

  constructor({
    logger,
    firehoseClient,
    deliveryStreamName,
  }: {
    logger: ILogger;
    firehoseClient: Firehose;
    deliveryStreamName: string;
  }) {
    this.logger = logger;
    this.firehoseClient = firehoseClient;
    this.deliveryStreamName = deliveryStreamName;
  }

  async writeUsageLog(usageLog: UsageLog): Promise<void> {
    const log = JSON.stringify(usageLog);
    this.logger.info("input to usagelogs", {
      usageLog,
    });
    // Date and timestamp to be added here.

    const params: Firehose.PutRecordInput = {
      DeliveryStreamName: this.deliveryStreamName,
      Record: {
        Data: `${log}$_$`,
      },
    };

    const response = await this.firehoseClient.putRecord(params).promise();

    this.logger.info("Successfully logged usage:", {
      response,
    });
  }

  async writeUsageLogForGetDelineatedFields(
    event: APIGatewayProxyEvent,
    features: NewPolygonPayload[] = [],
  ) {
    this.logger.debug("features for logging", { features });

    const getSourceType = (e: APIGatewayProxyEvent) => {
      if (e?.queryStringParameters?.billing === "by_haa") {
        return UsageLogBillingType.AREA;
      } else {
        return UsageLogBillingType.COUNT;
      }
    };

    const type = getSourceType(event);

    const ts = Date.now();
    const d = new Date(ts);
    const date = d.toISOString().split("T")[0] || "";

    const start = Date.now();

    await this.writeUsageLog({
      requestId: event.requestContext.requestId,
      source: {
        metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER,
        type: UsageLogMetricTypes.DF_HIGH_RES,
        billingType: type,
      },
      organizationId: event?.queryStringParameters?.token || "",
      apiKeyId: event?.queryStringParameters?.token || "",
      timeStamp: ts,
      date: date,
      payload: features,
    });
    const ttc = Date.now() - start;
    this.logger.info(`Completion time for usagelog insertion: ${ttc}`, {
      ttc,
      requestId: event.requestContext.requestId,
    });
  }

  async writeUsageLogForGetDelineatedFieldsByLocation(
    event: APIGatewayProxyEvent,
    features: NewPolygonPayload[] = [],
  ) {
    this.logger.debug("features for logging", { features });

    const sourceType = UsageLogBillingType.COUNT;

    const ts = Date.now();
    const d = new Date(ts);
    const date = d.toISOString().split("T")[0] || "";

    const start = Date.now();

    await this.writeUsageLog({
      requestId: event.requestContext.requestId,
      source: {
        metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER,
        type: UsageLogMetricTypes.DF_HIGH_RES,
        billingType: sourceType,
      },
      organizationId: event?.queryStringParameters?.token || "",
      apiKeyId: event?.queryStringParameters?.token || "",
      timeStamp: ts,
      date,
      payload: features,
    });

    const ttc = Date.now() - start;

    this.logger.info(`Completion time for usagelog insertion: ${ttc}`, {
      ttc,
      requestId: event.requestContext.requestId,
    });
  }

  async writeUsageLogForGetDelineatedFieldsById(
    event: APIGatewayProxyEvent,
    features: NewPolygonPayload[] = [],
  ) {
    this.logger.debug("features for logging:", { features });

    const sourceType = UsageLogBillingType.COUNT;

    const ts = Date.now();
    const d = new Date(ts);
    const date = d.toISOString().split("T")[0] || "";

    const start = Date.now();

    await this.writeUsageLog({
      requestId: event.requestContext.requestId,
      source: {
        metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER,
        type: UsageLogMetricTypes.DF_HIGH_RES,
        billingType: sourceType,
      },
      organizationId: event?.queryStringParameters?.token || "",
      apiKeyId: event?.queryStringParameters?.token || "",
      timeStamp: ts,
      date,
      payload: features,
    });

    const ttc = Date.now() - start;

    this.logger.info(`Completion time for usagelog insertion: ${ttc}`, {
      ttc,
      requestId: event.requestContext.requestId,
    });
  }

  async writeUsageLogForPDRImagery(
    features: PartialDRPayload[] = [],
    organizationId: string,
  ) {
    this.logger.debug("features for logging", { features });

    const ts = Date.now();
    const d = new Date(ts);
    const date = d.toISOString().split("T")[0] || "";

    const start = Date.now();

    await this.writeUsageLog({
      requestId: features?.[0]?.subscriptionId || "",
      source: {
        metric: UsageLogMetricFamily.SUM,
        type: UsageLogMetricTypes.DR_BBOX,
        // billingType: sourceType
      },
      organizationId: organizationId,
      apiKeyId: organizationId,
      timeStamp: ts,
      date,
      payload: features as unknown as NewPolygonPayload[],
    });

    const ttc = Date.now() - start;

    this.logger.info(`Completion time for usagelog insertion: ${ttc}`, {
      ttc,
      requestId: features,
    });
  }
}
