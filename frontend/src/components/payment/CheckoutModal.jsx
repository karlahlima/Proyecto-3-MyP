import { useState } from 'react';

export default function CheckoutModal({ isOpen, onClose, total, onConfirm, isProcessing }) {
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardName: '',
        cvv: '',
        address: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'cardNumber' && value.replace(/\D/g, '').length > 16) return;
        if (name === 'cvv' && value.replace(/\D/g, '').length > 4) return;

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="checkout-modal" onClick={e => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose} disabled={isProcessing}>✕</button>

                <div className="auth-body">
                    <h2 className="auth-title">Finalizar Compra</h2>
                    <p className="auth-sub">Total a pagar: <strong>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>

                    <form onSubmit={handleSubmit} className="checkout-form">
                        <div className="auth-field">
                            <label>Número de Tarjeta</label>
                            <input
                                type="text"
                                name="cardNumber"
                                placeholder="0000 0000 0000 0000"
                                value={formData.cardNumber}
                                onChange={handleChange}
                                pattern="\d{16}"
                                inputMode="numeric"
                                required
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="auth-field">
                            <label>Nombre del Titular</label>
                            <input
                                type="text"
                                name="cardName"
                                placeholder="Como aparece en la tarjeta"
                                value={formData.cardName}
                                onChange={handleChange}
                                required
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="auth-field">
                            <label>CVV</label>
                            <input
                                type="text"
                                name="cvv"
                                placeholder="123"
                                value={formData.cvv}
                                onChange={handleChange}
                                pattern="\d{3,4}"
                                inputMode="numeric"
                                required
                                disabled={isProcessing}
                                style={{ maxWidth: '120px' }}
                            />
                        </div>

                        <div className="auth-field">
                            <label>Dirección de Entrega</label>
                            <textarea
                                name="address"
                                placeholder="Calle, número, colonia, código postal y ciudad"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                disabled={isProcessing}
                                rows={3}
                                className="auth-textarea"
                            />
                        </div>

                        <button type="submit" className="auth-submit" disabled={isProcessing}>
                            {isProcessing ? 'Procesando pago...' : `Pagar $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}