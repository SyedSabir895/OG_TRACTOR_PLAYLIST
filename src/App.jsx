import { useState } from 'react'
import bgImg from './assets/gettyimages-172593199-612x612.jpg'
import './App.css'

const SONGS = [
  { title: 'Tractor Waaliye', artist: 'Diljit Dosanjh / OG Tractor', duration: '3:24' },
  { title: 'Pind Diyan Galiyan', artist: 'Sharry Mann / OG Tractor', duration: '4:02' },
  { title: 'Khet Wala Vibe', artist: 'Ammy Virk / OG Tractor', duration: '3:47' },
]

function App() {
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showQueue, setShowQueue] = useState(false)

  const song = SONGS[current]

  const playSong = (i) => {
    if (i === current) {
      setIsPlaying((p) => !p)
    } else {
      setCurrent(i)
      setIsPlaying(true)
    }
    setShowQueue(false)
  }

  return (
    <div
      className="app-bg"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(180,40,10,0.5), rgba(120,20,5,0.5)), url(${bgImg})`,
      }}
    >
      <div className="vignette" />

      <header className="site-header">
        <h1>OG Tractor</h1>
        <p className="tagline">Playlist</p>
      </header>

      <a
        className="spotify-pill"
        href="https://open.spotify.com"
        target="_blank"
        rel="noreferrer"
      >
        <span className="spotify-dot" /> Open Spotify
      </a>

      {showQueue && (
        <ul className="song-list">
          {SONGS.map((s, i) => (
            <li
              key={s.title}
              className={`song-row ${i === current ? 'active' : ''}`}
              onClick={() => playSong(i)}
            >
              <span className="song-info">
                <span className="song-title">{s.title}</span>
                <span className="song-artist">{s.artist}</span>
              </span>
              <span className="song-duration">{s.duration}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="player-bar">
        <div className="album-art" />

        <div className="np-info">
          <span className="np-title">{song.title}</span>
          <span className="np-artist">{song.artist}</span>
        </div>

        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: isPlaying ? '20%' : '0%' }} />
            <div className="progress-thumb" style={{ left: isPlaying ? '20%' : '0%' }} />
          </div>
        </div>

        <span className="time">{isPlaying ? '0:52' : '0:00'} / {song.duration}</span>

        <div className="player-controls">
          <button className="ctrl-btn" onClick={() => setCurrent((c) => (c - 1 + SONGS.length) % SONGS.length)}>⏮</button>
          <button className="ctrl-btn play" onClick={() => setIsPlaying((p) => !p)}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="ctrl-btn" onClick={() => setCurrent((c) => (c + 1) % SONGS.length)}>⏭</button>
          <button className="ctrl-btn" onClick={() => setShowQueue((s) => !s)}>☰</button>
        </div>
      </div>
    </div>
  )
}

export default App
