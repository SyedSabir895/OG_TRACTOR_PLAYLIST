import { S3Client } from '@aws-sdk/client-s3'

export function r2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

export function checkAuth(req, res) {
  const { ADMIN_PASSWORD } = process.env
  const password = req.body?.password
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}
