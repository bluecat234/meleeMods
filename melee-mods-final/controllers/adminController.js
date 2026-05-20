const db = require('../config/db');

exports.getDashboard = async (req, res) => {
  const [[{ total_users }]]     = await db.query('SELECT COUNT(*) AS total_users FROM users');
  const [[{ total_mods }]]      = await db.query("SELECT COUNT(*) AS total_mods FROM mods WHERE status='published'");
  const [[{ total_downloads }]] = await db.query('SELECT COALESCE(SUM(download_count),0) AS total_downloads FROM mods');
  const [[{ total_comments }]]  = await db.query('SELECT COUNT(*) AS total_comments FROM comments');
  const [recentMods] = await db.query(
    `SELECT m.*, u.username AS author, c.name AS category_name
     FROM mods m JOIN users u ON m.user_id=u.id JOIN categories c ON m.category_id=c.id
     ORDER BY m.created_at DESC LIMIT 10`
  );
  res.render('admin/dashboard', {
    title: 'Admin — Dashboard',
    stats: { total_users, total_mods, total_downloads, total_comments },
    recentMods
  });
};

exports.getUsers = async (req, res) => {
  const [users] = await db.query(
    'SELECT id, username, email, role, is_verified, created_at FROM users ORDER BY created_at DESC'
  );
  res.render('admin/users', { title: 'Admin — Usuarios', users });
};

exports.getMods = async (req, res) => {
  const [mods] = await db.query(
    `SELECT m.*, u.username AS author, c.name AS category_name
     FROM mods m JOIN users u ON m.user_id=u.id JOIN categories c ON m.category_id=c.id
     ORDER BY m.created_at DESC`
  );
  res.render('admin/mods', { title: 'Admin — Mods', mods });
};

exports.banMod = async (req, res) => {
  await db.query("UPDATE mods SET status='banned' WHERE id=?", [req.params.id]);
  req.flash('success', 'Mod baneado.');
  res.redirect('/admin/mods');
};

exports.publishMod = async (req, res) => {
  await db.query("UPDATE mods SET status='published' WHERE id=?", [req.params.id]);
  req.flash('success', 'Mod publicado.');
  res.redirect('/admin/mods');
};

exports.setUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.redirect('/admin/users');
  await db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
  req.flash('success', 'Rol actualizado.');
  res.redirect('/admin/users');
};

exports.deleteUser = async (req, res) => {
  await db.query('DELETE FROM users WHERE id=? AND role != "admin"', [req.params.id]);
  req.flash('success', 'Usuario eliminado.');
  res.redirect('/admin/users');
};
