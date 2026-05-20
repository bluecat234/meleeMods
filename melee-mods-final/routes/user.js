const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userController');
const { isAuthenticated } = require('../middlewares/auth');
const { avatarUpload }    = require('../config/multer');

router.get( '/edit',       isAuthenticated, ctrl.getEditProfile);
router.post('/edit',       isAuthenticated, avatarUpload, ctrl.postEditProfile);
router.get( '/:username',                   ctrl.getProfile);

module.exports = router;
