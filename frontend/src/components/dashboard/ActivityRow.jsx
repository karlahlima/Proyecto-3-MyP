export default function ActivityRow({ icon, title, sub, value, badge }) {
    return (
        <div className="activity-row">
            <div className="activity-icon">{icon}</div>
            <div className="activity-info">
                <span className="activity-title">{title}</span>
                <span className="activity-sub">{sub}</span>
            </div>
            <div className="activity-right">
                {value && <span className="activity-value">{value}</span>}
                {badge && <span className={`activity-badge activity-badge--${badge.type}`}>{badge.label}</span>}
            </div>
        </div>
    );
}