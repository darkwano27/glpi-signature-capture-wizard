const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Cambiar según tu proveedor de email
  port: 587,
  secure: false,
  auth: {
    user: 'qui.vta091.aris@gmail.com', // Cambia por tu email
    pass: 'svze iolf vosk yncq' // Cambia por tu contraseña o app password
  }
});
function sendMail(options) {
  return transporter.sendMail({
    from: 'qui.vta091.aris@gmail.com',
    ...options
  });
}
module.exports = { sendMail };