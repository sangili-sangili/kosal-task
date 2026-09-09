const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {}

const appEvents = new AppEventEmitter();

// Limit max listeners to prevent memory leak warnings
appEvents.setMaxListeners(20);

module.exports = appEvents;
