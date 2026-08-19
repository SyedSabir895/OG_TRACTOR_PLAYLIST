import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, checkAuth } from './_r2.js'

const META_KEY = 'meta/songs.json'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!checkAuth(req, res)) return

  const { songs } = req.body || {}
  if (!Array.isArray(songs)) {
    res.status(400).json({ error: 'songs must be an array' })
    return
  }

  const client = r2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: META_KEY,
      Body: JSON.stringify(songs, null, 2),
      ContentType: 'application/json',
      CacheControl: 'no-cache',
    })
  )

  res.status(200).json({ ok: true, count: songs.length })
}
