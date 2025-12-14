import React, { useState, useEffect } from "react";
import "./SettingsSidebar.css";

const SettingsSidebar = ({ isOpen, onClose, floatingHotkey, onFloatingHotkeyChange, ahkPath, onAhkPathChange }) => {
    const [hotkey, setHotkey] = useState(floatingHotkey || "Ctrl+Space");
    const [path, setPath] = useState(ahkPath || "");

    useEffect(() => {
        setHotkey(floatingHotkey || "Ctrl+Space");
    }, [floatingHotkey]);

    useEffect(() => {
        setPath(ahkPath || "");
    }, [ahkPath]);

    const handleHotkeyChange = (e) => {
        setHotkey(e.target.value);
        try {
            localStorage.setItem("floatingHotkey", e.target.value);
        } catch (err) {}
        if (onFloatingHotkeyChange) onFloatingHotkeyChange(e.target.value);
    };

    const handlePathChange = (e) => {
        setPath(e.target.value);
    };

    const savePath = () => {
        try {
            localStorage.setItem('ahkPath', path || '');
        } catch (err) {}
        if (onAhkPathChange) onAhkPathChange(path || '');
        alert('Caminho salvo.');
    };

    return (
        <>
            <div className={`settings-overlay ${isOpen ? "open" : ""}`} onClick={onClose}></div>
            <div className={`settings-sidebar ${isOpen ? "open" : ""}`}>
                <div className="settings-header">
                    <h2>Configurações</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <div className="settings-content">
                    <div className="setting-item">
                        <label>Tema</label>
                        <select defaultValue="dark">
                            <option value="dark">Escuro</option>
                            <option value="light">Claro</option>
                        </select>
                    </div>
                    <div className="setting-item">
                        <label>Idioma</label>
                        <select defaultValue="pt-BR">
                            <option value="pt-BR">Português (BR)</option>
                            <option value="en-US">English (US)</option>
                        </select>
                    </div>
                    <div className="setting-item">
                        <label>Animações</label>
                        <div className="toggle-switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                        </div>
                    </div>

                    <div className="setting-item">
                        <label>Atalho do Floating Search</label>
                        <select value={hotkey} onChange={handleHotkeyChange}>
                            <option value="Ctrl+Space">Ctrl + Space</option>
                            <option value="Alt+Space">Alt + Space</option>
                            <option value="Ctrl+K">Ctrl + K</option>
                            <option value="Ctrl+Shift+K">Ctrl + Shift + K</option>
                            <option value="F2">F2</option>
                        </select>
                    </div>

                    <div className="setting-item">
                        <label>Caminho do AutoHotkey (AutoHotkey.exe)</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={path}
                                onChange={handlePathChange}
                                placeholder="C:\\Program Files\\AutoHotkey\\AutoHotkey.exe"
                                style={{ flex: 1, background: '#334155', color: 'white', border: '1px solid #475569', padding: '6px', borderRadius: '4px' }}
                            />
                            <button onClick={savePath} style={{ padding: '6px 10px', borderRadius: '4px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>Salvar</button>
                        </div>
                        <div style={{ marginTop: '6px', color: '#94a3b8', fontSize: '0.8rem' }}>Se vazio, o backend tentará localizar automaticamente.</div>
                    </div>

                    <div className="setting-info">
                        <p>AutoHotKey Generator v1.0</p>
                        <p>Desenvolvido com ❤️</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsSidebar;
