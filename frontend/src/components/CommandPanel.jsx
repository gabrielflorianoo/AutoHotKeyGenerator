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
                    style={{
                        background: "transparent",
                        border: "1px solid #555",
                        color: "#aaa",
                        cursor: "pointer",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "1.2rem"
                    }}
                >
                    🌐
                </button>
            </div>

            {showGlobalVarModal && (
                <div className="modal-overlay" style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.7)", zIndex: 1000,
                    display: "flex", justifyContent: "center", alignItems: "center"
                }}>
                    <div className="modal-content" style={{
                        background: "#1e293b", padding: "20px", borderRadius: "8px",
                        width: "400px", border: "1px solid #334155"
                    }}>
                        <h3>Variáveis Globais</h3>
                        <div style={{ marginBottom: "15px", maxHeight: "200px", overflowY: "auto" }}>
                            {globalVars.map((v, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", background: "#333", padding: "5px", borderRadius: "4px" }}>
                                    <span>{v.name} := {v.value}</span>
                                    <button onClick={() => handleDeleteGlobalVar(i)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>🗑️</button>
                                </div>
                            ))}
                            {globalVars.length === 0 && <p style={{ color: "#888" }}>Nenhuma variável global.</p>}
                        </div>
                        
                        <div style={{ display: "flex", gap: "5px", marginBottom: "15px" }}>
                            <input 
                                placeholder="Nome (ex: Speed)" 
                                value={newVarName} 
                                onChange={e => setNewVarName(e.target.value)}
                                style={{ flex: 1, padding: "5px", background: "#333", border: "1px solid #555", color: "white" }}
                            />
                            <input 
                                placeholder="Valor (ex: 100)" 
                                value={newVarValue} 
                                onChange={e => setNewVarValue(e.target.value)}
                                style={{ flex: 1, padding: "5px", background: "#333", border: "1px solid #555", color: "white" }}
                            />
                            <button onClick={handleAddGlobalVar} style={{ background: "#3b82f6", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>+</button>
                        </div>

                        <button onClick={() => setShowGlobalVarModal(false)} style={{ width: "100%", padding: "8px", background: "#475569", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Fechar</button>
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
