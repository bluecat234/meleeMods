const db   = require('../config/db');
const path = require('path');
const fs   = require('fs');

// ── GET / ──────────────────────────────────────────────────────────────────
exports.getIndex = async (req, res) => {
  const { category, search, sort = 'newest' } = req.query;
  let where = "WHERE m.status='published'";
  const params = [];
  if (category) { where += ' AND c.slug=?'; params.push(category); }
  if (search)   { where += ' AND (m.title LIKE ? OR m.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  const orderMap = { newest: 'm.created_at DESC', downloads: 'm.download_count DESC', rating: 'avg_score DESC' };
  const order = orderMap[sort] || orderMap.newest;
  const [mods] = await db.query(
    `SELECT m.*, c.name AS category_name, c.slug AS category_slug,
            u.username AS author,
            (SELECT image_url FROM mod_images WHERE mod_id=m.id AND is_cover=1 LIMIT 1) AS cover,
            ROUND(AVG(r.score),1) AS avg_score, COUNT(DISTINCT r.id) AS rating_count
     FROM mods m
     JOIN categories c ON m.category_id=c.id
     JOIN users u ON m.user_id=u.id
     LEFT JOIN ratings r ON r.mod_id=m.id
     ${where} GROUP BY m.id ORDER BY ${order} LIMIT 48`, params
  );
  const [categories] = await db.query('SELECT * FROM categories');
  res.render('mods/index', { title: 'Mods de Melee', mods, categories, currentCategory: category||null, search: search||'', sort });
};

// ── GET /mods/:id ──────────────────────────────────────────────────────────
exports.getMod = async (req, res) => {
  const { id } = req.params;
  try {
    const [[mod]] = await db.query(
      `SELECT m.*, c.name AS category_name, c.slug AS category_slug,
              u.username AS author, u.id AS user_id, u.avatar_url AS author_avatar,
              ROUND(AVG(r.score),1) AS avg_score, COUNT(DISTINCT r.id) AS rating_count
       FROM mods m JOIN categories c ON m.category_id=c.id
       JOIN users u ON m.user_id=u.id
       LEFT JOIN ratings r ON r.mod_id=m.id
       WHERE m.id=? AND m.status='published' GROUP BY m.id`, [id]
    );
    if (!mod) return res.status(404).render('error', { title:'404', message:'Mod no encontrado.' });
    const [images]   = await db.query('SELECT * FROM mod_images WHERE mod_id=? ORDER BY sort_order', [id]);
    const [files]    = await db.query('SELECT * FROM files WHERE mod_id=?', [id]);
    const [comments] = await db.query(
      `SELECT cm.*, u.username, u.avatar_url FROM comments cm
       JOIN users u ON cm.user_id=u.id
       WHERE cm.mod_id=? AND cm.parent_id IS NULL ORDER BY cm.created_at DESC`, [id]
    );
    const [tags] = await db.query(
      `SELECT t.name FROM tags t JOIN mod_tags mt ON mt.tag_id=t.id WHERE mt.mod_id=?`, [id]
    );
    let userRating = null;
    if (req.session.userId) {
      const [[r]] = await db.query(
        'SELECT score FROM ratings WHERE user_id=? AND mod_id=?', [req.session.userId, id]
      );
      userRating = r ? r.score : null;
    }
    res.render('mods/detail', { title: mod.title, mod, images, files, comments, tags, userRating });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Error', message: 'Error al cargar el mod.' });
  }
};

// ── GET /mods/new ──────────────────────────────────────────────────────────
exports.getNew = async (req, res) => {
  const [categories] = await db.query('SELECT * FROM categories');
  res.render('mods/new', { title: 'Subir mod', categories });
};

// ── POST /mods ─────────────────────────────────────────────────────────────
exports.postMod = async (req, res) => {
  const { title, description, category_id, version, tags } = req.body;
  const images   = req.files?.images  || [];
  const modFiles = req.files?.modfile || [];

  if (!modFiles.length) {
    req.flash('error', 'Debes subir al menos un archivo .dat');
    return res.redirect('/mods/new');
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO mods (user_id, category_id, title, description, version) VALUES (?,?,?,?,?)',
      [req.session.userId, category_id, title, description, version || '1.0.0']
    );
    const modId = result.insertId;

    for (let i = 0; i < images.length; i++) {
      await conn.query(
        'INSERT INTO mod_images (mod_id, image_url, is_cover, sort_order) VALUES (?,?,?,?)',
        [modId, '/uploads/images/' + images[i].filename, i === 0 ? 1 : 0, i]
      );
    }
    for (const f of modFiles) {
      await conn.query(
        'INSERT INTO files (mod_id, filename, file_path, file_size) VALUES (?,?,?,?)',
        [modId, f.originalname, '/uploads/mods/' + f.filename, f.size]
      );
    }
    if (tags) {
      for (const tagName of tags.split(',').map(t => t.trim()).filter(Boolean)) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');
        await conn.query('INSERT IGNORE INTO tags (name, slug) VALUES (?,?)', [tagName, slug]);
        const [[tag]] = await conn.query('SELECT id FROM tags WHERE slug=?', [slug]);
        await conn.query('INSERT IGNORE INTO mod_tags (mod_id, tag_id) VALUES (?,?)', [modId, tag.id]);
      }
    }
    await conn.commit();
    req.flash('success', '¡Mod subido correctamente!');
    res.redirect(`/mods/${modId}`);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    req.flash('error', 'Error al subir el mod: ' + err.message);
    res.redirect('/mods/new');
  } finally {
    conn.release();
  }
};

