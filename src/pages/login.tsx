import React from "react";
import firebase from "../lib/firebaseClient";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";

type FormData = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setAuthError(null);
    clearErrors();
    try {
      await firebase
        .auth()
        .signInWithEmailAndPassword(data.email, data.password);
      router.push("/");
    } catch (error: any) {
      console.error(error);
      switch (error?.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("password", {
            type: "server",
            message:
              "メールアドレスまたはパスワードが正しくありません",
          });
          break;
        case "auth/invalid-email":
          setError("email", {
            type: "server",
            message: "メールアドレスの形式が正しくありません",
          });
          break;
        case "auth/too-many-requests":
          setAuthError(
            "試行回数が上限に達しました。しばらく待ってから再度お試しください。"
          );
          break;
        case "auth/user-disabled":
          setAuthError(
            "このアカウントは無効化されています。管理者にお問い合わせください。"
          );
          break;
        default:
          setAuthError("ログインに失敗しました。時間をおいて再度お試しください。");
      }
    }
  };

  return (
    <div className="flex h-screen bg-zinc-300 py-6 sm:py-8 lg:py-12 justify-center items-center">
      <div className="flex flex-col bg-white rounded-md border shadow-xl">
        <form
          className="flex w-96 flex-col gap-6 rounded-t-md px-16 py-10"
          onSubmit={handleSubmit(onSubmit)}
          aria-labelledby="login-heading"
        >
          <h1
            id="login-heading"
            className="text-2xl font-bold text-center mb-2"
          >
            ログイン
          </h1>
          {authError && (
            <div
              className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
              aria-live="assertive"
            >
              {authError}
            </div>
          )}
          <div className="flex flex-col grow">
            <label
              htmlFor="email-field"
              className="flex w-24 text-sm text-gray-800 sm:text-base mb-1"
            >
              Email:
            </label>
            <input
              id="email-field"
              type="email"
              className="w-full rounded border bg-gray-50 px-3 py-2 text-gray-800 outline-none ring-gray-400 transition duration-100 focus:ring-2 focus:ring-offset-2"
              {...register("email", {
                required: "メールアドレスを入力してください",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "メールアドレスの形式が正しくありません",
                },
              })}
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
              className="flex w-24 text-sm text-gray-800 sm:text-base mb-1"
            >
              Password:
            </label>
            <input
              id="password-field"
              className="w-full rounded border bg-gray-50 px-3 py-2 text-gray-800 outline-none ring-gray-400 transition duration-100 focus:ring-2 focus:ring-offset-2"
              type="password"
              {...register("password", {
                required: "パスワードを入力してください",
                minLength: {
                  value: 6,
                  message: "パスワードは6文字以上で入力してください",
                },
              })}
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
            className="py-3 px-8 text-white text-sm leading-tight font-semibold rounded-lg bg-gray-800 transition duration-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 active:bg-gray-600 md:text-base"
            type="submit"
          >
            ログイン
          </button>
        </form>
        <div className="flex items-center justify-center bg-gray-100 p-4 rounded-b-md">
          <p className="text-center text-sm text-gray-500">
            登録がまだですか？{" "}
            <Link
              href="/signup"
              className="py-1 px-1 text-xs text-gray-600 transition duration-100 hover:text-gray-800 active:text-gray-900 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 rounded"
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
