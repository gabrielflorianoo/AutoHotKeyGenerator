from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import ctypes
import time
import subprocess
import tempfile
import os
import shutil

app = Flask(__name__)
CORS(app)

# --- Biblioteca de Comandos AHK ---

COMMAND_LIBRARY = {
    "Hotkeys & Gatilhos": [
        {
            "id": "Hotkey",
            "label": "Definir Hotkey",
            "template": "&key::\n    &code\nReturn",
            "parameters": [
                {"name": "key", "type": "text", "placeholder": "Tecla (ex: ^j, F1)"},
                {"name": "code", "type": "textarea", "placeholder": "Código a executar"}
            ],
            "description": "Define uma tecla de atalho para executar um código."
        },
        {
            "id": "Hotstring",
            "label": "Definir Hotstring",
            "template": "::&abbrev::&replacement",
            "parameters": [
                {"name": "abbrev", "type": "text", "placeholder": "Abreviação (ex: btw)"},
                {"name": "replacement", "type": "text", "placeholder": "Texto expandido"}
            ],
            "description": "Substitui texto digitado por outro."
        }
    ],
    "Mouse & Click": [
        {
            "id": "Click",
            "label": "Clicar (Click)",
            "template": "Click, &x, &y, &button",
            "parameters": [
                {"name": "x", "type": "number", "label": "X", "hasPicker": True},
                {"name": "y", "type": "number", "label": "Y", "hasPicker": True},
                {"name": "button", "type": "select", "options": ["Left", "Right", "Middle"], "default": "Left"},
                {"name": "relative", "type": "checkbox", "label": "Relativo a tela", "default": True},
                {"name": "screenWidth", "type": "hidden"},
                {"name": "screenHeight", "type": "hidden"}
            ],
            "description": "Clica em uma posição específica."
        },
        {
            "id": "MouseMove",
            "label": "Mover Mouse (MouseMove)",
            "template": "MouseMove, &x, &y",
            "parameters": [
                {"name": "x", "type": "number", "label": "X", "hasPicker": True},
                {"name": "y", "type": "number", "label": "Y", "hasPicker": True},
                {"name": "relative", "type": "checkbox", "label": "Relativo a tela", "default": True},
                {"name": "screenWidth", "type": "hidden"},
                {"name": "screenHeight", "type": "hidden"}
            ],
            "description": "Move o cursor para as coordenadas X e Y."
        },
        {
            "id": "MouseGetPos",
            "label": "Obter Posição (MouseGetPos)",
            "template": "MouseGetPos, &OutputVarX, &OutputVarY",
            "parameters": [
                {"name": "OutputVarX", "type": "text", "default": "PosX"},
                {"name": "OutputVarY", "type": "text", "default": "PosY"}
            ],
            "description": "Salva a posição atual do mouse em variáveis."
        }
    ],
    "Teclado & Texto": [
        {
            "id": "Send",
            "label": "Enviar Texto (Send)",
            "template": "Send, &keys",
            "parameters": [
                {"name": "keys", "type": "text", "placeholder": "Texto ou teclas (ex: {Enter})"}
            ],
            "description": "Envia toques de tecla e cliques de mouse simulados."
        },
        {
            "id": "SendInput",
            "label": "Enviar Rápido (SendInput)",
            "template": "SendInput, &keys",
            "parameters": [
                {"name": "keys", "type": "text", "placeholder": "Texto ou teclas"}
            ],
            "description": "Mais rápido e confiável que o Send tradicional."
        }
    ],
    "Janelas (Window)": [
        {
            "id": "Run",
            "label": "Executar Programa (Run)",
            "template": "Run, &Target",
            "parameters": [
                {"name": "Target", "type": "text", "placeholder": "Caminho do arquivo, URL ou comando"}
            ],
            "description": "Executa um programa, documento ou URL."
        },
        {
            "id": "WinActivate",
            "label": "Ativar Janela (WinActivate)",
            "template": "WinActivate, &WinTitle",
            "parameters": [
                {"name": "WinTitle", "type": "text", "placeholder": "Título da Janela"}
            ],
            "description": "Ativa a janela especificada."
        },
        {
            "id": "WinWait",
            "label": "Aguardar Janela (WinWait)",
            "template": "WinWait, &WinTitle, , &Seconds",
            "parameters": [
                {"name": "WinTitle", "type": "text", "placeholder": "Título da Janela"},
                {"name": "Seconds", "type": "number", "placeholder": "Tempo limite (segundos)"}
            ],
            "description": "Aguarda até que a janela exista."
        },
        {
            "id": "WinClose",
            "label": "Fechar Janela (WinClose)",
            "template": "WinClose, &WinTitle",
            "parameters": [
                {"name": "WinTitle", "type": "text", "placeholder": "Título da Janela"}
            ],
            "description": "Fecha a janela especificada."
        }
    ],
    "Controle de Fluxo": [
        {
            "id": "Sleep",
            "label": "Pausar (Sleep)",
            "template": "Sleep, &Delay",
            "parameters": [
                {"name": "Delay", "type": "number", "placeholder": "Milissegundos (1000 = 1s)"}
            ],
            "description": "Aguarda o tempo especificado antes de continuar."
        },
        {
            "id": "MsgBox",
            "label": "Caixa de Mensagem (MsgBox)",
            "template": "MsgBox, &Text",
            "parameters": [
                {"name": "Text", "type": "text", "placeholder": "Mensagem a exibir"}
            ],
            "description": "Exibe uma caixa de mensagem simples."
        },
        {
            "id": "Loop",
            "label": "Loop",
            "is_container": True,
            "template": "Loop, &Count\n{\n&children\n}",
            "parameters": [
                {"name": "Count", "type": "number", "placeholder": "Repetições (vazio para infinito)"}
            ],
            "description": "Repete um bloco de código."
        },
        {
            "id": "If",
            "label": "Condicional (If)",
            "is_container": True,
            "template": "If (&Condition)\n{\n&children\n}",
            "parameters": [
                {"name": "Condition", "type": "text", "placeholder": "Ex: x > 100"}
            ],
            "description": "Executa o bloco se a condição for verdadeira."
        },
        {
            "id": "While",
            "label": "Enquanto (While)",
            "is_container": True,
            "template": "While (&Condition)\n{\n&children\n}",
            "parameters": [
                {"name": "Condition", "type": "text", "placeholder": "Ex: x < 500"}
            ],
            "description": "Repete o bloco enquanto a condição for verdadeira."
        }
    ]
}

