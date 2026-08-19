import { useEffect, useState } from 'react'
import { SONGS_META_URL } from './config'
import './AdminPage.css'

const LANG_OPTIONS = ['Telugu', 'Hindi', 'Punjabi', 'English', 'Tamil', 'Other']

async function presign(kind, file, password) {
  const r = await fetch('/api/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, filename: file.name, contentType: file.type, password }),
  })
  if (!r.ok) throw new Error((await r.json()).error || 'Presign failed')
  return r.json()
}

async function uploadToR2(uploadUrl, file) {
  const r = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!r.ok) throw new Error('Upload to R2 failed')
}

function AdminPage() {
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState(LANG_OPTIONS[0])
  const [songFile, setSongFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [songs, setSongs] = useState([])

  const loadSongs = () => {
    fetch(SONGS_META_URL, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setSongs)
      .catch(() => setSongs([]))
  }

  useEffect(loadSongs, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!password) return setStatus('Enter admin password')
    if (!title.trim()) return setStatus('Enter a title')
    if (!songFile) return setStatus('Select an mp3 file')

    setBusy(true)
    setStatus('Uploading song…')
    try {
      const songPre = await presign('song', songFile, password)
      await uploadToR2(songPre.uploadUrl, songFile)

      let thumbKey = null
      if (coverFile) {
        setStatus('Uploading cover…')
        const coverPre = await presign('cover', coverFile, password)
        await uploadToR2(coverPre.uploadUrl, coverFile)
        thumbKey = coverPre.key
      }

      setStatus('Saving metadata…')
      const r = await fetch('/api/save-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          language,
          file: songPre.key,
          thumb: thumbKey,
          password,
        }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Save failed')

      setStatus(`Added "${title}" ✓`)
      setTitle('')
      setSongFile(null)
      setCoverFile(null)
      e.target.reset()
      loadSongs()
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <h1>OG Tractor · Admin</h1>
        <p className="admin-sub">Add a song — uploads straight to R2, no server storage.</p>

        <form onSubmit={submit} className="admin-form">
          <label>
            Admin password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label>
            Language
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANG_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>

          <label>
            Song file (mp3)
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setSongFile(e.target.files?.[0] || null)}
            />
          </label>

          <label>
            Cover image (optional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </label>

          <button type="submit" disabled={busy}>
            {busy ? 'Uploading…' : 'Add song'}
          </button>

          {status && <p className="admin-status">{status}</p>}
        </form>
      </div>

      <div className="admin-card">
        <h2>Library ({songs.length})</h2>
        <ul className="admin-list">
          {songs.map((s, i) => (
            <li key={s.file + i}>
              <span className="a-title">{s.title}</span>
              <span className="a-lang">{s.language || 'Other'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default AdminPage
