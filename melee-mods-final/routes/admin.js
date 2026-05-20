const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

router.use(isAuthenticated, isAdmin);

router.get( '/',                 ctrl.getDashboard);
router.get( '/users',            ctrl.getUsers);
router.get( '/mods',             ctrl.getMods);
router.post('/mods/:id/ban',     ctrl.banMod);
router.post('/mods/:id/publish', ctrl.publishMod);
router.post('/users/:id/role',   ctrl.setUserRole);
router.post('/users/:id/delete', ctrl.deleteUser);

module.exports = router;
