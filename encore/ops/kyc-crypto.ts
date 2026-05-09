import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { secret } from "encore.dev/config";

const kycEncryptionSecret = secret<"KYC_DATA_ENCRYPTION_KEY">("KYC_DATA_ENCRYPTION_KEY");
const allowInsecureLocalKey = process.env.IDEAL_STAY_ALLOW_INSECURE_AUTH === "true";
const ENCRYPTED_PREFIX = "enc:";

function getEncryptionKey() {
  const configuredSecret = kycEncryptionSecret();
  if (configuredSecret) {
    return createHash("sha256").update(configuredSecret).digest();
  }
  if (allowInsecureLocalKey) {
    return createHash("sha256").update("ideal-stay-local-dev-kyc-key").digest();
  }
  throw new Error(
    "Missing KYC_DATA_ENCRYPTION_KEY. Set KYC_DATA_ENCRYPTION_KEY or explicitly opt in to insecure local auth for development.",
  );
}

export function encryptSensitiveString(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString("base64url")}.${authTag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSensitiveString(value: string) {
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  }

  const payload = value.slice(ENCRYPTED_PREFIX.length);
  const [iv, authTag, ciphertext] = payload.split(".");
  if (!iv || !authTag || !ciphertext) {
    throw new Error("Encrypted KYC value is malformed.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSensitiveString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const visibleCount = Math.min(4, trimmed.length);
  const maskedCount = Math.max(trimmed.length - visibleCount, 0);
  return `${"*".repeat(maskedCount)}${trimmed.slice(-visibleCount)}`;
}
