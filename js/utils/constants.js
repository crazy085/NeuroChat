// Application Constants
const APP_CONFIG = {
    NAME: 'NeuroChat',
    VERSION: '2.0.0',
    AUTHOR: 'NeuroChat Inc.',
    DESCRIPTION: 'Real-time messaging platform'
};

// Storage Keys
const STORAGE_KEYS = {
    USER: 'neurochat_user',
    CHATS: 'neurochat_chats',
    MESSAGES: 'neurochat_messages',
    SETTINGS: 'neurochat_settings',
    AUTH_TOKEN: 'neurochat_auth_token',
    USERS: 'neurochat_users'
};

// API Endpoints (for future backend integration)
const API = {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout',
            REFRESH: '/api/auth/refresh'
        },
        USERS: {
            GET: '/api/users',
            CREATE: '/api/users',
            UPDATE: '/api/users/:id',
            DELETE: '/api/users/:id'
        },
        CHATS: {
            GET: '/api/chats',
            CREATE: '/api/chats',
            UPDATE: '/api/chats/:id',
            DELETE: '/api/chats/:id',
            MESSAGES: '/api/chats/:id/messages'
        },
        MESSAGES: {
            SEND: '/api/messages',
            UPDATE: '/api/messages/:id',
            DELETE: '/api/messages/:id'
        }
    }
};

// Message Status
const MESSAGE_STATUS = {
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed'
};

// User Status
const USER_STATUS = {
    ONLINE: 'online',
    AWAY: 'away',
    OFFLINE: 'offline',
    BUSY: 'busy'
};

// Chat Types
const CHAT_TYPES = {
    DIRECT: 'direct',
    GROUP: 'group'
};

// Event Names
const EVENTS = {
    // Auth Events
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_REGISTER: 'user:register',
    
    // Chat Events
    CHAT_CREATED: 'chat:created',
    CHAT_UPDATED: 'chat:updated',
    CHAT_DELETED: 'chat:deleted',
    
    // Message Events
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_READ: 'message:read',
    MESSAGE_UPDATED: 'message:updated',
    MESSAGE_DELETED: 'message:deleted',
    
    // Real-time Events
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',
    USER_STATUS_CHANGED: 'user:status:changed',
    USER_ONLINE: 'user:online',
    USER_OFFLINE: 'user:offline'
};

// Default Settings
const DEFAULT_SETTINGS = {
    darkMode: false,
    desktopNotifications: false,
    soundNotifications: true,
    readReceipts: true,
    lastSeen: true,
    typingIndicators: true,
    onlineStatus: true
};

// Emoji Categories
const EMOJI_CATEGORIES = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈'],
    food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'],
    travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩', '🛫', '🛬', '🪂', '💺', '🚂', '🚆', '🚊', '🚝', '🚄', '🚅', '🚈', '🚞', '🚋', '🚉', '🚇', '🚠', '🚟', '🚃', '🚋', '🚌', '🚍', '🚐', '🚎', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🛻', '🚚', '🚛', '🚜', '🏎', '🏍', '🛵', '🚲', '🛴', '🛹', '🛼'],
    objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙️', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🧴', '🛎', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🖼', '🛍', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒', '🗓', '📆', '📅', '🗑', '📇', '🗃', '🗳', '🗄', '📋', '📁', '📂', '🗂', '🗞', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊', '🖋', '✒️', '🖌', '🖍', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅']
};

// Time Formats
const TIME_FORMATS = {
    SHORT: 'h:mm A',
    LONG: 'h:mm:ss A',
    DATE: 'MMM DD, YYYY',
    DATETIME: 'MMM DD, YYYY h:mm A'
};

// Error Messages
const ERROR_MESSAGES = {
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid username or password',
        USER_NOT_FOUND: 'User not found',
        USERNAME_TAKEN: 'Username is already taken',
        EMAIL_TAKEN: 'Email is already registered',
        WEAK_PASSWORD: 'Password must be at least 6 characters',
        SESSION_EXPIRED: 'Session expired, please login again'
    },
    CHAT: {
        NOT_FOUND: 'Chat not found',
        ACCESS_DENIED: 'Access denied',
        ALREADY_EXISTS: 'Chat already exists'
    },
    MESSAGE: {
        NOT_FOUND: 'Message not found',
        EMPTY: 'Message cannot be empty',
        TOO_LONG: 'Message is too long'
    },
    NETWORK: {
        OFFLINE: 'You are offline',
        TIMEOUT: 'Request timeout',
        SERVER_ERROR: 'Server error, please try again'
    }
};

// Success Messages
const SUCCESS_MESSAGES = {
    AUTH: {
        LOGIN: 'Login successful',
        LOGOUT: 'Logout successful',
        REGISTER: 'Account created successfully'
    },
    CHAT: {
        CREATED: 'Chat created successfully',
        UPDATED: 'Chat updated successfully',
        DELETED: 'Chat deleted successfully'
    },
    MESSAGE: {
        SENT: 'Message sent successfully',
        UPDATED: 'Message updated successfully',
        DELETED: 'Message deleted successfully'
    },
    PROFILE: {
        UPDATED: 'Profile updated successfully'
    }
};

// Notification Types
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning'
};

// Export all constants
window.APP_CONSTANTS = {
    APP_CONFIG,
    STORAGE_KEYS,
    API,
    MESSAGE_STATUS,
    USER_STATUS,
    CHAT_TYPES,
    EVENTS,
    DEFAULT_SETTINGS,
    EMOJI_CATEGORIES,
    TIME_FORMATS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    NOTIFICATION_TYPES
};
