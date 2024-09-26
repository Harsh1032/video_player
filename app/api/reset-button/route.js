export const dynamic = 'force-dynamic';

import Video from "@models/video";
import CsvFile from "@models/csvFile"; // Assuming you have a model for your CSV files
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';

export const DELETE = async () => {
  try {
    // Connect to the database
    await connectToDB();

    // Clear the 'videos' collection
    await Video.deleteMany({});
    console.log("All videos deleted");

    // Clear the 'csvFiles' collection
    await CsvFile.deleteMany({});
    console.log("All CSV files deleted");

    return NextResponse.json({ message: "Database reset successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error resetting the database:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
