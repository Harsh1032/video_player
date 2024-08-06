"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';

const Login = () => {
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmission = (e) => {
    e.preventDefault();
    if (password === "Harsh123!") {
      login();
      router.push('/form');
      setPassword('');
    } else {
      setPassword('');
      toast.error('Wrong password!');
    }
  };

  return (
    <form
      className='w-full h-full flex flex-col justify-center items-center'
      onSubmit={handleSubmission}
    >
      <input
        type='password'
        placeholder='Password'
        className='w-[200px] text-center h-[40px] rounded-lg p-2 bg-white'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        className='w-[100px] h-[40px] text-center rounded-lg p-2 mt-5 bg-indigo-600 hover:bg-indigo-500 text-white'
      >
        Login
      </button>
      <ToastContainer />
    </form>
  );
};

export default Login;
