const express = require('express');

const moviesController = require('./../Controllers/moviesController');
const authController = require('./../Controllers/authController');

const router = express.Router();

router.route('/movie-stats').get(moviesController.getMovieStats)
router.route('/movie-by-genre/:genre').get(moviesController.getMovieByGenre)

router.route('/')
    .get(authController.protect, moviesController.getAllMovies)
    .post(authController.protect, moviesController.createMovie)


router.route('/:id')
    .get(authController.protect, moviesController.getMovie)
    .patch(authController.protect, moviesController.updateMovie)
    .delete(authController.protect, authController.restrict('admin', 'especial'), moviesController.deleteMovie)


module.exports = router;