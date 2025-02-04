const express = require('express');
const userController = require('./../Controllers/usersController');
const authController = require('./../Controllers/authController');

const router = express.Router();

router.route('/updatePassword').patch(authController.protect, userController.updatePassword);
router.route('/getAllUsers').get(authController.protect, authController.restrict('admin'), userController.getAllUsers);
router.route('/updateUser').patch(authController.protect, authController.restrict('admin'), userController.updateUser);
router.route('/deleteUser').delete(authController.protect, authController.restrict('admin'), userController.deleteUser);

module.exports = router;