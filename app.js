require('dotenv').config();

const express = require('express');
const passport = require('passport');
const morgan = require('morgan');
const routes = require('./routes/routes');
const winston = require('./config/winston');

const connectDB = require('./config/db');

const app = express();

// Logging Middleware
app.use(morgan('combined', { stream: winston.stream }));

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());
app.use(passport.initialize());

const port = process.env.PORT || 9000;

app.get('/', (req, res) => { res.send('Rooftop API is running.') });

app.use('/', routes);

app.listen(port, () => {
  winston.info(`Server running on port ${port}`);
});

module.exports = { app }