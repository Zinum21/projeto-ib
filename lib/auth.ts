import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { store } from "./db";
export const cookieName = "career_session";
export function passwordHash(
  password: string,
  salt = randomBytes(16).toString("hex"),
) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function checkPassword(password: string, hash: string) {
  const [salt, digest] = hash.split(":");
  const test = Buffer.from(passwordHash(password, salt).split(":")[1], "hex"),
    expected = Buffer.from(digest, "hex");
  return test.length === expected.length && timingSafeEqual(test, expected);
}
function secret() {
  const db = store();
  let key = db.meta("session_secret");
  if (!key) {
    key = randomBytes(32).toString("hex");
    db.setMeta("session_secret", key);
  }
  return key;
}
export function issueSession() {
  const value = `${Date.now() + 7 * 86400000}.${randomBytes(12).toString("hex")}`;
  return `${value}.${createHmac("sha256", secret()).update(value).digest("hex")}`;
}
export function validSession(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || Number(parts[0]) < Date.now()) return false;
  const expected = createHmac("sha256", secret())
    .update(parts.slice(0, 2).join("."))
    .digest("hex");
  const a = Buffer.from(expected),
    b = Buffer.from(parts[2]);
  return a.length === b.length && timingSafeEqual(a, b);
}
