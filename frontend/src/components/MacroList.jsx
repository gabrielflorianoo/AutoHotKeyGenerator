import React, { useState } from "react";
import { SPECIAL_KEY_MAP } from "../contants";

const MacroList = ({
    macros,
    activeMacroId,
    onSelectMacro,
    onAddMacro,
    onDeleteMacro,
}) => {
    const [newMacroHotkey, setNewMacroHotkey] = useState("");

    const buildAhkHotkey = (e) => {
        // Modifiers
        let prefix = '';
        if (e.ctrlKey) prefix += '^';
        if (e.altKey) prefix += '!';
        if (e.shiftKey) prefix += '+';
        if (e.metaKey) prefix += '#';

        // Main key
        let keyName = '';
        // For single character keys, use uppercase letter/number
        if (e.key && e.key.length === 1) {
            keyName = e.key.toUpperCase();
        } else if (e.key && SPECIAL_KEY_MAP[e.key]) {
            keyName = SPECIAL_KEY_MAP[e.key];
        } else if (e.code && e.code.startsWith('F')) {
            // Function keys like F1..F12
            keyName = e.code.toUpperCase();
        } else if (e.key) {
            // fallback to e.key cleaned
            keyName = e.key.replace(/\s+/g, '');
        }

        return prefix + keyName;
    };

    const handleKeyDown = (e) => {
        // Prevent the browser default for some combos
        e.preventDefault();
        const hk = buildAhkHotkey(e);
        if (hk) setNewMacroHotkey(hk);
        // If user pressed Enter, add macro
        if (e.key === 'Enter') {
            if (newMacroHotkey) {
                onAddMacro(newMacroHotkey);
                setNewMacroHotkey('');
            }
        }
    };

    const handleAdd = () => {
        if (!newMacroHotkey) return;
        onAddMacro(newMacroHotkey);
        setNewMacroHotkey('');
    };

    return (
        <div className="panel macro-panel">
            <h2>Meus Macros</h2>
            <div className="add-macro-form">
                <input
                    type="text"
                    placeholder="Pressione a combinação de teclas..."
                    value={newMacroHotkey}
                    onChange={(e) => setNewMacroHotkey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                />
                <button onClick={handleAdd}>+</button>
            </div>
            <div className="macro-list">
                {macros.map((macro) => (
                    <div
                        key={macro.id}
                        className={`macro-item ${activeMacroId === macro.id ? "active" : ""}`}
                        onClick={() => onSelectMacro(macro.id)}
                    >
                        <span className="macro-hotkey">{macro.hotkey}</span>
                        <button
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMacro(macro.id);
                            }}
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MacroList;
