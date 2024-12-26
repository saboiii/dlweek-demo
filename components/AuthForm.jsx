import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

const AuthForm = ({ setUsername, setPassword, errorMessage, loading, loadingText }) => {
  const router = useRouter();
  const isRegisterPage = router.pathname === "/register";
  const formLocked = isRegisterPage ? "Locked" : "Accessible";
  const formText = isRegisterPage ? "Register" : "Sign in";
  const formSubText = isRegisterPage ? "Welcome, user. Please register." : "Log in with your credentials.";
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="form-style">
      <div className='flex flex-col w-full gap-1 mb-4 items-center'>
        <div className='flex text-[16px] md:text-[20px] tracking-[5px] md:tracking-[10px] font-montserrat uppercase font-medium'>{formLocked}</div>
        <div className='flex text-xs md:text-sm font-montserrat text-center font-light'>{formSubText}</div>
      </div>
      <input
        type="text"
        placeholder="Username"
        id="username"
        autoComplete="username"
        onChange={(e) => setUsername(e.target.value)}
        className="w-full"
        disabled={loading}
      />
      <div className="relative w-full">
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          autoComplete="new-password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
          disabled={loading}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-2 flex items-center text-white"
          disabled={loading}
        >
          {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
        </button>
      </div>
      <div className='text-xs text-red-400/80 text-center uppercase'>{errorMessage}</div>
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="flex animate-spin rounded-full h-3 w-3 md:h-5 md:w-5 border-t-2 border-b-2 border-gray-500"></div>
          <div className='inline text-xs md:text-sm'>{loadingText}</div>
        </div>
      ) : (
        <button
          type="submit"
          className='button-style1 w-full'
          disabled={loading}
        >
          {formText}
        </button>
      )}
    </div>
  );
}

export default AuthForm;
