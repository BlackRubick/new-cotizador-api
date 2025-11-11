import nodemailer from 'nodemailer';

// Configurar transporter de nodemailer con tus credenciales
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cotizacionesacr4@gmail.com',
    pass: 'tabn lxjw qubk qtmw'
  }
});

// Verificar conexión
transporter.verify((error, success) => {
  if (error) {
    console.error('Error al configurar el servicio de email:', error);
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
  }
});

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
}

/**
 * Envía un email con adjuntos opcionales
 */
export async function sendMail(
  to: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[] = []
) {
  try {
    const mailOptions = {
      from: `"Cotizaciones ACR" <cotizacionesacr4@gmail.com>`,
      to,
      subject,
      html,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content
      }))
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
}

export default { sendMail };