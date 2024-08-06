import Video from "@models/video";
import CsvFile from "@models/csvFile";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import Papa from 'papaparse';

const __dirname = path.resolve();
const downloadsPath = path.join(__dirname, "public", "downloads");

if (!fs.existsSync(downloadsPath)) {
  fs.mkdirSync(downloadsPath, { recursive: true });
}

export const POST = async (request) => {
  try {
    const { videos, originalFileName } = await request.json();

    if (!videos || !Array.isArray(videos)) {
      return NextResponse.json({ error: "Invalid request format. Expected an array of videos." }, { status: 400 });
    }

    await connectToDB();

    const savedVideos = await Promise.all(
      videos.map(async (video) => {
        const { name, websiteUrl, videoUrl, timeFullScreen, videoDuration, image } = video;
        const newVideo = new Video({
          name,
          websiteUrl,
          videoUrl,
          timeFullScreen,
          videoDuration,
          image,
        });
        await newVideo.save();
        return newVideo;
      })
    );

    const generatedLinks = savedVideos.map((video) => `${process.env.BASE_URL}/video/${video.id}`);

    const csvData = videos.map((video, index) => ({
      ...video,
      link: generatedLinks[index],
    }));

    const csv = Papa.unparse(csvData);
    const fileName = originalFileName || `generated_videos_${Date.now()}.csv`;
    const filePath = path.join(downloadsPath, fileName);

    await promisify(fs.writeFile)(filePath, csv, "utf8");

    const newCsvFile = new CsvFile({
      fileName,
      numberOfPages: videos.length,
      downloadLink: `/downloads/${fileName}`,
      videoIds: savedVideos.map((video) => video.id),
    });
    await newCsvFile.save();

    return NextResponse.json({ links: generatedLinks }, { status: 201 });
  } catch (error) {
    console.error("Error generating bulk videos:", error);
    return NextResponse.json({ error: "Failed to generate bulk videos" }, { status: 500 });
  }
};
