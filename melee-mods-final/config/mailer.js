const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendVerificationEmail(to, username, token) {
  const verifyUrl = `${process.env.BASE_URL}/auth/verify/${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: '¡Verifica tu cuenta en Melee Mods!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0e1a;color:#e2e8f0;padding:2rem;border-radius:10px">
        <h2 style="color:#3b82f6">¡Bienvenido a Melee Mods, ${username}!</h2>
        <p>Haz clic en el botón para verificar tu cuenta:</p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;
                  border-radius:6px;text-decoration:none;font-weight:bold;margin:1rem 0">
          Verificar cuenta
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:1.5rem">
          Si no te registraste en Melee Mods, ignora este correo.
        </p>
      </div>
    `
  });
}

module.exports = { sendVerificationEmail };
