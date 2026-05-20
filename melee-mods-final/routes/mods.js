const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/modController');
const { isAuthenticated }  = require('../middlewares/auth');
const { combinedUpload }   = require('../config/multer');

router.get( '/',                            ctrl.getIndex);
router.get( '/new',      isAuthenticated,   ctrl.getNew);
router.post('/',         isAuthenticated,   combinedUpload, ctrl.postMod);
router.get( '/:id',                         ctrl.getMod);
router.get( '/:id/edit', isAuthenticated,   ctrl.getEdit);
router.post('/:id/edit', isAuthenticated,   combinedUpload, ctrl.postEdit);
router.get( '/:id/download/:fileId',        ctrl.downloadFile);
router.post('/:id/comment', isAuthenticated, ctrl.postComment);
router.post('/:id/rate',    isAuthenticated, ctrl.rateMod);
router.post('/:id/delete',  isAuthenticated, ctrl.deleteMod);

module.exports = router;