// ── GET /mods/:id/edit ─────────────────────────────────────────────────────
exports.getEdit = async (req, res) => {
  const { id } = req.params;
  try {
    const [[mod]] = await db.query('SELECT * FROM mods WHERE id=?', [id]);
    if (!mod) return res.status(404).render('error', { title:'404', message:'Mod no encontrado.' });
    if (mod.user_id !== req.session.userId && req.session.role !== 'admin')
      return res.status(403).render('error', { title:'Sin acceso', message:'Sin permiso.' });
    const [categories]  = await db.query('SELECT * FROM categories');
    const [images]      = await db.query('SELECT * FROM mod_images WHERE mod_id=? ORDER BY sort_order', [id]);
    const [files]       = await db.query('SELECT * FROM files WHERE mod_id=?', [id]);
    const [currentTags] = await db.query(
      'SELECT t.name FROM tags t JOIN mod_tags mt ON mt.tag_id=t.id WHERE mt.mod_id=?', [id]
    );
    res.render('mods/edit', { title: 'Editar mod', mod, categories, images, files, currentTags });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title:'Error', message:'Error al cargar el editor.' });
  }
};

// ── POST /mods/:id/edit ────────────────────────────────────────────────────
exports.postEdit = async (req, res) => {
  const { id } = req.params;
  const { title, description, category_id, version, tags, delete_images, delete_files } = req.body;
  const newImages   = req.files?.images  || [];
  const newDatFiles = req.files?.modfile || [];

  const conn = await db.getConnection();
  try {
    const [[mod]] = await conn.query('SELECT * FROM mods WHERE id=?', [id]);
    if (!mod) return res.status(404).render('error', { title:'404', message:'Mod no encontrado.' });
    if (mod.user_id !== req.session.userId && req.session.role !== 'admin')
      return res.status(403).render('error', { title:'Sin acceso', message:'Sin permiso.' });

    await conn.beginTransaction();

    await conn.query(
      'UPDATE mods SET title=?, description=?, category_id=?, version=?, updated_at=NOW() WHERE id=?',
      [title, description, category_id, version || '1.0.0', id]
    );

    const imgIds = Array.isArray(delete_images) ? delete_images : (delete_images ? [delete_images] : []);
    for (const imgId of imgIds)
      await conn.query('DELETE FROM mod_images WHERE id=? AND mod_id=?', [imgId, id]);

    const fileIds = Array.isArray(delete_files) ? delete_files : (delete_files ? [delete_files] : []);
    for (const fId of fileIds)
      await conn.query('DELETE FROM files WHERE id=? AND mod_id=?', [fId, id]);

    const [[{ maxSort }]] = await conn.query(
      'SELECT COALESCE(MAX(sort_order),0) AS maxSort FROM mod_images WHERE mod_id=?', [id]
    );
    let sortOrder = maxSort + 1;
    for (const img of newImages) {
      await conn.query(
        'INSERT INTO mod_images (mod_id, image_url, is_cover, sort_order) VALUES (?,?,0,?)',
        [id, '/uploads/images/' + img.filename, sortOrder++]
      );
    }
    await conn.query('UPDATE mod_images SET is_cover=0 WHERE mod_id=?', [id]);
    await conn.query(
      'UPDATE mod_images SET is_cover=1 WHERE mod_id=? ORDER BY sort_order LIMIT 1', [id]
    );

    for (const f of newDatFiles) {
      await conn.query(
        'INSERT INTO files (mod_id, filename, file_path, file_size) VALUES (?,?,?,?)',
        [id, f.originalname, '/uploads/mods/' + f.filename, f.size]
      );
    }

    await conn.query('DELETE FROM mod_tags WHERE mod_id=?', [id]);
    if (tags) {
      for (const tagName of tags.split(',').map(t => t.trim()).filter(Boolean)) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');
        await conn.query('INSERT IGNORE INTO tags (name, slug) VALUES (?,?)', [tagName, slug]);
        const [[tag]] = await conn.query('SELECT id FROM tags WHERE slug=?', [slug]);
        await conn.query('INSERT IGNORE INTO mod_tags (mod_id, tag_id) VALUES (?,?)', [id, tag.id]);
      }
    }

    await conn.commit();
    req.flash('success', 'Mod actualizado.');
    res.redirect(`/mods/${id}`);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    req.flash('error', 'Error al guardar: ' + err.message);
    res.redirect(`/mods/${id}/edit`);
  } finally {
    conn.release();
  }
};

