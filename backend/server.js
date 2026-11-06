require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jaysha Carpet Server running on port ${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing backend process and restart.`);
        process.exitCode = 1;
        return;
    }
    throw error;
});

server.requestTimeout = 30000;
server.headersTimeout = 35000;
server.keepAliveTimeout = 65000;