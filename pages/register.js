import axios from "axios";
import AuthForm from "@/components/AuthForm";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import Link from "next/link";
import { GoArrowRight } from "react-icons/go";
import Head from "next/head";
import CaptchaPolicy from "@/components/CaptchaPolicy";

export async function getServerSideProps(context) {
  const cookies = parseCookies(context);

  if (!cookies.unlockRegister) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}


export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [disabledKey, setDisabledKey] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMessage("Missing username or password");
      return;
    }

    try {
      setDisabledKey(true)
      setLoading(true);
      setLoadingText("Validating registration...");

      const captchaToken = await window.grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, {
        action: "register",
      });

      if (!captchaToken) {
        setErrorMessage("CAPTCHA token lost.");
        return;
      }

      const response = await axios.post("/api/auth/register", { username, password, captchaToken });

      setLoadingText("Creating new account...");

      if (response.status === 200 || response.status === 201) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/login");
      } else {
        setErrorMessage(response.data.message || "Something went wrong during registration. Please try again.");
      }
    } catch (error) {
      setLoadingText("");

      if (axios.isAxiosError(error)) {
        console.error("Registration error:", error.response?.data || error.message);
        setErrorMessage(error.response?.data?.message || "An unexpected error occurred. Please try again later.");
      } else {
        console.error("Unexpected error:", error);
        setErrorMessage("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Register | DLW</title>
        <meta name="description" content="DLW Secret Register Page" />
      </Head>
      <div className='flex flex-col items-center h-screen w-screen'>
        <form onSubmit={handleSubmit} className="flex h-full w-full items-center justify-center z-30 flex-col px-8 md:px-0">
          <AuthForm
            setUsername={setUsername}
            setPassword={setPassword}
            errorMessage={errorMessage}
            loading={loading}
            loadingText={loadingText}
            disabledKey={disabledKey}
          />
          <Link href="/login" className="cryptic-text no-underline z-10 mt-4">Login<GoArrowRight className="inline ml-1" /></Link>
        </form>
        <CaptchaPolicy/>
      </div>
    </>
  );
}
