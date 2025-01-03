import axios from "axios";
import AuthForm from "@/components/AuthForm";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { parseCookies } from 'nookies';
import Head from "next/head";
import CaptchaPolicy from "@/components/CaptchaPolicy";

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = parseCookies(context);
  const token = cookies.token;

  if (token) {
    return {
      redirect: {
        destination: "/game",
        permanent: false,
      },
    };
  }

  if (!cookies.unlockRegister) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [disabledKey, setDisabledKey] = useState(false);

  useEffect(() => {
    const token = document.cookie
      .split(";")
      .find((cookie) => cookie.trim().startsWith("token="));

    if (token) {
      console.log("Token found:", token);
      router.push("/game");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    try {
      setDisabledKey(true)
      setLoading(true);
      setLoadingText("Creating secure token...");

      const captchaToken = await window.grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, {
        action: "login",
      });


      if (!captchaToken) {
        setErrorMessage("CAPTCHA failed.");
        return;
      }

      const response = await axios.post("/api/auth/login",
        { username, password, captchaToken },
        {
          withCredentials: true,
          validateStatus: (status) => {
            return true;
          }
        }
      );

      setLoadingText("Validating credentials...");
      setErrorMessage("");

      if (response.status === 200) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/game");
      } else {
        setErrorMessage(response.data.message || "Something went wrong during login. Contact the website admin.");
        setDisabledKey(false)
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again later or contact the website admin.");
      setDisabledKey(false)
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
        <title>Login | DLW</title>
        <meta name="description" content="DLW Secret Login Page" />
      </Head>
      <div className='flex flex-col items-center h-screen w-screen'>
        <form id="auth-form" onSubmit={handleSubmit} className="flex h-full w-full items-center justify-center z-30 px-8 md:px-0">
          <AuthForm
            setUsername={setUsername}
            setPassword={setPassword}
            errorMessage={errorMessage}
            loading={loading}
            loadingText={loadingText}
            disabledKey={disabledKey}
          />
        </form>
        <CaptchaPolicy/>
      </div>
    </>
  );
}
