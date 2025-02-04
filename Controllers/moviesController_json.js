const fs = require('fs');

let movies = JSON.parse(fs.readFileSync('./data/movies.json'));

exports.checkId = (req, res, next, value) => {
    //console.log('movie id is ' + value);

    let movie = movies.find(el => el.id ===value * 1);
   
   if(!movie){
    return res.status(404).json({
        status:'fail',
        message: 'Movie with id '+value+ ' is not found'
       });
   }

    next();
}
// GET -api/v1/movies
exports.getAllMovies = (req, res) =>{
    res.status(200).json({
        status:'success',
        count: movies.length,
        data:{
            movies: movies
        }
    });
};

// GET -api/v1/movies/id
exports.getMovie = (req, res) =>{
   const id = +req.params.id;
   let movie = movies.find(el => el.id ===id);
   
   /*if(!movie){
    return res.status(404).json({
        status:'fail',
        message: 'Movie with id '+id+ ' is not found'
       });
   }*/
   res.status(200).json({
    status:'success',
    data:{
        movie: movie
    }
   });
};

exports.validateBody = (req, res, next) =>{
    if(!req.body.name || !req.body.releaseYear){
        return res.status(400).json({
            status:'fail',
            message:'Not a valid movie data'
           });
    }
    next();
}

exports.updateMovie = (req, res) =>{
    let id = req.params.id * 1;
    let movieToUpdate = movies.find(el => el.id ===id);

   /* if(!movieToUpdate){
        return res.status(404).json({
            status:'fail',
            message: 'Movie with id '+id+ ' is not found'
           });
       }*/

    let index = movies.indexOf(movieToUpdate);   
    Object.assign(movieToUpdate, req.body);
    //console.log(req);
    movies[index] = movieToUpdate;
    fs.writeFile('./data/movies.json', JSON.stringify(movies), (err) =>{
        res.status(200).json({
            status: "success",
            data: {
                movie: movieToUpdate
            }
        });
    });
};

// GET -api/v1/movies

exports.createMovie = (req, res) =>{
    //console.log(req.body);
    const newID = movies[movies.length - 1].id + 1;
    const newMovie = Object.assign({id: newID}, req.body);
    movies.push(newMovie);
    fs.writeFile('./data/movies.json', JSON.stringify(movies), (err) =>{
        res.status(201).json({
            status: "success",
            data: {
                movie: newMovie
            }
        })
    });
    //res.send('created');
};

exports.deleteMovie = (req, res) =>{
    let id = req.params.id * 1;
    let movieToDelete = movies.find(el => el.id ===id);

    /*if(!movieToDelete){
        return res.status(404).json({
            status:'fail',
            message: 'Movie with id '+id+ ' is not found'
           });
       }*/

    let index = movies.indexOf(movieToDelete);   
    movies.splice(index, 1);

    fs.writeFile('./data/movies.json', JSON.stringify(movies), (err) =>{
        res.status(204).json({
            status: "success",
            data: {
                movie: null
            }
        })
    });
};