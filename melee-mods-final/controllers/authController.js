const bcrypt  = require('bcrypt');
const crypto  = require('crypto');
const db      = require('../config/db');
const { sendVerificationEmail } = require('../config/mailer');

exports.getRegister = (req, res) => res.render('auth/register', { title: 'Crear cuenta' });

exports.postRegister = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email=? OR username=?', [email, username]
    );
    if (existing.length > 0) {
      req.flash('error', 'El email o nombre de usuario ya está en uso.');
      return res.redirect('/auth/register');
    }
    const passwordHash      = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await db.query(
      'INSERT INTO users (username, email, password_hash, verification_token) VALUES (?,?,?,?)',
      [username, email, passwordHash, verificationToken]
    );
    await sendVerificationEmail(email, username, verificationToken);
    req.flash('success', '¡Cuenta creada! Revisa tu correo para verificarla.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al crear la cuenta.');
    res.redirect('/auth/register');
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE verification_token=?', [token]
    );
    if (rows.length === 0) {
      req.flash('error', 'Token inválido o expirado.');
      return res.redirect('/auth/login');
    }
    await db.query(
      'UPDATE users SET is_verified=TRUE, verification_token=NULL WHERE id=?', [rows[0].id]
    );
    req.flash('success', '¡Cuenta verificada! Ya puedes iniciar sesión.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al verificar la cuenta.');
    res.redirect('/auth/login');
  }
};

exports.getLogin = (req, res) => res.render('auth/login', { title: 'Iniciar sesión' });

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      req.flash('error', 'Email o contraseña incorrectos.');
      return res.redirect('/auth/login');
    }
    if (!user.is_verified) {
      req.flash('error', 'Debes verificar tu email antes de iniciar sesión.');
      return res.redirect('/auth/login');
    }
    req.session.userId   = user.id;
    req.session.username = user.username;
    req.session.role     = user.role;
    req.session.avatar   = user.avatar_url;
    req.flash('success', `¡Bienvenido, ${user.username}!`);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al iniciar sesión.');
    res.redirect('/auth/login');
  }
};

exports.logout = (req, res) => req.session.destroy(() => res.redirect('/'));
