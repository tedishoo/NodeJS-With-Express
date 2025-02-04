const CustomError = require('./../Utilities/CustomError');

const devErrors = (res, error) =>{
    res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
        stackTrace: error.stack,
        error: error
    });
}

const prodError = (res, error) =>{
    if(error.isOperational){
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message
        });
    }else {
        res.status(500).json({
            status: 'error',
            message: 'something went wrong, please try again'
        });
    }
}

const castErrorHandler = (err) => {
    const msg = `Invalid value ${err.value} for field ${err.path}!`;
    return new CustomError(msg, 400);
}

const duplicateKeyErrorHandler = (err) => {
    for (var key in err.keyValue) {
        const msg = `There is already a data with ${key} ${err.keyValue[key]}, please use another ${key}.`;
        return new CustomError(msg, 400);
    }    
}

const validationErrorHandler = (err) => {
    const errors = Object.values(err.errors).map(val =>val.message);
    const errorMessages = errors.join('. ');
    const msg = `Invalid input data: ${errorMessages}`;
    return new CustomError(msg, 400);
}

const expiredJWTHandler = (err) => {
    return new CustomError('Token has expired. Please login again!', 401);
}

const JWTErrorHandler = (err) => {
    return new CustomError('Invalid Token. Please login again!', 401);
}

module.exports = (error,req, res, next) =>{
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        devErrors(res, error);
    }else if(process.env.NODE_ENV === 'production'){        
        //let e = {...error};
        if(error.name === 'CastError') error = castErrorHandler(error);
        if(error.code === 11000) error = duplicateKeyErrorHandler(error);
        if(error.name === 'ValidationError') error = validationErrorHandler(error);
        if(error.name === 'TokenExpiredError') error = expiredJWTHandler(error);
        if(error.name === 'JsonWebTokenError') error = JWTErrorHandler(error);

        prodError(res, error);
    }
    
};