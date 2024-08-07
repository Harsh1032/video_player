import Video from '@components/Video';
import VideoModel from '@models/video';
import { connectToDB } from '@utils/database';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const videoData = await getVideoData(params.id);

  if (!videoData) {
    return {
      title: 'Video not found',
      description: 'The requested video could not be found.',
      openGraph: {
        title: 'Video not found',
        description: 'The requested video could not be found.',
        url: `${process.env.BASE_URL}/video/${params.id}`,
      },
      twitter: {
        title: 'Video not found',
        description: 'The requested video could not be found.',
      },
    };
  }

  const overlayUrl = `${process.env.BASE_URL}/api/generate-image-overlay?imageUrl=${encodeURIComponent(videoData.websiteUrl)}&webcamImageUrl=${encodeURIComponent(videoData.image)}`;
   const baseUrl = `${process.env.BASE_URL}/video/${params.id}`;

  return {
    title: `Video for ${videoData.name}`,
    description: `Watch the video for ${videoData.name}`,
    openGraph: {
      title: `Video for ${videoData.name}`,
      description: `Watch the video for ${videoData.name}`,
      images: [
        {
          url: overlayUrl,
          width: 1200,
          height: 630,
          alt: "Default Image",
        },
      ],
      url: baseUrl,
    },
    twitter: {
      title: `Video for ${videoData.name}`,
      description: `Watch the video for ${videoData.name}`,
      images: [
        {
          url: overlayUrl,
          width: 1200,
          height: 630,
          alt: "Default Image",
        },
      ],
      url: baseUrl,
    },
  };
}

async function getVideoData(id) {
  try {
    await connectToDB();
    const video = await VideoModel.findOne({ id });

    if (video) {
      return JSON.parse(JSON.stringify(video));
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching video:", error);
    return null;
  }
}

const VideoPage = async ({ params }) => {
  const videoData = await getVideoData(params.id);

  if (!videoData) {
    notFound();
  }

  return (
    <div className="w-full h-full">
      <Video videoData={videoData} />
    </div>
  );
};

export default VideoPage;
