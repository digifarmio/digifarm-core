import S3 from "aws-sdk/clients/s3";
import { ILogger } from "../log-manager";

export type NewPolygonPayload = {
  id: string;
  version: string;
  area: number;
  count: number;
  country: string;
  mgrs: string;
};

export type PartiaDRPayload = {
  subscriptionId: string;
  version: string;
  area: number;
  date: string;
  dataSource: string;
  mgrs: string;
};

export enum UsageLogMetricFamily {
  "SUM" = "SUM",
  "NEW_POLYGONS_FILTER" = "NEW_POLYGONS_FILTER",
}

export enum UsageLogBillingType {
  "COUNT" = "COUNT",
  "AREA" = "AREA",
  "ZONING_AREA" = "ZONING_AREA",
}

export enum UsageLogMetricTypes {
  "DF_LOW_RES" = "DF_LOW_RES",
  "DF_HIGH_RES" = "DF_HIGH_RES",
  "DF_COVERAGE" = "DF_COVERAGE",
  "DR_COVERAGE" = "DR_COVERAGE",
  "DR_XYZ" = "DR_XYZ",
  "DR_BBOX" = "DR_BBOX",
  "DR_PRE_WMTS_CAP" = "DR_PRE_WMTS_CAP",
  "DR_PRE_WMTS_TILE" = "DR_PRE_WMTS_TILE",
  "ZONING" = "ZONING",
}

type UsageLogMetrics =
  | {
      type: UsageLogMetricTypes.DF_LOW_RES;
      metric: UsageLogMetricFamily.SUM;
    }
  | {
      type: UsageLogMetricTypes.DF_HIGH_RES;
      metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER;
      billingType: UsageLogBillingType.AREA | UsageLogBillingType.COUNT;
    }
  | {
      type: UsageLogMetricTypes.DF_COVERAGE;
      metric: UsageLogMetricFamily.SUM;
    }
  | {
      type: UsageLogMetricTypes.DR_COVERAGE;
      metric: UsageLogMetricFamily.SUM;
    }
  | {
      type: UsageLogMetricTypes.DR_XYZ;
      metric: UsageLogMetricFamily.SUM;
    }
  | {
      type: UsageLogMetricTypes.DR_BBOX;
      metric: UsageLogMetricFamily.SUM;
    }
  | {
      type: UsageLogMetricTypes.DR_PRE_WMTS_CAP;
      metric: UsageLogMetricFamily.SUM;
    }
  | {
      type: UsageLogMetricTypes.DR_PRE_WMTS_TILE;
      metric: UsageLogMetricFamily.SUM;
    }
  | {
      type: UsageLogMetricTypes.ZONING;
      metric: UsageLogMetricFamily.NEW_POLYGONS_FILTER;
      billingType: UsageLogBillingType.ZONING_AREA;
    };

/**
 * UsageLog is one single instance of the usage log
 * triggered by the APIs. This is one usage unit.
 * requestId identifies the request from which this request has originated from.
 * source tells us the type (i.e the API) and metric tells us how we should process it
 * organizationId and apiKeyId are evident.
 * timeStamp is the unix timestamp in milliseconds since unix epoch
 * payload is only applicable for high resolution polygons
 *
 * For high resolution polygons we have payload which tells us what all polygons were processed.
 */
export type UsageLog = {
  requestId: string;
  source: UsageLogMetrics;
  organizationId: string;
  apiKeyId: string;
  timeStamp: number;
  date: string;
  payload?: NewPolygonPayload[];
};

export interface IUsageLogsManager {
  getUsageLogs(path: string): Promise<UsageLog[]>;
}

export class UsageLogsReadManager implements IUsageLogsManager {
  s3Client: S3;
  logger: ILogger;

  constructor({ s3Client, logger }: { s3Client: S3; logger: ILogger }) {
    this.s3Client = s3Client;
    this.logger = logger;
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
