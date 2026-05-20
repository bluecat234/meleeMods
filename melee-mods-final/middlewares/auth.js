function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) return next();
  req.flash('error', 'Debes iniciar sesión para acceder a esta página.');
  res.redirect('/auth/login');
}

function isGuest(req, res, next) {
  if (!req.session || !req.session.userId) return next();
  res.redirect('/');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') return next();
  res.status(403).render('error', { title: 'Sin acceso', message: 'Acceso denegado.' });
}

module.exports = { isAuthenticated, isGuest, isAdmin };
