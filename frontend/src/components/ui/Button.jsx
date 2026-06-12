export default function Button({ children, variant = 'primary', isLoading, ...props }) {
    const baseClasses = 'auth-submit';
    const variantClasses = variant === 'secondary' ? 'auth-submit--secondary' : '';
    const disabledClasses = isLoading ? 'opacity-50 cursor-not-allowed' : '';

    return (
        <button
            className={`${baseClasses} ${variantClasses} ${disabledClasses}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? 'Cargando…' : children}
        </button>
    );
}