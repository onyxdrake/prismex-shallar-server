const fs = require('fs');
const path = require('path');

// ========== LOG LEVELS ==========
const LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL'
};

// ========== LOG DIRECTORY ==========
const LOG_DIR = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ========== FORMAT LOG ==========
function formatLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const log = {
        timestamp,
        level,
        message
    };

    if (data) {
        log.data = data;
    }

    return JSON.stringify(log);
}

// ========== WRITE LOG ==========
function writeLog(level, message, data = null) {
    const logLine = formatLog(level, message, data);
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(LOG_DIR, `${date}.log`);

    console.log(logLine);

    fs.appendFile(logFile, logLine + '\n', (err) => {
        if (err) {
            console.error('Failed to write log:', err);
        }
    });
}

// ========== LOG FUNCTIONS ==========
function debug(message, data) {
    writeLog(LEVELS.DEBUG, message, data);
}

function info(message, data) {
    writeLog(LEVELS.INFO, message, data);
}

function warn(message, data) {
    writeLog(LEVELS.WARN, message, data);
}

function error(message, data) {
    writeLog(LEVELS.ERROR, message, data);
}

function fatal(message, data) {
    writeLog(LEVELS.FATAL, message, data);
}

// ========== AUDIT LOG ==========
function audit(action, userId, details = null) {
    const auditLog = {
        action,
        user_id: userId,
        timestamp: new Date().toISOString(),
        details
    };

    const logFile = path.join(LOG_DIR, 'audit.log');

    fs.appendFile(logFile, JSON.stringify(auditLog) + '\n', (err) => {
        if (err) {
            console.error('Failed to write audit log:', err);
        }
    });
}

module.exports = {
    debug,
    info,
    warn,
    error,
    fatal,
    audit,
    LEVELS
};
