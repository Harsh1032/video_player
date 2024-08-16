export const dynamic = 'force-static'

import Video from "@models/video";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';

export const GET = async (req, { params }) => {
  const { id } = params;

  try {
    await connectToDB();
    const video = await Video.findOne({ id });
    console.log(video);
    if (video) {
      return NextResponse.json(video, { status: 200 });
    } else {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json({ error: "An error occurred while fetching the video" }, { status: 500 });
  }
};

export const DELETE = async (request, { params }) => {
  const { id } = params;

  try {
    await connectToDB();
    const result = await Video.deleteOne({ id });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Video deleted successfully" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json({ error: "An error occurred while deleting the video" }, { status: 500 });
  }
};
