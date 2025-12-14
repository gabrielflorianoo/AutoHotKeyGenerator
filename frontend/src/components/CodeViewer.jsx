import React, { useState, useEffect } from "react";

const CodeViewer = ({ generatedCode }) => {
    const [localCode, setLocalCode] = useState(generatedCode);
    const [copyStatus, setCopyStatus] = useState("📋 Copiar Código");

    useEffect(() => {
        setLocalCode(generatedCode);
    }, [generatedCode]);

    const handleCopy = async () => {
        if (!localCode) return;

        try {
            await navigator.clipboard.writeText(localCode);
            setCopyStatus("✅ Copiado!");
            setTimeout(() => setCopyStatus("📋 Copiar Código"), 2000);
        } catch (err) {
            console.error("Falha ao copiar:", err);
            setCopyStatus("❌ Erro");
        }
    };

    return (
        <div className="panel code-viewer-panel">
            <h2>Script Gerado</h2>
            <textarea
                className="code-block"
                value={localCode || ""}
                onChange={(e) => setLocalCode(e.target.value)}
                placeholder="; O código gerado aparecerá aqui..."
                spellCheck="false"
                style={{ resize: "vertical" }}
            />
            <button
                className="copy-btn"
                onClick={handleCopy}
                disabled={!localCode}
            >
                {copyStatus}
            </button>
        </div>
    );
};

export default CodeViewer;
