const metrics = {
    requestsTotal: 0,
    requestsByMinute: new Map(), // key: minute timestamp, value: count
    responseTimeTotal: 0,
    responsesCount: 0,
    errorsCount: 0,
    activeRequests: 0,
    startTime: Date.now()
};

// Cleanup old metrics every minute
setInterval(() => {
    const now = Math.floor(Date.now() / 60000);
    for (let [minute] of metrics.requestsByMinute) {
        if (minute < now - 60) { // Keep last 60 minutes
            metrics.requestsByMinute.delete(minute);
        }
    }
}, 60000);

const monitoringMiddleware = (req, res, next) => {
    const start = Date.now();
    metrics.requestsTotal++;
    metrics.activeRequests++;

    const minute = Math.floor(start / 60000);
    metrics.requestsByMinute.set(minute, (metrics.requestsByMinute.get(minute) || 0) + 1);

    // Intercept response finish
    res.on('finish', () => {
        metrics.activeRequests--;
        const duration = Date.now() - start;
        metrics.responseTimeTotal += duration;
        metrics.responsesCount++;

        if (res.statusCode >= 500) {
            metrics.errorsCount++;
        }
    });

    next();
};

const getMetrics = () => {
    const avgResponseTime = metrics.responsesCount > 0
        ? (metrics.responseTimeTotal / metrics.responsesCount).toFixed(2)
        : 0;

    const now = Math.floor(Date.now() / 60000);
    const rpm = metrics.requestsByMinute.get(now) || 0;

    // Last 30 minutes of traffic for charts
    const traffic = [];
    for (let i = 29; i >= 0; i--) {
        const m = now - i;
        traffic.push({
            time: new Date(m * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            requests: metrics.requestsByMinute.get(m) || 0
        });
    }

    return {
        uptime: Math.floor(process.uptime()),
        totalRequests: metrics.requestsTotal,
        avgResponseTime: parseFloat(avgResponseTime),
        errorRate: metrics.responsesCount > 0 ? ((metrics.errorsCount / metrics.responsesCount) * 100).toFixed(2) : 0,
        activeRequests: metrics.activeRequests,
        requestsPerMinute: rpm,
        trafficData: traffic,
        status: 'healthy'
    };
};

module.exports = {
    monitoringMiddleware,
    getMetrics
};
