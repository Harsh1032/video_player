import { Schema, model, models } from 'mongoose';

const csvFileSchema = new Schema({
    fileName: String,
    numberOfPages: Number,
    generatedAt: { type: Date, default: Date.now },
    downloadLink: String,
    videoIds: [{ type: String, ref: "Video" }],
  });

const CsvFile = models.CsvFile || model("CsvFile", csvFileSchema);

export default CsvFile;