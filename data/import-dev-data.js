const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Movie = require('./../Models/movieModel');

dotenv.config({path:'./config.env'});

//Connect to mongo db
mongoose.connect(process.env.CONN_STR, {
    //useNewUrlParser: true
}).then((conn) =>{
    console.log("db connection successful");
}).catch((error) => {
    console.log("unable to connect database");
});

//read movies.json file
const movies = JSON.parse(fs.readFileSync('./data/movies.json', 'utf-8'));

//delete existing documents from collection
const deleteMovies = async () => {
    try{
        await Movie.deleteMany();
        console.log('Data successfully deleted!');
    }
    catch(err){
        console.log(err.message);
    }
    process.exit();
}

//import movies data to mongodb collection
const importMovies = async () => {
    try{
        await Movie.create(movies);
        console.log('Data successfully imported!');
    }
    catch(err){
        console.log(err.message);
    }
    process.exit();
}

if(process.argv[2] === '--import'){
    importMovies();
}
if(process.argv[2] === '--delete'){
    deleteMovies();
}

