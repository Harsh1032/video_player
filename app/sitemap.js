import Video from '@components/Video';
import VideoModel from '@models/video';
import { connectToDB } from '@utils/database';
import { notFound } from 'next/navigation';

export default async function sitemap(){

   
    await connectToDB();
    const videos = await VideoModel.find({}).lean();

    const data = videos.map((video) => ({
        url: `${process.env.BASE_URL}/video/${video.id}`,
        lastModified: new Date()
    }));

    return [
      {
        url: `${process.env.BASE_URL}`,
        lastModified: new Date()
      },
      {
        url: `${process.env.BASE_URL}/login`,
        lastModified: new Date()
      },
      {
        url: `${process.env.BASE_URL}/form`,
        lastModified: new Date()
      },
      ...data 
    ]
  }