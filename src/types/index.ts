import { Polygon } from "geojson";

export type UserOrganization = {
  Token: string;
  Type: string;
  Name: string;
  organizationId: string;
};

export type SlackNotificationPayload = {
  text: string;
  channel: string;
};

export type ViableImageryVerifierPayloadType = {
  targetPayload: Record<string, unknown>;
  params: {
    bbox: Polygon;
    checkStartTime: string;
    checkEndTime: string;
    problematicAreaPercentage: number;
    startTime: string;
    endTime?: string;
  };
  target: string;
  messageId: string;
};

export type PartialDRErrorPayloadType = {
  targetPayload: Record<string, unknown>;
  params: {
    imageryId: string;
    failedAt: Date;
    errorMessage: string;
  };
  target: string;
  messageId: string;
};

export type NewPolygonPayload = {
  id: string;
  version: string;
  area: number;
  count: number;
  country: string;
  mgrs: string;
};

export type PartialDRPayload = {
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
