const db = require('../config/db');

exports.getProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const [[user]] = await db.query(
      'SELECT id, username, avatar_url, bio, social_twitter, social_youtube, social_twitch, social_discord, created_at FROM users WHERE username=?',
      [username]
    );
    if (!user) return res.status(404).render('error', { title:'404', message:'Usuario no encontrado.' });
    const [mods] = await db.query(
      `SELECT m.*, c.name AS category_name,
              (SELECT image_url FROM mod_images WHERE mod_id=m.id AND is_cover=1 LIMIT 1) AS cover,
              ROUND(AVG(r.score),1) AS avg_score
       FROM mods m JOIN categories c ON m.category_id=c.id
       LEFT JOIN ratings r ON r.mod_id=m.id
       WHERE m.user_id=? AND m.status='published'
       GROUP BY m.id ORDER BY m.created_at DESC`, [user.id]
    );
    res.render('user/profile', { title: user.username, profileUser: user, mods });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title:'Error', message:'Error al cargar el perfil.' });
  }
};

exports.getEditProfile = async (req, res) => {
  const [[user]] = await db.query(
    'SELECT id, username, bio, avatar_url, social_twitter, social_youtube, social_twitch, social_discord FROM users WHERE id=?',
    [req.session.userId]
  );
  res.render('user/edit', { title: 'Editar perfil', profileUser: user });
};

exports.postEditProfile = async (req, res) => {
  const { bio, social_twitter, social_youtube, social_twitch, social_discord } = req.body;
  try {
    if (req.file) {
      const avatar_url = '/uploads/avatars/' + req.file.filename;
      await db.query(
        'UPDATE users SET bio=?, social_twitter=?, social_youtube=?, social_twitch=?, social_discord=?, avatar_url=? WHERE id=?',
        [bio, social_twitter, social_youtube, social_twitch, social_discord, avatar_url, req.session.userId]
      );
      req.session.avatar = avatar_url;
    } else {
      await db.query(
        'UPDATE users SET bio=?, social_twitter=?, social_youtube=?, social_twitch=?, social_discord=? WHERE id=?',
        [bio, social_twitter, social_youtube, social_twitch, social_discord, req.session.userId]
      );
    }
    req.flash('success', 'Perfil actualizado.');
    res.redirect('/user/' + req.session.username);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar el perfil.');
    res.redirect('/user/edit');
  }
};
