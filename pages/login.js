import { signIn, useSession } from "next-auth/react";
import AuthForm from "@/components/AuthForm";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import Head from "next/head";
import CaptchaPolicy from "@/components/CaptchaPolicy";
import { getSession } from "next-auth/react";

export async function getServerSideProps(context) {
  const cookies = parseCookies(context);
  const session = await getSession({ req: context.req });
  
  if (!cookies.unlockRegister) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  if (session) {
    return {
      redirect: {
        destination: "/game",
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    try {
      setDisabledKey(true);
      setLoading(true);
      setLoadingText("Validating credentials...");

      const captchaToken = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
        { action: "login" }
      );

      if (!captchaToken) {
        setErrorMessage("CAPTCHA failed.");
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
        captchaToken,
        isNewUser: false,
      });

      if (result.error) {
        setErrorMessage(result.error || "Invalid credentials.");
        setDisabledKey(false);
      } else {
        router.push("/game");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again later.");
      setDisabledKey(false);
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
      <div className="flex flex-col items-center h-screen w-screen">
        <form
          id="auth-form"
          onSubmit={handleSubmit}
          className="flex h-full w-full items-center justify-center z-30 px-8 md:px-0"
        >
          <AuthForm
            setUsername={setUsername}
            setPassword={setPassword}
            errorMessage={errorMessage}
            loading={loading}
            loadingText={loadingText}
            disabledKey={disabledKey}
          />
        </form>
        <CaptchaPolicy />
      </div>
    </>
  );
}
