import * as z from "zod";

// 共通のバリデーションスキーマ部品
const emailSchema = z
  .string()
  .min(1, "メールアドレスを入力してください")
  .email("有効なメールアドレスを入力してください");

const basePasswordSchema = z
  .string()
  .min(1, "パスワードを入力してください")
  .min(8, "パスワードは8文字以上である必要があります");

// ログインフォーム用のZodスキーマ定義
export const loginSchema = z.object({
  email: emailSchema,
  password: basePasswordSchema,
});

// 新規登録フォーム用のZodスキーマ定義（パスワード確認なし）
export const signupSchema = z.object({
  email: emailSchema,
  password: basePasswordSchema.regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "パスワードは少なくとも1つの小文字、大文字、数字を含む必要があります"
  ),
});

// 型定義のエクスポート
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
