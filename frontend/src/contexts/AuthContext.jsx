import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, clearAuthStorage, getMyProfile } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verificar sesión al iniciar la app
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getMyProfile()
                .then(userData => setUser(userData))
                .catch(() => {
                    clearAuthStorage(); // Token inválido o expirado
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const data = await apiLogin(credentials);
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', String(data.user?.id ?? ''));
            localStorage.setItem('userName', data.user?.name ?? '');
            localStorage.setItem('userUsername', data.user?.username ?? '');
            localStorage.setItem('userEmail', data.user?.email ?? '');
            setUser(data.user);
        }
        return data;
    };

    const register = async (userData) => {
        const data = await apiRegister(userData);
        // auto-login tras registro exitoso
        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser(data.user);
        }
        return data;
    };

    const logout = () => {
        clearAuthStorage();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return context;
};