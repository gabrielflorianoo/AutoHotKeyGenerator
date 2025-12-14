import React, { useState, useEffect } from "react";
import axios from "axios";
import CommandPanel from "./components/CommandPanel";
import ConfigurationPanel from "./components/ConfigurationPanel";
import CodeViewer from "./components/CodeViewer";
import MacroList from "./components/MacroList";
import ScriptEditor from "./components/ScriptEditor";
import "./App.css";

function App() {
    const [commandLibrary, setCommandLibrary] = useState({});
    const [macros, setMacros] = useState([]);
    const [globalVars, setGlobalVars] = useState([]);
    const [activeMacroId, setActiveMacroId] = useState(null);
    const [selectedActionId, setSelectedActionId] = useState(null);
    const [generatedCode, setGeneratedCode] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Carregar biblioteca de comandos ao iniciar
    useEffect(() => {
        const fetchCommands = async () => {
            try {
                const response = await axios.get("/api/commands");
                setCommandLibrary(response.data);
            } catch (error) {
                console.error("Erro ao carregar comandos:", error);
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
            }
        } catch (error) {
            console.error("Erro ao gerar código:", error);
            setGeneratedCode("; Erro ao gerar código. Verifique o console.");
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
