import Video from "@models/video";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';

export const POST = async (request) => {
    try {
        const { name, websiteUrl, videoUrl, timeFullScreen, videoDuration, image } = await request.json();

        if (!name || !websiteUrl || !videoUrl || !timeFullScreen || !videoDuration || !image) {
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

        const staticImagePath = path.join(process.cwd(), 'public', 'static', `${newVideo.id}.png`);

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
        fs.writeFileSync(staticImagePath, buffer);

        const staticImageUrl = `${process.env.BASE_URL}/static/${newVideo.id}.png`;
        console.log('Static Image URL:', staticImageUrl);

        // Update the staticImageUrl in the document
        newVideo.staticImageUrl = staticImageUrl;
        
        // Use findOneAndUpdate to ensure the update is applied
        await Video.findOneAndUpdate(
            { id: newVideo.id },
            { staticImageUrl: staticImageUrl },
            { new: true }
        );

        console.log('After saving newVideo with staticImageUrl:', newVideo);

        return NextResponse.json({ link: `${process.env.BASE_URL}/video/${newVideo.id}` }, { status: 201 });
    } catch (error) {
        console.error("Error creating new video:", error);
        return NextResponse.json({ error: "Failed to create a new video" }, { status: 500 });
    }
};
