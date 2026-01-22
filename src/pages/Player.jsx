import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, List, Info, AlertCircle, ChevronDown, MonitorPlay, Lock } from 'lucide-react'
import { getDramaBosDetail, getDramaBosChapters, getDramaBosStream } from '../api/dramabos'
import Hls from 'hls.js'

// --- INTERNAL STYLES (NO EXTERNAL DEPENDENCY) ---
const INTERNAL_STYLES = `
  .sp-container { background-color: #050505; color: #e5e5e5; font-family: sans-serif; min-height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
  .sp-header { position: fixed; top: 0; left: 0; right: 0; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.08); z-index: 100; transition: all 0.3s ease; }
  .sp-btn-icon { padding: 8px; border-radius: 50%; color: #a3a3a3; transition: all 0.2s; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .sp-btn-icon:hover { background: rgba(255,255,255,0.1); color: #fff; transform: scale(1.05); }
  
  .sp-title-area { display: flex; flex-direction: column; flex: 1; min-width: 0; margin-left: 12px; }
  .sp-title { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
  .sp-subtitle { font-size: 10px; font-weight: 600; color: #10b981; letter-spacing: 0.05em; background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 2px; align-self: flex-start; }

  .sp-main { padding-top: 60px; display: flex; flex-direction: column; height: 100dvh; }
  @media (min-width: 1024px) { .sp-main { flex-direction: row; overflow: hidden; } }

  .sp-video-section { flex: 1; position: relative; background: #000; display: flex; flex-direction: column; }
  .sp-video-container { width: 100%; aspect-ratio: 16/9; position: relative; z-index: 50; background: #000; }
  @media (min-width: 1024px) { .sp-video-container { height: 100%; aspect-ratio: auto; display: flex; align-items: center; justify-content: center; position: absolute; inset: 0; } }

  .sp-loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(24,24,27,0.5); backdrop-filter: blur(4px); gap: 12px; color: #737373; }
  .sp-spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #10b981; border-radius: 50%; animation: sp-spin 1s linear infinite; }
  @keyframes sp-spin { to { transform: rotate(360deg); } }

  .sp-info-mobile { padding: 16px; background: #0a0a0a; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .sp-tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #d4d4d4; border: 1px solid rgba(255,255,255,0.05); margin-right: 6px; }
  .sp-tag-accent { background: #10b981; color: #000; font-weight: 700; border: none; box-shadow: 0 0 10px rgba(16,185,129,0.2); }
  
  .sp-synopsis { font-size: 13px; color: #a3a3a3; line-height: 1.6; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; }

  .sp-info-desktop { display: none; position: absolute; bottom: 0; left: 0; right: 0; padding: 40px; background: linear-gradient(to top, #000 10%, rgba(0,0,0,0.9) 50%, transparent); z-index: 60; transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
  @media (min-width: 1024px) { .sp-info-desktop { display: block; } }
  .sp-info-desktop.hidden { transform: translateY(85%); }
  
  .sp-cover { width: 100px; height: 150px; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
  .sp-info-content { margin-left: 24px; color: #fff; }
  .sp-big-title { font-size: 32px; font-weight: 800; margin-bottom: 8px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }

  .sp-sidebar { background: #0f0f0f; display: flex; flex-direction: column; border-left: 1px solid rgba(255,255,255,0.05); }
  @media (min-width: 1024px) { .sp-sidebar { width: 380px; height: 100%; } }
  
  .sp-list-header { padding: 16px; background: rgba(15,15,15,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
  .sp-list-title { font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 0.05em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
  .sp-count-badge { font-size: 10px; font-family: monospace; color: #10b981; background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(16,185,129,0.2); }

  .sp-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; padding: 16px; overflow-y: auto; flex: 1; }
  @media (max-width: 768px) { .sp-grid { grid-template-columns: repeat(4, 1fr); } }

  .sp-ep-btn { aspect-ratio: 1/1; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.03); color: #737373; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; position: relative; display: flex; align-items: center; justify-content: center; }
  .sp-ep-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.1); }
  .sp-ep-btn.active { background: #fff; color: #000; font-weight: 800; border-color: #fff; transform: scale(1.05); z-index: 5; box-shadow: 0 0 15px rgba(255,255,255,0.2); }
  .sp-ep-btn:disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }
  
  .sp-active-dot { position: absolute; top: -2px; right: -2px; display: flex; }
  .sp-ping { width: 8px; height: 8px; background: #10b981; border-radius: 50%; opacity: 0.75; animation: sp-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; position: absolute; }
  .sp-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; position: relative; }
  @keyframes sp-ping { 75%, 100% { transform: scale(2); opacity: 0; } }

  /* SCROLLBAR */
  .custom-scroll::-webkit-scrollbar { width: 5px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: #555; }
`

