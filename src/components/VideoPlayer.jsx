export default function VideoPlayer({ src }) {
    if (!src) return <div className="empty">Pilih episode</div>
    return (
        <video
            src={src}
            controls
            autoPlay
            playsInline
            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '85vh' }}
        />
    )
}
