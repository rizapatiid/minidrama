import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function VideoPlayer({ src, poster, onEnded }) {
    const videoRef = useRef(null)
    const hlsRef = useRef(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video || !src) return

        // Cleanup previous HLS instance if any
        if (hlsRef.current) {
            hlsRef.current.destroy()
            hlsRef.current = null
        }

        const handleFormattedError = (msg, e) => {
            console.error(`[VideoPlayer] ${msg}`, e)
        }

        // Logic to play HLS (m3u8) or Native (mp4)
        if (Hls.isSupported() && (src.includes('.m3u8') || src.includes('.m3u'))) {
            // MSE Environment (Desktop Chrome/Firefox, Android, etc.)
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true
            })
            hlsRef.current = hls
            hls.loadSource(src)
            hls.attachMedia(video)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(err => console.warn("HLS Autoplay prevented:", err))
            })

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error("[HLS Fatal Error]", data)
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            })
        } else {
            // Standard MP4 or Fallback (now also handles native HLS if it falls through)
            video.src = src
            // FORCE NO REFERRER to bypass 403 checks often found on video CDNs
            video.referrerPolicy = "no-referrer"

            video.load()
            video.play().catch(err => console.warn("Standard Autoplay prevented:", err))
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy()
            }
        }
    }, [src])

    useEffect(() => {
        // Handle onEnded manually for logic synchronization if needed
        // but the video tag <video onEnded={...}> works well for both HLS and Native
    }, [])

    if (!src) return <div className="empty" style={{ color: '#fff' }}>Pilih episode</div>

    return (
        <video
            ref={videoRef}
            controls
            playsInline
            onEnded={onEnded}
            style={{ width: '100%', height: '100%', maxHeight: '80vh', objectFit: 'contain', backgroundColor: '#000' }}
        />
    )
}
