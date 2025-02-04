const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utilities/asyncErrorHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('./../Utilities/CustomError');
const util = require('util');
const sendEmail = require('./../Utilities/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({id}, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    });
}

exports.createSendResponse = asyncErrorHandler(async (user, statusCode, res) => {
    const token = signToken(user._id);

    const options = {
        maxAge: process.env.LOGIN_EXPIRES,
        httpOnly: true
    }
    if(process.env.NODE_ENV === "production"){
        options.secure = true;
    }

    res.cookie('jwt', token, options);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user: user
        }
    })
});

exports.signup = asyncErrorHandler(async (req, res, next) => {
    const newUser = await User.create(req.body);

    this.createSendResponse(newUser, 201, res);
});

exports.login = asyncErrorHandler(async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    //const {email, password} = req.body;

    if(!email || !password){
        const error = new CustomError('Please provide E-mail and Password to login', 400);
        return next(error);
    }

    const usr = await User.findOne({email}).select('+password');

    if(!usr || !(await usr.comparePasswordInDB(password, usr.password))){
        const error = new CustomError('Incorrect E-mail or password', 400);
        return next(error);
    }
    this.createSendResponse(usr, 200, res);
});

exports.protect = asyncErrorHandler(async(req, res, next) => {
    //read the token and check if it exists
    let token = req.headers.authorization;
    if(token && token.startsWith('bearer')){
        token = token.split(' ')[1];
    }
    if(!token){
        next(new CustomError('You are not logged in!', 401));
    }
  
    //validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);
    
    //check if user exists
    const user = await User.findById(decodedToken.id);
    if(!user){
        next(new CustomError('A user with given token does not exist!', 401));
    }

    //if the user changed his/her password after the token was issued
    const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat);
    if(isPasswordChanged){
        return next(new CustomError('the password has been changed recently. Please login again!', 401));
    }

    //allow user to access route
    req.user = user;
    next();
})

exports.restrict = (...role) => {
    return (req, res, next) => {
        if(!role.includes(req.user.role)) {
            next(new CustomError('You do not have permission to perform this action', 403));
        }
        next()
    }
}

exports.forgotPassword = asyncErrorHandler(async(req, res, next) => {
    const user = await User.findOne({email: req.body.email});
    if(!user) {
        next(new CustomError(`User not found with given email ${req.body.email}`, 404));
    }

    const resetToken = user.createResetPasswordToken();
    await user.save({validateBeforeSave: false});

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `we have received a password reset request. Please use the following link to reset your password\n\n${resetUrl}\n\nThis reset password link will be valid for 10 minutes.`;

    try {
            await sendEmail({
            email: user.email,
            subject: 'Password Change',
            message: message
        });

        res.status(200).json({
            status: 'success',
            message: `Password reset link sent to user email ${req.body.email}`
        });
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        user.save({validateBeforeSave: false});

        return next(new CustomError(`There was an error sending password reset email to ${req.body.email}. Please try again later`, 500));
    }
});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: token, passwordResetTokenExpires: {$gt: Date.now()}});

    if(!user){
        next(new CustomError('Token is invalid or has expired!', 400));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    this.createSendResponse(user, 200, res);
});