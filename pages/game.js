import { useSession, signOut, getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import Head from "next/head";
import { CiLogout } from "react-icons/ci";

const GameComponent = dynamic(() =>
  import('@/game/GameComponent'), {
  ssr: false
}
);

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default function Game() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pause, setPause] = useState(false);

  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        setPause(true);
      } else if (event.key === " ") {
        setPause((prevPause) => !prevPause);
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  if (status === "loading") {
    return <div className="flex w-screen h-screen items-center justify-center cryptic-text2"> Loading...</div>;
  }

  const handlePause = () => {
    setPause(prevPause => !prevPause);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
    router.push("/");
  };

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Minigame | DLW</title>
        <meta name="description" content="DLW Minigame - Unlocked" />
      </Head>

      <div className="flex w-screen h-screen items-center justify-center">
        <div className="hidden md:flex w-full flex-row sm:flex-col transform items-center justify-center gap-8">
          <div className="flex cryptic-text">
            Welcome, <span className="cryptic-text2 inline-block">&nbsp;{session?.user.username}</span>. There's an AI embedded in the game that will try its best to kill you.
          </div>
          <GameComponent className="flex" pause={pause}/>
          {pause && (
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#ffffff]/5 flex flex-col justify-center items-center backdrop-blur-sm transform -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-white uppercase">Paused</h1>
              <button className="button-style2" onClick={handlePause}>
                Continue
              </button>
            </div>
          )}
          <div className="hidden md:flex">
            <button onClick={handleLogout} className="cryptic-text underline mr-4">
              Logout
            </button>
            <Link href="/" className="cryptic-text underline">
              Leaderboard
            </Link>
          </div>
        </div>
        <div className="flex md:hidden cryptic-text flex-col items-center px-24 text-center">
          <div>Hello, <span className="cryptic-text2 inline-block">{session?.user.username}</span>.</div>
          <div>
            This page is best viewed on a larger screen. Try using a laptop or a tablet!
          </div>
          <button onClick={handleLogout} className="cryptic-text2 no-underline mt-12"><CiLogout className="inline mr-1" /> Logout</button>
        </div>


      </div>
    </>
  );
}
