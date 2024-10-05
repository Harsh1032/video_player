import CsvFile from "@models/csvFile";
import Video from "@models/video";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import AWS from 'aws-sdk';
import fs from 'fs';
import Papa from 'papaparse';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const BATCH_SIZE = 50; // Limit batch size based on server capacity

export const POST = async (request) => {
  try {
    const { videos, originalFileName } = await request.json();

    if (!videos || !Array.isArray(videos)) {
      return NextResponse.json({ error: "Invalid request format. Expected an array of videos." }, { status: 400 });
    }

    await connectToDB();

    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    let processedVideos = [];

    // Helper function to process videos in batches
    const processBatch = async (videoBatch) => {
      const batchResults = await Promise.all(videoBatch.map(async (video) => {
        const { name, websiteUrl, videoUrl, timeFullScreen, videoDuration, image } = video;

        // Create and save video
        const newVideo = new Video({
          name,
          websiteUrl,
          videoUrl,
          timeFullScreen,
          videoDuration,
          image,
        });
        await newVideo.save();

        // Generate image with Canvas
        const canvas = createCanvas(500, 281);
        const ctx = canvas.getContext('2d');
        const baseImage = await loadImage(websiteUrl);
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

        // Overlay image
        const overlayImage = await loadImage('https://www.quasr.fr/wp-content/uploads/2024/07/overlay.png');
        ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);

        // Add webcam image
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

        // Upload directly to S3 (streaming)
        const buffer = canvas.toBuffer('image/png');
        const s3Params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `${newVideo.id}.png`,
          Body: buffer,
          ContentType: 'image/png',
        };
        const uploadResult = await s3.upload(s3Params).promise();
        const publicUrl = uploadResult.Location;

        // Save video metadata
        newVideo.staticImageUrl = publicUrl;
        await newVideo.save();

        // Returning processed video with its link
        return {
          ...video,
          id: newVideo.id,
          link: `${process.env.BASE_URL}/video/${newVideo.id}`,
          staticImageUrl: publicUrl,
        };
      }));

      return batchResults;
    };

    // Process videos in batches
    for (let i = 0; i < videos.length; i += BATCH_SIZE) {
      const batch = videos.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatch(batch);
      processedVideos.push(...batchResults);
    }

    // Generate CSV from processed videos
    const csvData = Papa.unparse(processedVideos);

    // Stream CSV directly to S3 (to avoid local storage issues)
    const csvBuffer = Buffer.from(csvData, 'utf-8');
    const s3CsvParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `csv/generated_videos_${Date.now()}.csv`,
      Body: csvBuffer,
      ContentType: 'text/csv',
    };
    const csvUploadResult = await s3.upload(s3CsvParams).promise();
    const csvPublicUrl = csvUploadResult.Location;

    // Save CSV file metadata
    const newCsvFile = new CsvFile({
      fileName: originalFileName || `generated_videos_${Date.now()}.csv`,
      numberOfPages: processedVideos.length,
      downloadLink: csvPublicUrl,
      videoIds: processedVideos.map(video => video.id),
    });
    await newCsvFile.save();

    // Return CSV link and video links
    return NextResponse.json({
      csvLink: csvPublicUrl,
      videoLinks: processedVideos.map(v => v.link),
    }, { status: 201 });

  } catch (error) {
    console.error("Error generating bulk videos:", error);
    return NextResponse.json({ error: "Failed to generate bulk videos" }, { status: 500 });
  }
};
