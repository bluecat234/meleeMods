const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middlewares/auth');

router.get( '/register',      isGuest,         ctrl.getRegister);
router.post('/register',      isGuest,         ctrl.postRegister);
router.get( '/login',         isGuest,         ctrl.getLogin);
router.post('/login',         isGuest,         ctrl.postLogin);
router.get( '/verify/:token',                  ctrl.verifyEmail);
router.get( '/logout',        isAuthenticated, ctrl.logout);

module.exports = router;
