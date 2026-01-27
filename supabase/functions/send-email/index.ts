import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

interface EmailRequest {
  to: string;
  template: 'company-approved' | 'company-rejected' | 'new-message' | 'welcome-team-member' | 'low-credits' | 'credit-purchase' | 'new-job-application' | 'application-status-update';
  data: Record<string, any>;
}

const templates = {
  'company-approved': {
    subject: (data: any) => `¡Bienvenido a YourCVPassport! Tu empresa ${data.companyName} ha sido aprobada`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ ¡Empresa Aprobada!</h1>
            </div>
            <div class="content">
              <h2>¡Hola ${data.companyName}!</h2>
              <p>Nos complace informarte que tu registro de empresa ha sido <strong>aprobado</strong>.</p>
              <p>Ya puedes empezar a buscar talento verificado en nuestra plataforma.</p>

              <h3>🎁 Regalo de bienvenida</h3>
              <p>Hemos agregado <strong>${data.welcomeCredits || 10} créditos gratuitos</strong> a tu cuenta para que puedas empezar a explorar.</p>

              <h3>📋 Próximos pasos:</h3>
              <ul>
                <li>Completa tu perfil de empresa</li>
                <li>Invita a tu equipo</li>
                <li>Busca talento por categorías</li>
                <li>Guarda tus búsquedas favoritas</li>
              </ul>

              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Ir al Dashboard</a>
              </div>

              ${data.adminNotes ? `<p style="background: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px;"><strong>Nota del administrador:</strong> ${data.adminNotes}</p>` : ''}
            </div>
            <div class="footer">
              <p>© 2025 YourCVPassport. Todos los derechos reservados.</p>
              <p><a href="https://yourcvpassport.com">yourcvpassport.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  'company-rejected': {
    subject: (data: any) => `Actualización sobre tu registro en YourCVPassport`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Actualización de Registro</h1>
            </div>
            <div class="content">
              <h2>Hola ${data.companyName},</h2>
              <p>Lamentamos informarte que tu solicitud de registro no ha sido aprobada en este momento.</p>

              <div class="alert">
                <strong>Razón:</strong><br>
                ${data.reason}
              </div>

              <h3>¿Qué puedes hacer?</h3>
              <ul>
                <li>Revisa la información proporcionada</li>
                <li>Asegúrate de que los documentos sean legibles</li>
                <li>Verifica que la información sea precisa</li>
                <li>Intenta registrarte nuevamente</li>
              </ul>

              <p>Si crees que esto es un error o necesitas más información, no dudes en contactarnos.</p>

              <div style="text-align: center;">
                <a href="mailto:support@yourcvpassport.com" class="button">Contactar Soporte</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 YourCVPassport. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  'new-message': {
    subject: (data: any) => `💬 Nuevo mensaje de ${data.senderName}`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 Nuevo Mensaje</h1>
            </div>
            <div class="content">
              <p><strong>${data.senderName}</strong> te ha enviado un mensaje:</p>

              <div class="message-box">
                <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">
                  ${new Date(data.sentAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p style="margin: 0;">${data.messagePreview}${data.messagePreview.length > 200 ? '...' : ''}</p>
              </div>

              <div style="text-align: center;">
                <a href="${data.conversationUrl}" class="button">Ver Conversación Completa</a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                💡 Responde rápido para aumentar tus posibilidades de conectar con el mejor talento.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 YourCVPassport. Todos los derechos reservados.</p>
              <p style="font-size: 11px; color: #999;">
                Para dejar de recibir notificaciones de mensajes,
                <a href="${data.unsubscribeUrl}">haz clic aquí</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  'welcome-team-member': {
    subject: (data: any) => `¡Bienvenido al equipo de ${data.companyName}!`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .role-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Bienvenido al Equipo!</h1>
            </div>
            <div class="content">
              <h2>Hola ${data.userName}!</h2>
              <p>Has sido agregado como <span class="role-badge">${data.role}</span> al equipo de <strong>${data.companyName}</strong> en YourCVPassport.</p>

              <h3>🔑 Tu rol incluye:</h3>
              ${getRolePermissions(data.role)}

              <h3>🚀 Comienza ahora:</h3>
              <ul>
                <li>Explora el dashboard de la empresa</li>
                <li>Familiarízate con las búsquedas guardadas</li>
                <li>Revisa las conversaciones activas</li>
                <li>Configura tus preferencias</li>
              </ul>

              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Acceder al Dashboard</a>
              </div>

              <p style="background: #dbeafe; padding: 15px; border-radius: 5px; margin-top: 20px;">
                💡 <strong>Tip:</strong> Te invitó ${data.invitedBy}. Si tienes dudas, no dudes en contactarle.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 YourCVPassport. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  'low-credits': {
    subject: (data: any) => `⚠️ Créditos bajos - Solo quedan ${data.creditsRemaining} créditos`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .package { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; border: 2px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Créditos Bajos</h1>
            </div>
            <div class="content">
              <h2>Hola ${data.companyName}!</h2>

              <div class="warning">
                <p style="margin: 0;"><strong>Solo te quedan ${data.creditsRemaining} créditos.</strong></p>
              </div>

              <p>Recarga ahora para no perder oportunidades de conectar con el mejor talento.</p>

              <h3>📦 Paquetes Recomendados:</h3>

              <div class="package">
                <h4>Professional Pack - $129</h4>
                <p>150 créditos | Ahorra 13%</p>
              </div>

              <div class="package">
                <h4>Business Pack - $239</h4>
                <p>300 créditos | Ahorra 20%</p>
              </div>

              <div style="text-align: center;">
                <a href="${data.purchaseUrl}" class="button">Comprar Créditos</a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                💡 Los créditos nunca expiran y puedes usarlos cuando quieras.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 YourCVPassport. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  'credit-purchase': {
    subject: (data: any) => `✅ Compra confirmada - ${data.credits} créditos agregados`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Compra Confirmada</h1>
              <p style="font-size: 48px; margin: 20px 0;">+${data.credits}</p>
              <p>créditos agregados</p>
            </div>
            <div class="content">
              <h2>¡Gracias por tu compra, ${data.companyName}!</h2>

              <div class="receipt">
                <h3 style="margin-top: 0;">Detalles de la compra</h3>
                <div class="receipt-row">
                  <span>Paquete:</span>
                  <strong>${data.packageName}</strong>
                </div>
                <div class="receipt-row">
                  <span>Créditos:</span>
                  <strong>${data.credits} créditos</strong>
                </div>
                <div class="receipt-row">
                  <span>Precio:</span>
                  <strong>$${data.price}</strong>
                </div>
                <div class="receipt-row" style="border-bottom: none; font-size: 18px;">
                  <span>Nuevo Balance:</span>
                  <strong style="color: #10b981;">${data.newBalance} créditos</strong>
                </div>
              </div>

              <p>Fecha: ${new Date(data.purchaseDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>

              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Ir al Dashboard</a>
              </div>

              <p style="background: #dbeafe; padding: 15px; border-radius: 5px; margin-top: 20px;">
                💡 <strong>Próximos pasos:</strong> Usa tus créditos para desbloquear perfiles completos,
                descargar CVs y conectar con el mejor talento verificado.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 YourCVPassport. Todos los derechos reservados.</p>
              <p style="font-size: 11px; color: #999;">
                ID de transacción: ${data.transactionId}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  'new-job-application': {
    subject: (data: any) => `🎯 Nueva aplicación para ${data.jobTitle}`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .candidate-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .match-score { display: inline-block; background: #dbeafe; color: #1e40af; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 16px; }
            .match-score.high { background: #dcfce7; color: #166534; }
            .match-score.medium { background: #fef3c7; color: #92400e; }
            .skills-tag { display: inline-block; background: #ede9fe; color: #5b21b6; padding: 4px 12px; border-radius: 12px; margin: 4px; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Nueva Aplicación</h1>
            </div>
            <div class="content">
              <h2>¡Tienes un nuevo candidato!</h2>
              <p><strong>${data.candidateName}</strong> ha aplicado a tu vacante <strong>${data.jobTitle}</strong>.</p>

              <div class="candidate-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                  <h3 style="margin: 0;">${data.candidateName}</h3>
                  <span class="match-score ${data.matchScore >= 70 ? 'high' : data.matchScore >= 50 ? 'medium' : ''}">
                    ${data.matchScore}% Match
                  </span>
                </div>

                ${data.candidateTitle ? `<p style="color: #666; margin: 5px 0;"><strong>${data.candidateTitle}</strong></p>` : ''}
                ${data.candidateLocation ? `<p style="color: #666; margin: 5px 0;">📍 ${data.candidateLocation}</p>` : ''}
                ${data.candidateExperience ? `<p style="color: #666; margin: 5px 0;">💼 ${data.candidateExperience}</p>` : ''}

                ${data.topSkills && data.topSkills.length > 0 ? `
                  <div style="margin-top: 15px;">
                    <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">Habilidades principales:</p>
                    ${data.topSkills.map((skill: string) => `<span class="skills-tag">${skill}</span>`).join('')}
                  </div>
                ` : ''}

                ${data.coverLetter ? `
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <p style="font-weight: bold; margin: 5px 0 10px 0;">Carta de presentación:</p>
                    <p style="color: #666; font-style: italic;">"${data.coverLetter.substring(0, 200)}${data.coverLetter.length > 200 ? '...' : ''}"</p>
                  </div>
                ` : ''}
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⏰ Responde rápido:</strong> Los mejores candidatos reciben múltiples ofertas. Revisa su perfil completo ahora.</p>
              </div>

              <div style="text-align: center;">
                <a href="${data.applicationUrl}" class="button">Ver Aplicación Completa</a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
                Aplicación recibida el ${new Date(data.appliedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div class="footer">
              <p>© 2025 YourCVPassport. Todos los derechos reservados.</p>
              <p style="font-size: 11px; color: #999;">
                Aplicación ID: ${data.applicationId}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  'application-status-update': {
    subject: (data: any) => getApplicationStatusSubject(data),
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${getStatusColor(data.newStatus)}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: ${getStatusColor(data.newStatus)}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .status-badge { display: inline-block; background: white; color: ${getStatusColor(data.newStatus)}; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 16px; }
            .job-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${getStatusEmoji(data.newStatus)} Actualización de Aplicación</h1>
              <p style="font-size: 18px; margin-top: 15px;">
                <span class="status-badge">${getStatusText(data.newStatus)}</span>
              </p>
            </div>
            <div class="content">
              <h2>Hola ${data.candidateName},</h2>
              <p>${getStatusMessage(data.newStatus, data.companyName)}</p>

              <div class="job-details">
                <h3 style="margin-top: 0;">Detalles de la vacante</h3>
                <p><strong>Posición:</strong> ${data.jobTitle}</p>
                <p><strong>Empresa:</strong> ${data.companyName}</p>
                ${data.jobLocation ? `<p><strong>Ubicación:</strong> ${data.jobLocation}</p>` : ''}
                ${data.workMode ? `<p><strong>Modalidad:</strong> ${getWorkModeText(data.workMode)}</p>` : ''}
                <p style="color: #666; font-size: 14px; margin-top: 15px;">
                  Aplicaste el ${new Date(data.appliedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              ${data.companyMessage ? `
                <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <p style="margin: 0; font-weight: bold;">Mensaje de ${data.companyName}:</p>
                  <p style="margin: 10px 0 0 0;">"${data.companyMessage}"</p>
                </div>
              ` : ''}

              ${getStatusNextSteps(data.newStatus)}

              <div style="text-align: center;">
                <a href="${data.applicationUrl}" class="button">Ver Detalles</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 YourCVPassport. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
};

function getRolePermissions(role: string): string {
  const permissions = {
    OWNER: `
      <ul>
        <li>✅ Acceso completo a todas las funciones</li>
        <li>✅ Gestión de facturación y créditos</li>
        <li>✅ Administración del equipo</li>
        <li>✅ Búsqueda y contacto con talento</li>
      </ul>
    `,
    ADMIN: `
      <ul>
        <li>✅ Gestión de miembros del equipo</li>
        <li>✅ Acceso a todas las funciones de búsqueda</li>
        <li>✅ Visualización de analíticas</li>
        <li>✅ Contacto con candidatos</li>
      </ul>
    `,
    MEMBER: `
      <ul>
        <li>✅ Búsqueda de talento</li>
        <li>✅ Contacto con candidatos</li>
        <li>✅ Visualización de perfiles</li>
      </ul>
    `,
    VIEWER: `
      <ul>
        <li>👁️ Visualización de búsquedas</li>
        <li>👁️ Acceso a analíticas</li>
        <li>❌ Sin permisos de edición</li>
      </ul>
    `,
  };
  return permissions[role as keyof typeof permissions] || permissions.MEMBER;
}

// Helper functions for job application status emails
function getApplicationStatusSubject(data: any): string {
  const statusSubjects: Record<string, string> = {
    'REVIEWING': `📋 ${data.companyName} está revisando tu aplicación`,
    'SHORTLISTED': `⭐ ¡Fuiste pre-seleccionado para ${data.jobTitle}!`,
    'INTERVIEW': `🎯 ${data.companyName} quiere entrevistarte`,
    'OFFER': `🎉 ¡Tienes una oferta de ${data.companyName}!`,
    'HIRED': `✅ ¡Felicitaciones! Fuiste contratado por ${data.companyName}`,
    'REJECTED': `Actualización sobre tu aplicación en ${data.companyName}`,
    'WITHDRAWN': `Confirmación: Aplicación retirada`,
  };
  return statusSubjects[data.newStatus] || `Actualización de tu aplicación en ${data.companyName}`;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'REVIEWING': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    'SHORTLISTED': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'INTERVIEW': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'OFFER': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'HIRED': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'REJECTED': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    'WITHDRAWN': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  };
  return colors[status] || colors['REVIEWING'];
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    'REVIEWING': '📋',
    'SHORTLISTED': '⭐',
    'INTERVIEW': '🎯',
    'OFFER': '🎉',
    'HIRED': '✅',
    'REJECTED': '📝',
    'WITHDRAWN': '↩️',
  };
  return emojis[status] || '📧';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    'REVIEWING': 'En Revisión',
    'SHORTLISTED': 'Pre-Seleccionado',
    'INTERVIEW': 'Entrevista',
    'OFFER': 'Oferta Recibida',
    'HIRED': 'Contratado',
    'REJECTED': 'No Seleccionado',
    'WITHDRAWN': 'Aplicación Retirada',
  };
  return texts[status] || status;
}

function getStatusMessage(status: string, companyName: string): string {
  const messages: Record<string, string> = {
    'REVIEWING': `${companyName} está revisando tu aplicación. Te mantendremos informado sobre cualquier novedad.`,
    'SHORTLISTED': `¡Excelentes noticias! ${companyName} te ha pre-seleccionado para la siguiente fase del proceso.`,
    'INTERVIEW': `¡Felicitaciones! ${companyName} está interesado en conocerte mejor y te invita a una entrevista.`,
    'OFFER': `¡Increíble! ${companyName} quiere que te unas a su equipo y te ha enviado una oferta formal.`,
    'HIRED': `¡Enhorabuena! Has sido contratado por ${companyName}. ¡Bienvenido al equipo!`,
    'REJECTED': `Gracias por tu interés en ${companyName}. Lamentablemente, en esta ocasión hemos decidido continuar con otros candidatos. Te animamos a seguir aplicando a otras oportunidades.`,
    'WITHDRAWN': `Has retirado tu aplicación exitosamente. Si cambias de opinión, puedes aplicar nuevamente en el futuro.`,
  };
  return messages[status] || `Tu aplicación ha sido actualizada.`;
}

function getWorkModeText(workMode: string): string {
  const modes: Record<string, string> = {
    'REMOTE': 'Remoto',
    'ONSITE': 'Presencial',
    'HYBRID': 'Híbrido',
  };
  return modes[workMode] || workMode;
}

function getStatusNextSteps(status: string): string {
  const nextSteps: Record<string, string> = {
    'REVIEWING': `
      <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">⏰ Próximos pasos:</p>
        <ul style="margin: 10px 0;">
          <li>Mantén tu perfil actualizado</li>
          <li>Revisa tu email regularmente</li>
          <li>Prepárate para posibles preguntas de entrevista</li>
        </ul>
      </div>
    `,
    'SHORTLISTED': `
      <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">⏰ Próximos pasos:</p>
        <ul style="margin: 10px 0;">
          <li>Estate atento a tu email y teléfono</li>
          <li>Prepara ejemplos de tu experiencia relevante</li>
          <li>Investiga más sobre la empresa</li>
          <li>Actualiza tu disponibilidad para entrevistas</li>
        </ul>
      </div>
    `,
    'INTERVIEW': `
      <div style="background: #ede9fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">⏰ Prepárate para la entrevista:</p>
        <ul style="margin: 10px 0;">
          <li>Revisa la descripción de la posición</li>
          <li>Investiga sobre la empresa y su cultura</li>
          <li>Prepara preguntas para el entrevistador</li>
          <li>Ten ejemplos concretos de tu experiencia</li>
          <li>Confirma fecha, hora y formato de la entrevista</li>
        </ul>
      </div>
    `,
    'OFFER': `
      <div style="background: #dcfce7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">⏰ Próximos pasos:</p>
        <ul style="margin: 10px 0;">
          <li>Revisa cuidadosamente los términos de la oferta</li>
          <li>No dudes en hacer preguntas o negociar</li>
          <li>Verifica beneficios y condiciones</li>
          <li>Responde dentro del plazo indicado</li>
        </ul>
      </div>
    `,
    'HIRED': `
      <div style="background: #dcfce7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">🎉 ¡Bienvenido al equipo!</p>
        <ul style="margin: 10px 0;">
          <li>Estate atento a información sobre onboarding</li>
          <li>Completa cualquier documentación pendiente</li>
          <li>Prepárate para tu primer día</li>
        </ul>
      </div>
    `,
    'REJECTED': `
      <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">💪 No te desanimes:</p>
        <ul style="margin: 10px 0;">
          <li>Cada experiencia es aprendizaje</li>
          <li>Sigue mejorando tu perfil</li>
          <li>Aplica a otras oportunidades</li>
          <li>Pide feedback si es posible</li>
        </ul>
      </div>
    `,
    'WITHDRAWN': `
      <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;">Puedes aplicar nuevamente en el futuro si cambias de opinión.</p>
      </div>
    `,
  };
  return nextSteps[status] || '';
}

serve(async (req) => {
  try {
    const { to, template, data } = await req.json() as EmailRequest;

    if (!templates[template]) {
      return new Response(JSON.stringify({ error: 'Invalid template' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailTemplate = templates[template];
    const subject = emailTemplate.subject(data);
    const html = emailTemplate.html(data);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'YourCVPassport <noreply@yourcvpassport.com>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
