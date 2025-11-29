
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const timestamp = Math.round((new Date).getTime() / 1000);
  const secret = process.env.CLOUDINARY_API_SECRET!;
  const key = process.env.CLOUDINARY_API_KEY!;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  
  // Params to sign (must match what client sends exactly)
  const paramsToSign = {
    folder: 'signage_assets',
    timestamp: timestamp
  };

  const signatureString = `folder=${paramsToSign.folder}&timestamp=${paramsToSign.timestamp}${secret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: key,
    cloudName
  });
}
