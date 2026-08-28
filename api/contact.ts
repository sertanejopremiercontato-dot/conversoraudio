import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore/lite";

// In-memory rate limiting (max 5 requests per 10 minutes per IP/client)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientKey);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientKey, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) {
    return true;
  }
  entry.count += 1;
  return false;
}

// Load Firebase configuration safely
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {
  console.warn("[CONTACT-API] Failed to read firebase-applet-config.json:", err);
}

function getDb() {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    return null;
  }

  const app = getApps().length === 0 ? initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId
  }) : getApps()[0];

  return getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
}

// Email format validator
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sanitize string input
function sanitizeText(str: string): string {
  if (!str) return "";
  return str.replace(/[\r\n]+/g, " ").trim();
}

export default async function handler(req: any, res: any) {
  if (res.setHeader) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Somente o método POST é permitido."
    });
  }

  try {
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          ok: false,
          error: "INVALID_JSON",
          message: "Formato de requisição inválido."
        });
      }
    }

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        ok: false,
        error: "MISSING_BODY",
        message: "Dados de contato não fornecidos."
      });
    }

    const {
      name = "",
      email = "",
      type = "Sugestão",
      subject = "",
      message = "",
      honeypot = "",
      page = "Como Funciona"
    } = body;

    // 1. Honeypot check (Spam protection)
    if (honeypot && String(honeypot).trim().length > 0) {
      // Silently accept spam bot submission
      return res.status(200).json({
        ok: true,
        message: "Mensagem enviada com sucesso! Obrigado pelo contato."
      });
    }

    // 2. Rate limiting check (using connection hash or header)
    const clientKey = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "client-anon";
    if (isRateLimited(String(clientKey).split(",")[0].trim())) {
      return res.status(429).json({
        ok: false,
        error: "RATE_LIMITED",
        message: "Muitas mensagens enviadas recentemente. Por favor, aguarde alguns minutos."
      });
    }

    // 3. Validation
    const cleanEmail = String(email).trim();
    const cleanSubject = sanitizeText(String(subject)).substring(0, 200);
    const cleanName = sanitizeText(String(name)).substring(0, 100);
    const cleanType = sanitizeText(String(type)).substring(0, 100);
    const cleanMessage = String(message).trim().substring(0, 5000);
    const cleanPage = sanitizeText(String(page)).substring(0, 100);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        ok: false,
        error: "INVALID_EMAIL",
        message: "Por favor, informe um endereço de e-mail válido para resposta."
      });
    }

    if (!cleanSubject) {
      return res.status(400).json({
        ok: false,
        error: "MISSING_SUBJECT",
        message: "Por favor, preencha o assunto da mensagem."
      });
    }

    if (!cleanMessage || cleanMessage.length < 5) {
      return res.status(400).json({
        ok: false,
        error: "MISSING_MESSAGE",
        message: "Por favor, escreva sua mensagem (mínimo 5 caracteres)."
      });
    }

    // 4. Server-Side Target Email
    const targetEmail = process.env.CONTACT_TO_EMAIL || "sertanejopremiercontato@gmail.com";
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Format Email Body
    const emailSubject = `[Conversor Audio] Nova mensagem — ${cleanType}`;
    const emailText = `
[Conversor Audio] Nova mensagem recebida através do site

Nome: ${cleanName || "Não informado"}
Email para resposta: ${cleanEmail}
Tipo: ${cleanType}
Assunto: ${cleanSubject}

Mensagem:
${cleanMessage}

----------------------------------------
Página de Origem: ${cleanPage}
Data: ${formattedDate} (${nowIso})
    `.trim();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #1d68f2, #3b82f6); padding: 16px 20px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold;">Conversor Audio — Nova Mensagem</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Formulário de Contato / Sugestões</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1e293b; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #64748b;">Nome:</td>
            <td style="padding: 8px 0;">${cleanName || "<em>Não informado</em>"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748b;">E-mail para resposta:</td>
            <td style="padding: 8px 0;"><a href="mailto:${cleanEmail}" style="color: #1d68f2; text-decoration: none; font-weight: bold;">${cleanEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Tipo:</td>
            <td style="padding: 8px 0;"><span style="display: inline-block; padding: 3px 10px; background-color: #eff6ff; color: #1d68f2; border-radius: 6px; font-weight: bold; font-size: 12px;">${cleanType}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Assunto:</td>
            <td style="padding: 8px 0; font-weight: bold;">${cleanSubject}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Página:</td>
            <td style="padding: 8px 0;">${cleanPage}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Data:</td>
            <td style="padding: 8px 0; font-size: 13px; color: #64748b;">${formattedDate}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 10px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Mensagem:</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #0f172a; white-space: pre-wrap;">${cleanMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
          Esta mensagem foi enviada pelo formulário da página Como Funciona do Conversor Audio.
        </div>
      </div>
    `;

    // 5. Save to Firestore for permanent reliable storage
    try {
      const db = getDb();
      if (db) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await setDoc(doc(db, "contact_messages", messageId), {
          id: messageId,
          name: cleanName,
          email: cleanEmail,
          type: cleanType,
          subject: cleanSubject,
          message: cleanMessage,
          page: cleanPage,
          targetEmail,
          createdAt: nowIso,
          status: "received"
        });
      }
    } catch (dbErr) {
      console.warn("[CONTACT-API] Firestore record error:", dbErr);
    }

    // 6. Attempt Email Dispatch via Nodemailer (Gmail SMTP / Standard SMTP)
    let emailSent = false;
    const smtpHost = (process.env.SMTP_HOST || "").trim();
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = (process.env.SMTP_USER || "").trim();
    const smtpPass = process.env.SMTP_PASS || "";
    const isSecure = smtpPort === 465;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: isSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        const fromAddress = (process.env.SMTP_FROM || "").trim() || `"Conversor Audio" <${smtpUser}>`;

        await transporter.sendMail({
          from: fromAddress,
          to: targetEmail,
          replyTo: cleanEmail,
          subject: emailSubject,
          text: emailText,
          html: emailHtml
        });
        emailSent = true;
      } catch (smtpErr) {
        console.warn("[CONTACT-API] SMTP send error:", smtpErr);
      }
    } else if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: process.env.SMTP_FROM || "Conversor Audio <onboarding@resend.dev>",
            to: [targetEmail],
            reply_to: cleanEmail,
            subject: emailSubject,
            text: emailText,
            html: emailHtml
          })
        });
        emailSent = true;
      } catch (resendErr) {
        console.warn("[CONTACT-API] Resend API error:", resendErr);
      }
    }

    return res.status(200).json({
      ok: true,
      message: "Mensagem enviada com sucesso! Obrigado pelo contato.",
      emailSent
    });

  } catch (error: any) {
    console.error("[CONTACT-API] Unexpected error:", error);
    return res.status(500).json({
      ok: false,
      error: "SERVER_ERROR",
      message: "Não foi possível enviar sua mensagem agora. Tente novamente em alguns instantes."
    });
  }
}
