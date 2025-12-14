export const AVAILABLE_LANGUAGES = ['en', 'pt'];
export const DEFAULT_LANGUAGE = 'en';

export const CONTROL_KEYS_MAP = {
    'Ctrl': '^',
    'Alt': '!',
    'Shift': '+',
    'Win': '#',
}

export const AVAILABLE_KEYS = [
    // Letras e Números
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',

    // Teclas de Função
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',

    // Modificadores (Símbolos AHK)
    '^',    // Ctrl (Caret)
    '!',    // Alt (Exclamation Mark)
    '+',    // Shift (Plus Sign)
    '#',    // Win (Hash/Number Sign)

    // Teclas de Ação/Especiais
    'Space',
    'Tab',
    'Enter',
    'Esc',  // Escape
    'Delete',
    'Home',
    'End',
    'PgUp', // Page Up
    'PgDn', // Page Down
    'Up',   // Seta para cima
    'Down', // Seta para baixo
    'Left', // Seta para a esquerda
    'Right',// Seta para a direita
    'LWin', // Left Windows Key (se precisar de especificidade)
    'RWin', // Right Windows Key
];

export const SPECIAL_KEY_MAP = {
    Escape: 'Esc',
    ' ': 'Space',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Enter: 'Enter',
    Tab: 'Tab',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'PgUp',
    PageDown: 'PgDn',
    Pause: 'Pause',
    CapsLock: 'CapsLock'
};