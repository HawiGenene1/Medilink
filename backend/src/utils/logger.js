const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'medilink-backend' },
    transports: [
        // Write all logs with level `error` and below to `error.log`
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'),
            level: 'error' 
        }),
        // Write all logs to `combined.log`
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log') 
        })
    ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Create a stream for morgan (HTTP request logging)
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

module.exports = logger;