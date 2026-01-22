import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, List, Info, AlertCircle, ChevronDown, MonitorPlay, Lock, Play, Pause, SkipForward, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import { getDramaBosDetail, getDramaBosChapters, getDramaBosStream } from '../api/dramabos'
import Hls from 'hls.js'

// --- ENHANCED STYLES ---
const ENHANCED_STYLES = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  
  .ep-container { 
    background: linear-gradient(to bottom, #0a0a0a 0%, #000 100%); 
    color: #fff; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
    min-height: 100vh; 
    display: flex; 
    flex-direction: column; 
    overflow-x: hidden;
    position: relative;
  }
  
  /* HEADER STYLES */
  .ep-header { 
    position: fixed; 
    top: 0; 
    left: 0; 
    right: 0; 
    height: 56px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 12px; 
    background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 70%, transparent 100%);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255,255,255,0.05); 
    z-index: 1000;
    transition: transform 0.3s ease;
  }
  
  .ep-header.hidden { transform: translateY(-100%); }
  
  .ep-btn-icon { 
    padding: 10px; 
    border-radius: 12px; 
    color: #fff; 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
    background: rgba(255,255,255,0.08); 
    border: none; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    min-width: 40px;
    min-height: 40px;
  }
  .ep-btn-icon:active { transform: scale(0.95); background: rgba(255,255,255,0.15); }
  
  .ep-title-section { 
    display: flex; 
    flex-direction: column; 
    flex: 1; 
    min-width: 0; 
    margin: 0 12px; 
  }
  
  .ep-title { 
    font-size: 15px; 
    font-weight: 700; 
    color: #fff; 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    line-height: 1.3;
    letter-spacing: -0.3px;
  }
  
  .ep-episode-badge { 
    font-size: 11px; 
    font-weight: 600; 
    color: #fff; 
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    padding: 3px 10px; 
    border-radius: 6px; 
    display: inline-block; 
    margin-top: 3px; 
    align-self: flex-start;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    letter-spacing: 0.3px;
  }

  /* VIDEO SECTION */
  .ep-main { 
    padding-top: 56px; 
    display: flex; 
    flex-direction: column; 
    min-height: 100vh;
    position: relative;
  }
  
  @media (min-width: 1024px) { 
    .ep-main { 
      flex-direction: row; 
      height: 100vh;
      overflow: hidden; 
    } 
  }

  .ep-video-wrapper { 
    position: relative; 
    background: #000; 
    flex-shrink: 0;
  }
  
  .ep-video-container { 
    width: 100%; 
    position: relative; 
    background: #000;
    overflow: hidden;
  }
  
  /* Mobile: Full width with 16:9 ratio */
  @media (max-width: 1023px) {
    .ep-video-container {
      aspect-ratio: 16/9;
      max-height: 56.25vw;
    }
  }
  
  /* Desktop: Fill available space */
  @media (min-width: 1024px) { 
    .ep-video-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    
    .ep-video-container { 
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    } 
  }

  /* VIDEO PLAYER */
  .ep-video-player {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  /* LOADING OVERLAY */
  .ep-loading-overlay { 
    position: absolute; 
    inset: 0; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    background: rgba(0,0,0,0.85); 
    backdrop-filter: blur(10px);
    gap: 16px; 
    color: #999;
    z-index: 10;
  }
  
  .ep-spinner { 
    width: 48px; 
    height: 48px; 
    border: 4px solid rgba(16, 185, 129, 0.1); 
    border-top-color: #10b981; 
    border-radius: 50%; 
    animation: ep-spin 0.8s linear infinite; 
  }
  
  @keyframes ep-spin { to { transform: rotate(360deg); } }
  
  .ep-loading-text {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #10b981;
  }

  /* INFO SECTION - MOBILE */
  .ep-info-mobile { 
    padding: 20px 16px;
    background: linear-gradient(to bottom, #0a0a0a 0%, #050505 100%);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  
  @media (min-width: 1024px) {
    .ep-info-mobile { display: none; }
  }
  
  .ep-info-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .ep-info-main h2 { 
    font-size: 18px; 
    font-weight: 800; 
    color: #fff;
    line-height: 1.3;
    margin: 0 0 10px 0;
    letter-spacing: -0.5px;
  }
  
  .ep-tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  
  .ep-tag { 
    font-size: 11px; 
    padding: 5px 12px; 
    border-radius: 20px; 
    background: rgba(255,255,255,0.06); 
    color: #d4d4d4; 
    border: 1px solid rgba(255,255,255,0.08);
    font-weight: 500;
    letter-spacing: 0.2px;
  }
  
  .ep-tag-primary { 
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #000; 
    font-weight: 700; 
    border: none; 
    box-shadow: 0 2px 10px rgba(16,185,129,0.25);
  }
  
  .ep-toggle-btn {
    padding: 8px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    color: #10b981;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    min-height: 36px;
  }
  
  .ep-toggle-btn:active {
    transform: scale(0.95);
    background: rgba(255,255,255,0.1);
  }
  
  .ep-synopsis-wrapper {
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  }
  
  .ep-synopsis-wrapper.collapsed {
    max-height: 0;
    opacity: 0;
  }
  
  .ep-synopsis-wrapper.expanded {
    max-height: 300px;
    opacity: 1;
  }
  
  .ep-synopsis { 
    font-size: 14px; 
    color: #a3a3a3; 
    line-height: 1.7; 
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  /* INFO SECTION - DESKTOP */
  .ep-info-desktop { 
    display: none;
    position: absolute; 
    bottom: 0; 
    left: 0; 
    right: 0; 
    padding: 48px 40px 32px;
    background: linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.5) 70%, transparent 100%);
    z-index: 50; 
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  }
  
  @media (min-width: 1024px) { 
    .ep-info-desktop { display: block; } 
  }
  
  .ep-info-desktop.hidden { 
    transform: translateY(calc(100% - 80px));
    opacity: 0.95;
  }
  
  .ep-info-desktop-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: flex-end;
    gap: 32px;
  }
  
  .ep-cover-img { 
    width: 120px; 
    height: 180px; 
    border-radius: 12px; 
    object-fit: cover; 
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    border: 2px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
  }
  
  .ep-info-details {
    flex: 1;
    min-width: 0;
  }
  
  .ep-big-title { 
    font-size: 36px; 
    font-weight: 900; 
    margin-bottom: 12px; 
    text-shadow: 0 2px 16px rgba(0,0,0,0.8);
    letter-spacing: -1px;
    line-height: 1.2;
  }
  
  .ep-desktop-synopsis {
    font-size: 15px;
    color: #d4d4d4;
    line-height: 1.7;
    max-width: 700px;
    margin-top: 16px;
  }

  /* SIDEBAR - EPISODE LIST */
  .ep-sidebar { 
    background: #0a0a0a;
    display: flex; 
    flex-direction: column;
    border-top: 1px solid rgba(255,255,255,0.06);
    position: relative;
  }
  
  @media (min-width: 1024px) { 
    .ep-sidebar { 
      width: 400px;
      min-width: 400px;
      max-width: 400px;
      height: 100%;
      border-top: none;
      border-left: 1px solid rgba(255,255,255,0.06);
    } 
  }
  
  .ep-list-header { 
    padding: 20px 16px;
    background: rgba(10,10,10,0.98);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .ep-list-title { 
    font-size: 13px; 
    font-weight: 800; 
    color: #fff; 
    letter-spacing: 0.5px; 
    text-transform: uppercase; 
    display: flex; 
    align-items: center; 
    gap: 10px;
  }
  
  .ep-count-badge { 
    font-size: 11px; 
    font-family: -apple-system, monospace;
    font-weight: 700;
    color: #10b981; 
    background: rgba(16,185,129,0.12); 
    padding: 4px 12px; 
    border-radius: 20px; 
    border: 1px solid rgba(16,185,129,0.25);
  }

  /* EPISODE GRID */
  .ep-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 10px; 
    padding: 16px;
    overflow-y: auto; 
    flex: 1;
    max-height: 400px;
  }
  
  @media (min-width: 640px) {
    .ep-grid {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 12px;
    }
  }
  
  @media (min-width: 1024px) { 
    .ep-grid { 
      max-height: none;
      height: 100%;
    } 
  }

  /* EPISODE BUTTON */
  .ep-episode-btn { 
    aspect-ratio: 1/1; 
    border-radius: 12px; 
    border: 2px solid rgba(255,255,255,0.06); 
    background: rgba(255,255,255,0.03); 
    color: #999; 
    font-size: 15px; 
    font-weight: 600; 
    cursor: pointer; 
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    overflow: hidden;
  }
  
  .ep-episode-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .ep-episode-btn:hover:not(:disabled)::before {
    opacity: 1;
  }
  
  .ep-episode-btn:hover:not(:disabled) { 
    background: rgba(255,255,255,0.08); 
    color: #fff; 
    border-color: rgba(16,185,129,0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  
  .ep-episode-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .ep-episode-btn.active { 
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #000; 
    font-weight: 800; 
    border-color: #10b981;
    transform: scale(1.08);
    z-index: 5; 
    box-shadow: 0 6px 24px rgba(16,185,129,0.4);
  }
  
  .ep-episode-btn:disabled { 
    opacity: 0.25; 
    cursor: not-allowed; 
    filter: grayscale(1);
  }
  
  /* ACTIVE INDICATOR */
  .ep-active-indicator { 
    position: absolute; 
    top: 4px; 
    right: 4px; 
    display: flex;
    z-index: 1;
  }
  
  .ep-ping-animation { 
    width: 10px; 
    height: 10px; 
    background: #fff; 
    border-radius: 50%; 
    opacity: 0.75; 
    animation: ep-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; 
    position: absolute; 
  }
  
  .ep-dot { 
    width: 10px; 
    height: 10px; 
    background: #fff; 
    border-radius: 50%; 
    position: relative;
    box-shadow: 0 0 8px rgba(255,255,255,0.5);
  }
  
  @keyframes ep-ping { 
    75%, 100% { 
      transform: scale(2.5); 
      opacity: 0; 
    } 
  }

  /* LOCK ICON */
  .ep-lock-icon {
    position: absolute;
    top: 6px;
    right: 6px;
    opacity: 0.5;
  }

  /* SCROLLBAR CUSTOM */
  .ep-custom-scroll::-webkit-scrollbar { 
    width: 6px; 
  }
  
  .ep-custom-scroll::-webkit-scrollbar-track { 
    background: transparent; 
  }
  
  .ep-custom-scroll::-webkit-scrollbar-thumb { 
    background: rgba(16,185,129,0.3);
    border-radius: 10px; 
  }
  
  .ep-custom-scroll::-webkit-scrollbar-thumb:hover { 
    background: rgba(16,185,129,0.5);
  }

  /* RESPONSIVE ADJUSTMENTS */
  @media (max-width: 640px) {
    .ep-header { height: 52px; padding: 0 10px; }
    .ep-main { padding-top: 52px; }
    .ep-btn-icon { padding: 8px; min-width: 36px; min-height: 36px; }
    .ep-title { font-size: 14px; }
    .ep-episode-badge { font-size: 10px; padding: 2px 8px; }
    .ep-info-mobile { padding: 16px 12px; }
    .ep-info-main h2 { font-size: 16px; }
    .ep-tag { font-size: 10px; padding: 4px 10px; }
    .ep-synopsis { font-size: 13px; }
  }
  
  /* LANDSCAPE MODE ON MOBILE */
  @media (max-width: 1023px) and (orientation: landscape) {
    .ep-header { display: none; }
    .ep-main { padding-top: 0; }
    .ep-video-container { 
      height: 100vh;
      max-height: 100vh;
      aspect-ratio: auto;
    }
    .ep-info-mobile { display: none; }
    .ep-sidebar { display: none; }
  }

  /* SMOOTH TRANSITIONS */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`

// --- INTERNAL VIDEO PLAYER COMPONENT ---
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
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            })
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
            controlsList="nodownload"
            onEnded={onEnded}
            poster={poster}
            className="ep-video-player"
        />
    )
}

// --- EPISODE LIST COMPONENT ---
function InternalEpisodeList({ episodes, currentEpisode, onEpisodeSelect }) {
    const activeRef = useRef(null)

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            })
        }
    }, [currentEpisode])

    if (!episodes?.length) {
        return (
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#666',
                fontSize: '13px',
                fontWeight: 600
            }}>
                <MonitorPlay size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                TIDAK ADA EPISODE
            </div>
        )
    }

    return (
        <div className="ep-grid ep-custom-scroll">
            {episodes.map((item, idx) => {
                const isActive = currentEpisode && item.chapterIndex === currentEpisode.chapterIndex
                const isLocked = item.isLock

                return (
                    <button
                        key={idx}
                        ref={isActive ? activeRef : null}
                        disabled={isLocked}
                        onClick={() => !isLocked && onEpisodeSelect(item)}
                        className={`ep-episode-btn ${isActive ? 'active' : ''}`}
                        aria-label={`Episode ${item.episodeNo}`}
                    >
                        {isActive && (
                            <div className="ep-active-indicator">
                                <span className="ep-ping-animation"></span>
                                <span className="ep-dot"></span>
                            </div>
                        )}
                        {isLocked && (
                            <Lock
                                size={14}
                                className="ep-lock-icon"
                                strokeWidth={2.5}
                            />
                        )}
                        {item.episodeNo}
                    </button>
                )
            })}
        </div>
    )
}

// --- MAIN PLAYER COMPONENT ---
export default function Player() {
    const { source, id: bookId } = useParams()
    const navigate = useNavigate()

    // State Management
    const [loading, setLoading] = useState(true)
    const [detail, setDetail] = useState(null)
    const [episodes, setEpisodes] = useState([])
    const [currentEp, setCurrentEp] = useState(null)
    const [streamUrl, setStreamUrl] = useState(null)
    const [videoLoading, setVideoLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showSynopsis, setShowSynopsis] = useState(true)
    const [headerVisible, setHeaderVisible] = useState(true)

    // Initialize Data
    useEffect(() => {
        const init = async () => {
            setLoading(true)
            try {
                if (source !== 'dramabos') {
                    throw new Error("Sumber tidak didukung")
                }

                const [detailData, chaptersData] = await Promise.all([
                    getDramaBosDetail(bookId),
                    getDramaBosChapters(bookId)
                ])

                if (!detailData) {
                    throw new Error("Gagal mengambil detail drama")
                }

                setDetail(detailData)

                // Process Episodes
                let processedEpisodes = []
                if (chaptersData && Array.isArray(chaptersData)) {
                    processedEpisodes = chaptersData
                        .map((item, idx) => ({
                            ...item,
                            internalIndex: idx,
                            title: item.chapterName || `Episode ${idx + 1}`,
                            episodeNo: String(idx + 1),
                            bestUrl: findBestQualityInCdnList(item.cdnList)
                        }))
                        .sort((a, b) => (a.chapterIndex || 0) - (b.chapterIndex || 0))
                }

                setEpisodes(processedEpisodes)

                // Auto-play first episode
                if (processedEpisodes.length > 0) {
                    playEpisode(processedEpisodes[0])
                }
            } catch (err) {
                console.error('Init error:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [bookId, source])

    // Find Best Quality URL
    const findBestQualityInCdnList = (cdnList) => {
        if (!cdnList?.length) return null

        for (const cdn of cdnList) {
            if (cdn.videoPathList) {
                // Try 1080p first
                const q1080 = cdn.videoPathList.find(v => v.quality === 1080)
                if (q1080) return q1080.videoPath

                // Then 720p
                const q720 = cdn.videoPathList.find(v => v.quality === 720)
                if (q720) return q720.videoPath

                // Finally default or first available
                const qDefault = cdn.videoPathList.find(v => v.isDefault) || cdn.videoPathList[0]
                if (qDefault) return qDefault.videoPath
            }
        }
        return null
    }

    // Play Episode Function
    const playEpisode = async (episode) => {
        if (!episode) return

        setCurrentEp(episode)
        setVideoLoading(true)
        setStreamUrl(null)

        try {
            // Priority 1: Use CDN URL if available
            if (episode.bestUrl) {
                setStreamUrl(episode.bestUrl)
                setVideoLoading(false)
                return
            }

            // Priority 2: Fetch from API
            const targetIndex = (episode.chapterIndex !== undefined && episode.chapterIndex !== null)
                ? episode.chapterIndex
                : (episode.internalIndex + 1)

            const url = await getDramaBosStream(bookId, targetIndex)

            if (url) {
                setStreamUrl(url)
            } else if (episode.internalIndex === 0 && detail?.videoPath) {
                // Fallback to detail video path for first episode
                setStreamUrl(detail.videoPath)
            }
        } catch (err) {
            console.error('Play episode error:', err)
        } finally {
            setVideoLoading(false)
        }
    }

    // Handle Next Episode
    const handleNext = () => {
        if (!episodes || !currentEp) return

        const currentIdx = episodes.findIndex(e => e.chapterIndex === currentEp.chapterIndex)

        if (currentIdx >= 0 && currentIdx < episodes.length - 1) {
            const nextEp = episodes[currentIdx + 1]
            if (!nextEp.isLock) {
                playEpisode(nextEp)
            }
        }
    }

    // Loading State
    if (loading && !detail) {
        return (
            <div style={{
                background: '#000',
                color: '#fff',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px'
            }}>
                <div className="ep-spinner"></div>
                <span className="ep-loading-text">Memuat Drama...</span>
            </div>
        )
    }

    // Error State
    if (error) {
        return (
            <div style={{
                background: '#000',
                color: '#fff',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center'
            }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Terjadi Kesalahan</h2>
                <p style={{ color: '#999', marginBottom: '24px' }}>{error}</p>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '12px 32px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    KEMBALI KE BERANDA
                </button>
            </div>
        )
    }

    return (
        <>
            <style>{ENHANCED_STYLES}</style>

            <div className="ep-container">
                {/* HEADER */}
                <header className={`ep-header ${!headerVisible ? 'hidden' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <button
                            onClick={() => navigate(-1)}
                            className="ep-btn-icon"
                            aria-label="Kembali"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </button>

                        <div className="ep-title-section">
                            <h1 className="ep-title">{detail?.bookName}</h1>
                            <span className="ep-episode-badge">
                                {currentEp ? `EP ${currentEp.episodeNo}` : 'MEMUAT...'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <div className="ep-main">
                    {/* VIDEO SECTION */}
                    <div className="ep-video-wrapper">
                        <div className="ep-video-container">
                            {streamUrl ? (
                                <InternalVideoPlayer
                                    key={streamUrl}
                                    src={streamUrl}
                                    poster={detail?.cover}
                                    onEnded={handleNext}
                                />
                            ) : (
                                <div className="ep-loading-overlay">
                                    {videoLoading ? (
                                        <>
                                            <div className="ep-spinner"></div>
                                            <span className="ep-loading-text">Memuat Video...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MonitorPlay size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>
                                                VIDEO TIDAK TERSEDIA
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* DESKTOP INFO OVERLAY */}
                        <div className={`ep-info-desktop ${!showSynopsis ? 'hidden' : ''}`}>
                            <div className="ep-info-desktop-content">
                                <img
                                    src={detail?.cover}
                                    className="ep-cover-img"
                                    alt={detail?.bookName}
                                    loading="lazy"
                                />

                                <div className="ep-info-details">
                                    <h2 className="ep-big-title">{detail?.bookName}</h2>

                                    <div className="ep-tags-row">
                                        <span className="ep-tag ep-tag-primary">
                                            EP {currentEp?.episodeNo}
                                        </span>
                                        {detail?.tags?.slice(0, 4).map((tag, i) => (
                                            <span key={i} className="ep-tag">{tag}</span>
                                        ))}
                                    </div>

                                    <p className="ep-desktop-synopsis">
                                        {detail?.introduction || 'Tidak ada sinopsis tersedia'}
                                    </p>
                                </div>

                                <button
                                    className="ep-btn-icon"
                                    onClick={() => setShowSynopsis(!showSynopsis)}
                                    aria-label="Toggle synopsis"
                                    style={{ marginBottom: '8px' }}
                                >
                                    <ChevronDown
                                        size={24}
                                        style={{
                                            transform: showSynopsis ? 'rotate(0deg)' : 'rotate(180deg)',
                                            transition: 'transform 0.3s ease'
                                        }}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* MOBILE INFO */}
                        <div className="ep-info-mobile">
                            <div className="ep-info-header">
                                <div className="ep-info-main">
                                    <h2>{detail?.bookName}</h2>
                                    <div className="ep-tags-row">
                                        <span className="ep-tag ep-tag-primary">Drama</span>
                                        {detail?.tags?.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="ep-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowSynopsis(!showSynopsis)}
                                    className="ep-toggle-btn"
                                    aria-label="Toggle synopsis"
                                >
                                    {showSynopsis ? (
                                        <ChevronDown size={18} strokeWidth={2.5} />
                                    ) : (
                                        <Info size={18} strokeWidth={2.5} />
                                    )}
                                </button>
                            </div>

                            <div className={`ep-synopsis-wrapper ${showSynopsis ? 'expanded' : 'collapsed'}`}>
                                <p className="ep-synopsis">
                                    {detail?.introduction || 'Sinopsis tidak tersedia'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* EPISODE LIST SIDEBAR */}
                    <div className="ep-sidebar">
                        <div className="ep-list-header">
                            <div className="ep-list-title">
                                <List size={16} color="#10b981" strokeWidth={2.5} />
                                <span>Episode</span>
                            </div>
                            <span className="ep-count-badge">
                                {episodes.length} VIDEO
                            </span>
                        </div>

                        <InternalEpisodeList
                            episodes={episodes}
                            currentEpisode={currentEp}
                            onEpisodeSelect={playEpisode}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}