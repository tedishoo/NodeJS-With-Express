const mongoose = require('mongoose');
const fs = require('fs');
const validator = require('validator');

const movieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is a required field'],
        unique: true,
        maxlength: [100, "movie name must not have more than 100 characters"],
        minlength: [4, "movie name must have atleast 4 characters"],
        trim: true,
        validate: [validator.isAlpha, "Name should only contain alphabets."]
    },
    description: {
        type: String,
        required: [true, 'Description is a required field'],
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'duration is a required field']
    },
    ratings: {
        type: Number,
        default: 1.0,
        //min: [1, "Ratings must be 1 or above"],
        //max: [10, "Ratings must be 10 or below"]
        validate: {
            validator: function(value){
                return value >=1 && value <= 10;
            },
            message: "Ratings ({VALUE}) should be above 1 and below 10"
        }
    },
    totalRating: {
        type: Number
    },
    releaseYear: {
        type: Number,
        required: [true, 'Release Year is a required field']
    },
    releaseDate: {
        type: Date
    },
    genres: {
        type: [String],
        required: [true, 'Genres is a required field'],
        /*enum: {
            values: ["Action", "Adventure", "Sci-fi", "Thriller", "Crime", "Drama", "Comedy", "Romance", "Biography"],
            message: "this genre does not exist"
        }*/
    },
    directors: {
        type: [String],
        required: [true, 'Directors is a required field']
    },
    coverImage: {
        type: String,
        required: [true, 'Cover Image is a required field']
    },
    actors: {
        type: [String],
        required: [true, 'Actors is a required field']
    },
    price: {
        type: Number,
        required: [true, 'Price is a required field']
    },
    created: {
        type: Date,
        default: Date.now(),
        select: false
    },
    createdBy: String
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

movieSchema.virtual('durationInHours').get(function(){    
    return this.duration /60;
});

//executed before the document is saved in DB
//.save() or .create()
//insertMany, findByIdAndUpdate will not work
movieSchema.pre('save', function(next){
    this.createdBy = 'Manojjha';
    next();
});

movieSchema.post('save', function(doc, next){
    const content = `A new movie document with name ${doc.name} is created by ${doc.createdBy}\n`;
     fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, (err) =>{
        console.log(err.message);
     });
     next();
});

movieSchema.pre(/^find/, function(next){
    this.find({releaseDate: {$lte: Date.now()}});
    this.startTime = Date.now();
    next();
})

movieSchema.post(/^find/, function(doc, next){
    this.endTime = Date.now();
    const content = `Query took ${this.endTime - this.startTime} milliseconds to fetch the documents\n`;
     fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, (err) =>{
        //console.log(err.message);
     });
     next();
});

movieSchema.pre('aggregate', function(next){
    this.pipeline().unshift({$match: {releaseDate: {$lte: new Date()}}});
    next();
})

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;

/*
const testMovie = new Movie({
    name: "Die Hard 1",
    description: "Action packed movie starting bruce wills in this trilling adventure.",
    duration: 140,
    ratings: 4.5
});

testMovie.save()
.then(doc => {
    console.log(doc);
})
.catch(err =>{
    console.log("Error occured: "+ err);
});
*/