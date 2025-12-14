import React, { useState, useEffect } from "react";
import "./SettingsSidebar.css";

const SettingsSidebar = ({ isOpen, onClose, floatingHotkey, onFloatingHotkeyChange }) => {
    const [hotkey, setHotkey] = useState(floatingHotkey || "Ctrl+Space");

    useEffect(() => {
        setHotkey(floatingHotkey || "Ctrl+Space");
    }, [floatingHotkey]);

    const handleHotkeyChange = (e) => {
        setHotkey(e.target.value);
        try {
            localStorage.setItem("floatingHotkey", e.target.value);
        } catch (err) {}
        if (onFloatingHotkeyChange) onFloatingHotkeyChange(e.target.value);
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
