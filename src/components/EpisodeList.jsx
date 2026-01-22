import { useEffect, useRef } from 'react'
import "../index.css"

export default function EpisodeList({ episodes, current, onPlay }) {
    const scrollRef = useRef(null)
    const activeRef = useRef(null)

    // Scroll to active episode on mount or change
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            })
        }
    }, [current])

    if (!episodes || episodes.length === 0) return null

    return (
        <div className="episode-list-container" style={{
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '12px',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow)'
        }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Episodes</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.7, background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '12px' }}>{episodes.length}</span>
            </h3>

            <div className="episode-grid custom-scrollbar" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                gap: '10px',
                overflowY: 'auto',
                paddingRight: '5px',
                flex: 1
            }}>
                {episodes.map((e, i) => {
                    // Check logic for both NetShort (episodeNo) and other sources if applicable
                    const isActive = current && (
                        (e.episodeNo && current.episodeNo === e.episodeNo) ||
                        (e.shortPlayId && current.shortPlayId === e.shortPlayId)
                    )
                    const isLocked = e.isLock

                    return (
                        <button
                            key={i}
                            ref={isActive ? activeRef : null}
                            disabled={isLocked}
                            onClick={() => onPlay(e)}
                            style={{
                                appearance: 'none',
                                border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                                background: isActive ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-main)',
                                color: isActive ? 'var(--primary)' : 'var(--text-main)',
                                borderRadius: '8px',
                                padding: '12px 4px',
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                opacity: isLocked ? 0.5 : 1,
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: isActive ? 'bold' : 'normal',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? '0 0 10px rgba(37, 99, 235, 0.2)' : 'none'
                            }}
                            onMouseEnter={(e) => !isLocked && (e.currentTarget.style.borderColor = 'var(--text-muted)')}
                            onMouseLeave={(e) => !isLocked && !isActive && (e.currentTarget.style.borderColor = 'var(--border)')}
                        >
                            {e.episodeNo}
                            {isLocked && (
                                <span style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex' }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border);
                    borderRadius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--text-muted);
                }
            `}</style>
        </div>
    )
}
