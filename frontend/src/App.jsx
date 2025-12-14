import React, { useState, useEffect } from "react";
import axios from "axios";
import CommandPanel from "./components/CommandPanel";
import ConfigurationPanel from "./components/ConfigurationPanel";
import CodeViewer from "./components/CodeViewer";
import MacroList from "./components/MacroList";
import ScriptEditor from "./components/ScriptEditor";
import SettingsSidebar from "./components/SettingsSidebar";
import FloatingCommandSearch from "./components/FloatingCommandSearch";
import "./App.css";

function App() {
    const [floatingHotkey, setFloatingHotkey] = useState(() => {
        try {
            return localStorage.getItem("floatingHotkey") || "Ctrl+Space";
        } catch (e) {
            return "Ctrl+Space";
        }
    });
    // helper to test hotkey
    const isHotkeyPressed = (e, hotkeyString) => {
        if (!hotkeyString) return false;
        const parts = hotkeyString.split("+").map(p => p.trim().toLowerCase());
        const keyPart = parts[parts.length - 1];
        const ctrl = parts.includes("ctrl") || parts.includes("control");
        const alt = parts.includes("alt");
        const shift = parts.includes("shift");

        const keyMatches = (k) => {
            if (!k) return false;
            const code = e.code ? e.code.toLowerCase() : "";
            const key = e.key ? e.key.toLowerCase() : "";
            if (k === "space") return code === "space" || key === " ";
            if (k.length === 1) return key === k;
            return code === k || key === k;
        };

        if (ctrl && !e.ctrlKey) return false;
        if (alt && !e.altKey) return false;
        if (shift && !e.shiftKey) return false;
        return keyMatches(keyPart);
    };
    const [commandLibrary, setCommandLibrary] = useState({});
    const [macros, setMacros] = useState([]);
    const [globalVars, setGlobalVars] = useState([]);
    const [activeMacroId, setActiveMacroId] = useState(null);
    const [selectedActionId, setSelectedActionId] = useState(null);
    const [generatedCode, setGeneratedCode] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFloatingSearchOpen, setIsFloatingSearchOpen] = useState(false);
    const [floatingSearchPos, setFloatingSearchPos] = useState({ x: 0, y: 0 });

    // Carregar biblioteca de comandos ao iniciar
    useEffect(() => {
        const fetchCommands = async () => {
            try {
                const response = await axios.get("/api/commands");
                setCommandLibrary(response.data);
            } catch (error) {
                console.error("Erro ao carregar comandos:", error);
                // fallback para comandos padrões embutidos
                try {
                    const defaults = await import("./defaultCommands.json");
                    setCommandLibrary(defaults.default || defaults);
                } catch (e) {
                    console.warn("Não foi possível carregar comandos padrão:", e);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchCommands();
    }, []);

    // Carregar do LocalStorage
    useEffect(() => {
        const savedMacros = localStorage.getItem("ahk_macros");
        const savedGlobalVars = localStorage.getItem("ahk_global_vars");
        if (savedMacros) {
            try {
                setMacros(JSON.parse(savedMacros));
            } catch (e) {
                console.error("Erro ao carregar macros do localStorage", e);
            }
        }
        if (savedGlobalVars) {
            try {
                setGlobalVars(JSON.parse(savedGlobalVars));
            } catch (e) {
                console.error("Erro ao carregar variáveis globais do localStorage", e);
            }
        }
    }, []);

    // Salvar no LocalStorage
    useEffect(() => {
        localStorage.setItem("ahk_macros", JSON.stringify(macros));
    }, [macros]);

    useEffect(() => {
        localStorage.setItem("ahk_global_vars", JSON.stringify(globalVars));
    }, [globalVars]);

    // Auto-gerar código quando macros ou variáveis globais mudam
    useEffect(() => {
        const timer = setTimeout(() => {
            generateCode();
        }, 500); // Debounce de 500ms
        return () => clearTimeout(timer);
    }, [macros, globalVars]);

    // Atalho para Floating Search (configurável) e Rastreamento do Mouse
    useEffect(() => {
        const handleKeyDown = (e) => {
            try {
                if (isHotkeyPressed(e, floatingHotkey)) {
                    e.preventDefault();
                    setIsFloatingSearchOpen(prev => !prev);
                }
            } catch (err) {
                // ignore
            }
        };

        const handleMouseMove = (e) => {
            if (!isFloatingSearchOpen) {
                setFloatingSearchPos({ x: e.clientX, y: e.clientY });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [isFloatingSearchOpen, floatingHotkey]);

    // --- Gerenciamento de Macros ---
    const handleAddMacro = (hotkey) => {
        const newMacro = {
            id: Date.now().toString(),
            hotkey: hotkey,
            actions: [],
        };
        setMacros([...macros, newMacro]);
        setActiveMacroId(newMacro.id);
        setSelectedActionId(null);
    };

    const handleDeleteMacro = (id) => {
        setMacros(macros.filter((m) => m.id !== id));
        if (activeMacroId === id) {
            setActiveMacroId(null);
            setSelectedActionId(null);
        }
    };

    const handleSelectMacro = (id) => {
        setActiveMacroId(id);
        setSelectedActionId(null);
    };

    // --- Gerenciamento de Ações (Script) ---

    // Função auxiliar para encontrar e atualizar uma ação na árvore
    const updateActionInTree = (actions, actionId, updater) => {
        return actions.map((action) => {
            if (action.id === actionId) {
                return updater(action);
            }
            if (action.children) {
                return {
                    ...action,
                    children: updateActionInTree(
                        action.children,
                        actionId,
                        updater,
                    ),
                };
            }
            return action;
        });
    };

    // Função auxiliar para adicionar ação a um container (ou raiz)
    const addActionToContainer = (actions, targetContainerId, newAction) => {
        if (!targetContainerId) {
            return [...actions, newAction];
        }
        return actions.map((action) => {
            if (action.id === targetContainerId) {
                return {
                    ...action,
                    children: [...(action.children || []), newAction],
                };
            }
            if (action.children) {
                return {
                    ...action,
                    children: addActionToContainer(
                        action.children,
                        targetContainerId,
                        newAction,
                    ),
                };
            }
            return action;
        });
    };

    const handleAddCommand = (cmd) => {
        if (!activeMacroId) {
            alert("Selecione ou crie um macro primeiro!");
            return;
        }

        const newAction = {
            id: Date.now().toString(),
            command_id: cmd.id,
            params: {},
            children: cmd.is_container ? [] : undefined,
        };

        // Inicializar parâmetros padrão
        if (cmd.parameters) {
            cmd.parameters.forEach((p) => {
                newAction.params[p.name] =
                    p.default !== undefined ? p.default : "";
            });
        }

        // Se uma ação container estiver selecionada, adiciona dentro dela.
        // Caso contrário, adiciona na raiz do macro.
        // (Lógica simplificada: se selecionado for container, adiciona dentro. Se não, adiciona na raiz)

        let targetId = null;
        if (selectedActionId) {
            // Verifica se a ação selecionada é um container
            // Precisamos buscar a definição na library ou no próprio objeto action se tivermos acesso fácil
            // Aqui vamos assumir que se tem children array, é container.
            const findAction = (list) => {
                for (let a of list) {
                    if (a.id === selectedActionId) return a;
                    if (a.children) {
                        const found = findAction(a.children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const activeMacro = macros.find((m) => m.id === activeMacroId);
            const selectedAction = findAction(activeMacro.actions);

            if (selectedAction && selectedAction.children !== undefined) {
                targetId = selectedActionId;
            }
        }

        setMacros(
            macros.map((m) => {
                if (m.id === activeMacroId) {
                    return {
                        ...m,
                        actions: addActionToContainer(
                            m.actions,
                            targetId,
                            newAction,
                        ),
                    };
                }
                return m;
            }),
        );
    };

    const handleActionSelect = (action) => {
        setSelectedActionId(action.id);
    };

    const handleParameterChange = (nameOrObj, value) => {
        if (!activeMacroId || !selectedActionId) return;

        const updates = typeof nameOrObj === 'object' ? nameOrObj : { [nameOrObj]: value };

        setMacros((prevMacros) =>
            prevMacros.map((m) => {
                if (m.id === activeMacroId) {
                    return {
                        ...m,
                        actions: updateActionInTree(
                            m.actions,
                            selectedActionId,
                            (action) => ({
                                ...action,
                                params: { ...action.params, ...updates },
                            }),
                        ),
                    };
                }
                return m;
            }),
        );
    };

    const handleDeleteAction = (actionId) => {
        if (!activeMacroId) return;
        
        const deleteFromTree = (actions) => {
            return actions.filter(action => {
                if (action.id === actionId) return false;
                if (action.children) {
                    action.children = deleteFromTree(action.children);
                }
                return true;
            });
        };

        setMacros((prevMacros) => prevMacros.map(macro => {
            if (macro.id === activeMacroId) {
                return { ...macro, actions: deleteFromTree(macro.actions) };
            }
            return macro;
        }));
        
        if (selectedActionId === actionId) setSelectedActionId(null);
    };

    const handleDuplicateAction = (actionId) => {
        if (!activeMacroId) return;

        const duplicateInTree = (actions) => {
            let newActions = [];
            for (let action of actions) {
                newActions.push(action);
                if (action.id === actionId) {
                    const clone = JSON.parse(JSON.stringify(action));
                    const updateIds = (node) => {
                        node.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                        if (node.children) node.children.forEach(updateIds);
                    };
                    updateIds(clone);
                    newActions.push(clone);
                }
                if (action.children) {
                    action.children = duplicateInTree(action.children);
                }
            }
            return newActions;
        };

        setMacros((prevMacros) => prevMacros.map(macro => {
            if (macro.id === activeMacroId) {
                return { ...macro, actions: duplicateInTree(macro.actions) };
            }
            return macro;
        }));
    };

    const generateCode = async () => {
        try {
            const response = await axios.post("/api/generate", {
                macros: macros,
                global_vars: globalVars,
            });

            if (response.data && response.data.code) {
                setGeneratedCode(response.data.code);
                return response.data.code;
            }
            return null;
        } catch (error) {
            console.error("Erro ao gerar código:", error);
            setGeneratedCode("; Erro ao gerar código. Verifique o console.");
            return null;
        }
    };

    const handleRunMacro = async () => {
        if (!macros || macros.length === 0) {
            alert('Nenhum macro para executar. Crie ou selecione um macro primeiro.');
            return;
        }

        // Primeiro, acionar download local do .ahk com o código gerado (se houver)
        try {
            // Ensure we have latest generated code and get it directly
            let code = generatedCode;
            if (!code || code.includes('; Erro ao gerar')) {
                code = await generateCode();
            }
            const blob = new Blob([code || ''], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'macro.ahk';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.warn('Erro ao iniciar download:', e);
        }

        // Em seguida, solicitar ao backend que grave e execute
        try {
            const resp = await axios.post('/api/run-macro', { macros });
            if (resp.data) {
                if (resp.data.success) {
                    alert('Macro executado. Se o AutoHotkey estiver instalado, o script foi aberto.');
                } else {
                    alert('Arquivo gerado: ' + (resp.data.file || '') + '\nAviso: ' + (resp.data.error || 'Não foi possível executar automaticamente.'))
                }
            }
        } catch (err) {
            console.error('Erro ao chamar run-macro:', err);
            alert('Erro ao solicitar execução do macro. Veja o console.');
        }
    };

    // Encontrar o objeto de comando da ação selecionada para passar pro ConfigPanel
    let selectedCommandDef = null;
    let selectedActionParams = {};

    if (activeMacroId && selectedActionId) {
        const activeMacro = macros.find((m) => m.id === activeMacroId);

        const findAction = (list) => {
            for (let a of list) {
                if (a.id === selectedActionId) return a;
                if (a.children) {
                    const found = findAction(a.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const action = findAction(activeMacro.actions);
        if (action) {
            selectedActionParams = action.params;
            // Buscar definição na library
            for (const cat in commandLibrary) {
                const found = commandLibrary[cat].find(
                    (c) => c.id === action.command_id,
                );
                if (found) {
                    selectedCommandDef = found;
                    break;
                }
            }
        }
    }

    if (isLoading) {
        return <div className="loading">Carregando...</div>;
    }

    return (
        <div className="app-container">
            <button 
                className="settings-btn" 
                onClick={() => setIsSettingsOpen(true)}
                title="Configurações"
                style={{
                    position: "fixed",
                    top: "10px",
                    right: "10px",
                    zIndex: 100,
                    background: "transparent",
                    border: "none",
                    color: "#64748b",
                    fontSize: "1.5rem",
                    cursor: "pointer"
                }}
            >
                ⚙️
            </button>

            <SettingsSidebar 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                floatingHotkey={floatingHotkey}
                onFloatingHotkeyChange={(hk) => {
                    setFloatingHotkey(hk);
                    try { localStorage.setItem("floatingHotkey", hk); } catch (e) {}
                }}
            />

            <FloatingCommandSearch
                isOpen={isFloatingSearchOpen}
                onClose={() => setIsFloatingSearchOpen(false)}
                position={floatingSearchPos}
                commandLibrary={commandLibrary}
                onAddCommand={handleAddCommand}
            />
            <div className="sidebar">
                <MacroList
                    macros={macros}
                    activeMacroId={activeMacroId}
                    onSelectMacro={handleSelectMacro}
                    onAddMacro={handleAddMacro}
                    onDeleteMacro={handleDeleteMacro}
                />
                <CommandPanel
                    commandLibrary={commandLibrary}
                    onAddCommand={handleAddCommand}
                    globalVars={globalVars}
                    setGlobalVars={setGlobalVars}
                />
            </div>

            <div className="main-content">
                <ScriptEditor
                    activeMacro={macros.find((m) => m.id === activeMacroId)}
                    onSelectAction={handleActionSelect}
                    selectedActionId={selectedActionId}
                    commandLibrary={commandLibrary}
                    onDeleteAction={handleDeleteAction}
                    onDuplicateAction={handleDuplicateAction}
                    onAddCommand={handleAddCommand}
                />
            </div>

            <div className="right-panel">
                <ConfigurationPanel
                    selectedCommand={selectedCommandDef}
                    parameters={selectedActionParams}
                    onParamChange={handleParameterChange}
                    onGenerate={generateCode}
                    onRunMacro={handleRunMacro}
                    // Hotkey agora é gerenciada no nível do Macro, não aqui
                    hotkey={""}
                    onHotkeyChange={() => {}}
                />
                <CodeViewer generatedCode={generatedCode} />
            </div>
        </div>
    );
}

export default App;
