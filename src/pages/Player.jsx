import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { getNetShortEpisodes, getItemById } from "../api/sansekai"
import { getDramaBosDetail, getDramaBosChapters, getDramaBosStream } from "../api/dramabos"
import VideoPlayer from "../components/VideoPlayer"
import EpisodeList from "../components/EpisodeList"

export default function Player() {
    const { source, id } = useParams()
    const [episodes, setEpisodes] = useState([])
    const [current, setCurrent] = useState(null)
    const [currentStreamUrl, setCurrentStreamUrl] = useState(null)
    const [meta, setMeta] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)

            // 1. Try to get metadata from cache
            const item = await getItemById(source, id)
            if (item) setMeta(item)

            // 2. Load Content based on source
            if (source === 'netshort') {
                const eps = await getNetShortEpisodes(id)
                if (eps && eps.length > 0) {
                    // Force unlock all episodes
                    const unlockedEps = eps.map(e => ({ ...e, isLock: false }))
                    setEpisodes(unlockedEps)

                    // Find first episode to play (defaults to first available)
                    const first = unlockedEps.find(e => !e.isLock) || unlockedEps[0]
                    setCurrent(first)
                } else {
                    setError("Konten ini belum memiliki episode yang tersedia.")
                }
            } else if (source === 'dramabox' && item?.videoPath) {
                // Legacy Dramabox support
                setCurrent({ playVoucher: item.videoPath, title: item.title })
            } else if (source === 'dramabos') {
                // 1. Fetch Full Detail
                const detail = await getDramaBosDetail(id)
                let fullChapterList = []

                if (detail) {
                    setMeta({
                        ...detail,
                        title: detail.bookName,
                        cover: detail.cover
                    })
                    if (detail.chapterList) fullChapterList = detail.chapterList
                }

                // 2. Try Fetch All Chapters (to ensure we get 1 to End)
                // Some APIs limit detail's chapter list.
                const allChapters = await getDramaBosChapters(id)
                if (allChapters && allChapters.length > fullChapterList.length) {
                    fullChapterList = allChapters
                }

                // 3. Map Chapters
                if (fullChapterList.length > 0) {
                    // Sort by chapterIndex to be safe
                    fullChapterList.sort((a, b) => (a.chapterIndex || 0) - (b.chapterIndex || 0))

                    const mapped = fullChapterList.map(c => {
                        // Helper to extract best quality
                        let videoUrl = ""
                        if (c.cdnList && c.cdnList.length > 0) {
                            const cdn = c.cdnList.find(x => x.isDefault) || c.cdnList[0]
                            if (cdn?.videoPathList?.length > 0) {
                                const v = cdn.videoPathList.find(x => x.isDefault) || cdn.videoPathList[0]
                                videoUrl = v.videoPath
                            }
                        }

                        return {
                            ...c,
                            title: c.chapterName || `Episode ${c.chapterIndex}`,
                            episodeNo: c.chapterName ? c.chapterName.replace(/^EP\s*/i, '') : String(c.chapterIndex + 1),
                            playVoucher: videoUrl,
                            isLock: false
                        }
                    })
                    setEpisodes(mapped)
                    // If current is not set, set to Episode 1 (or first available)
                    if (!current) {
                        const firstEp = mapped.find(e => {
                            const no = parseInt(e.episodeNo)
                            return no === 1
                        }) || mapped[0]
                        setCurrent(firstEp)
                        // Optimize: Set stream URL immediately for first load to avoid flicker/delay
                        if (firstEp) {
                            setCurrentStreamUrl(firstEp.playVoucher || firstEp.url)
                        }
                    }
                } else {
                    if (!detail) setError("Gagal memuat detail drama.") // Only error if both failed
                    else setError("Episode tidak ditemukan.")
                }
            } else {
                if (source !== 'netshort') {
                    setError("Maaf, pemutaran video untuk sumber ini belum didukung sepenuhnya.")
                }
            }
            setLoading(false)
        }
        load()
        load()
    }, [id, source])

    // Fetch Fresh Stream on Episode Change
    useEffect(() => {
        const loadStream = async () => {
            if (source === 'dramabos' && current) {
                setCurrentStreamUrl(null) // Reset first
                const indexToFetch = current.chapterIndex !== undefined && current.chapterIndex !== null ? current.chapterIndex : 1
                // Avoid fetching stream for index 0 if it causes 404s/delays. 
                // Episode 1 (index 0) usually has a valid playVoucher from the detail API.
                let streamUrl = null
                console.log("Stream Fetch Start:", { indexToFetch, hasPlayVoucher: !!current.playVoucher, voucher: current.playVoucher })

                if (indexToFetch > 0) {
                    streamUrl = await getDramaBosStream(id, indexToFetch)
                } else {
                    console.log("Skipping stream fetch for Index 0")
                }

                if (streamUrl) {
                    setCurrentStreamUrl(streamUrl)
                } else {
                    // Fallback
                    setCurrentStreamUrl(current.playVoucher)
                }
            } else if (current) {
                // Non-dramabos sources
                setCurrentStreamUrl(current.playVoucher || current.url)
            }
        }
        loadStream()
    }, [current, source, id])

    return (
        <div className="player-page" style={{
            padding: '20px',
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: '100vh'
        }}>
            {/* Metadata Header (Compact) */}
            {meta && (
                <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={() => window.history.back()} style={{
                        background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <img
                        src={meta.cover || meta.shortPlayCover || meta.coverWap}
                        style={{ width: '60px', height: '90px', borderRadius: '4px', objectFit: 'cover' }}
                        alt="Cover"
                    />
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem' }}>{meta.title || meta.shortPlayName || meta.bookName}</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <span className="badge" style={{ fontSize: '0.8rem' }}>{source.toUpperCase()}</span>
                            {meta.categoryName && <span className="badge" style={{ background: '#333' }}>{meta.categoryName}</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Layout Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 3fr) minmax(280px, 1fr)',
                gap: '24px',
                alignItems: 'start'
            }}>
                {/* Left: Video Player */}
                <div className="video-section">
                    <div className="video-container" style={{
                        background: '#000',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        minHeight: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow)'
                    }}>
                        {loading ? (
                            <div className="loading-spinner"></div>
                        ) : error ? (
                            <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px' }}>
                                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                </div>
                                <h3>Tidak dapat memutar video</h3>
                                <p style={{ opacity: 0.8 }}>{error}</p>
                            </div>
                        ) : (
                            <VideoPlayer
                                src={currentStreamUrl}
                                onEnded={() => {
                                    if (episodes && current) {
                                        const idx = episodes.findIndex(e => e === current)
                                        if (idx >= 0 && idx < episodes.length - 1) {
                                            setCurrent(episodes[idx + 1])
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                    {/* Synopsis below video */}
                    <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0 }}>Sinopsis</h3>
                        <p style={{ lineHeight: '1.6', opacity: 0.8 }}>
                            {meta?.introduction || meta?.abstract || "Tidak ada deskripsi tersedia."}
                        </p>
                        {/* Tags */}
                        {meta?.tags && (
                            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {Array.isArray(meta.tags) ? meta.tags.map((t, i) => (
                                    <span key={i} style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}>#{t}</span>
                                )) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Episode List */}
                <div className="sidebar" style={{ height: 'calc(100vh - 100px)', position: 'sticky', top: '20px' }}>
                    {loading ? (
                        <div style={{
                            background: 'var(--bg-card)',
                            padding: '20px',
                            borderRadius: '12px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}>
                            <div style={{ width: '40%', height: '24px', background: 'var(--border)', borderRadius: '4px', opacity: 0.5 }}></div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} style={{ aspectRatio: '1', background: 'var(--border)', borderRadius: '8px', opacity: 0.3 }}></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <EpisodeList
                            episodes={episodes}
                            current={current}
                            onPlay={setCurrent}
                        />
                    )}
                </div>
            </div>

            {/* Mobile Responsive Style Injection */}
            <style>{`
                @media (max-width: 900px) {
                    .player-page > div[style*="grid-template-columns"] {
                        grid-template-columns: 1fr !important;
                    }
                    .sidebar {
                        height: auto !important;
                        position: static !important;
                    }
                    .episode-grid {
                        max-height: 400px;
                    }
                }
            `}</style>
        </div>
    )
}
