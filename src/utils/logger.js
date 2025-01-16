const winston = require('winston');
const { format } = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

const consoleLogFormat = format.printf(({ timestamp, level, message, ...metadata }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;
    if (Object.keys(metadata).length) {
        logMessage += ` | ${JSON.stringify(metadata)}`;
    }
    return logMessage;
});

const fileFormat = format.printf(({ timestamp, level, message, ...metadata }) => {
    const serviceName = "SIPARTAN-BE";
    return `${timestamp} [${level.toUpperCase()}]: ${message} | metadata: ${JSON.stringify({ service: serviceName, ...metadata })}`;
});

// If in the future using kibana, should make another transport and correct format for kibana

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(
        format.timestamp(),
        format.json() 
    ),
    transports: [
        new winston.transports.Console({
            format: format.combine(format.colorize(), consoleLogFormat),
        }),
        new DailyRotateFile({
            filename: path.join('logs', 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'info',
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                fileFormat
            ),
        }),
    ],
});

module.exports = logger;
