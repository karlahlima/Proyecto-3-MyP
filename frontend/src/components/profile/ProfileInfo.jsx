
import { useState } from 'react';
import { updateMyProfile } from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function ProfileInfo({ user, onUpdated }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: user.name, age: user.age, username: user.username });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

    async function save(e) {
        e.preventDefault();
        if (!form.username?.trim()) { setMsg('El username no puede estar vacío.'); return; }
        setLoading(true); setMsg('');
        try {
            await updateMyProfile(form);
            setMsg('✓ Perfil actualizado correctamente');
            setEditing(false);
            onUpdated?.();
        } catch (e) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={save} className="profile-info">
            <div className="info-grid">
                <div className="info-card">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user.email}</span>
                    <span className="info-note">El email no puede cambiarse.</span>
                </div>
                <Input
                    label="Username"
                    value={form.username}
                    onChange={(e) => set('username', e.target.value)}
                    placeholder="@usuario"
                    disabled={!editing}
                />
                <Input
                    label="Nombre"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    disabled={!editing}
                />
                <Input
                    label="Edad"
                    type="number"
                    min="18"
                    max="120"
                    value={form.age}
                    onChange={(e) => set('age', e.target.value)}
                    disabled={!editing}
                />
                <div className="info-card">
                    <span className="info-label">Miembro desde</span>
                    <span className="info-value">{new Date(user.created_at ?? user.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            {msg && <p className={`profile-msg${msg.startsWith('✓') ? ' profile-msg--ok' : ' profile-msg--err'}`}>{msg}</p>}

            <div className="info-actions">
                {editing ? (
                    <>
                        <Button type="button" variant="secondary" onClick={() => { setEditing(false); setForm({ name: user.name, age: user.age, username: user.username }); setMsg(''); }}>Cancelar</Button>
                        <Button type="submit" isLoading={loading}>Guardar cambios</Button>
                    </>
                ) : (
                    <Button type="button" onClick={() => setEditing(true)}>Editar perfil</Button>
                )}
            </div>
        </form>
    );
}