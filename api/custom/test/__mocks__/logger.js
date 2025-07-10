jest.mock('winston', () => {
  const mockFormatFunction = jest.fn((fn) => {
    return (info) => {
      if (!info) return {};
      return typeof fn === 'function' ? fn(info) : info;
    };
  });

  mockFormatFunction.colorize = jest.fn();
  mockFormatFunction.combine = jest.fn();
  mockFormatFunction.label = jest.fn();
  mockFormatFunction.timestamp = jest.fn();
  mockFormatFunction.printf = jest.fn();
  mockFormatFunction.errors = jest.fn();
  mockFormatFunction.splat = jest.fn();
  mockFormatFunction.json = jest.fn();

  const winstonMock = {
    format: mockFormatFunction,
    createLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }),
    transports: {
      Console: jest.fn(),
      DailyRotateFile: jest.fn(),
      File: jest.fn(),
    },
    addColors: jest.fn(),
  };
  winstonMock.default = winstonMock;
  Object.defineProperty(winstonMock, 'addColors', { value: jest.fn(), writable: true, configurable: true });
  Object.defineProperty(winstonMock.default, 'addColors', { value: jest.fn(), writable: true, configurable: true });
  return winstonMock;
});

jest.mock('winston-daily-rotate-file', () => {
  return jest.fn().mockImplementation(() => {
    return {
      level: 'error',
      filename: '../logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: 'format',
    };
  });
});

jest.mock('~/config', () => {
  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    },
  };
});

jest.mock('~/config/parsers', () => {
  return {
    redactMessage: jest.fn(),
    redactFormat: jest.fn(),
    debugTraverse: jest.fn(),
    jsonTruncateFormat: jest.fn(),
  };
});
