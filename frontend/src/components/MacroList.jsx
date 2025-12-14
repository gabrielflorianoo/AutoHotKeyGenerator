import React, { useState } from "react";

const MacroList = ({
    macros,
    activeMacroId,
    onSelectMacro,
    onAddMacro,
    onDeleteMacro,
    onUpdateMacro,
}) => {
    const [newMacroHotkey, setNewMacroHotkey] = useState("");

    const handleAdd = () => {
        if (!newMacroHotkey) return;
        onAddMacro(newMacroHotkey);
        setNewMacroHotkey("");
    };

    return (
        <div className="panel macro-panel">
            <h2>Meus Macros</h2>
            <div className="add-macro-form">
                <input
                    type="text"
                    placeholder="Nova Hotkey (ex: F1)"
                    value={newMacroHotkey}
                    onChange={(e) => setNewMacroHotkey(e.target.value)}
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
