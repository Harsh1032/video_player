import Video from "@models/video";
import CsvFile from "@models/csvFile";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import AWS from 'aws-sdk';
import fs from 'fs';
import Papa from 'papaparse';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

export const POST = async (request) => {
  try {
    const { videos, originalFileName } = await request.json();

    if (!videos || !Array.isArray(videos)) {
      return NextResponse.json({ error: "Invalid request format. Expected an array of videos." }, { status: 400 });
    }

    await connectToDB();

    const savedVideos = await Promise.all(videos.map(async (video) => {
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

      const canvas = createCanvas(500, 281);
      const ctx = canvas.getContext('2d');

      const baseImage = await loadImage(image);
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      const overlayImage = await loadImage('https://www.quasr.fr/wp-content/uploads/2024/07/overlay.png');
      ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);

      const webcamSize = 100;
      const margin = 10;
      const webcamX = margin;
      const webcamY = canvas.height - webcamSize - margin;
      ctx.save();
      ctx.beginPath();
      ctx.arc(webcamX + webcamSize / 2, webcamY + webcamSize / 2, webcamSize / 2, 0, Math.PI * 2);
      ctx.clip();

      const webcamImage = await loadImage(image);
      ctx.drawImage(webcamImage, webcamX, webcamY, webcamSize, webcamSize);
      ctx.restore();

      const buffer = canvas.toBuffer('image/png');

      const tmpDir = '/tmp';
      if (!fs.existsSync(tmpDir)) {
        console.log('Creating /tmp directory');
        fs.mkdirSync(tmpDir);
      }

      const tempFilePath = path.join(tmpDir, `${newVideo.id}.png`);
      console.log(`Writing buffer to ${tempFilePath}`);
      fs.writeFileSync(tempFilePath, buffer);

      const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${newVideo.id}.png`,
        Body: fs.createReadStream(tempFilePath),
        ContentType: 'image/png'
      };

      const uploadResult = await s3.upload(s3Params).promise();
      const publicUrl = uploadResult.Location;

      newVideo.staticImageUrl = publicUrl;
      await newVideo.save();
      fs.unlinkSync(tempFilePath);

      return {
        ...video,
        link: `${process.env.BASE_URL}/video/${newVideo.id}`,
        staticImageUrl: publicUrl,
      };
    }));

    const csvData = Papa.unparse(savedVideos);
    const fileName = originalFileName || `generated_videos_${Date.now()}.csv`;
    const csvFilePath = path.join('/tmp', fileName);
    fs.writeFileSync(csvFilePath, csvData, 'utf8');

    const newCsvFile = new CsvFile({
      fileName,
      numberOfPages: savedVideos.length,
      downloadLink: `/downloads/${fileName}`,
      videoIds: savedVideos.map(video => video._id),
    });

    await newCsvFile.save();

    return NextResponse.json({ csvLink: `/downloads/${fileName}`, videoLinks: savedVideos.map(v => v.link) }, { status: 201 });
  } catch (error) {
    console.error("Error generating bulk videos:", error);
    return NextResponse.json({ error: "Failed to generate bulk videos" }, { status: 500 });
  }
};
