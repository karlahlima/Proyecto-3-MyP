import { useState, useRef } from 'react';
import { uploadAvatar } from '../../services/api';

export default function AvatarUploader({ avatarUrl, name, onUploaded }) {
    const inputRef = useRef();
    const [preview, setPreview] = useState(avatarUrl);
    const [loading, setLoading] = useState(false);

    async function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        setLoading(true);
        try {
            const res = await uploadAvatar(file);
            onUploaded?.(res.avatarUrl);
        } catch {
            setPreview(avatarUrl);
        } finally {
            setLoading(false);
        }
    }

    const initials = name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';

    return (
        <div className="avatar-wrap" onClick={() => inputRef.current?.click()}>
            {preview ? <img src={preview} alt="Avatar" className="avatar-img" /> : <div className="avatar-initials">{initials}</div>}
            <div className="avatar-overlay">{loading ? '…' : 'editar'}</div>
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
    );
}