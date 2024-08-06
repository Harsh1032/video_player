import CsvFile from "@models/csvFile";
import Video from "@models/video";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();

export const DELETE = async (request, { params }) => {
  const { id } = params;

  try {
    await connectToDB();
    const csvFile = await CsvFile.findById(id);
    if (!csvFile) {
      return NextResponse.json({ error: "CSV file not found" }, { status: 404 });
    }

    const videoIds = csvFile.videoIds;
    await Video.deleteMany({ id: { $in: videoIds } });

    await CsvFile.findByIdAndDelete(id);

    const filePath = path.join(__dirname, "public", csvFile.downloadLink);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ message: "CSV file and associated videos deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting CSV file and associated videos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
