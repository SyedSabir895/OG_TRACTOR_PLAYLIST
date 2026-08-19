import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, checkAuth } from './_r2.js'

const META_KEY = 'meta/songs.json'

async function streamToString(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf-8')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!checkAuth(req, res)) return

  const { title, language, file, thumb } = req.body || {}
  if (!title || !file) {
    res.status(400).json({ error: 'Missing title or file' })
    return
  }

  const client = r2Client()
  const bucket = process.env.R2_BUCKET_NAME

  let songs = []
  try {
    const existing = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: META_KEY })
    )
    songs = JSON.parse(await streamToString(existing.Body))
  } catch (err) {
    if (err.name !== 'NoSuchKey') {
      res.status(500).json({ error: 'Failed to read songs.json' })
      return
    }
  }

  songs.push({
    title,
    language: language || 'Other',
    file,
    thumb: thumb || null,
  })

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: META_KEY,
      Body: JSON.stringify(songs, null, 2),
      ContentType: 'application/json',
      CacheControl: 'no-cache',
    })
  )

  res.status(200).json({ ok: true, count: songs.length })
}
