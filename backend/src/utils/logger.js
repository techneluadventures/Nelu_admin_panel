// Simple structured logger — logs JSON so it's easy to read in Vercel dashboard

export const logger = {
  info: (message, data = {}) => {
    console.log(JSON.stringify({ level: 'info', message, ...data, time: new Date().toISOString() }));
  },
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...data, time: new Date().toISOString() }));
  },
  error: (message, data = {}) => {
    console.error(JSON.stringify({ level: 'error', message, ...data, time: new Date().toISOString() }));
  },
};
