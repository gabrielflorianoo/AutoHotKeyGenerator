import React, { useState, useEffect, useRef } from "react";
import "./FloatingCommandSearch.css";

const FloatingCommandSearch = ({ isOpen, onClose, position, commandLibrary, onAddCommand }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSearchTerm("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const allCommands = [];
    Object.entries(commandLibrary).forEach(([category, commands]) => {
        commands.forEach(cmd => {
            allCommands.push({ ...cmd, category });
        });
    });

    const filteredCommands = allCommands.filter(cmd => 
        cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (cmd) => {
        onAddCommand(cmd);
        onClose();
    };

    return (
        <>
            <div className="floating-overlay" onClick={onClose}></div>
            <div 
                className="floating-search-box"
                style={{ 
                    top: Math.min(position.y, window.innerHeight - 300), 
                    left: Math.min(position.x, window.innerWidth - 250) 
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar comando..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") onClose();
                        if (e.key === "Enter" && filteredCommands.length > 0) {
                            handleSelect(filteredCommands[0]);
                        }
                    }}
                />
                <div className="floating-results">
                    {filteredCommands.map(cmd => (
                        <div 
                            key={cmd.id} 
                            className="floating-result-item"
                            onClick={() => handleSelect(cmd)}
                        >
                            <span className="cmd-icon">{cmd.is_container ? "📂" : "⚡"}</span>
                            <div className="cmd-info">
                                <span className="cmd-label">{cmd.label}</span>
                                <span className="cmd-category">{cmd.category}</span>
                            </div>
                        </div>
                    ))}
                    {filteredCommands.length === 0 && (
                        <div className="no-results">Nenhum comando encontrado</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FloatingCommandSearch;
