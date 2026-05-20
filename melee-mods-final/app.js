require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash   = require('connect-flash');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.userId ? {
    id:       req.session.userId,
    username: req.session.username,
    role:     req.session.role,
    avatar:   req.session.avatar
  } : null;
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg   = req.flash('error');
  next();
});

app.use('/auth',  require('./routes/auth'));
app.use('/mods',  require('./routes/mods'));
app.use('/user',  require('./routes/user'));
app.use('/admin', require('./routes/admin'));
app.get('/', require('./controllers/modController').getIndex);

app.use((req, res) => {
  res.status(404).render('error', { title: '404', message: 'Página no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`🎮 Melee Mods corriendo en http://localhost:${PORT}`);
});
