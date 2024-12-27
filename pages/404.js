import Link from 'next/link'
import React from 'react'
import { GoArrowLeft } from "react-icons/go";
import Background from "@/components/Background";
import Head from 'next/head';

const NotFound = () => {
    const videoUrl = "https://dlw-bucket.s3.ap-southeast-1.amazonaws.com/mainvideofin.mp4"
    return (
        <>
            <Head>
                <meta charSet='utf-8'/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>404 Not Found | DLW</title>
                <meta name="description" content="404 Page - Not Found"/>
            </Head>
            <div className="flex w-screen h-screen items-center justify-center flex-col">
                <Background videoUrl={videoUrl} />
                <div className="flex flex-col items-center justify-center px-24 text-center">
                    <h1 className="mb-2">Oops.</h1>
                    <div className="flex cryptic-text2 mb-4">404 - Page Not Found</div>
                    <Link className="flex cryptic-text items-center justify-center" href="/"><GoArrowLeft className="inline mr-2" />Home</Link>
                </div>
            </div>
        </>
    )
}

export default NotFound