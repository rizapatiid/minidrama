import { useEffect, useState } from "react"
// import { getFlickLatest, getNetShort, getMelolo } from "../api/sansekai"
import { getDramaBosForYou, getDramaBosNew, getDramaBosRank } from "../api/dramabos"
import DramaCard from "../components/DramaCard"
import "../index.css"

// Helper to shuffle array
const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

export default function Home() {
    const [featured, setFeatured] = useState(null)

    // Categories
    const [trending, setTrending] = useState([])     // Hot Mix
    const [dubbing, setDubbing] = useState([])       // Sulih Suara
    const [domestic, setDomestic] = useState([])     // Rumah Tangga
    const [tycoon, setTycoon] = useState([])         // CEO & Sultan
    const [revenge, setRevenge] = useState([])       // Balas Dendam
    const [fantasy, setFantasy] = useState([])       // Fantasi
    const [family, setFamily] = useState([])         // Keluarga
    const [romance, setRomance] = useState([])       // Romansa
    const [discovery, setDiscovery] = useState([])   // The Rest
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            // 1. Fetch All
            // Dramabox (New API)
            const [dForYou, dNew, dRank] = await Promise.all([
                getDramaBosForYou(),
                getDramaBosNew(),
                getDramaBosRank()
            ])

            const mapDramaBos = (list, extraTags = []) =>
                Array.isArray(list) ? list.map(item => ({
                    ...item,
                    title: item.bookName, // Map bookName to title
                    id: item.bookId,      // Ensure ID is standard
                    source: 'dramabos',   // New source identifier
                    tags: [...(item.tags || []), ...extraTags]
                })) : []

            const dramaData = [
                ...mapDramaBos(dForYou, ['Rekomendasi', 'For You']),
                ...mapDramaBos(dNew, ['Terbaru', 'New']),
                ...mapDramaBos(dRank, ['Trending', 'Peringkat', 'Sedang Hangat'])
            ]

            // 2. Flatten Everything & Dedup
            const combinedRaw = [...dramaData]

            // Unique by source + id to prevent duplicates from multiple lists
            const allItems = []
            const seen = new Set()

            for (const item of combinedRaw) {
                // Determine ID (different APIs use different ID fields)
                const id = item.bookId || item.playlet_id || item.book_id || item.shortPlayId || item.id
                const key = `${item.source}-${id}`

                if (!seen.has(key)) {
                    seen.add(key)
                    // If item has duplicate entries (e.g. in Trending AND Dubbing), we want to preserve the union of tags?
                    // For simplicity, first win. BUT the order above puts Latest first.
                    // Actually, if we want the tags to persist, we might need to merge tags if duplicate.
                    // But simpler: just take it. The tags are mainly for filtering into categories.
                    // If 'Latest' version is picked, it won't have 'Dubbing' tag. Use ID-based merge or just allow dupes in the intermediate step?
                    // Let's merge tags if duplicate.
                    allItems.push(item)
                } else {
                    // Update tags of existing item
                    const existing = allItems.find(i => {
                        const mid = i.bookId || i.playlet_id || i.book_id || i.shortPlayId || i.id
                        return `${i.source}-${mid}` === key
                    })
                    if (existing && item.tags) {
                        const newTags = Array.isArray(item.tags) ? item.tags : []
                        const oldTags = Array.isArray(existing.tags) ? existing.tags : []
                        existing.tags = [...new Set([...oldTags, ...newTags])]
                    }
                }
            }

            // Feature Logic (Randomized)
            if (allItems.length > 0) {
                setFeatured(allItems[Math.floor(Math.random() * allItems.length)])
            }

            // 3. Keyword Helper
            const check = (item, keywords) => {
                const text = (item.title || "") + " " + (item.introduction || "") + " " + (item.categoryName || "")
                const tags = Array.isArray(item.tags) ? item.tags.join(' ') : (item.tags || "")
                const content = (text + " " + tags).toLowerCase()
                return keywords.some(k => content.includes(k.toLowerCase()))
            }

            // 4. Distribute to Categories

            // Sulih Suara (Priority)
            const dubList = allItems.filter(item => check(item, ['sulih suara', 'dubbing', 'dubbed']))
            setDubbing(shuffle(dubList).slice(0, 15))

            // Rumah Tangga / Domestic
            const domList = allItems.filter(item => check(item, ['selingkuh', 'cerai', 'suami', 'istri', 'mertua', 'poligami', 'khianat', 'mandul', 'hamil']))
            setDomestic(shuffle(domList).slice(0, 15))

            // CEO & Sultan / Tycoon
            const ceoList = allItems.filter(item => check(item, ['ceo', 'kaya', 'miliarder', 'presdir', 'boss', 'warisan', 'sultan', 'miskin jadi kaya']))
            setTycoon(shuffle(ceoList).slice(0, 15))

            // Balas Dendam / Revenge
            const revList = allItems.filter(item => check(item, ['dendam', 'serangan balik', 'revenge', 'bangkit', 'hina', 'remeh', 'balas']))
            setRevenge(shuffle(revList).slice(0, 15))

            // Fantasi / Fantasy
            const fanList = allItems.filter(item => check(item, ['naga', 'dewa', 'kerajaan', 'putri', 'pangeran', 'sihir', 'siluman', 'takdir', 'waktu', 'reinkarnasi', 'kelahiran kembali']))
            setFantasy(shuffle(fanList).slice(0, 15))

            // Keluarga / Family
            const famList = allItems.filter(item => check(item, ['ibu', 'anak', 'ayah', 'keluarga', 'kakak', 'adik', 'bayi', 'hamil', 'adopsi', 'tiri']))
            setFamily(shuffle(famList).slice(0, 15))

            // Romansa / Romance (Catch-all for love)
            const romList = allItems.filter(item => check(item, ['cinta', 'love', 'romansa', 'jodoh', 'kekasih', 'pacar', 'menikah', 'nikah']))
            setRomance(shuffle(romList).slice(0, 15))

            // Trending (Random Mix)
            setTrending(shuffle([...allItems]).slice(0, 15))

            // Discovery (The rest mixed)
            setDiscovery(shuffle([...allItems]).slice(0, 25))

            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="page" style={{ paddingTop: '80px' }}>
                {/* Hero Skeleton */}
                <div style={{
                    height: '400px',
                    width: '100%',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '40px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }}></div>
                </div>

                {/* Section Skeletons */}
                {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ marginBottom: '40px' }}>
                        <div style={{ width: '200px', height: '24px', background: 'var(--bg-card)', borderRadius: '4px', marginBottom: '20px' }}></div>
                        <div style={{ display: 'flex', gap: '20px', overflow: 'hidden' }}>
                            {[...Array(6)].map((_, j) => (
                                <div key={j} style={{
                                    minWidth: '160px',
                                    height: '240px',
                                    background: 'var(--bg-card)',
                                    borderRadius: '8px',
                                    flexShrink: 0
                                }}></div>
                            ))}
                        </div>
                    </div>
                ))}

                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}</style>
            </div>
        )
    }


    // Search Logic
    const allContent = [...trending, ...dubbing, ...domestic, ...tycoon, ...revenge, ...fantasy, ...family, ...romance, ...discovery]
    const searchResults = searchQuery ? allContent.filter(item => {
        const text = (item.title || "") + " " + (item.introduction || "") + " " + (item.categoryName || "")
        const tags = Array.isArray(item.tags) ? item.tags.join(' ') : (item.tags || "")
        return (text + " " + tags).toLowerCase().includes(searchQuery.toLowerCase())
    }).filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.source === v.source)) === i) : [] // distinct

    return (
        <div className="page" style={{ paddingTop: '80px' }}>
            {/* Sticky Search Header */}
            <div className="sticky-search">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Cari judul, genre, atau kata kunci..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="search-clear-btn"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {searchQuery ? (
                <div style={{ padding: '0 20px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Hasil Pencarian: "{searchQuery}" ({searchResults.length})</h2>
                    {searchResults.length > 0 ? (
                        <div className="row" style={{ flexWrap: 'wrap' }}>
                            {searchResults.map((d, i) => (
                                <DramaCard key={i} data={d} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                            <p>Tidak ditemukan hasil untuk pencarian ini.</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Hero Section */}
                    {featured && (
                        <div className="hero-section">
                            <img
                                src={featured.cover || featured.shortPlayCover}
                                className="hero-image"
                                alt="Featured"
                            />
                            <div className="hero-overlay">
                                <div className="hero-content">
                                    <span className="hero-badge">Trending Now</span>
                                    <h1 className="hero-title">
                                        {featured.title || featured.shortPlayName}
                                    </h1>
                                    <p className="hero-subtitle">
                                        {featured.introduction || featured.abstract || "Saksikan drama trending pilihan kami, dikurasi khusus untuk Anda."}
                                    </p>
                                    <div className="hero-actions">
                                        <button className="btn-hero btn-primary" onClick={() => window.location.href = `/play/${featured.source}/${featured.id}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                            Tonton Sekarang
                                        </button>
                                        <button className="btn-hero btn-secondary">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                            Info Detail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Granular Sections */}
                    <Section title="Sedang Hangat" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.3.9.8.2 1.9 1.8z" /></svg>} items={trending} color="#ef4444" />
                    <Section title="Sulih Suara (Dubbing)" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>} items={dubbing} color="#f59e0b" />
                    <Section title="Konflik Rumah Tangga" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M12 5 9.04 22" /><path d="M14.96 22 12 5" /></svg>} items={domestic} color="#8b5cf6" />
                    <Section title="CEO & Sultan" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>} items={tycoon} color="#2563eb" />
                    <Section title="Balas Dendam" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>} items={revenge} color="#dc2626" />
                    <Section title="Fantasi & Legenda" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>} items={fantasy} color="#10b981" />
                    <Section title="Drama Keluarga" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21h6" /><path d="M12 3v18" /><path d="M12 8h7.5" /><path d="M4.5 8H12" /><path d="m16.5 13-4.5 4.5" /><path d="m12 17.5-4.5-4.5" /></svg>} items={family} color="#06b6d4" />
                    <Section title="Romansa Manis" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>} items={romance} color="#db2777" />
                    <Section title="Jelajahi Semua" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>} items={discovery} color="#6366f1" />
                </>
            )}

        </div>
    )
}

function Section({ title, items, color, icon }) {
    if (!items || items.length === 0) return null
    return (
        <div className="section">
            <div className="section-header">
                <div style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</div>
                <h2 className="section-title">{title}</h2>
            </div>
            <div className="row">
                {items.map((d, i) => (
                    <DramaCard key={i} data={d} />
                ))}
            </div>
        </div>
    )
}