@app.route('/api/commands', methods=['GET'])
def get_commands():
    return jsonify(COMMAND_LIBRARY)

@app.route('/api/pick-position', methods=['GET'])
def pick_position():
    """
    Aguarda um clique do botão esquerdo e retorna a posição do mouse.
    """
    # Constantes para ctypes
    VK_LBUTTON = 0x01
    
    # Espera o botão ser solto (caso o usuário ainda esteja clicando no botão da interface)
    while ctypes.windll.user32.GetAsyncKeyState(VK_LBUTTON) & 0x8000:
        time.sleep(0.1)

    # Espera o botão ser pressionado
    while not (ctypes.windll.user32.GetAsyncKeyState(VK_LBUTTON) & 0x8000):
        time.sleep(0.05)

    class POINT(ctypes.Structure):
        _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
    
    pt = POINT()
    ctypes.windll.user32.GetCursorPos(ctypes.byref(pt))
    
    # Obter resolução da tela
    ctypes.windll.user32.SetProcessDPIAware()
    width = ctypes.windll.user32.GetSystemMetrics(0)
    height = ctypes.windll.user32.GetSystemMetrics(1)

    return jsonify({"x": pt.x, "y": pt.y, "screenWidth": width, "screenHeight": height})

def generate_block(actions, indent_level=1):
    code_lines = []
    indent = "    " * indent_level
    
    for action in actions:
        cmd_id = action.get('command_id')
        params = action.get('params', {})
        children = action.get('children', [])
        
        # Busca o template
        cmd_obj = None
        for category in COMMAND_LIBRARY.values():
            for cmd in category:
                if cmd['id'] == cmd_id:
                    cmd_obj = cmd
                    break
            if cmd_obj:
                break
                
        # Lógica especial para coordenadas relativas
        if cmd_id in ["Click", "MouseMove"] and params.get("relative") is True:
            try:
                x = float(params.get("x", 0))
                y = float(params.get("y", 0))
                sw = float(params.get("screenWidth", 1920)) # Default fallback
                sh = float(params.get("screenHeight", 1080)) # Default fallback
                
                # Se sw/sh forem 0 ou inválidos, fallback
                if sw == 0: sw = 1920
                if sh == 0: sh = 1080

                x_perc = x / sw
                y_perc = y / sh
                
                # Gera código para calcular posição relativa
                code_lines.append(f"{indent}CoordMode, Mouse, Screen")
                code_lines.append(f"{indent}rx := (A_ScreenWidth * {x_perc:.4f})")
                code_lines.append(f"{indent}ry := (A_ScreenHeight * {y_perc:.4f})")
                
                # Substitui no template
                template = cmd_obj['template']
                generated_cmd = template.replace("&x", "%rx%").replace("&y", "%ry%")
                
                # Substitui outros parâmetros (ex: button)
                for param in cmd_obj.get('parameters', []):
                    if param['name'] in ['x', 'y', 'relative', 'screenWidth', 'screenHeight']:
                        continue
                    p_name = param['name']
                    p_val = params.get(p_name, '')
                    placeholder = f"&{p_name}"
                    generated_cmd = generated_cmd.replace(placeholder, str(p_val))
                
                code_lines.append(f"{indent}{generated_cmd}")
                continue # Pula o processamento padrão
            except Exception as e:
                code_lines.append(f"{indent}; Erro ao calcular coordenadas relativas: {str(e)}")
                # Fallback para processamento padrão

                break
        
        if not cmd_obj:
            code_lines.append(f"{indent}; Erro: Comando {cmd_id} desconhecido")
            continue

        template = cmd_obj['template']
        generated_cmd = template

        # Substituição de parâmetros
        for param in cmd_obj.get('parameters', []):
            p_name = param['name']
            p_val = params.get(p_name, '')
            placeholder = f"&{p_name}"
            generated_cmd = generated_cmd.replace(placeholder, str(p_val))
            
        # Processamento de filhos (containers)
        if cmd_obj.get('is_container'):
            children_code = generate_block(children, indent_level + 1)
            generated_cmd = generated_cmd.replace("&children", children_code)
        
        # Indentação correta para cada linha do comando gerado
        # Se o template tem múltiplas linhas (como Loop), precisamos indentar as linhas subsequentes
        cmd_lines = generated_cmd.split('\n')
        indented_cmd = []
        for i, line in enumerate(cmd_lines):
            if i == 0:
                indented_cmd.append(f"{indent}{line}")
            else:
                # Se a linha já não tiver indentação suficiente (ex: fechamento de chave), adiciona
                # Mas cuidado para não duplicar indentação se o template já tiver
                indented_cmd.append(f"{indent}{line}")
                
        code_lines.append("\n".join(indented_cmd))

    return "\n".join(code_lines)

