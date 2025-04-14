import React from 'react';
import firebase from '../lib/firebaseClient';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';

type FormData = {
  email: string;
  password: string;
};

const SignupPage: React.FC = () => {
	const { register, handleSubmit, formState: { errors }, } = useForm<FormData>();
  const router = useRouter();

	  const onSubmit = async (data: FormData) => {
			try {
				await firebase.auth().createUserWithEmailAndPassword(data.email, data.password);
				// router.push('/supplements'); // サプリ一覧画面へ遷移
				router.push('/'); // サプリ一覧画面ないのでTOPへ遷移
			} catch (error) {
				console.error(error);
			}
		};

  return (
    <div className='flex h-screen bg-black justify-center items-center'>
      <form className='flex w-96 flex-col gap-6 rounded-sm bg-gray-500 px-16 py-10' onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>メールアドレス:</label>
          <input  className='text-black' type="email"{...register("email",{ required: true })} />
          {errors.email && <span>このフィールドは必須です</span>}
        </div>
        <div>
          <label>パスワード:</label>
          <input className='text-black' type="text" {...register("password",{ required: true })} />
          {errors.password && <span>このフィールドは必須です</span>}
        </div>
        <button type="submit" className="py-1 px-2 rounded-sm bg-orange-300">アカウントを作成</button>
      </form>
    </div>
  );
};

export default SignupPage;
