import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import bgImg from './assets/1.png'
import './App.css'

const fmt = (sec) => {
  if (!isFinite(sec) || sec <= 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = String(Math.floor(sec % 60)).padStart(2, '0')
  return `${m}:${s}`
}

const fmtTotal = (sec) => {
  if (!isFinite(sec) || sec <= 0) return '0 min'
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  return h > 0 ? `${h} hr ${m} min` : `${m} min`
}

const srcOf = (song) => `/songs/${encodeURIComponent(song.file)}`
const thumbOf = (song, fallback) =>
  song.thumb ? `/thumbs/${encodeURIComponent(song.thumb)}` : fallback

/* ---------- icons ---------- */
const Icon = ({ d, size = 20, fill = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} aria-hidden="true">
    <path d={d} />
  </svg>
)
const PATH = {
  play: 'M8 5.14v13.72a1 1 0 0 0 1.54.84l10.5-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z',
  pause: 'M7 4h3.5v16H7V4Zm6.5 0H17v16h-3.5V4Z',
  prev: 'M7 5h2.5v14H7V5Zm11.5.3v13.4a.8.8 0 0 1-1.24.67L7.9 12.67a.8.8 0 0 1 0-1.34l9.36-6.7a.8.8 0 0 1 1.24.67Z',
  next: 'M17 5h-2.5v14H17V5ZM5.5 5.3v13.4a.8.8 0 0 0 1.24.67l9.36-6.7a.8.8 0 0 0 0-1.34L6.74 4.63A.8.8 0 0 0 5.5 5.3Z',
  queue: 'M3 6h13v2H3V6Zm0 5h13v2H3v-2Zm0 5h9v2H3v-2Zm14.5-6.5 5 3.5-5 3.5v-7Z',
  shuffle:
    'M17 3.5 21.5 7 17 10.5V8h-2.1c-.9 0-1.4.4-2.2 1.6l-.7 1.1-1.2-1.9.4-.6C12.4 6.4 13.4 6 15 6h2V3.5ZM2.5 6H6c1.6 0 2.6.4 3.8 2.2l3.4 5.2c.8 1.2 1.3 1.6 2.2 1.6H17V12.5L21.5 16 17 19.5V17h-1.6c-1.6 0-2.6-.4-3.8-2.2L8.2 9.6C7.4 8.4 6.9 8 6 8H2.5V6Zm0 10H6c.9 0 1.4-.4 2.2-1.6l.5-.8 1.2 1.9-.2.3C8.6 17.6 7.6 18 6 18H2.5v-2Z',
  repeat:
    'M7 4h10a4 4 0 0 1 4 4v2h-2V8a2 2 0 0 0-2-2H7v2.5L2.5 5 7 1.5V4Zm10 16H7a4 4 0 0 1-4-4v-2h2v2a2 2 0 0 0 2 2h10v-2.5l4.5 3.5-4.5 3.5V20Z',
  volume: 'M4 9h3.5L12 5v14L7.5 15H4V9Zm11.5-.6a5 5 0 0 1 0 7.2l-1.4-1.4a3 3 0 0 0 0-4.4l1.4-1.4Z',
  mute: 'M4 9h3.5L12 5v14L7.5 15H4V9Zm11 1.6 1.4-1.4 1.8 1.8 1.8-1.8 1.4 1.4-1.8 1.8 1.8 1.8-1.4 1.4-1.8-1.8-1.8 1.8-1.4-1.4 1.8-1.8-1.8-1.8Z',
  close: 'm6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z',
}

function App() {
  const [songs, setSongs] = useState([])
  const [durations, setDurations] = useState({})
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)

  /* load manifest */
  useEffect(() => {
    fetch('/songs/songs.json')
      .then((r) => r.json())
      .then((list) => {
        setSongs(list)
        setLoading(false)
        list.forEach((s, i) => {
          const probe = new Audio()
          probe.preload = 'metadata'
          probe.src = srcOf(s)
          probe.addEventListener('loadedmetadata', () =>
            setDurations((d) => ({ ...d, [i]: probe.duration }))
          )
        })
      })
      .catch(() => setLoading(false))
  }, [])

  const song = songs[current]

  /* swap track */
  useEffect(() => {
    const a = audioRef.current
    if (!a || !song) return
    a.src = srcOf(song)
    if (isPlaying) a.play().catch(() => setIsPlaying(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, song])

  /* play / pause */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (isPlaying) a.play().catch(() => setIsPlaying(false))
    else a.pause()
  }, [isPlaying])

  /* volume */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const nextTrack = useCallback(() => {
    setCurrent((c) =>
      shuffle && songs.length > 1
        ? (() => {
            let n = c
            while (n === c) n = Math.floor(Math.random() * songs.length)
            return n
          })()
        : (c + 1) % songs.length
    )
  }, [shuffle, songs.length])

  const prevTrack = useCallback(() => {
    const a = audioRef.current
    if (a && a.currentTime > 3) {
      a.currentTime = 0
      return
    }
    setCurrent((c) => (c - 1 + songs.length) % songs.length)
  }, [songs.length])

  const playAt = (i) => {
    if (i === current) setIsPlaying((p) => !p)
    else {
      setCurrent(i)
      setIsPlaying(true)
    }
  }

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      } else if (e.code === 'ArrowRight') nextTrack()
      else if (e.code === 'ArrowLeft') prevTrack()
      else if (e.code === 'KeyM') setMuted((m) => !m)
      else if (e.code === 'Escape') setShowQueue(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextTrack, prevTrack])

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    if (audioRef.current && duration) audioRef.current.currentTime = ratio * duration
  }

  const pct = useMemo(
    () => (duration ? (progress / duration) * 100 : 0),
    [progress, duration]
  )

  const totalRuntime = useMemo(
    () => Object.values(durations).reduce((sum, d) => sum + (d || 0), 0),
    [durations]
  )

  return (
    <div className="stage">
      <div className="bg" style={{ backgroundImage: `url(${bgImg})` }} />
      <div className="bg-wash" />
      <div className="vignette" />
      <div className="grain" />

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => {
          if (repeat) {
            audioRef.current.currentTime = 0
            audioRef.current.play()
          } else nextTrack()
        }}
      />

      <header className="masthead">
        <span className="kicker">🚜 Desi Beats · Volume One</span>
        <h1 className="wordmark">OG Tractor</h1>
        <p className="script">Playlist</p>
        <span className="count">{songs.length} tracks · {fmtTotal(totalRuntime)}</span>
      </header>

      {song && (
        <section className="hero-track">
          <div className={`vinyl ${isPlaying ? 'spin' : ''}`}>
            <div className="vinyl-grooves" />
            <div className="vinyl-label" style={{ backgroundImage: `url(${thumbOf(song, bgImg)})` }} />
            <div className="vinyl-pin" />
          </div>
          <div className="hero-meta">
            <span className="now-label">
              {isPlaying ? (
                <span className="eq">
                  <i /><i /><i />
                </span>
              ) : null}
              {isPlaying ? 'Now playing' : 'Paused'}
            </span>
            <h2 className="hero-title">{song.title}</h2>
            <p className="hero-artist">{song.artist}</p>
          </div>
        </section>
      )}

      {loading && <div className="loader">Loading playlist…</div>}
      {!loading && !songs.length && (
        <div className="loader">No songs found in /public/songs</div>
      )}

      <aside className={`queue-panel ${showQueue ? 'open' : ''}`}>
        <div className="queue-head">
          <div className="queue-head-text">
            <h3>Playlist Queue <span>({songs.length})</span></h3>
            <p className="queue-runtime">{songs.length} tracks · {fmtTotal(totalRuntime)}</p>
          </div>
          <button className="icon-btn" onClick={() => setShowQueue(false)} aria-label="Close queue">
            <Icon d={PATH.close} size={16} />
          </button>
        </div>
        <ul className="queue-list">
          {songs.map((s, i) => (
            <li
              key={s.file}
              className={`queue-row ${i === current ? 'active' : ''}`}
              onClick={() => playAt(i)}
            >
              <div
                className="q-thumb"
                style={{ backgroundImage: `url(${thumbOf(s, bgImg)})` }}
              >
                {i === current && isPlaying && (
                  <span className="eq sm"><i /><i /><i /></span>
                )}
              </div>
              <span className="q-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="q-meta">
                <span className="q-title">{s.title}</span>
                <span className="q-artist">{s.artist}</span>
              </span>
              <span className="q-dur">{fmt(durations[i])}</span>
            </li>
          ))}
        </ul>
      </aside>

      {song && (
        <footer className="dock">
          <div className="dock-track">
            <div className={`mini-art ${isPlaying ? 'lit' : ''}`} style={{ backgroundImage: `url(${thumbOf(song, bgImg)})` }} />
            <div className="dock-meta">
              <span className="dock-title">{song.title}</span>
              <span className="dock-artist">{song.artist}</span>
            </div>
          </div>

          <div className="dock-center">
            <div className="transport">
              <button
                className={`icon-btn ${shuffle ? 'on' : ''}`}
                onClick={() => setShuffle((s) => !s)}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <Icon d={PATH.shuffle} size={16} />
              </button>
              <button className="icon-btn" onClick={prevTrack} aria-label="Previous">
                <Icon d={PATH.prev} size={20} />
              </button>
              <button
                className="play-btn"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                <Icon d={isPlaying ? PATH.pause : PATH.play} size={20} />
              </button>
              <button className="icon-btn" onClick={nextTrack} aria-label="Next">
                <Icon d={PATH.next} size={20} />
              </button>
              <button
                className={`icon-btn ${repeat ? 'on' : ''}`}
                onClick={() => setRepeat((r) => !r)}
                aria-label="Repeat"
                title="Repeat one"
              >
                <Icon d={PATH.repeat} size={16} />
              </button>
            </div>

            <div className="scrub">
              <span className="t">{fmt(progress)}</span>
              <div className="track" onClick={seek}>
                <div className="track-fill" style={{ width: `${pct}%` }} />
                <div className="track-thumb" style={{ left: `${pct}%` }} />
              </div>
              <span className="t">{fmt(duration)}</span>
            </div>
          </div>

          <div className="dock-right">
            <div className="vol">
              <button className="icon-btn" onClick={() => setMuted((m) => !m)} aria-label="Mute">
                <Icon d={muted || volume === 0 ? PATH.mute : PATH.volume} size={18} />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value))
                  setMuted(false)
                }}
                aria-label="Volume"
              />
            </div>
            <button
              className={`icon-btn ${showQueue ? 'on' : ''}`}
              onClick={() => setShowQueue((s) => !s)}
              aria-label="Queue"
            >
              <Icon d={PATH.queue} size={20} />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
