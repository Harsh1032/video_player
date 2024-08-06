import CsvFile from "@models/csvFile";
import { connectToDB } from "@utils/database";
import { NextResponse } from 'next/server';

export const GET = async () => {
  try {
    await connectToDB();
    const csvFiles = await CsvFile.find();
    return NextResponse.json(csvFiles, { status: 200 });
  } catch (error) {
    console.error("Error fetching CSV files:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
