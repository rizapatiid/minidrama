import DramaCard from "./DramaCard"

export default function Row({ title, items, badge }) {
    if (!items.length) return null

    return (
        <section className="row">
            <h2>{title}</h2>
            <div className="row-scroll">
                {items.map((it, i) => (
                    <DramaCard key={i} data={it} badge={badge} />
                ))}
            </div>
        </section>
    )
}
