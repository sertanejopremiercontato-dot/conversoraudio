import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Safe load firebase config
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {
  console.error("[SUPPORT_QR_UPLOAD] Failed to load firebase config:", err);
}

// Lightweight Firebase ID Token verification using standard Google REST API
async function verifyFirebaseIdToken(token: string): Promise<{ uid: string }> {
  const apiKey = firebaseConfig?.apiKey;
  if (!apiKey) {
    throw new Error("API Key do Firebase ausente para verificação de token.");
  }
  
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || "Token inválido ou expirado";
    throw new Error(errMsg);
  }
  
  const data = await response.json();
  const user = data.users?.[0];
  if (!user || !user.localId) {
    throw new Error("Usuário não encontrado ou token inválido");
  }
  
  return { uid: user.localId };
}

// Helper function to check if a user is an active admin
async function checkIsAdminSecure(uid: string, token: string): Promise<boolean> {
  if (!uid || !token) return false;

  if (firebaseConfig) {
    try {
      const projectId = firebaseConfig.projectId;
      const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/admins/${uid}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const docData = await response.json();
        const activeField = docData.fields?.active;
        if (activeField && (activeField.booleanValue === true || activeField.stringValue === "true")) {
          return true;
        }
      }
    } catch (err: any) {
      console.error("[SUPPORT_QR_UPLOAD] Admin check error:", err);
    }
  }

  return false;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "METHOD_NOT_ALLOWED",
      message: "Método não permitido. Utilize POST."
    });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token de autenticação ausente ou inválido."
      });
    }

    const token = authHeader.split("Bearer ")[1]?.trim();
    if (!token) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token inválido."
      });
    }

    const decoded = await verifyFirebaseIdToken(token);
    const isAdmin = await checkIsAdminSecure(decoded.uid, token);
    if (!isAdmin) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Acesso negado. Apenas administradores ativos podem enviar QR Code."
      });
    }

    const { dataUrl, fileName, contentType } = req.body || {};
    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({
        error: "INVALID_DATA",
        message: "O parâmetro 'dataUrl' é obrigatório."
      });
    }

    let mime = contentType || "image/png";
    let ext = "png";
    if (dataUrl.startsWith("data:")) {
      const matches = dataUrl.match(/^data:([^;]+);base64,/);
      if (matches && matches[1]) {
        mime = matches[1];
        if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
        else if (mime.includes("webp")) ext = "webp";
        else if (mime.includes("png")) ext = "png";
      }
    }

    const base64Content = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
    const buffer = Buffer.from(base64Content, "base64");

    const timestamp = Date.now();
    const storageKey = `support/support-qr-${timestamp}.${ext}`;
    const localFileName = `support-qr-${timestamp}.${ext}`;

    const accountId = process.env.R2_ADS_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ADS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_ADS_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_ADS_BUCKET_NAME;

    let r2Uploaded = false;
    let finalUrl = "";

    if (accountId && accessKeyId && secretAccessKey && bucketName) {
      try {
        const s3 = new S3Client({
          region: "auto",
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey
          }
        });

        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: storageKey,
          Body: buffer,
          ContentType: mime
        });

        await s3.send(command);
        r2Uploaded = true;
        finalUrl = `/api/ads-public-image?path=${storageKey}`;
      } catch (r2Err: any) {
        console.warn("[SUPPORT_QR_UPLOAD] R2 upload error:", r2Err.message);
      }
    }

    if (!r2Uploaded) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, localFileName), buffer);
      finalUrl = `/uploads/${localFileName}`;
    }

    return res.json({
      success: true,
      url: finalUrl,
      storagePath: r2Uploaded ? storageKey : `uploads/${localFileName}`,
      contentType: mime
    });
  } catch (err: any) {
    console.error("[SUPPORT_QR_UPLOAD] Handler error:", err);
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: err.message || String(err)
    });
  }
}
