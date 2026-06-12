
import Button from './Button';

const ICONS = {
    search: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
    ),
    empty: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
    )
};

export default function EmptyState({ iconType = 'empty', title, description, actionLabel, onAction }) {
    return (
        <div className="state-empty">
            <div className="state-icon-wrap">
                {ICONS[iconType] || ICONS.empty}
            </div>
            <h3 className="state-title">{title}</h3>
            {description && <p className="state-description">{description}</p>}

            {actionLabel && onAction && (
                <Button variant="secondary" onClick={onAction} className="state-action-btn">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}