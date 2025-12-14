import React, { useState } from "react";

const CommandPanel = ({ commandLibrary, onAddCommand, globalVars, setGlobalVars }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showGlobalVarModal, setShowGlobalVarModal] = useState(false);
    const [newVarName, setNewVarName] = useState("");
    const [newVarValue, setNewVarValue] = useState("");

    const filteredLibrary = {};
    Object.entries(commandLibrary).forEach(([category, commands]) => {
        const filtered = commands.filter(
            (cmd) =>
                cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cmd.id.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        if (filtered.length > 0) {
            filteredLibrary[category] = filtered;
        }
    });

    const handleAddGlobalVar = () => {
        if (newVarName && newVarValue) {
            setGlobalVars([...globalVars, { name: newVarName, value: newVarValue }]);
            setNewVarName("");
            setNewVarValue("");
            setShowGlobalVarModal(false);
        }
    };

    const handleDeleteGlobalVar = (index) => {
        const newVars = [...globalVars];
        newVars.splice(index, 1);
        setGlobalVars(newVars);
    };

    return (
        <div className="panel command-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Biblioteca</h2>
                <button 
                    onClick={() => setShowGlobalVarModal(true)}
                    title="Gerenciar Variáveis Globais"
                    className="global-var-btn"
                >
                    🌐
                </button>
            </div>

            {showGlobalVarModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Variáveis Globais</h3>
                        <div className="var-list">
                            {globalVars.map((v, i) => (
                                <div key={i} className="var-item">
                                    <span>{v.name} := {v.value}</span>
                                    <button onClick={() => handleDeleteGlobalVar(i)} className="var-delete-btn">🗑️</button>
                                </div>
                            ))}
                            {globalVars.length === 0 && <p className="var-empty">Nenhuma variável global.</p>}
                        </div>
                        
                        <div className="var-add-form">
                            <input 
                                placeholder="Nome (ex: Speed)" 
                                value={newVarName} 
                                onChange={e => setNewVarName(e.target.value)}
                                className="var-input"
                            />
                            <input 
                                placeholder="Valor (ex: 100)" 
                                value={newVarValue} 
                                onChange={e => setNewVarValue(e.target.value)}
                                className="var-input"
                            />
                            <button onClick={handleAddGlobalVar} className="var-add-btn">+</button>
                        </div>

                        <button onClick={() => setShowGlobalVarModal(false)} className="modal-close-btn">Fechar</button>
                    </div>
                </div>
            )}

            <input
                type="text"
                placeholder="🔍 Pesquisar comandos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar"
            />
            <div className="command-list-container">
                {Object.entries(filteredLibrary).map(([category, commands]) => (
                    <div key={category} className="category-group">
                        <div className="category-title">{category}</div>
                        {commands.map((cmd) => (
                            <button
                                key={cmd.id}
                                className="command-btn"
                                onClick={() => onAddCommand(cmd)}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("commandId", cmd.id);
                                }}
                            >
                                {cmd.label}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommandPanel;
