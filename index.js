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
mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
const port = 3000;

const cors = require('cors');

// function serving all requests of static file (here:"documenation.html") from public folder
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Welcome to my Movie database');
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

module.exports = app;
