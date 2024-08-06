"use client";

import React from "react";
import VideoData from "@components/VideoData";

const Video = ({ videoData }) => {
  if (!videoData) {
    return <div>Video not found</div>;
  }

  return (
    <div className="w-full h-full">
      <VideoData
        name={videoData.name}
        websiteUrl={videoData.websiteUrl}
        videoUrl={videoData.videoUrl}
        timeFullScreen={videoData.timeFullScreen}
        videoDuration={videoData.videoDuration}
        image={videoData.image}
      />
    </div>
  );
};

export default Video;
