require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_FROM,
  to: "hwan.pro1@gmail.com", // Cambia al destinatario
  subject: "Prueba de Nodemailer",
  text: "Hola, este es un correo de prueba enviado desde Nodemailer.",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log("Error al enviar correo:", error);
  }
  console.log("Correo enviado:", info.response);
});
