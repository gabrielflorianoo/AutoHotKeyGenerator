import React, { useState } from "react";
import axios from "axios";

const ParameterInput = ({ param, value, onChange, onPick }) => {
    const handleChange = (e) => {
        onChange(param.name, e.target.value);
    };

    const renderInput = () => {
        if (param.type === "select") {
            return (
                <select value={value || ""} onChange={handleChange}>
                    <option value="" disabled>
                        Selecione uma opção
                    </option>
                    {param.options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }

        if (param.type === "textarea") {
            return (
                <textarea
                    value={value || ""}
                    onChange={handleChange}
                    placeholder={param.placeholder || ""}
                    rows={5}
                    style={{
                        width: "100%",
                        background: "#111",
                        color: "white",
                        border: "1px solid #3a3a3a",
                        padding: "0.5rem",
                    }}
                />
            );
        }

        if (param.type === "number") {
            return (
                <input
                    type="number"
                    value={value || ""}
                    onChange={handleChange}
                    placeholder={`Ex: ${param.default || 0}`}
                />
            );
        }

        if (param.type === "checkbox") {
            return (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                        type="checkbox"
                        checked={value === undefined ? (param.default || false) : value}
                        onChange={(e) => onChange(param.name, e.target.checked)}
                        style={{ width: "auto" }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#ccc" }}>{param.label}</span>
                </div>
            );
        }

        if (param.type === "hidden") {
            return null;
        }

        return (
            <input
                type="text"
                value={value || ""}
                onChange={handleChange}
                placeholder={param.placeholder || param.description || ""}
            />
        );
    };

    return (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ flexGrow: 1 }}>{renderInput()}</div>
            {param.hasPicker && (
                <button
                    onClick={() => onPick(param.name)}
                    title="Capturar posição do mouse (aguarda 3s)"
                    style={{
                        padding: "0.6rem",
                        cursor: "pointer",
                        background: "#333",
                        border: "1px solid #555",
                        color: "white",
                        borderRadius: "4px",
                    }}
                >
                    📍
                </button>
            )}
        </div>
    );
};

const ConfigurationPanel = ({
    selectedCommand,
    parameters,
    onParamChange,
    onGenerate,
}) => {
    const [picking, setPicking] = useState(false);
    const [pickMessage, setPickMessage] = useState("");

    const handlePickPosition = async (paramName) => {
        setPicking(true);
        setPickMessage("Mova o mouse... (3s)");

        try {
            const response = await axios.get("/api/pick-position");
            const { x, y, screenWidth, screenHeight } = response.data;
            console.log(x, y, screenWidth, screenHeight);

            // Atualiza o campo clicado
            onParamChange(paramName, paramName === "y" ? y : x);

            // Tenta atualizar o par (se clicou em X, atualiza Y também se existir e estiver vazio ou for o mesmo contexto)
            // Simplificação: Se o comando tem X e Y, atualiza ambos.
            if (
                selectedCommand.parameters.find((p) => p.name === "x") &&
                selectedCommand.parameters.find((p) => p.name === "y")
            ) {
                onParamChange("x", x);
                onParamChange("y", y);
            }

            // Atualiza dimensões da tela se o comando suportar
            if (selectedCommand.parameters.find((p) => p.name === "screenWidth")) {
                onParamChange("screenWidth", screenWidth);
            }
            if (selectedCommand.parameters.find((p) => p.name === "screenHeight")) {
                onParamChange("screenHeight", screenHeight);
            }

            setPickMessage("Capturado!");
            setTimeout(() => setPickMessage(""), 2000);
        } catch (error) {
            console.error("Erro ao capturar:", error);
            setPickMessage("Erro ao capturar");
        } finally {
            setPicking(false);
        }
    };

    if (!selectedCommand) {
        return (
            <div className="panel config-panel">
                <h2>Configuração</h2>
                <p
                    style={{
                        color: "#888",
                        textAlign: "center",
                        marginTop: "2rem",
                    }}
                >
                    Selecione uma ação no editor para configurar.
                </p>
                <button
                    className="generate-btn"
                    onClick={onGenerate}
                    style={{ marginTop: "auto" }}
                >
                    🚀 Gerar Código Completo
                </button>
            </div>
        );
    }

    return (
        <div className="panel config-panel">
            <h2>Configurar: {selectedCommand.label}</h2>
            <p style={{ marginBottom: "1.5rem", color: "#aaa" }}>
                {selectedCommand.description}
            </p>

            <div className="parameters-form">
                {selectedCommand.parameters.map((param) => {
                    if (param.type === "hidden") return null;
                    return (
                        <div key={param.name} className="form-group">
                            {param.type !== "checkbox" && <label>{param.label || param.name}:</label>}
                            <ParameterInput
                                param={param}
                                value={parameters[param.name]}
                                onChange={onParamChange}
                                onPick={handlePickPosition}
                            />
                        </div>
                    );
                })}
            </div>

            {picking && (
                <div
                    style={{
                        textAlign: "center",
                        color: "#e6a700",
                        marginBottom: "1rem",
                        fontWeight: "bold",
                    }}
                >
                    {pickMessage}
                </div>
            )}

            <button
                className="generate-btn"
                onClick={onGenerate}
                disabled={picking}
            >
                {picking ? "Aguardando..." : "🚀 Gerar Código Completo"}
            </button>
        </div>
    );
};

export default ConfigurationPanel;
