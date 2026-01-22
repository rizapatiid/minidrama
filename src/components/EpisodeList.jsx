import { useEffect, useRef } from 'react'
import { Play, Lock } from 'lucide-react'

export default function EpisodeList({ episodes, currentEpisode, onEpisodeSelect }) {
    const activeRef = useRef(null)

    // Scroll to active episode on mount or change
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }
    }, [currentEpisode])

    if (!episodes || episodes.length === 0) return (
        <div className="p-8 text-center text-neutral-500 text-xs uppercase tracking-widest">
            Tidak ada episode
        </div>
    )

    return (
        <div className="grid grid-cols-4 md:grid-cols-5 gap-2 p-2">
            {episodes.map((item, idx) => {
                // Determine Active State
                const isActive = currentEpisode && item.chapterIndex === currentEpisode.chapterIndex
                const isLocked = item.isLock

                return (
                    <button
                        key={idx}
                        ref={isActive ? activeRef : null}
                        disabled={isLocked}
                        onClick={() => onEpisodeSelect(item)}
                        className={`
                            relative aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300
                            ${isActive
                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105 z-10 font-bold border-2 border-transparent'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/5'
                            }
                            ${isLocked ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
                        `}
                    >
                        {/* Playing Indicator */}
                        {isActive && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                        )}

                        {/* Lock Icon */}
                        {isLocked && (
                            <Lock size={12} className="absolute top-1 right-1 text-white/50" />
                        )}

                        {/* Episode Number */}
                        <span className={isActive ? 'scale-110' : ''}>
                            {item.episodeNo}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
