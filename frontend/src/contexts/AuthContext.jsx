import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMyProfile } from '../services/api';

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
                    localStorage.clear(); // Token inválido o expirado
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const data = await apiLogin(credentials);
        setUser(data.user);
        return data;
    };

    const register = async (userData) => {
        const data = await apiRegister(userData);
        // auto-login tras registro exitoso
        setUser(data.user);
        return data;
    };

    const logout = () => {
        apiLogout();
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