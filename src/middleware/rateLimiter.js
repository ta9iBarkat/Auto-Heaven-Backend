import rateLimit from "express-rate-limit";

const rateLimitHandler = (req, res) =>{
    console.log(`❌ Rate limit exceeded: ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({ error: "Too many requests, please try again later." });
}

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15min
    max: 100,
    massage: {error: "Too many requests, please try again later."},
    handler: rateLimitHandler,
    headers: true
});

const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,
    massage: {error: "Too many failed login attempts, please try again later."},
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
})

export {loginLimiter, globalLimiter}