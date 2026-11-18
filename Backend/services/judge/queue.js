const HttpError = require("../../utils/httpError");

// Bounded in-process job queue. Keeps untrusted-code execution from starving the API.
// (Swap for a Redis-backed queue such as BullMQ when running several API instances.)
class JobQueue {
    constructor({ concurrency = 2, maxQueue = 50 } = {}) {
        this.concurrency = concurrency;
        this.maxQueue = maxQueue;
        this.active = 0;
        this.waiting = [];
        this.completed = 0;
        this.totalWaitMs = 0;
    }

    run(fn) {
        if (this.waiting.length >= this.maxQueue) {
            return Promise.reject(new HttpError(503, "The judge is busy. Please try again in a moment."));
        }
        return new Promise((resolve, reject) => {
            this.waiting.push({ fn, resolve, reject, queuedAt: Date.now() });
            this._next();
        });
    }

    _next() {
        while (this.active < this.concurrency && this.waiting.length) {
            const job = this.waiting.shift();
            this.active++;
            this.totalWaitMs += Date.now() - job.queuedAt;
            Promise.resolve()
                .then(job.fn)
                .then(job.resolve, job.reject)
                .finally(() => {
                    this.active--;
                    this.completed++;
                    this._next();
                });
        }
    }

    stats() {
        return {
            active: this.active,
            waiting: this.waiting.length,
            completed: this.completed,
            avgWaitMs: this.completed ? Math.round(this.totalWaitMs / this.completed) : 0,
        };
    }
}

module.exports = JobQueue;
