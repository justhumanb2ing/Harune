import { hashPassword, verifyPassword } from "better-auth/crypto";

export const passwordHashing = {
  hash: hashPassword,
  verify: verifyPassword,
};
