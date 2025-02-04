const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const moviesRouter = require('./routes/moviesRoutes');
const authRouter = require('./routes/authRouter');
const userRouter = require('./routes/userRouter');
const CustomError = require('./Utilities/CustomError');
const globalErrorHandler = require('./Controllers/ErrorController');

let app = express();

app.use(helmet());

let limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'We have received too many requests from this IP. Please try after one hour.'
});

app.use('/api', limiter);
/*const logger = function(req, res, next){
    console.log('Custom middleware called');
    next();
}*/

/*app.get('/', (req, res) =>{
    res.status(200).send('<h4>hello from express server</4>');
});

app.post('/', () =>{

});*/

app.use(express.json({limit: '10kb'}));

app.use(sanitize());
app.use(xss());
app.use(hpp({whitelist:['duration']}));

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

app.use(express.static('./Public'));
//app.use(logger);
app.use((req, res, next) => {
    req.requestedAt = new Date().toISOString();
    next();
});

//use routes
app.use('/api/v1/movies', moviesRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);

//none existing (undefined) route handling
app.all('*', (req, res, next) =>{
    /*res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on the server`
    })*/

    // error handling using the global error handler inside app.js
    /*const err = new Error(`Can't find ${req.originalUrl} on the server`);
    err.status = 'fail';
    err.statusCode = 404;*/

    //error handling using the global error handler from CustomError.js class
    const err = new CustomError(`Can't find ${req.originalUrl} on the server`, 404);

    //we call the global error handler
    next(err);
});

//global error handling
app.use(globalErrorHandler);

module.exports = app;

