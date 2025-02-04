const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utilities/asyncErrorHandler');
const authController = require('./authController');
const CustomError = require('./../Utilities/CustomError');

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: "success",
        result: users.length,
        data: {
            users
        }
    })
})

const filterReqObj = (obj, ...allowedFields) =>{
    const newObj = {};
    Object.keys(obj).forEach(prop => {
        if(allowedFields.includes(prop)){
            newObj[prop] = obj[prop];
        }
    })
    return newObj;
}

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).select('+password');

    if(!(await user.comparePasswordInDB(req.body.currentPassword, user.password))){
        return next(new CustomError('The current password you provided is wrong', 401));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordChangedAt = Date.now();

    await user.save();

    authController.createSendResponse(user, 200, res);
})

exports.updateUser = asyncErrorHandler(async (req, res, next) => {
    if(req.body.password || req.body.confirmPassword){
        return next(new CustomError('You cannot update your password using this endpoint', 400));
    }

    const filterObj = filterReqObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {new: true, runValidators: true});

    if(!updatedUser){
        const err = new CustomError(`User is not updated`, 400);
        return next(err);
    }

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    })
})

exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
    const deletedUser = await User.findByIdAndUpdate(req.user.id, {active: false});

    if(!deletedUser){
        const err = new CustomError(`User is not deleted`, 400);
        return next(err);
    }

    res.status(204).json({
        status: "success",
        message: "User Deleted Successfully!"
    })
})