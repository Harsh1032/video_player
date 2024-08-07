import Video from "@models/video";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

export const POST = async (request) => {
    try {
        const { name, websiteUrl, videoUrl, timeFullScreen, videoDuration, image } = await request.json();

        if (!name || !websiteUrl || !videoUrl || !timeFullScreen || !videoDuration || !image) {
            console.error("Validation failed. All fields are required.");
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }

        await connectToDB();

        const newVideo = new Video({
            name,
            websiteUrl,
            videoUrl,
            timeFullScreen,
            videoDuration,
            image,
        });

        await newVideo.save();

        console.log('Before setting staticImageUrl:', newVideo);

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

        // Ensure the /tmp directory exists
        const tmpDir = '/tmp';
        if (!fs.existsSync(tmpDir)){
            console.log('Creating /tmp directory');
            fs.mkdirSync(tmpDir);
        }

        // Create a temporary file to store the buffer
        const tempFilePath = path.join(tmpDir, `${newVideo.id}.png`);
        console.log(`Writing buffer to ${tempFilePath}`);
        fs.writeFileSync(tempFilePath, buffer);

        // Upload to Google Cloud Storage
        console.log(`Uploading ${tempFilePath} to Google Cloud Storage`);
        await bucket.upload(tempFilePath, {
            destination: `${newVideo.id}.png`,
            metadata: {
                contentType: 'image/png',
            },
        });

        // Get the public URL of the uploaded image
        const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${newVideo.id}.png`;
        newVideo.staticImageUrl = publicUrl;

        console.log('Static Image URL:', publicUrl);

        // Save the updated video document with the staticImageUrl
        await newVideo.save();

        // Delete the temporary file
        console.log(`Deleting temporary file ${tempFilePath}`);
        fs.unlinkSync(tempFilePath);

        console.log('After saving newVideo with staticImageUrl:', newVideo);

        return NextResponse.json({ link: `${process.env.BASE_URL}/video/${newVideo.id}` }, { status: 201 });
    } catch (error) {
        console.error("Error creating new video:", error);
        return NextResponse.json({ error: "Failed to create a new video" }, { status: 500 });
    }
};