@app.route('/api/generate', methods=['POST'])
def generate_ahk_code():
    data = request.json
    macros = data.get('macros', [])
    
    full_script = "; Gerado por AHK Generator Pro\n\n"
    
    for macro in macros:
        hotkey = macro.get('hotkey', '')
        actions = macro.get('actions', [])
        
        if not hotkey:
            continue
            
        full_script += f"{hotkey}::\n"
        full_script += generate_block(actions, 1)
        full_script += "\nReturn\n\n"
        
    return jsonify({"code": full_script})


@app.route('/api/run-macro', methods=['POST'])
def run_macro():
    """
    Recebe JSON com 'code' (string) ou 'macros' (lista). Gera .ahk, grava em arquivo temporário,
    tenta localizar AutoHotkey.exe e executá-lo. Retorna JSON com status e caminho do arquivo.
    """
    data = request.json or {}
    code = data.get('code')
    macros = data.get('macros')

    if not code:
        # se recebeu macros, gera
        if macros:
            # Reuse existing generator
            try:
                # gera o script usando a função interna
                full_script = "; Gerado por AHK Generator Pro\n\n"
                for macro in macros:
                    hotkey = macro.get('hotkey', '')
                    actions = macro.get('actions', [])
                    if not hotkey:
                        continue
                    full_script += f"{hotkey}::\n"
                    full_script += generate_block(actions, 1)
                    full_script += "\nReturn\n\n"
                code = full_script
            except Exception as e:
                return jsonify({"success": False, "error": f"Erro ao gerar script: {str(e)}"}), 500
        else:
            return jsonify({"success": False, "error": "Nenhum código ou macros fornecidos."}), 400

    # grava em arquivo temporário
    try:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.ahk', prefix='ahk_', dir=os.getcwd())
        tmp_path = tmp.name
        tmp.write(code.encode('utf-8'))
        tmp.close()
    except Exception as e:
        return jsonify({"success": False, "error": f"Erro ao gravar arquivo: {str(e)}"}), 500

    # Tenta localizar AutoHotkey.exe em caminhos comuns
    candidates = []
    pf = os.environ.get('ProgramFiles', r'C:\Program Files')
    pfx86 = os.environ.get('ProgramFiles(x86)', r'C:\Program Files (x86)')
    candidates.append(os.path.join(pf, 'AutoHotkey', 'AutoHotkey.exe'))
    candidates.append(os.path.join(pfx86, 'AutoHotkey', 'AutoHotkey.exe'))
    # also check common portable path
    candidates.append(os.path.join(os.getcwd(), 'AutoHotkey.exe'))

    ahk_exe = None
    for c in candidates:
        if os.path.exists(c):
            ahk_exe = c
            break

    if not ahk_exe:
        # try in PATH
        which = shutil.which('AutoHotkey.exe') or shutil.which('AutoHotkey')
        if which:
            ahk_exe = which

    started = False
    err_msg = None
    pid = None
    if ahk_exe:
        try:
            # Use Popen so it doesn't block; we detach
            proc = subprocess.Popen([ahk_exe, tmp_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            started = True
            pid = proc.pid
        except Exception as e:
            err_msg = str(e)
    else:
        err_msg = 'AutoHotkey.exe não encontrado. Instale o AutoHotkey ou informe o caminho.'

    # Retorna resposta com sucesso parcial e caminho do arquivo para download
    resp = {
        "success": started,
        "exe": ahk_exe,
        "file": os.path.abspath(tmp_path),
        "pid": pid,
        "error": err_msg
    }

    return jsonify(resp)


if __name__ == '__main__':
    app.run(debug=True)