import helmet from 'helmet';

const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Allow resources only from our own domain
      scriptSrc: ["'self'", "https://trusted.cdn.com"], // Allow scripts from trusted CDNs
      styleSrc: ["'self'", "https://fonts.googleapis.com"], // Allow styles from Google Fonts
    },
  },
  xssFilter: true, // Protects against XSS attacks
  frameguard: { action: 'deny' }, // Prevent Clickjacking
  noSniff: true, // Prevent MIME-Type sniffing
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000 } : false,
  hidePoweredBy: true, // Remove the technologie used like (express) from headers
});

export default securityMiddleware;
