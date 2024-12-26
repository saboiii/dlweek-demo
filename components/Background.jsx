import React, { useState, useEffect } from "react";

const Background = ({ videoUrl }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const videoElement = document.getElementById("background-video");

    const handleCanPlayThrough = () => {
      setIsLoaded(true);
    };

    if (videoElement) {
      videoElement.addEventListener("canplaythrough", handleCanPlayThrough);
    } else{
      console.log("naur")
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("canplaythrough", handleCanPlayThrough);
      } else{
        console.log("naur")
      }
    };
  }, []);

  return (
    <>
      {!isLoaded && (
        <div className="fixed inset-0 bg-black z-[-1]" />
      )}
      <video
        id="background-video"
        className={`fixed inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-100 z-[-2]" : "opacity-0 z-[-3]"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[-1] pointer-events-none" />
    </>
  );
};

export default Background;