// --- INTERNAL COMPONENTS (NO EXTERNAL DEPENDENCY) ---

function InternalVideoPlayer({ src, poster, onEnded }) {
    const videoRef = useRef(null)
    const hlsRef = useRef(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video || !src) return

        if (hlsRef.current) {
            hlsRef.current.destroy()
            hlsRef.current = null
        }

        if (Hls.isSupported() && (src.includes('.m3u8') || src.includes('.m3u'))) {
            const hls = new Hls({ debug: false, enableWorker: true, lowLatencyMode: true })
            hlsRef.current = hls
            hls.loadSource(src)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(console.warn)
            })
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
                    else hls.destroy()
                }
            })
        } else {
            video.src = src
            video.referrerPolicy = "no-referrer"
            video.load()
            video.play().catch(console.warn)
        }

        return () => hlsRef.current?.destroy()
    }, [src])

    return (
        <video
            ref={videoRef}
            controls
            playsInline
            onEnded={onEnded}
            poster={poster}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
        />
    )
}

function InternalEpisodeList({ episodes, currentEpisode, onEpisodeSelect }) {
    const activeRef = useRef(null)
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [currentEpisode])

    if (!episodes?.length) return <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '12px' }}>TIDAK ADA EPISODE</div>

    return (
        <div className="sp-grid custom-scroll">
            {episodes.map((item, idx) => {
                const isActive = currentEpisode && item.chapterIndex === currentEpisode.chapterIndex
                const isLocked = item.isLock
                return (
                    <button
                        key={idx}
                        ref={isActive ? activeRef : null}
                        disabled={isLocked}
                        onClick={() => onEpisodeSelect(item)}
                        className={`sp-ep-btn ${isActive ? 'active' : ''}`}
                    >
                        {isActive && (
                            <div className="sp-active-dot">
                                <span className="sp-ping"></span>
                                <span className="sp-dot"></span>
                            </div>
                        )}
                        {isLocked && <Lock size={12} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', top: 4, right: 4 }} />}
                        {item.episodeNo}
                    </button>
                )
            })}
        </div>
    )
}

// --- MAIN PAGE ---

