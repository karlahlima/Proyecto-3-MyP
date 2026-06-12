export default function StatCard({ icon, label, value, sub, accent }) {
    return (
        <div className={`stat-card${accent ? ' stat-card--accent' : ''}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-body">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
                {sub && <span className="stat-sub">{sub}</span>}
            </div>
        </div>
    );
}