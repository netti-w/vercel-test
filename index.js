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
app.use(cors());

// let allowedOrigins = ['http://localhost:8080', 'https://vercel-test-netti-w.vercel.app', 'https://vercel-test-git-main-netti-w.vercel.app', 'https://vercel-test-virid-two.vercel.app'];
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) { // If a origin is not on the list of allowed origins
//       let message = 'The CORS policy for this application doesn\'t allow access from origin ' + origin;
//       return callback(new Error(message), false);
//     }
//     return callback(null, true);
//   }
// }));

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');


// ----------------------- Homepage -----------------------
app.get('/', (req, res) => {
  res.send('Welcome to my Movie database');
});

// ----------------------- Movie endpoints -----------------------
/** 
 * GET the list of data about all movies
 * @returns an array of all movies objects in json format 
*/
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find().then(movies => res.json(movies));
});

/**
 * GET data about a single movie by title
 * @params {string} Title
 * @returns a movie object in json format
 */
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
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
app.get('/movies/genres/:genreName', passport.authenticate('jwt', { session: false }), (req, res) => {
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
app.get('/movies/directors/:directorName', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ "Director.Name": req.params.directorName })
    .then((movie) => {
      res.json(movie.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// ----------------------- User endpoints -----------------------

/**
 * GET the list of all users
 * @returns an array of all user objects in JSON format
 */
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find().then(users => res.json(users));
});

/**
 * GET data about a single user by name
 * @params {string} Username
 * @returns a new user object in json format
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * POST data creating a new user
 * @params {string} Username
 * @params {string} Password
 * @params {string} Email
 * @returns a new user object in JSON format
 */
app.post('/users',
  [
    check('Username', 'Username is required (min. 5 characters)').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            })
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

/**
 * PUT data updating a user's info by user name
 * @params {string} Username
 * @params {string} Password
 * @params {string} Email
 * @returns a new user object in JSON format
 */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
      });
  });

/**
 * PUT data adding a user's favourite movie to a list
 * @params {string} Username
 * @params {string} MovieID
 * @returns a new user object in JSON format
 */
app.put('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $push: { FavouriteMovies: req.params.MovieID }
  },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

/**
 * DELETE data removing a user's favourite movie from the list
 * @params {string} Username
 * @params {string} MovieID
 */
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $pull: { FavouriteMovies: req.params.MovieID }
  },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

/**
 * DELETE data removing a user by user name
 * @params {string} Username
 * @returns success message
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


// function serving all requests of static file (here:"documenation.html") from public folder
// app.use(express.static('public'));

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
