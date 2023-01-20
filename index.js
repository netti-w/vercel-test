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
require('dotenv').config();

// Connecting LOCAL myFlixDB via Mongoose to perform CRUD operations
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('strictQuery', true);

// Connecting EXTERNAL (MongoDB Atlas) myFlixDB via Mongoose to perform CRUD operations
// mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

// Body parser middleware passing data as JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS - allowing requests from other specified origins (here: default all origins)
const cors = require('cors');
// app.use(cors());
let allowedOrigins = ['http://localhost:8080', 'https://vercel-test-netti-w.vercel.app', 'https://vercel-test-git-main-netti-w.vercel.app', 'https://vercel-test-virid-two.vercel.app'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) { // If a origin is not on the list of allowed origins
      let message = 'The CORS policy for this application doesn\'t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

// function serving all requests of static file (here:"documenation.html") from public folder
app.use(express.static('public'));

// ----------------------- Homepage -----------------------
app.get('/', (req, res) => {
  res.send('Welcome to my Movie database');
});

// ----------------------- Movie endpoints -----------------------
/** 
 * GET the list of data about all movies
 * @returns an array of all movies objects in json format 
*/
app.get('/movies', (req, res) => {
  Movies.find().then(movies => res.json(movies));
});

/**
 * GET data about a single movie by title
 * @params {string} Title
 * @returns a movie object in json format
 */
app.get('/movies/:Title', (req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * GET data about a genre by name
 * @params {string} genreName
 * @returns a genre object in json format
 */
app.get('/movies/genres/:genreName', (req, res) => {
  Movies.findOne({ "Genre.Name": req.params.genreName })
    .then((movie) => {
      res.json(movie.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * GET data about a director by name
 * @params {string} directorName
 * @returns a director object in json format
 */
app.get('/movies/directors/:directorName', (req, res) => {
  Movies.findOne({ "Director.Name": req.params.directorName })
    .then((movie) => {
      res.json(movie.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


app.use(express.static('public'));
app.get('/documentation', (req, res) => {
  res.sendFile('public/documentation.html', { root: __dirname });
});

//log requests using Morgan’s “common” format
app.use(morgan('common'));

// Error handling middleware logging app level errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});


// module.exports = app;
