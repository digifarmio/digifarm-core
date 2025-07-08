import { LogManager } from "..";
import { LambdaLog } from "lambda-log";

describe("LogManager", () => {
  const mockLambdaLog = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as LambdaLog;

  let logger: LogManager;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new LogManager({ lambdaLog: mockLambdaLog });
  });

  it("should call lambdaLog.debug with correct args", () => {
    const msg = "Debug message";
    const meta = { key: "value" };

    logger.debug(msg, meta);
    expect(mockLambdaLog.debug).toHaveBeenCalledWith(msg, meta);
  });

  it("should call lambdaLog.info with correct args", () => {
    const msg = "Info message";
    const meta = { key: "value" };

    logger.info(msg, meta);
    expect(mockLambdaLog.info).toHaveBeenCalledWith(msg, meta);
  });

  it("should call lambdaLog.warn with correct args", () => {
    const msg = "Warn message";
    const meta = { key: "value" };

    logger.warn(msg, meta);
    expect(mockLambdaLog.warn).toHaveBeenCalledWith(msg, meta);
  });

  it("should call lambdaLog.error with string error", () => {
    const errMsg = "An error occurred";
    const meta = { key: "value" };

    logger.error(errMsg, meta);
    expect(mockLambdaLog.error).toHaveBeenCalledWith(errMsg, meta);
  });

  it("should call lambdaLog.error with Error object", () => {
    const errorObj = new Error("Exception!");
    const meta = { key: "value" };

    logger.error(errorObj, meta);
    expect(mockLambdaLog.error).toHaveBeenCalledWith(errorObj, meta);
  });
});
