import { useState, useRef } from 'react';
import { createProduct } from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';

const CATEGORIES = [
    { value: 'Ropa', label: 'Ropa' }, { value: 'Comida', label: 'Comida' },
    { value: 'Electrodomesticos', label: 'Electrodomésticos' }, { value: 'Electronica', label: 'Electrónica' },
    { value: 'Deportes', label: 'Deportes' }, { value: 'Libros', label: 'Libros' },
    { value: 'Hogar', label: 'Hogar' }, { value: 'Belleza', label: 'Belleza' },
    { value: 'Automotriz', label: 'Automotriz' }, { value: 'Juguetes', label: 'Juguetes' },
    { value: 'Arte', label: 'Arte' }, { value: 'Otros', label: 'Otros' },
];

export default function PublishModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({ title: '', description: '', price: '', category: 'Otros', stock: '1' });
    const [imageB64, setImageB64] = useState('');
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef();

    function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

    function handleImageFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError('La imagen no puede superar 2 MB.');
            return;
        }
        setPreview(URL.createObjectURL(file));
        const reader = new FileReader();
        reader.onload = () => setImageB64(reader.result);
        reader.readAsDataURL(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title?.trim() || !form.price) {
            setError('Nombre y precio son obligatorios.');
            return;
        }
        setLoading(true); setError('');
        try {
            await createProduct({
                ...form,
                price: parseFloat(form.price),
                stock: parseInt(form.stock, 10) || 1,
                image_url: imageB64 || null,
            });
            onSuccess?.();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2>Publicar producto</h2>
                    <button className="modal-x" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <p className="form-error">{error}</p>}

                    <div className="field">
                        <label>Imagen del producto <span className="field-optional">(opcional, máx 2 MB)</span></label>
                        <div className={`image-picker${preview ? ' image-picker--filled' : ''}`} onClick={() => fileRef.current?.click()}>
                            {preview ? (
                                <>
                                    <img src={preview} alt="Vista previa" className="image-picker-preview" />
                                    <div className="image-picker-overlay">Cambiar imagen</div>
                                </>
                            ) : (
                                <div className="image-picker-empty">
                                    <span>Haz clic para subir una imagen</span>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
                    </div>

                    <Input label="Nombre del producto" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Nombre..." required />

                    <div className="field">
                        <label>Descripción</label>
                        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Describe tu producto…" />
                    </div>

                    <div className="field-row">
                        <Input label="Precio (MXN)" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" min="0" step="0.01" required />
                        <Input label="Stock" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="1" min="1" required />
                        <div className="field field--category">
                            <label>Categoría</label>
                            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" isLoading={loading}>Publicar</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}