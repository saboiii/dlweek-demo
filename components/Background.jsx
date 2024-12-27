import React, { Suspense } from "react";

const VideoComponent = React.lazy(() => Promise.resolve({
  default: ({ videoUrl, onLoad }) => (
    <video
      id="background-video"
      className="fixed inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-100 z-[-2]"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onCanPlayThrough={onLoad}
    >
      <source src={videoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}));

const Background = ({ videoUrl }) => {
  const fallback = (
    <div className="fixed inset-0 bg-black z-[-1] flex items-center justify-center">
      <span className="text-white text-xl">Loading...</span>
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <VideoComponent videoUrl={videoUrl} onLoad={() => console.log("Video loaded")} />
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[-1] pointer-events-none" />
    </Suspense>
  );
};

export default Background;
