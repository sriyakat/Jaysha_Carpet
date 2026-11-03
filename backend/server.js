require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Jaysha Carpet Server running on port ${PORT}`);
});