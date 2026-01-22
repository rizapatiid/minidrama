import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, List, Info, ChevronDown, ChevronUp, MonitorPlay, Lock, X, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import { getDramaBosDetail, getDramaBosChapters, getDramaBosStream } from '../api/dramabos'
import Hls from 'hls.js'

// --- INTERNAL STYLES ---
const INTERNAL_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  .sp-container { 
    background: #000; 
    color: #fff; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    height: 100vh;
    height: 100dvh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: fixed;
    inset: 0;
  }
  
  /* HEADER */
  .sp-header { 
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%);
    z-index: 100;
    transition: all 0.3s;
  }
  
  .sp-header.hidden { transform: translateY(-100%); opacity: 0; }
  
  .sp-btn-icon { 
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #fff;
    background: rgba(255,255,255,0.1);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .sp-btn-icon:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }
  
  .sp-title-area { 
    flex: 1;
    margin: 0 12px;
    min-width: 0;
  }
  
  .sp-title { 
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .sp-subtitle { 
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    margin-top: 2px;
  }

  /* MAIN LAYOUT */
  .sp-main { 
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
  
  @media (min-width: 1024px) { 
    .sp-main { flex-direction: row; } 
  }

  /* VIDEO SECTION */
  .sp-video-section { 
    flex: 1;
    position: relative;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .sp-video-container { 
    width: 100%;
    height: 100%;
    position: relative;
  }

  /* VIDEO WRAPPER */
  .sp-video-wrapper { 
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .sp-video { 
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }
  
  /* LOADING */
  .sp-loading-overlay { 
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.8);
    gap: 16px;
    z-index: 10;
  }
  
  .sp-spinner { 
    width: 48px;
    height: 48px;
    border: 4px solid rgba(59,130,246,0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: sp-spin 1s linear infinite;
  }
  
  @keyframes sp-spin { to { transform: rotate(360deg); } }

  /* CUSTOM VIDEO CONTROLS */
  .sp-controls-overlay { 
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.8) 100%);
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 20;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 16px;
    pointer-events: none;
  }
  
  .sp-controls-overlay.visible { 
    opacity: 1; 
    pointer-events: auto;
  }
  
  .sp-controls-overlay > * {
    pointer-events: auto;
  }
  
  /* TOP CONTROLS - REMOVED */
  
  /* CENTER CONTROLS */
  .sp-center-controls { 
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    gap: 20px;
    align-items: center;
    pointer-events: auto;
  }
  
  @media (max-width: 768px) {
    .sp-center-controls {
      gap: 16px;
    }
  }
  
  .sp-control-btn { 
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255,255,255,0.3);
    color: #fff;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  
  @media (max-width: 768px) {
    .sp-control-btn {
      width: 56px;
      height: 56px;
    }
  }
  
  .sp-control-btn:active { 
    transform: scale(0.9);
    background: rgba(59,130,246,0.5);
    border-color: #3b82f6;
  }
  
  .sp-control-btn-sm { 
    width: 48px;
    height: 48px;
  }
  
  @media (max-width: 768px) {
    .sp-control-btn-sm {
      width: 44px;
      height: 44px;
    }
  }
  
  /* BOTTOM CONTROLS */
  .sp-bottom-controls { 
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: auto;
  }
  
  @media (max-width: 768px) {
    .sp-bottom-controls {
      gap: 8px;
    }
  }
  
  .sp-progress-container { 
    width: 100%;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    transition: height 0.2s;
  }
  
  .sp-progress-container:hover { height: 6px; }
  
  .sp-progress-bar { 
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    border-radius: 2px;
    position: relative;
    transition: width 0.1s linear;
  }
  
  .sp-progress-thumb { 
    position: absolute;
    right: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .sp-progress-container:hover .sp-progress-thumb { opacity: 1; }
  
  .sp-controls-row { 
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .sp-controls-left,
  .sp-controls-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .sp-time { 
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    min-width: 90px;
    white-space: nowrap;
  }
  
  @media (max-width: 768px) {
    .sp-time {
      font-size: 11px;
      min-width: 70px;
    }
  }
  
  .sp-control-btn-small {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    .sp-control-btn-small {
      width: 32px;
      height: 32px;
    }
  }
  
  .sp-control-btn-small:active {
    background: rgba(59,130,246,0.5);
    border-color: #3b82f6;
    transform: scale(0.9);
  }
  
  .sp-control-btn-small.active {
    background: rgba(59,130,246,0.7);
    border-color: #3b82f6;
  }
  
  .sp-mobile-only {
    display: flex;
  }
  
  @media (min-width: 1024px) {
    .sp-mobile-only {
      display: none;
    }
  }

  /* MOBILE INFO SECTION */
  .sp-info-mobile { 
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 70%, transparent 100%);
    padding: 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 90;
    transition: transform 0.3s;
    max-height: 45vh;
    display: flex;
    flex-direction: column;
  }
  
  .sp-info-mobile.hidden { 
    transform: translateY(100%);
  }
  
  .sp-info-header {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    position: relative;
  }
  
  .sp-info-mobile-cover {
    width: 60px;
    height: 90px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.1);
  }
  
  .sp-info-header-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  
  .sp-info-toggle-btn {
    position: absolute;
    top: 0;
    right: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .sp-info-toggle-btn:active {
    background: rgba(59,130,246,0.5);
    transform: scale(0.9);
  }
  
  .sp-info-title-area {
    flex: 1;
  }
  
  .sp-info-title {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
  }
  
  .sp-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  
  .sp-tag { 
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(59,130,246,0.15);
    color: #60a5fa;
    border: 1px solid rgba(59,130,246,0.3);
    font-weight: 500;
  }
  
  .sp-synopsis { 
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    line-height: 1.6;
    max-height: 120px;
    overflow-y: auto;
    padding-right: 8px;
  }
  
  .sp-synopsis::-webkit-scrollbar { width: 4px; }
  .sp-synopsis::-webkit-scrollbar-track { background: transparent; }
  .sp-synopsis::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 10px; }
  
  .sp-info-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }
  
  .sp-btn-action {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }
  
  .sp-btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #fff;
    box-shadow: 0 4px 12px rgba(59,130,246,0.4);
  }
  
  .sp-btn-primary:active {
    transform: scale(0.98);
  }
  
  @media (min-width: 1024px) {
    .sp-info-mobile { display: none; }
  }

  /* DESKTOP SIDEBAR */
  .sp-sidebar { 
    display: none;
    background: #0a0a0a;
    border-left: 1px solid rgba(255,255,255,0.05);
    flex-direction: column;
  }
  
  @media (min-width: 1024px) { 
    .sp-sidebar { 
      display: flex;
      width: 400px;
      height: 100%;
    }
  }
  
  /* DESKTOP INFO IN SIDEBAR */
  .sp-sidebar-info {
    padding: 20px;
    background: rgba(15,15,15,0.95);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    gap: 16px;
  }
  
  .sp-sidebar-cover {
    width: 80px;
    height: 120px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.1);
  }
  
  .sp-sidebar-info-content {
    flex: 1;
    min-width: 0;
  }
  
  .sp-sidebar-title {
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    line-height: 1.3;
  }
  
  .sp-sidebar-synopsis {
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    line-height: 1.5;
    max-height: 80px;
    overflow-y: auto;
  }
  
  .sp-sidebar-synopsis::-webkit-scrollbar { width: 4px; }
  .sp-sidebar-synopsis::-webkit-scrollbar-track { background: transparent; }
  .sp-sidebar-synopsis::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 10px; }
  
  .sp-list-header { 
    padding: 20px;
    background: rgba(10,10,10,0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .sp-list-title { 
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .sp-count-badge { 
    font-size: 11px;
    font-family: monospace;
    color: #3b82f6;
    background: rgba(59,130,246,0.15);
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid rgba(59,130,246,0.3);
    font-weight: 600;
  }

  .sp-grid { 
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }
  
  .sp-ep-btn { 
    aspect-ratio: 1/1;
    border-radius: 10px;
    border: 1.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.5);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .sp-ep-btn:hover:not(:disabled) { 
    background: rgba(59,130,246,0.15);
    color: #fff;
    border-color: rgba(59,130,246,0.5);
    transform: translateY(-2px);
  }
  
  .sp-ep-btn.active { 
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #fff;
    font-weight: 700;
    border-color: transparent;
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(59,130,246,0.4);
  }
  
  .sp-ep-btn:disabled { 
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .sp-active-indicator {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: sp-pulse 2s ease-in-out infinite;
  }
  
  @keyframes sp-pulse { 
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }

  /* MOBILE POPUP */
  .sp-popup-overlay { 
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    backdrop-filter: blur(10px);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    animation: sp-fade-in 0.2s ease-out;
  }
  
  @media (min-width: 1024px) { .sp-popup-overlay { display: none; } }
  
  @keyframes sp-fade-in { from { opacity: 0; } to { opacity: 1; } }

  .sp-popup-container {
    background: linear-gradient(to bottom, #0f0f0f, #0a0a0a);
    width: 100%;
    max-height: 70vh;
    border-radius: 20px 20px 0 0;
    display: flex;
    flex-direction: column;
    animation: sp-slide-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    box-shadow: 0 -8px 40px rgba(0,0,0,0.8);
    border-top: 1px solid rgba(255,255,255,0.1);
    overflow: hidden;
  }
  
  @keyframes sp-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }

  .sp-popup-header {
    padding: 20px 16px 12px;
    background: rgba(15,15,15,0.98);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .sp-popup-handle {
    width: 40px;
    height: 4px;
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
  }

  .sp-popup-list {
    overflow-y: auto;
    flex: 1;
    padding: 8px 12px 12px;
  }

  .sp-popup-ep-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .sp-popup-ep-item:active {
    transform: scale(0.98);
  }

  .sp-popup-ep-item.active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-color: transparent;
    box-shadow: 0 4px 16px rgba(59,130,246,0.4);
  }

  .sp-popup-ep-item:not(.active):hover {
    background: rgba(59,130,246,0.1);
    border-color: rgba(59,130,246,0.3);
  }

  .sp-popup-ep-item.locked {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .sp-popup-ep-number {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    flex-shrink: 0;
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.05);
  }

  .sp-popup-ep-item.active .sp-popup-ep-number {
    background: rgba(0,0,0,0.2);
    border-color: rgba(255,255,255,0.15);
    color: #fff;
  }

  .sp-popup-ep-info {
    flex: 1;
    min-width: 0;
  }

  .sp-popup-ep-title {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sp-popup-ep-meta {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sp-popup-ep-item.active .sp-popup-ep-meta {
    color: rgba(255,255,255,0.8);
  }

  .sp-popup-ep-badge {
    background: rgba(59,130,246,0.2);
    color: #60a5fa;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .sp-popup-ep-item.active .sp-popup-ep-badge {
    background: rgba(255,255,255,0.25);
    color: #fff;
  }

  /* SCROLLBAR */
  .custom-scroll::-webkit-scrollbar { width: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 10px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.5); }
  
  /* SETTINGS POPUP */
  .sp-settings-popup {
    position: fixed;
    bottom: 90px;
    right: 20px;
    background: rgba(10,10,10,0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 8px;
    min-width: 180px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: sp-scale-in 0.2s ease-out;
    z-index: 150;
  }
  
  @media (min-width: 1024px) {
    .sp-settings-popup {
      position: fixed;
      top: auto;
      bottom: 80px;
      right: 430px;
    }
  }
  
  @keyframes sp-scale-in {
    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  
  .sp-settings-header {
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .sp-settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: #fff;
    font-size: 14px;
  }
  
  .sp-settings-item:hover {
    background: rgba(255,255,255,0.1);
  }
  
  .sp-settings-item.active {
    background: rgba(59,130,246,0.2);
    color: #60a5fa;
  }
  
  .sp-settings-value {
    color: #3b82f6;
    font-weight: 600;
    font-size: 13px;
  }
  
  .sp-settings-item.active .sp-settings-value {
    color: #60a5fa;
  }
`

// --- VIDEO PLAYER COMPONENT ---
function InternalVideoPlayer({ src, poster, onEnded, onToggleInfo, showInfo, playbackRate = 1, onOpenSettings }) {
    const videoRef = useRef(null)
    const hlsRef = useRef(null)
    const containerRef = useRef(null)
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [showControls, setShowControls] = useState(true)
    const hideControlsTimeout = useRef(null)

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

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const updateTime = () => setCurrentTime(video.currentTime)
        const updateDuration = () => setDuration(video.duration)
        const handlePlay = () => setPlaying(true)
        const handlePause = () => setPlaying(false)

        video.addEventListener('timeupdate', updateTime)
        video.addEventListener('loadedmetadata', updateDuration)
        video.addEventListener('play', handlePlay)
        video.addEventListener('pause', handlePause)
        video.addEventListener('ended', onEnded)

        return () => {
            video.removeEventListener('timeupdate', updateTime)
            video.removeEventListener('loadedmetadata', updateDuration)
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePause)
            video.removeEventListener('ended', onEnded)
        }
    }, [onEnded])

    useEffect(() => {
        const video = videoRef.current
        if (video) {
            video.playbackRate = playbackRate
        }
    }, [playbackRate])

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return
        if (video.paused) video.play()
        else video.pause()
    }

    const toggleMute = () => {
        const video = videoRef.current
        if (!video) return
        video.muted = !video.muted
        setMuted(video.muted)
    }

    const toggleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else {
                containerRef.current.requestFullscreen()
            }
        }
    }

    const handleProgressClick = (e) => {
        const video = videoRef.current
        if (!video) return
        const rect = e.currentTarget.getBoundingClientRect()
        const pos = (e.clientX - rect.left) / rect.width
        video.currentTime = pos * video.duration
    }

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleInteraction = () => {
        setShowControls(true)
        if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current)
        hideControlsTimeout.current = setTimeout(() => {
            if (playing) setShowControls(false)
        }, 3000)
    }

    return (
        <div
            ref={containerRef}
            className="sp-video-wrapper"
            onMouseMove={handleInteraction}
            onTouchStart={handleInteraction}
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                className="sp-video"
                playsInline
                poster={poster}
            />
            <div className={`sp-controls-overlay ${showControls ? 'visible' : ''}`}>
                <div className="sp-center-controls">
                    <button className="sp-control-btn" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                        {playing ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '3px' }} />}
                    </button>
                </div>

                <div className="sp-bottom-controls" onClick={(e) => e.stopPropagation()}>
                    <div className="sp-progress-container" onClick={handleProgressClick}>
                        <div className="sp-progress-bar" style={{ width: `${(currentTime / duration) * 100 || 0}%` }}>
                            <div className="sp-progress-thumb"></div>
                        </div>
                    </div>
                    <div className="sp-controls-row">
                        <div className="sp-controls-left">
                            <span className="sp-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div className="sp-controls-right">
                            <button
                                className="sp-control-btn-small sp-mobile-only"
                                onClick={onToggleInfo}
                                title="Toggle Info"
                            >
                                <Info size={16} />
                            </button>
                            <button
                                className="sp-control-btn-small"
                                onClick={toggleMute}
                                title="Mute/Unmute"
                            >
                                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            <button
                                className="sp-control-btn-small"
                                onClick={onOpenSettings}
                                title="Pengaturan"
                            >
                                <Settings size={16} />
                            </button>
                            <button className="sp-control-btn-small" onClick={toggleFullscreen}>
                                <Maximize size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- EPISODE LIST COMPONENT ---
function InternalEpisodeList({ episodes, currentEpisode, onEpisodeSelect }) {
    const activeRef = useRef(null)

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [currentEpisode])

    if (!episodes?.length) return <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '14px' }}>Tidak ada episode</div>

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
                        {isActive && <div className="sp-active-indicator"></div>}
                        {isLocked && <Lock size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', top: 6, right: 6 }} />}
                        {item.episodeNo}
                    </button>
                )
            })}
        </div>
    )
}

// --- MOBILE POPUP COMPONENT ---
function MobileEpisodePopup({ episodes, currentEpisode, onEpisodeSelect, onClose }) {
    const activeRef = useRef(null)

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [currentEpisode])

    if (!episodes?.length) return null

    return (
        <div className="sp-popup-overlay" onClick={onClose}>
            <div className="sp-popup-container" onClick={(e) => e.stopPropagation()}>
                <div className="sp-popup-handle"></div>
                <div className="sp-popup-header">
                    <div className="sp-list-title">
                        <List size={16} color="#3b82f6" />
                        Episode
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="sp-count-badge">{episodes.length}</span>
                        <button onClick={onClose} className="sp-btn-icon" style={{ width: '32px', height: '32px' }}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div className="sp-popup-list custom-scroll">
                    {episodes.map((item, idx) => {
                        const isActive = currentEpisode && item.chapterIndex === currentEpisode.chapterIndex
                        const isLocked = item.isLock
                        return (
                            <div
                                key={idx}
                                ref={isActive ? activeRef : null}
                                className={`sp-popup-ep-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                                onClick={() => {
                                    if (!isLocked) {
                                        onEpisodeSelect(item)
                                        onClose()
                                    }
                                }}
                            >
                                <div className="sp-popup-ep-number">
                                    {isLocked ? (
                                        <Lock size={20} color="rgba(255,255,255,0.4)" />
                                    ) : (
                                        <span>{item.episodeNo}</span>
                                    )}
                                </div>
                                <div className="sp-popup-ep-info">
                                    <div className="sp-popup-ep-title">
                                        {item.title || `Episode ${item.episodeNo}`}
                                    </div>
                                    <div className="sp-popup-ep-meta">
                                        {isActive && <span className="sp-popup-ep-badge">Sedang Diputar</span>}
                                        {isLocked && <span>🔒 Terkunci</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// --- MAIN PLAYER COMPONENT ---
export default function Player() {
    const { source, id: bookId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [detail, setDetail] = useState(null)
    const [episodes, setEpisodes] = useState([])
    const [currentEp, setCurrentEp] = useState(null)
    const [streamUrl, setStreamUrl] = useState(null)
    const [videoLoading, setVideoLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showInfo, setShowInfo] = useState(true)
    const [showMobilePopup, setShowMobilePopup] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)

    // Close settings when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showSettings && !e.target.closest('.sp-settings-popup') && !e.target.closest('.sp-control-btn-small')) {
                setShowSettings(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [showSettings])

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            try {
                if (source !== 'dramabos') throw new Error("Sumber tidak didukung")

                const [d, c] = await Promise.all([
                    getDramaBosDetail(bookId),
                    getDramaBosChapters(bookId)
                ])

                console.log('=== DEBUG DETAIL DATA ===')
                console.log('Raw response d:', d)
                console.log('Type of d:', typeof d)
                console.log('Is array?:', Array.isArray(d))
                if (d) {
                    console.log('d.cover:', d.cover)
                    console.log('d.bookName:', d.bookName)
                    console.log('Keys in d:', Object.keys(d))
                }
                console.log('========================')

                if (!d) throw new Error("Gagal mengambil detail")
                setDetail(d)

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

                if (processedEps.length > 0) playEpisode(processedEps[0])
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [bookId, source])

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
            if (episode.bestUrl) {
                setStreamUrl(episode.bestUrl)
                setVideoLoading(false)
                return
            }
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

    if (loading && !detail) return (
        <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="sp-spinner"></div>
        </div>
    )

    if (error) return (
        <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '20px' }}>{error}</div>
            <button onClick={() => navigate('/')} className="sp-btn-primary" style={{ padding: '12px 24px', borderRadius: '8px' }}>Kembali</button>
        </div>
    )

    return (
        <>
            <style>{INTERNAL_STYLES}</style>

            <div className="sp-container">
                <header className="sp-header">
                    <button onClick={() => navigate(-1)} className="sp-btn-icon">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="sp-title-area">
                        <div className="sp-title">{detail?.bookName}</div>
                        <div className="sp-subtitle">EP.{currentEp?.episodeNo || '...'}</div>
                    </div>
                    <div style={{ width: '40px' }}></div>
                </header>

                <div className="sp-main">
                    <div className="sp-video-section">
                        <div className="sp-video-container">
                            {streamUrl ? (
                                <InternalVideoPlayer
                                    key={streamUrl}
                                    src={streamUrl}
                                    poster={detail?.cover}
                                    onEnded={handleNext}
                                    onToggleInfo={() => setShowInfo(!showInfo)}
                                    showInfo={showInfo}
                                    playbackRate={playbackSpeed}
                                    onOpenSettings={() => setShowSettings(!showSettings)}
                                />
                            ) : (
                                <div className="sp-loading-overlay">
                                    {videoLoading ? (
                                        <>
                                            <div className="sp-spinner"></div>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: '12px' }}>Memuat video...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MonitorPlay size={48} opacity={0.3} />
                                            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>Video tidak tersedia</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* SETTINGS POPUP */}
                            {showSettings && (
                                <div className="sp-settings-popup">
                                    <div className="sp-settings-header">Kecepatan</div>
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                        <div
                                            key={speed}
                                            className={`sp-settings-item ${playbackSpeed === speed ? 'active' : ''}`}
                                            onClick={() => {
                                                setPlaybackSpeed(speed)
                                                setShowSettings(false)
                                            }}
                                        >
                                            <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                                            {playbackSpeed === speed && <span className="sp-settings-value">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* MOBILE INFO */}
                        <div className={`sp-info-mobile ${!showInfo ? 'hidden' : ''}`}>
                            <div className="sp-info-header">
                                {detail?.cover && detail.cover.trim() !== '' ? (
                                    <img
                                        src={detail.cover}
                                        className="sp-info-mobile-cover"
                                        alt={detail?.bookName || ''}
                                        crossOrigin="anonymous"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            console.error('Mobile cover failed to load:', detail.cover)
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <div className="sp-info-mobile-cover" style={{
                                        background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.3))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: 'rgba(255,255,255,0.5)'
                                    }}>
                                        {detail?.bookName?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div className="sp-info-header-content">
                                    <div className="sp-info-title">{detail?.bookName}</div>
                                    <div className="sp-tags">
                                        <span className="sp-tag">EP {currentEp?.episodeNo}</span>
                                        {detail?.tags?.slice(0, 2).map((t, i) => <span key={i} className="sp-tag">{t}</span>)}
                                    </div>
                                </div>
                                <button className="sp-info-toggle-btn" onClick={() => setShowInfo(!showInfo)}>
                                    {showInfo ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                </button>
                            </div>
                            <div className="sp-synopsis">
                                {detail?.introduction || 'Deskripsi tidak tersedia'}
                            </div>
                            <div className="sp-info-actions">
                                <button className="sp-btn-action sp-btn-primary" onClick={() => setShowMobilePopup(true)}>
                                    <List size={18} />
                                    Daftar Episode
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP SIDEBAR */}
                    <div className="sp-sidebar">
                        {/* INFO SECTION */}
                        <div className="sp-sidebar-info">
                            {detail?.cover && detail.cover.trim() !== '' ? (
                                <img
                                    src={detail.cover}
                                    className="sp-sidebar-cover"
                                    alt={detail?.bookName || ''}
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        console.error('Desktop cover failed to load:', detail.cover)
                                        e.target.style.display = 'none'
                                    }}
                                />
                            ) : (
                                <div className="sp-sidebar-cover" style={{
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.3))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '36px',
                                    fontWeight: '700',
                                    color: 'rgba(255,255,255,0.5)'
                                }}>
                                    {detail?.bookName?.charAt(0) || '?'}
                                </div>
                            )}
                            <div className="sp-sidebar-info-content">
                                <div className="sp-sidebar-title">{detail?.bookName}</div>
                                <div className="sp-tags" style={{ marginBottom: '8px' }}>
                                    <span className="sp-tag">EP {currentEp?.episodeNo}</span>
                                    {detail?.tags?.slice(0, 2).map((t, i) => <span key={i} className="sp-tag">{t}</span>)}
                                </div>
                                <div className="sp-sidebar-synopsis">
                                    {detail?.introduction || 'Deskripsi tidak tersedia'}
                                </div>
                            </div>
                        </div>

                        {/* EPISODE LIST */}
                        <div className="sp-list-header">
                            <div className="sp-list-title">
                                <List size={18} color="#3b82f6" />
                                Episode
                            </div>
                            <span className="sp-count-badge">{episodes.length}</span>
                        </div>
                        <InternalEpisodeList
                            episodes={episodes}
                            currentEpisode={currentEp}
                            onEpisodeSelect={(ep) => playEpisode(ep)}
                        />
                    </div>
                </div>

                {/* MOBILE POPUP */}
                {showMobilePopup && (
                    <MobileEpisodePopup
                        episodes={episodes}
                        currentEpisode={currentEp}
                        onEpisodeSelect={(ep) => playEpisode(ep)}
                        onClose={() => setShowMobilePopup(false)}
                    />
                )}
            </div>
        </>
    )
}