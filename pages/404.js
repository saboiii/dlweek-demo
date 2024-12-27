import Link from 'next/link'
import React from 'react'
import { GoArrowLeft } from "react-icons/go";

const NotFound = () => {
    return (
        <div className="flex w-screen h-screen items-center justify-center flex-col">
            <div className="flex flex-col items-center justify-center px-24 text-center">
                <h1 className="mb-2">Oops.</h1>
                <div className="flex cryptic-text2 mb-4">404 - Page Not Found</div>
                <Link className="flex cryptic-text items-center justify-center" href="/"><GoArrowLeft className="inline mr-2" />Home</Link>
            </div>
        </div>
    )
}

export default NotFound