import Background from "@/components/Background";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { setCookie } from "nookies";
import axios from "axios";
import Link from "next/link";
import { CiLogout } from "react-icons/ci";
import { GoArrowRight } from "react-icons/go";
import Head from "next/head";
import { useSession, getSession, signOut } from "next-auth/react";

export default function Home() {
  const videoUrl = "https://dlw-bucket.s3.ap-southeast-1.amazonaws.com/mainvideofin.mp4"
  const router = useRouter();
  const { data: session, status } = useSession();
  const [leaderboard, setLeaderboard] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      setIsLoggedIn(session ? true : false);
    };
    checkSession();
  }, [status]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const handlePlusClick = async (index) => {
    const newClicks = [...clicks, index];
    setClicks(newClicks);

    if (newClicks.length > 4) {
      setClicks([]);
      return;
    }

    if (newClicks.length === 4) {
      try {
        const response = await axios.post("/api/puzzle", { clicks: newClicks });
        if (response.data.isValid) {
          console.log("Correct sequence, unlocking register/login page.");
          setCookie(null, "unlockRegister", "true", {
            path: "/",
            maxAge: 60 * 60 * 24,
            httpOnly: false,
          });
          router.push("/register");
        } else {
          setClicks([]);
        }
      } catch (error) {
        setClicks([]);
      }
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!isLoggedIn || !session) return;
      try {
        const response = await axios.get("/api/leaderboard", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        setLeaderboard(response.data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  if (status === "loading") {
    return <div className="flex flex-col w-screen h-screen cryptic text"/>;
  }
  

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Coming Soon | DLW</title>
        <meta name="description" content="Deep Learning Week - MLDA @ NTU EEE" />
        <meta property="og:site_name" content="dlweek.com" />
        <meta property="og:title" content="Coming Soon | DLW" />
        <meta property="og:description" content="Deep Learning Week - MLDA @ NTU EEE" />
        <meta property="og:image" content="https://dlweek.com/og-image.png" />
        <meta property="og:url" content="https://dlweek.com" />
        <meta property="og:type" content="website" />
        
      </Head>

      <div className="flex flex-col p-8 w-screen h-screen">
        <div className="flex justify-between text-lg">
          <button onClick={() => handlePlusClick(0)} disabled={isLoggedIn}>+</button>
          <button onClick={() => handlePlusClick(1)} disabled={isLoggedIn}>+</button>
        </div>
        {isLoggedIn ? (
          <div className="flex justify-center w-full h-full items-center flex-col">
            <Background videoUrl={videoUrl} />
            <div className="flex md:hidden flex-col cryptic-text2 px-24 text-center">
              Leaderboard only available on a bigger viewport.
              <button onClick={handleLogout} className="cryptic-text2 no-underline mt-12"><CiLogout className="inline mr-1" /> Logout</button>
            </div>
            <div className="hidden md:flex flex-col w-full h-full py-20 px-32">
              <h1>LEADERBOARD</h1>
              <div className="grid grid-cols-1 overflow-scroll gap-2 grid-rows-10 w-full h-full border rounded-md px-4 mb-4">
                {leaderboard.map((user, index) => (
                  <div key={index} className="flex justify-between border-b items-center px-4">
                    <div>{user.username}</div>
                    <div>{user.highScore}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between gap-2">
                <button onClick={handleLogout} className="cryptic-text2 no-underline mr-4"><CiLogout className="inline mr-1" /> Logout</button>
                <Link href="/game" className="cryptic-text2 no-underline">Back to Game<GoArrowRight className="inline ml-1" /></Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center h-full items-center flex-col">
            <Background videoUrl={videoUrl} />
            <div className="subtitle mb-2">
              DEEP LEARNING WEEK
            </div>
            <h1 className="mb-2">
              COMING SOON.
            </h1>
            <div className="subtitle">
              Hosted by MLDA
            </div>
          </div>
        )}
        <div className="flex justify-between">
          <button onClick={() => handlePlusClick(2)} disabled={isLoggedIn}>+</button>
          <button onClick={() => handlePlusClick(3)} disabled={isLoggedIn}>+</button>
        </div>
      </div>
    </>


  );
}
