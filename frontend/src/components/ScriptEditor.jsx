import React from "react";

const ScriptAction = ({
    action,
    depth,
    onSelect,
    selectedActionId,
    commandLibrary,
    onDelete,
    onDuplicate,
}) => {
    // Encontrar label do comando
    let label = action.command_id;
    let isContainer = false;

    for (const cat in commandLibrary) {
        const found = commandLibrary[cat].find(
            (c) => c.id === action.command_id,
        );
        if (found) {
            label = found.label;
            isContainer = found.is_container;
            break;
        }
    }

    const isSelected = selectedActionId === action.id;

    return (
        <div className="script-action-wrapper">
            <div
                className={`script-action ${isSelected ? "selected" : ""}`}
                style={{ marginLeft: `${depth * 20}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(action);
                }}
                onAuxClick={(e) => {
                    if (e.button === 1) {
                        e.stopPropagation();
                        e.preventDefault();
                        onDuplicate(action.id);
                    }
                }}
            >
                <span className="action-icon">{isContainer ? "📂" : "⚡"}</span>
                <span className="action-label">{label}</span>
                {/* Preview simples dos parâmetros */}
                <span className="action-params">
                    {Object.entries(action.params || {})
                        .map(([k, v]) => `${k}:${v}`)
                        .join(", ")
                        .substring(0, 30)}
                </span>
                <button
                    className="delete-action-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(action.id);
                    }}
                    title="Excluir"
                >
                    🗑️
                </button>
            </div>

            {isContainer && action.children && (
                <div className="script-children">
                    {action.children.map((child) => (
                        <ScriptAction
                            key={child.id}
                            action={child}
                            depth={depth + 1}
                            onSelect={onSelect}
                            selectedActionId={selectedActionId}
                            commandLibrary={commandLibrary}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                        />
                    ))}
                    {/* Placeholder para indicar onde novos itens entram neste container se ele estiver selecionado */}
                    {isSelected && (
                        <div
                            className="add-here-placeholder"
                            style={{
                                marginLeft: `${(depth + 1) * 20}px`,
                            }}
                        >
                            + Adicionar aqui
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ScriptEditor = ({
    activeMacro,
    onSelectAction,
    selectedActionId,
    commandLibrary,
    onDeleteAction,
    onDuplicateAction,
    onAddCommand,
}) => {
    if (!activeMacro) {
        return (
            <div className="panel script-editor-panel">
                <h2>Editor de Script</h2>
                <div className="empty-state">
                    Selecione ou crie um macro para começar.
                </div>
            </div>
        );
    }

    const handleDrop = (e) => {
        e.preventDefault();
        const cmdId = e.dataTransfer.getData("commandId");
        if (cmdId) {
            let cmd = null;
            for (const cat in commandLibrary) {
                const found = commandLibrary[cat].find((c) => c.id === cmdId);
                if (found) {
                    cmd = found;
                    break;
                }
            }
            if (cmd) {
                onAddCommand(cmd);
            }
        }
    };

    return (
        <div
            className="panel script-editor-panel"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <h2>Editor: {activeMacro.hotkey}</h2>
            <div className="script-tree">
                {activeMacro.actions.length === 0 ? (
                    <div className="empty-state">
                        Nenhuma ação. Adicione comandos da biblioteca.
                    </div>
                ) : (
                    activeMacro.actions.map((action) => (
                        <ScriptAction
                            key={action.id}
                            action={action}
                            depth={0}
                            onSelect={onSelectAction}
                            selectedActionId={selectedActionId}
                            commandLibrary={commandLibrary}
                            onDelete={onDeleteAction}
                            onDuplicate={onDuplicateAction}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ScriptEditor;
