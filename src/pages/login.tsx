import React from "react";
import firebase from "../lib/firebaseClient";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Link from "next/link";

type FormData = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
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
        .signInWithEmailAndPassword(data.email, data.password);
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
        >
          <div className="flex flex-col grow">
            <label className="flex w-24 text-sm text-gray-800 sm:text-base">
              Email:
            </label>
            <input
              type="email"
              className="w-full rounded border bg-gray-50 px-3 py-2 text-gray-800 outline-none ring-indigo-300 transition duration-100 focus:ring"
              {...register("email", { required: true })}
            />
            {/* <input
              className="text-black p-2"
              type="email"
              {...register("email", { required: true })}
            /> */}
            {errors.email && <span>This field is required</span>}
          </div>
          <div className="flex flex-col grow">
            {/* <label className="text-[12px] flex w-24">Password:</label> */}
            <label className="flex w-24 text-sm text-gray-800 sm:text-base">
              Password:
            </label>
            <input
              className="w-full rounded border bg-gray-50 px-3 py-2 text-gray-800 outline-none ring-indigo-300 transition duration-100 focus:ring"
              type="text"
              {...register("password", { required: true })}
            />
            {errors.password && <span>This field is required</span>}
          </div>
          {/* <div className="flex gap-3 text-xs leading-none"> */}
          <button
            className="py-3 px-8 text-white text-sm leading-tight font-semibold  rounded-lg bg-gray-800 transition duration-100 hover:bg-gray-700 focus-visible:ring active:bg-gray-600 md:text-base"
            type="submit"
          >
            ログイン
          </button>
          {/* </div> */}
        </form>
        <div className="flex items-center justify-center bg-gray-100 p-4 rounded-b-md">
          <p className="text-center text-sm text-gray-500">
            登録がまだですか？{" "}
            <Link
              href="/signup"
              className="py-1 px-1 text-xs text-indigo-500 transition duration-100 hover:text-indigo-600 active:text-indigo-700 border-b border-orange-300"
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
