import { Schema, model, models } from 'mongoose';
import { nanoid } from "nanoid";

const videoSchema = new Schema({
    id: { type: String, default: () => nanoid(12) },
    name: String,
    websiteUrl: String,
    videoUrl: String,
    timeFullScreen: Number,
    videoDuration: Number,
    image: String,
    staticImageUrl: String,
    createdAt: { type: Date, default: Date.now },
});

const Video = models.Video || model("Video", videoSchema);

export default Video;
