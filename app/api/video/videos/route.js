export const dynamic = 'force-static'

import Video from "@models/video";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';

export const GET = async () => {
  try {
    await connectToDB();
    const videos = await Video.find().sort({ createdAt: -1 });
    return NextResponse.json(videos, { status: 200 });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
