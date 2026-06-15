import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Input from '../ui/Input';
import Button from '../ui/Button';

function EyeIcon({ open }) {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.6 18.6 0 0 1 4.22-5.06"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19"/>
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

function PasswordInput({ value, onChange, placeholder = '••••••••', minLength }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="password-wrap">
            <input
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                minLength={minLength}
                required
                className="password-input"
            />
            <button
                type="button"
                className="password-toggle"
                onClick={() => setVisible(v => !v)}
                title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
                <EyeIcon open={visible} />
            </button>
        </div>
    );
}

export default function AuthModal({ defaultTab = 'login', onClose }) {
    const [tab, setTab] = useState(defaultTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, register } = useAuth();

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [regForm, setRegForm] = useState({ name: '', email: '', username: '', age: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await login(loginForm);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await register(regForm);
            setTab('login'); // Cambiar a login tras registro exitoso
            setLoginForm({ email: regForm.email, password: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="auth-modal">
                <button className="auth-close" onClick={onClose}>✕</button>
                <div className="auth-tabs">
                    <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Ingresar</button>
                    <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Registrarse</button>
                </div>

                {tab === 'login' && (
                    <form onSubmit={handleLogin} className="auth-body">
                        <h2 className="auth-title">Bienvenido de nuevo</h2>
                        {error && <p className="auth-error">{error}</p>}
                        <Input label="Email" type="email" placeholder="tu@email.com" value={loginForm.email} onChange={(e) => setLoginForm(p => ({ ...p, email: e.target.value }))} required />
                        <div className="auth-field">
                            <label>Contraseña</label>
                            <PasswordInput value={loginForm.password} onChange={(e) => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                        </div>
                        <Button type="submit" isLoading={loading}>Ingresar →</Button>
                    </form>
                )}

                {tab === 'register' && (
                    <form onSubmit={handleRegister} className="auth-body">
                        <h2 className="auth-title">Crea tu cuenta</h2>
                        {error && <p className="auth-error">{error}</p>}
                        <Input label="Nombre Completo" type="text" placeholder="Nombre" value={regForm.name} onChange={(e) => setRegForm(p => ({ ...p, name: e.target.value }))} required />
                        <Input label="Nombre de usuario (opcional)" type="text" placeholder="ej. juan_perez" value={regForm.username} onChange={(e) => setRegForm(p => ({ ...p, username: e.target.value }))} />
                        <Input label="Email" type="email" placeholder="@email.com" value={regForm.email} onChange={(e) => setRegForm(p => ({ ...p, email: e.target.value }))} required />
                        <Input label="Edad" type="number" placeholder="18+" min="18" value={regForm.age} onChange={(e) => setRegForm(p => ({ ...p, age: e.target.value }))} required />
                        <div className="auth-field">
                            <label>Contraseña</label>
                            <PasswordInput value={regForm.password} onChange={(e) => setRegForm(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" minLength={6} />
                        </div>
                        <Button type="submit" isLoading={loading}>Crear cuenta →</Button>
                    </form>
                )}
            </div>
        </div>
    );
}