const express = require('express');
const routes = require('./routes/routes');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

const port = process.env.PORT || 9000;

app.get('/', (req, res) => { res.send('Rooftop API is running.') });

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = { app }