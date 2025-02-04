const Movie = require('./../Models/movieModel');
const ApiFeatures = require('./../Utilities/apiFeatures');
const asyncErrorHandler = require('./../Utilities/asyncErrorHandler');
const CustomError = require('./../Utilities/CustomError');

// GET -api/v1/movies
exports.getAllMovies = asyncErrorHandler(async (req, res, next) =>{
    
    const features = new ApiFeatures(Movie.find(), req.query).filter().sort().limitFields().paginate();
    let movies = await features.query;
    //mongoose 6.0 or less
    /* const excludeFields = ['sort', 'page', 'limit', 'fields'];
    const queryObjAll = {...req.query};
    excludeFields.forEach((el) => {
        delete queryObjAll[el];
    })
    
    
    //const movies = await Movie.find();
    //const movies = await Movie.find({duration: +req.query.duration, ratings: +req.query.ratings});
    let queryStr = JSON.stringify(queryObjAll);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const queryObj = JSON.parse(queryStr);
    let query = Movie.find(queryObj);*/

    //sorting logic
    /*if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    }else{
        query = query.sort('-createdAt');
    }*/
    
    //fields to show (limiting fields)
    /*if(req.query.fields){
        const fileds = req.query.fields.split(',').join(' ');
        query = query.select(fileds);
    }else{
        query = query.select('-__v');
    }*/

    //pagination
    /*const page = req.query.page*1 || 1;
    const limit = req.query.limit*1 || 20;
    const skip = (page -1) * limit;
    query = query.skip(skip).limit(limit);

    if(req.query.page){
        const moviesCount = await Movie.countDocuments();
        if(skip >= moviesCount){
            throw new Error("This page is not found");
        }
    }*/

    //const movies = await query;
    /*const movies = await Movie.find()
                    .where('duration').equals(req.query.duration)
                    .where('ratings').equals(req.query.ratings);
                    .where('price').lte(req.query.price)*/

    res.status(200).json({
        status: "success",
        length: movies.length,
        data: {
            movies
        }
    })    
});

// GET -api/v1/movies/id
exports.getMovie = asyncErrorHandler(async (req, res, next) =>{
    //const movie = await Movie.find({_id: req.params.id});
    const movie = await Movie.findById(req.params.id);

    if(!movie){
        const err = new CustomError(`Movie with id ${req.params.id} is not found`, 404);
        return next(err);
    }

    res.status(200).json({
        status: "success",
        data: {
            movie
        }
    })    
});

exports.updateMovie = asyncErrorHandler(async(req, res, next) =>{
    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});

    if(!updatedMovie){
        const err = new CustomError(`Movie with id ${req.params.id} is not found`, 404);
        return next(err);
    }


    res.status(200).json({
        status: "success",
        data: {
            updatedMovie
        }
    })
});

// GET -api/v1/movies

exports.createMovie = asyncErrorHandler(async (req, res, next) =>{
    //const testMovie = new Movie({});
    //testMovie.save();
    const movie = await Movie.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            movie
        }
    })
});

exports.deleteMovie = asyncErrorHandler(async(req, res, next) =>{
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);

    if(!deletedMovie){
        const err = new CustomError(`Movie with id ${req.params.id} is not found`, 404);
        return next(err);
    }

    res.status(204).json({
        status: "success",
        message: "Movie Deleted Successfully!"
    })
});

exports.getMovieStats = asyncErrorHandler(async(req, res, next) =>{
    const stats = await Movie.aggregate([
        //{$match: {releaseDate: {$lte: new Date()}}},
        {$match: {ratings: {$gte: 4.5}}},
        {$group:{
            _id: '$releaseYear',
            avgRating: {$avg: '$ratings'},
            avgPrice: {$avg: '$price'},
            minPrice: {$min: '$price'},
            maxPrice: {$max: '$price'},
            totalPrice: {$sum: '$price'},
            movieCount: {$sum: 1}
        }},
        {$sort: {minPrice : 1}}
    ]);

    res.status(200).json({
        status: "success",
        count: stats.length,
        data: {
            stats
        }
    })
});

exports.getMovieByGenre = asyncErrorHandler(async(req, res, next) =>{
    const genre = req.params.genre;
    const movies = await Movie.aggregate([
        {$unwind: '$genres'},
        {$group: {
            _id: '$genres',
            movieCount: {$sum: 1},
            movies: {$push: '$name'}
        }},
        {$addFields: {genre: "$_id"}},
        {$project: {_id: 0}},
        {$sort: {movieCount: -1}},
        //{$limit: 6},
        {$match: {genre: genre}}
    ]);

    res.status(200).json({
        status: "success",
        count: movies.length,
        data: {
            movies
        }
    })
});