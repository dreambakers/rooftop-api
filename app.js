require('dotenv').config();

const express = require('express');
const passport = require('passport');
const morgan = require('morgan');
const cors = require('cors')
const routes = require('./routes/routes');
const winston = require('./config/winston');

const connectDB = require('./config/db');
const port = process.env.PORT || 9000;
const app = express();

// Logging Middleware
app.use(morgan('combined', { stream: winston.stream }));

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'x-auth,Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'x-auth,Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.get('/', (req, res) => { res.send('Rooftop API is running.') });

app.use('/', routes);

app.listen(port, () => {
  winston.info(`Server running on port ${port}`);
});

module.exports = { app }