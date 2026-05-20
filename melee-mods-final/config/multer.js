const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

function makeStorage(dest) {
  return multer.diskStorage({
    destination(req, file, cb) {
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename(req, file, cb) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  });
}

// Subida combinada: imágenes (field "images") + archivos .dat (field "modfile")
const combinedUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = file.fieldname === 'images'
        ? 'public/uploads/images'
        : 'public/uploads/mods';
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.fieldname === 'images') {
      const ok = /\.(jpe?g|png|gif|webp)$/i.test(path.extname(file.originalname));
      return ok ? cb(null, true) : cb(new Error('Solo imágenes (jpg, png, gif, webp)'));
    }
    if (file.fieldname === 'modfile') {
      const ok = path.extname(file.originalname).toLowerCase() === '.dat';
      return ok ? cb(null, true) : cb(new Error('Solo se permiten archivos .dat'));
    }
    cb(null, false);
  }
}).fields([
  { name: 'images',  maxCount: 10 },
  { name: 'modfile', maxCount: 20 }
]);

// Subida de avatar
const avatarUpload = multer({
  storage: makeStorage('public/uploads/avatars'),
  fileFilter(req, file, cb) {
    const ok = /\.(jpe?g|png|gif|webp)$/i.test(path.extname(file.originalname));
    ok ? cb(null, true) : cb(new Error('Solo imágenes'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('avatar');

module.exports = { combinedUpload, avatarUpload };
