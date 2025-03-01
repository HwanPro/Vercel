export function generateEmailTemplate({
  firstName,
  email,
  password,
  verificationLink,
  showCredentials = false,
  showPasswordChangeLink = false,
}: {
  firstName: string;
  email: string;
  password?: string;
  verificationLink: string;
  showCredentials?: boolean;
  showPasswordChangeLink?: boolean;
}) {
  const passwordChangeLink = `${process.env.NEXTAUTH_URL}/auth/login`;

  const motivationalQuotes = [
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día. – Robert Collier",
    "La disciplina es el puente entre metas y logros. – Jim Rohn",
    "Tu cuerpo puede soportar casi todo. Es tu mente la que debes convencer.",
    "Cada entrenamiento es un paso más hacia tu mejor versión.",
  ];

  const randomQuote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
    <h2 style="color: #ffca28;">¡Bienvenido a Wolf Gym, ${firstName}!</h2>
    
    <p><em>"${randomQuote}"</em></p>
    
    ${
      showCredentials
        ? `
      <h4>Tus credenciales:</h4>
      <p><strong>Correo:</strong> ${email}</p>
      <p><strong>Contraseña Temporal:</strong> ${password}</p>
      ${
        showPasswordChangeLink
          ? `<p>Puedes iniciar sesión y cambiar tu contraseña desde aquí: <a href="${passwordChangeLink}" target="_blank">Cambiar Contraseña</a></p>`
          : ""
      }
    `
        : ""
    }

    <h3>Verifica tu cuenta</h3>
    <p>Para completar tu registro, por favor verifica tu cuenta haciendo clic en el siguiente enlace:</p>
    <p><a href="${verificationLink}" target="_blank" style="color: #ffca28;">Verificar Cuenta</a></p>

    <!-- Pie de página con la frase destacada -->
    <div style="margin-top: 30px; text-align: center;">
      <p style="font-size: 24px; font-weight: bold; color: #e53935; letter-spacing: 1px;">
        PROHIBIDO RENDIRSE
      </p>
    </div>
    
    <p style="margin-top: 20px; font-style: italic;">"Libera tu lobo interior. Únete a la manada y transforma tu cuerpo y mente."</p>
  
    <p>¡Te esperamos en Wolf Gym!</p>
  </div>
`;
}

export function generatePasswordResetEmailTemplate(
  name: string,
  resetLink: string
) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color: #F59E0B;">Recuperación de contraseña - Wolf Gym</h2>
      <p>Hola <strong>${name}</strong>,</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
      <p>Por favor, haz clic en el siguiente botón para restablecer tu contraseña:</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #F59E0B; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
      </p>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      <hr />
      <p style="text-align: center; color: #aaa;">Wolf Gym - Libera tu lobo interior 🐺</p>
    </div>
  `;
}
