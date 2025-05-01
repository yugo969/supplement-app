import React from "react";
import firebase from "../lib/firebaseClient";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Link from "next/link";

type FormData = {
  email: string;
  password: string;
};

const SignupPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    try {
      await firebase
        .auth()
        .createUserWithEmailAndPassword(data.email, data.password);
      // router.push('/supplements'); // サプリ一覧画面へ遷移
      router.push("/"); // サプリ一覧画面ないのでTOPへ遷移
    } catch (error) {
      console.error(error);
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
          <div className="flex flex-col grow">
            <label
              htmlFor="email"
              className="flex w-full text-sm text-gray-800 sm:text-base mb-1"
            >
              メールアドレス:
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded border bg-gray-50 px-3 py-2 text-gray-800 outline-none ring-indigo-300 transition duration-100 focus:ring focus:ring-2 focus:ring-offset-2"
              {...register("email", {
                required: "メールアドレスを入力してください",
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
              htmlFor="password"
              className="flex w-full text-sm text-gray-800 sm:text-base mb-1"
            >
              パスワード:
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded border bg-gray-50 px-3 py-2 text-gray-800 outline-none ring-indigo-300 transition duration-100 focus:ring focus:ring-2 focus:ring-offset-2"
              {...register("password", {
                required: "パスワードを入力してください",
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
            type="submit"
            className="py-3 px-8 text-white text-sm leading-tight font-semibold rounded-lg bg-gray-800 transition duration-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:bg-gray-600 md:text-base"
          >
            アカウントを作成
          </button>
        </form>
        <div className="flex items-center justify-center bg-gray-100 p-4 rounded-b-md">
          <p className="text-center text-sm text-gray-500">
            すでにアカウントをお持ちですか？{" "}
            <Link
              href="/login"
              className="py-1 px-1 text-xs text-indigo-500 transition duration-100 hover:text-indigo-600 active:text-indigo-700 border-b border-orange-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 rounded"
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