export default function Player() {
    const { source, id: bookId } = useParams()
    const navigate = useNavigate()

    // State
    const [loading, setLoading] = useState(true)
    const [detail, setDetail] = useState(null)
    const [episodes, setEpisodes] = useState([])
    const [currentEp, setCurrentEp] = useState(null)
    const [streamUrl, setStreamUrl] = useState(null)
    const [videoLoading, setVideoLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showSynopsis, setShowSynopsis] = useState(true)

    // Init
    useEffect(() => {
        const init = async () => {
            setLoading(true)
            try {
                if (source !== 'dramabos') throw new Error("Sumber tidak didukung")

                const [d, c] = await Promise.all([
                    getDramaBosDetail(bookId),
                    getDramaBosChapters(bookId)
                ])

                if (!d) throw new Error("Gagal mengambil detail")
                setDetail(d)

                // Process Episodes
                let processedEps = []
                if (c && Array.isArray(c)) {
                    processedEps = c.map((item, idx) => ({
                        ...item,
                        internalIndex: idx,
                        title: item.chapterName || `Episode ${idx + 1}`,
                        episodeNo: String(idx + 1),
                        bestUrl: findBestQualityInCdnList(item.cdnList)
                    })).sort((a, b) => (a.chapterIndex || 0) - (b.chapterIndex || 0))
                }
                setEpisodes(processedEps)

                // Start
                if (processedEps.length > 0) playEpisode(processedEps[0])
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [bookId, source])

    // Helpers
    const findBestQualityInCdnList = (cdnList) => {
        if (!cdnList?.length) return null
        for (const cdn of cdnList) {
            if (cdn.videoPathList) {
                const q1080 = cdn.videoPathList.find(v => v.quality === 1080)
                if (q1080) return q1080.videoPath
                const q720 = cdn.videoPathList.find(v => v.quality === 720)
                if (q720) return q720.videoPath
                const qDef = cdn.videoPathList.find(v => v.isDefault) || cdn.videoPathList[0]
                if (qDef) return qDef.videoPath
            }
        }
        return null
    }

    const playEpisode = async (episode) => {
        if (!episode) return
        setCurrentEp(episode)
        setVideoLoading(true)
        setStreamUrl(null)

        try {
            // Priority 1: CDN
            if (episode.bestUrl) {
                setStreamUrl(episode.bestUrl)
                setVideoLoading(false)
                return
            }
            // Priority 2: API
            const targetIndex = (episode.chapterIndex !== undefined && episode.chapterIndex !== null)
                ? episode.chapterIndex
                : (episode.internalIndex + 1)

            const url = await getDramaBosStream(bookId, targetIndex)
            if (url) {
                setStreamUrl(url)
            } else if (episode.internalIndex === 0 && detail?.videoPath) {
                setStreamUrl(detail.videoPath)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setVideoLoading(false)
        }
    }

    const handleNext = () => {
        if (!episodes || !currentEp) return
        const currentIdx = episodes.findIndex(e => e.chapterIndex === currentEp.chapterIndex)
        if (currentIdx >= 0 && currentIdx < episodes.length - 1) {
            playEpisode(episodes[currentIdx + 1])
        }
    }

    if (loading && !detail) return <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MEMUAT...</div>
    if (error) return <div style={{ background: '#000', color: 'red', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{error} <button onClick={() => navigate('/')} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 20, background: '#333', color: '#fff', border: 'none' }}>KEMBALI</button></div>

    return (
        <>
            <style>{INTERNAL_STYLES}</style>

            <div className="sp-container">
                {/* HEADER */}
                <header className="sp-header">
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <button onClick={() => navigate(-1)} className="sp-btn-icon">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="sp-title-area">
                            <h1 className="sp-title">{detail?.bookName}</h1>
                            <span className="sp-subtitle">
                                {currentEp ? `EPISODE ${currentEp.episodeNo}` : 'MEMUAT'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* MAIN */}
                <div className="sp-main">
                    {/* VIDEO AREA */}
                    <div className="sp-video-section">
                        <div className="sp-video-container">
                            {streamUrl ? (
                                <InternalVideoPlayer
                                    key={streamUrl}
                                    src={streamUrl}
                                    poster={detail?.cover}
                                    onEnded={handleNext}
                                />
                            ) : (
                                <div className="sp-loading-overlay">
                                    {videoLoading ? (
                                        <>
                                            <div className="sp-spinner"></div>
                                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em' }}>MEMUAT VIDEO</span>
                                        </>
                                    ) : (
                                        <>
                                            <MonitorPlay size={32} opacity={0.3} />
                                            <span>VIDEO TIDAK TERSEDIA</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* DESKTOP INFO */}
                        <div className={`sp-info-desktop ${!showSynopsis ? 'hidden' : ''}`}>
                            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
                                <img src={detail?.cover} className="sp-cover" alt="" />
                                <div className="sp-info-content">
                                    <h2 className="sp-big-title">{detail?.bookName}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className="sp-tag sp-tag-accent">EP {currentEp?.episodeNo}</span>
                                        {detail?.tags?.map((t, i) => <span key={i} className="sp-tag">{t}</span>)}
                                    </div>
                                    <p className="sp-synopsis" style={{ maxWidth: '600px', borderTop: 'none' }}>{detail?.introduction}</p>
                                </div>
                                <button className="sp-btn-icon" onClick={() => setShowSynopsis(!showSynopsis)} style={{ marginBottom: '4px' }}>
                                    <ChevronDown size={28} />
                                </button>
                            </div>
                        </div>

                        {/* MOBILE INFO */}
                        <div className="sp-info-mobile lg:hidden">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{detail?.bookName}</h2>
                                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        <span className="sp-tag sp-tag-accent">Drama</span>
                                        {detail?.tags?.slice(0, 3).map((t, i) => <span key={i} className="sp-tag">{t}</span>)}
                                    </div>
                                </div>
                                <button onClick={() => setShowSynopsis(!showSynopsis)} className="sp-btn-icon">
                                    {showSynopsis ? <ChevronDown size={18} /> : <Info size={18} />}
                                </button>
                            </div>
                            <div style={{ maxHeight: showSynopsis ? '200px' : '0px', overflow: 'hidden', transition: 'all 0.3s' }}>
                                <p className="sp-synopsis">{detail?.introduction || 'Sinopsis tidak tersedia'}</p>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div className="sp-sidebar">
                        <div className="sp-list-header">
                            <div className="sp-list-title">
                                <List size={16} color="#10b981" />
                                DAFTAR EPISODE
                            </div>
                            <span className="sp-count-badge">{episodes.length} VIDEO</span>
                        </div>
                        <InternalEpisodeList
                            episodes={episodes}
                            currentEpisode={currentEp}
                            onEpisodeSelect={(ep) => playEpisode(ep)}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}
