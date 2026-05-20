CREATE DATABASE IF NOT EXISTS melee_mods CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE melee_mods;

CREATE TABLE users (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username           VARCHAR(50)  NOT NULL UNIQUE,
    email              VARCHAR(255) NOT NULL UNIQUE,
    password_hash      VARCHAR(255) NOT NULL,
    avatar_url         VARCHAR(500) DEFAULT NULL,
    bio                TEXT         DEFAULT NULL,
    social_twitter     VARCHAR(100) DEFAULT NULL,
    social_youtube     VARCHAR(100) DEFAULT NULL,
    social_twitch      VARCHAR(100) DEFAULT NULL,
    social_discord     VARCHAR(100) DEFAULT NULL,
    is_verified        BOOLEAN      NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255) DEFAULT NULL,
    role               ENUM('user','admin') NOT NULL DEFAULT 'user',
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT         DEFAULT NULL,
    icon        VARCHAR(100) DEFAULT NULL
);

INSERT INTO categories (name, slug, description, icon) VALUES
    ('Skins de personajes', 'skins-personajes', 'Texturas y modelos alternativos para los personajes', '🎮'),
    ('Skins de escenarios', 'skins-escenarios', 'Fondos y elementos visuales de los stages',           '🏟️'),
    ('Audio',              'audio',            'Música, efectos de sonido y voces',                    '🎵'),
    ('HUD',                'hud',              'Interfaz, iconos de stock y elementos de pantalla',    '🖥️');

CREATE TABLE mods (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED NOT NULL,
    category_id    INT UNSIGNED NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT         DEFAULT NULL,
    version        VARCHAR(20)  NOT NULL DEFAULT '1.0.0',
    download_count INT UNSIGNED NOT NULL DEFAULT 0,
    status         ENUM('draft','published','banned') NOT NULL DEFAULT 'published',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mods_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    CONSTRAINT fk_mods_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE mod_images (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mod_id      INT UNSIGNED NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    is_cover    BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_images_mod FOREIGN KEY (mod_id) REFERENCES mods(id) ON DELETE CASCADE
);

CREATE TABLE files (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mod_id      INT UNSIGNED NOT NULL,
    filename    VARCHAR(255) NOT NULL,
    file_path   VARCHAR(500) NOT NULL,
    file_size   INT UNSIGNED NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_files_mod FOREIGN KEY (mod_id) REFERENCES mods(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    mod_id     INT UNSIGNED NOT NULL,
    parent_id  INT UNSIGNED DEFAULT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_comments_mod    FOREIGN KEY (mod_id)    REFERENCES mods(id)     ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE ratings (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    mod_id     INT UNSIGNED NOT NULL,
    score      TINYINT UNSIGNED NOT NULL CHECK (score BETWEEN 1 AND 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ratings_user_mod UNIQUE (user_id, mod_id),
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_mod  FOREIGN KEY (mod_id)  REFERENCES mods(id)  ON DELETE CASCADE
);

CREATE TABLE tags (
    id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE mod_tags (
    mod_id INT UNSIGNED NOT NULL,
    tag_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (mod_id, tag_id),
    CONSTRAINT fk_mod_tags_mod FOREIGN KEY (mod_id) REFERENCES mods(id)  ON DELETE CASCADE,
    CONSTRAINT fk_mod_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id)  ON DELETE CASCADE
);