import Video from "@models/video";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';

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
            image
        });

        await newVideo.save();

        return NextResponse.json({ link: `${process.env.BASE_URL}/video/${newVideo.id}` }, { status: 201 });
    } catch (error) {
        console.error("Error creating new video:", error);
        return NextResponse.json({ error: "Failed to create a new video" }, { status: 500 });
    }
};
