import CategoryIcon from '../CategoryIcon';

export default function BarChart({ data }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div className="bar-chart">
            {data.map((d) => (
                <div key={d.label} className="bar-col">
                    <div className="bar-track">
                        <div
                            className="bar-fill"
                            style={{ height: `${(d.value / max) * 100}%` }}
                            title={`${d.label}: ${d.value}`}
                        />
                    </div>
                    <span className="bar-label">
            <CategoryIcon category={d.label} className="bar-cat-icon" />
          </span>
                </div>
            ))}
        </div>
    );
}