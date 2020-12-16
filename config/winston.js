const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');

// define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'info',
    filename: path.join(__dirname, '..', 'logs', 'app.log'),
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

// instantiate a new Winston Logger with the settings defined above
const logger = createLogger({
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.printf((info) => {
            let logData = { ...info };
            if (info.error instanceof Error) {
                logData.error = {
                    message: info.error.message,
                    stack: info.error.stack,
                };
            }
            return JSON.stringify(logData, null, 2);
        }),
    ),
    transports: [
        new transports.File(options.file),
        new transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

module.exports = logger;
