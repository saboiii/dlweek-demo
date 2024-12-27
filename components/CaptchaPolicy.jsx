import React from 'react'

const CaptchaPolicy = () => {
    return (
        <div className="cryptic-text3 mb-16 mx-12 text-center">
            This site is protected by reCAPTCHA and the Google{" "}
            <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
            >
                Privacy Policy
            </a>{" "}
            and{" "}
            <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
            >
                Terms of Service
            </a>{" "}
            apply.
        </div>
    )
}

export default CaptchaPolicy