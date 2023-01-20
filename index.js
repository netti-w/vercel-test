const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const { check, validationResult } = require('express-validator');

const mongoose = require('mongoose');
const Models = require('./models.js'); //require (import) 'custom' models.js

// call movie and user modals from modals.js
const Movies = Models.Movie;
const Users = Models.User;

// Connecting LOCAL myFlixDB via Mongoose to perform CRUD operations
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Connecting EXTERNAL (MongoDB Atlas) myFlixDB via Mongoose to perform CRUD operations
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

const cors = require('cors');

// function serving all requests of static file (here:"documenation.html") from public folder
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Welcome to my Movie database');
});



// Error handling middleware logging app level errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});


module.exports = app;