// ── GET /mods/:id/download/:fileId ─────────────────────────────────────────
exports.downloadFile = async (req, res) => {
  const { id, fileId } = req.params;
  try {
    const [[file]] = await db.query('SELECT * FROM files WHERE id=? AND mod_id=?', [fileId, id]);
    if (!file) return res.status(404).render('error', { title:'404', message:'Archivo no encontrado.' });
    await db.query('UPDATE mods SET download_count=download_count+1 WHERE id=?', [id]);
    const filePath = path.join(__dirname, '..', 'public', file.file_path);
    res.download(filePath, file.filename);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title:'Error', message:'Error al descargar.' });
  }
};

// ── POST /mods/:id/comment ─────────────────────────────────────────────────
exports.postComment = async (req, res) => {
  const { id } = req.params;
  const { content, parent_id } = req.body;
  try {
    await db.query(
      'INSERT INTO comments (user_id, mod_id, parent_id, content) VALUES (?,?,?,?)',
      [req.session.userId, id, parent_id || null, content]
    );
    res.redirect(`/mods/${id}#comentarios`);
  } catch (err) {
    req.flash('error', 'Error al publicar comentario.');
    res.redirect(`/mods/${id}`);
  }
};

// ── POST /mods/:id/rate ────────────────────────────────────────────────────
exports.rateMod = async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  try {
    await db.query(
      'INSERT INTO ratings (user_id, mod_id, score) VALUES (?,?,?) ON DUPLICATE KEY UPDATE score=VALUES(score)',
      [req.session.userId, id, score]
    );
    res.redirect(`/mods/${id}`);
  } catch (err) {
    req.flash('error', 'Error al guardar valoración.');
    res.redirect(`/mods/${id}`);
  }
};

// ── POST /mods/:id/delete ──────────────────────────────────────────────────
exports.deleteMod = async (req, res) => {
  const { id } = req.params;
  try {
    const [[mod]] = await db.query('SELECT * FROM mods WHERE id=?', [id]);
    if (!mod) return res.status(404).render('error', { title:'404', message:'Mod no encontrado.' });
    if (mod.user_id !== req.session.userId && req.session.role !== 'admin')
      return res.status(403).render('error', { title:'Sin acceso', message:'Sin permiso.' });
    await db.query("UPDATE mods SET status='banned' WHERE id=?", [id]);
    req.flash('success', 'Mod eliminado.');
    res.redirect('/');
  } catch (err) {
    req.flash('error', 'Error al eliminar.');
    res.redirect(`/mods/${id}`);
  }
};
