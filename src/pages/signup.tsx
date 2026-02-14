import React, { useState } from "react";
import firebase from "../lib/firebaseClient";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormData } from "@/schemas/auth";

const SignupPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const onSubmit = async (data: SignupFormData) => {
    setAuthError(null);
    clearErrors();
    try {
      await firebase
        .auth()
        .createUserWithEmailAndPassword(data.email, data.password);
      router.push("/");
    } catch (error: any) {
      console.error(error);
      switch (error?.code) {
        case "auth/email-already-in-use":
          setError("email", {
            type: "server",
            message: "このメールアドレスは既に使用されています",
          });
          break;
        case "auth/invalid-email":
          setError("email", {
            type: "server",
            message: "メールアドレスの形式が正しくありません",
          });
          break;
        case "auth/weak-password":
          setError("password", {
            type: "server",
            message: "パスワードが弱すぎます。より強いものを設定してください",
          });
          break;
        case "auth/too-many-requests":
          setAuthError(
            "試行回数が上限に達しました。しばらく待ってから再度お試しください。"
          );
          break;
        default:
          setAuthError("アカウント作成中にエラーが発生しました");
      }
    }
  };

  return (
    <div className="flex h-screen bg-zinc-300 py-6 sm:py-8 lg:py-12 justify-center items-center">
      <div className="flex flex-col bg-white rounded-md border shadow-xl">
        <form
          className="flex w-96 flex-col gap-6 rounded-t-md px-16 py-10"
          onSubmit={handleSubmit(onSubmit)}
          aria-labelledby="signup-heading"
        >
          <h1
            id="signup-heading"
            className="text-2xl font-bold text-center mb-2"
          >
            アカウント作成
          </h1>
          {authError && (
            <div
              className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
              aria-live="assertive"
            >
              <span className="block sm:inline">{authError}</span>
            </div>
          )}
          <div className="flex flex-col grow">
            <label
              htmlFor="email-field"
              className="flex w-full text-sm text-gray-800 sm:text-base mb-1"
            >
              メールアドレス:
            </label>
            <input
              id="email-field"
              type="email"
              className="w-full rounded border bg-gray-50 px-3 py-2 text-gray-800 outline-none ring-gray-400 transition duration-100 focus:ring-2 focus:ring-offset-2"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <span id="email-error" className="text-destructive text-sm mt-1">
                {errors.email.message}
              </span>
            )}
          </div>
          <div className="flex flex-col grow">
            <label
              htmlFor="password-field"
              className="flex w-full text-sm text-gray-800 sm:text-base mb-1"
            >
              パスワード:
            </label>
            <input
              id="password-field"
              type="password"
              className="w-full rounded border bg-gray-50 px-3 py-2 text-gray-800 outline-none ring-gray-400 transition duration-100 focus:ring-2 focus:ring-offset-2"
              {...register("password")}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <span
                id="password-error"
                className="text-destructive text-sm mt-1"
              >
                {errors.password.message}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="py-3 px-8 text-white text-sm leading-tight font-semibold rounded-lg bg-gray-800 transition duration-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 active:bg-gray-600 md:text-base"
          >
            アカウントを作成
          </button>
        </form>
        <div className="flex items-center justify-center bg-gray-100 p-4 rounded-b-md">
          <p className="text-center text-sm text-gray-500">
            すでにアカウントをお持ちですか？{" "}
            <Link
              href="/login"
              className="py-1 px-1 text-xs text-gray-600 transition duration-100 hover:text-gray-800 active:text-gray-900 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 rounded"
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
