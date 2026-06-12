export default function SkeletonGrid({ count = 8 }) {
    return (
        <div className="skeleton-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton-card" />
            ))}
        </div>
    );
}