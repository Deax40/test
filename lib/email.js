import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendProblemNotification({ toolName, location, description, userName, userEmail, photoBuffer, photoType }) {
  if (!process.env.SMTP_USER || !process.env.ADMIN_EMAIL) {
    console.log('Email not configured. Problem notification would be sent:', {
      toolName,
      location,
      description,
      userName
    })
    return
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `Problème signalé - ${toolName}`,
    html: `
      <h2>Problème matériel signalé</h2>
      <p><strong>Outil:</strong> ${toolName}</p>
      <p><strong>Lieu:</strong> ${location}</p>
      <p><strong>Signalé par:</strong> ${userName} (${userEmail || 'Email non disponible'})</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>

      <h3>Description du problème:</h3>
      <p>${description}</p>

      ${photoBuffer ? '<p>Photo du problème en pièce jointe</p>' : ''}

      <hr>
      <p><small>Généré automatiquement par le système ENGEL QR</small></p>
    `,
    attachments: photoBuffer ? [{
      filename: `probleme_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${photoType?.split('/')[1] || 'jpg'}`,
      content: photoBuffer,
      contentType: photoType
    }] : []
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Problem notification email sent successfully')
  } catch (error) {
    console.error('Error sending problem notification email:', error)
    throw error
  }
}

export async function sendExpirationAlert({ toolName, expirationDate, userName, userEmail }) {
  if (!process.env.SMTP_USER || !process.env.ADMIN_EMAIL) {
    console.log('Email not configured. Expiration alert would be sent:', {
      toolName,
      expirationDate,
      userName
    })
    return
  }

  const daysUntilExpiration = Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24))

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    cc: userEmail,
    subject: `Expiration proche - Certification ${toolName}`,
    html: `
      <h2>Certification expire dans ${daysUntilExpiration} jours</h2>
      <p><strong>Outil:</strong> ${toolName}</p>
      <p><strong>Date d'expiration:</strong> ${new Date(expirationDate).toLocaleDateString('fr-FR')}</p>
      <p><strong>Responsable:</strong> ${userName} (${userEmail || 'Email non disponible'})</p>

      <p style="color: #d97706; font-weight: bold;">
        Action requise: Renouveler la certification avant expiration
      </p>

      <hr>
      <p><small>Généré automatiquement par le système ENGEL QR</small></p>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Expiration alert email sent successfully')
  } catch (error) {
    console.error('Error sending expiration alert email:', error)
    throw error
  }
}

export async function sendHabilitationExpirationAlert({ userName, userEmail, habilitationTitle, expirationDate }) {
  if (!process.env.SMTP_USER) {
    console.log('Email not configured. Habilitation expiration alert would be sent:', {
      userName,
      habilitationTitle,
      expirationDate
    })
    return
  }

  // Si l'utilisateur n'a pas d'email, on ne peut pas envoyer
  if (!userEmail) {
    console.log(`User ${userName} has no email address. Cannot send habilitation expiration alert.`)
    return
  }

  const daysUntilExpiration = Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24))

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: userEmail,
    subject: `⚠️ Votre habilitation expire dans ${daysUntilExpiration} jours`,
    html: `
      <h2 style="color: #d97706;">Habilitation bientôt expirée</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>

      <p>Votre habilitation <strong>${habilitationTitle || 'Non spécifié'}</strong> expire dans <strong style="color: #d97706;">${daysUntilExpiration} jours</strong>.</p>

      <p><strong>Date d'expiration:</strong> ${new Date(expirationDate).toLocaleDateString('fr-FR')}</p>

      <p style="color: #dc2626; font-weight: bold; background-color: #fee2e2; padding: 10px; border-left: 4px solid #dc2626;">
        ⚠️ Action requise: Contactez votre responsable pour renouveler votre habilitation avant expiration.
      </p>

      <p>Si vous avez des questions, veuillez contacter l'administration.</p>

      <hr>
      <p><small>Généré automatiquement par le système ENGEL QR</small></p>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Habilitation expiration alert sent to ${userEmail}`)
  } catch (error) {
    console.error('Error sending habilitation expiration alert email:', error)
    throw error
  }
}

export async function sendBrokenToolAlertToAdmins({ toolName, location, description, userName, photoBuffer, photoType, prisma }) {
  if (!process.env.SMTP_USER) {
    console.log('Email not configured. Broken tool alert would be sent:', {
      toolName,
      location,
      userName
    })
    return
  }

  try {
    // Récupérer tous les admins avec email
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        email: {
          not: null
        }
      },
      select: {
        email: true,
        name: true
      }
    })

    if (admins.length === 0) {
      console.log('No admin with email found. Cannot send broken tool alert.')
      return
    }

    const adminEmails = admins.map(admin => admin.email).filter(Boolean)

    if (adminEmails.length === 0) {
      console.log('No admin emails available.')
      return
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: adminEmails.join(', '),
      subject: `🔧 URGENT - Outil cassé signalé: ${toolName}`,
      html: `
        <h2 style="color: #dc2626;">🔧 Outil cassé signalé</h2>

        <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #dc2626;">ATTENTION - Intervention requise</p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 150px;">Outil:</td>
            <td style="padding: 8px;">${toolName}</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 8px; font-weight: bold;">Lieu:</td>
            <td style="padding: 8px;">${location || 'Non spécifié'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Signalé par:</td>
            <td style="padding: 8px;">${userName}</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 8px; font-weight: bold;">Date:</td>
            <td style="padding: 8px;">${new Date().toLocaleString('fr-FR')}</td>
          </tr>
        </table>

        <h3>Description du problème:</h3>
        <div style="background-color: #f3f4f6; padding: 10px; border-radius: 5px;">
          <p>${description || 'Aucune description fournie'}</p>
        </div>

        ${photoBuffer ? '<p style="color: #059669; font-weight: bold;">📷 Photo du problème en pièce jointe</p>' : ''}

        <hr style="margin: 20px 0;">
        <p><small>Généré automatiquement par le système ENGEL QR</small></p>
      `,
      attachments: photoBuffer ? [{
        filename: `outil_casse_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${photoType?.split('/')[1] || 'jpg'}`,
        content: photoBuffer,
        contentType: photoType
      }] : []
    }

    await transporter.sendMail(mailOptions)
    console.log(`Broken tool alert sent to ${adminEmails.length} admin(s)`)
  } catch (error) {
    console.error('Error sending broken tool alert to admins:', error)
    throw error
  }
}