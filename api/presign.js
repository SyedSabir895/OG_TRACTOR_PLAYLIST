import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, checkAuth } from './_r2.js'

const KIND_PREFIX = { song: 'songs', cover: 'covers' }

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!checkAuth(req, res)) return

  const { kind, filename, contentType } = req.body || {}
  const prefix = KIND_PREFIX[kind]
  if (!prefix || !filename) {
    res.status(400).json({ error: 'Invalid kind or filename' })
    return
  }

  const key = `${prefix}/${Date.now()}-${safeName(filename)}`
  const client = r2Client()

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    }),
    { expiresIn: 300 }
  )

  res.status(200).json({
    uploadUrl,
    key: key.slice(prefix.length + 1),
    publicUrl: `${process.env.R2_BASE_URL}/${key}`,
  })
}
