import { LambdaLog } from "lambda-log";

export interface ILogger {
  debug: (message: string, metadata: object) => void;
  info: (message: string, metadata: object) => void;
  warn: (message: string, metadata: object) => void;
  error: (error: string | Error, metadata: object) => void;
}

export class LogManager implements ILogger {
  lambdaLog: LambdaLog;

  constructor({ lambdaLog }: { lambdaLog: LambdaLog }) {
    this.lambdaLog = lambdaLog;
  }

  debug(message: string, metadata: object) {
    this.lambdaLog.debug(message, metadata);
  }

  info(message: string, metadata: object) {
    this.lambdaLog.info(message, metadata);
  }

  warn(message: string, metadata: object) {
    this.lambdaLog.warn(message, metadata);
  }

  error(message: string | Error, metadata: object) {
    this.lambdaLog.error(message, metadata);
  }
}
