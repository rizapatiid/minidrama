import { useNavigate } from "react-router-dom"

export default function DramaCard({ data }) {
    const nav = useNavigate()
    const id = data.shortPlayId || data.playlet_id || data.bookId

    return (
        <div
            className="drama-card group"
            onClick={() => nav(`/play/${data.source}/${id}`)}
            style={{
                flex: '0 0 160px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Image Container */}
            <div style={{
                position: 'relative',
                height: '240px',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                marginBottom: '12px'
            }}>
                <span className={`badge ${data.source}`}>{data.source}</span>

                <img
                    src={data.cover || data.shortPlayCover}
                    alt={data.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease'
                    }}
                    className="card-image"
                    loading="lazy"
                />

                {/* Hover Overlay */}
                <div className="hover-overlay" style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)'
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                    <span style={{
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Tonton
                    </span>
                </div>
            </div>

            {/* Content Info */}
            <div style={{ padding: '0 4px' }}>
                <h4 style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    lineHeight: '1.3',
                    marginBottom: '4px',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {data.title || data.shortPlayName}
                </h4>
                <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    opacity: 0.8
                }}>
                    {data.categoryName || (Array.isArray(data.tags) ? data.tags[0] : "Drama")}
                </p>
            </div>

            <style>{`
                .drama-card:hover .card-image {
                    transform: scale(1.1);
                }
                .drama-card:hover .hover-overlay {
                    opacity: 1;
                }
            `}</style>
        </div>
    )
}
