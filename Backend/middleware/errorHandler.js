const notFound = (req, res) => res.status(404).json({ message: "Not found" });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    let status = err.status || 500;
    let message = err.message;

    if (err.type === "entity.parse.failed") { status = 400; message = "Malformed JSON body"; }
    else if (err.type === "entity.too.large") { status = 413; message = "Request body too large"; }
    else if (err.name === "ValidationError") { status = 400; message = Object.values(err.errors).map((e) => e.message).join("; "); }
    else if (err.name === "CastError") { status = 400; message = "Invalid identifier"; }
    else if (err.code === 11000) { status = 409; message = "Duplicate value"; }

    if (status >= 500) {
        console.error(JSON.stringify({ level: "error", msg: err.message, path: req.path, stack: err.stack }));
        message = "Internal server error";
    }
    res.status(status).json({ message, ...(err.details ? { details: err.details } : {}) });
};

module.exports = { notFound, errorHandler };
