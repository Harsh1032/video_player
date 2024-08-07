import { NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('imageUrl');
  const webcamImageUrl = searchParams.get('webcamImageUrl');

  console.log('Received imageUrl:', imageUrl);
  console.log('Received webcamImageUrl:', webcamImageUrl);

  if (!imageUrl || !webcamImageUrl) {
    console.error('Missing parameters: imageUrl and webcamImageUrl are required');
    return new NextResponse('imageUrl and webcamImageUrl are required', { status: 400 });
  }

  try {
    const canvas = createCanvas(500, 281);
    const ctx = canvas.getContext('2d');

    const baseImage = await loadImage(decodeURIComponent(imageUrl));
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

    const webcamImage = await loadImage(decodeURIComponent(webcamImageUrl));
    ctx.drawImage(webcamImage, webcamX, webcamY, webcamSize, webcamSize);
    ctx.restore();

    const buffer = canvas.toBuffer('image/png');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
