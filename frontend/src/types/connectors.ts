export interface SetupStep {
  label: string;
  url?: string;
  urlLabel?: string;
}

export interface ConnectorMeta {
  connector_id: string;
  display_name: string;
  auth_type: 'oauth' | 'local' | 'bridge' | 'filesystem' | 'token';
  category: 'communication' | 'documents' | 'pim' | 'other';
  icon: string;
  color: string;
  description: string;
  unitLabel?: string;  // "emails", "messages", "meeting notes", "pages", "notes", etc.
  steps?: SetupStep[];
  troubleshooting?: string[];
  inputFields?: Array<{
    name: string;
    placeholder: string;
    type?: 'text' | 'password' | 'number' | 'select';
    required?: boolean;
    defaultValue?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
}

export interface OAuthSetupInfo {
  provider: string;
  setup_url: string;
  setup_hint: string;
  has_credentials: boolean;
}

export interface ConnectorInfo {
  connector_id: string;
  display_name: string;
  auth_type: "oauth" | "local" | "bridge" | "filesystem" | "token";
  connected: boolean;
  auth_url?: string;
  mcp_tools?: string[];
  chunks?: number;
  oauth_setup?: OAuthSetupInfo | null;
}

export interface SyncStatus {
  state: "idle" | "syncing" | "stopping" | "paused" | "error";
  items_synced: number;
  items_total: number;
  /** Items processed in the current (or most recent) run only. `null`
   *  when no sync has been triggered through this server session yet. */
  new_items_synced?: number | null;
  /** ISO 8601 timestamp of the oldest indexed item, used to label how far
   *  back the corpus reaches ("past 3 months", "past 5 years"). `null`
   *  before anything is indexed. */
  oldest_item_date?: string | null;
  last_sync: string | null;
  error: string | null;
}

export interface ConnectRequest {
  path?: string;
  token?: string;
  code?: string;
  email?: string;
  password?: string;
  /** Non-secret connector configuration such as a weather location or RSS feeds. */
  config?: Record<string, unknown>;
  host?: string;
  port?: number;
  security?: 'tls' | 'starttls';
}

/** Response from POST /v1/connectors/{id}/connect.
 *  For OAuth connectors, pasting a Client ID / Secret pair only registers the
 *  app credentials; the backend returns `status: "oauth_required"` plus an
 *  `oauth_start` path the UI must open to run the browser consent flow that
 *  actually mints an access token (see issue #512). */
export interface ConnectResponse {
  connector_id: string;
  connected: boolean;
  status: "connected" | "pending" | "oauth_required" | "disconnected";
  oauth_start?: string;
  sync_status?: string | null;
}

export type WizardStep = "pick" | "connect" | "ingest" | "ready";

// Backward-compatible alias
export type SourceCard = ConnectorMeta;

export type ConnectorCategory = ConnectorMeta['category'];

export const SOURCE_CATALOG: ConnectorMeta[] = [
  // ── Upload / Paste ─────────────────────────────────────────────────
  {
    connector_id: 'upload',
    display_name: 'Subir / Pegar',
    auth_type: 'filesystem',
    category: 'other',
    icon: 'FileUp',
    color: 'text-blue-400',
    description: 'Pega texto o sube documentos',
    unitLabel: 'documents',
    steps: [
      { label: 'Pega texto o sube archivos (.txt, .md, .pdf, .docx, .csv) para añadirlos a tu base de conocimiento.' },
    ],
    inputFields: [],
  },
  // ── Communication ──────────────────────────────────────────────────
  {
    // Unified Gmail card. Defaults to the IMAP (app-password) flow because
    // it needs no Google Cloud setup; the OAuth path is offered as an
    // "Advanced" disclosure rendered in DataSourcesPage.
    connector_id: 'gmail_imap',
    display_name: 'Gmail',
    auth_type: 'oauth',
    category: 'communication',
    icon: 'Mail',
    color: 'text-red-400',
    description: 'Correos y conversaciones',
    unitLabel: 'emails',
    steps: [
      {
        label: 'Asegúrate de tener activada la verificación en 2 pasos y genera una contraseña de aplicación de 16 caracteres (Correo / Otra / "AXE"). Pégala abajo (los espacios no importan). Usa la contraseña de aplicación, no tu contraseña normal de Gmail.',
        url: 'https://myaccount.google.com/apppasswords',
        urlLabel: 'Cómo obtener una contraseña de aplicación →',
      },
    ],
    troubleshooting: [
      "Don't see App Passwords? Make sure 2-Step Verification is enabled first.",
      "Google Workspace user? Your admin may need to enable App Passwords for your organization.",
    ],
    inputFields: [
      { name: 'email', placeholder: 'tu@gmail.com', type: 'text' },
      { name: 'password', placeholder: 'Contraseña de aplicación (xxxx xxxx xxxx xxxx)', type: 'password' },
    ],
  },
  {
    connector_id: 'imap',
    display_name: 'Correo (IMAP)',
    auth_type: 'oauth',
    category: 'communication',
    icon: 'Mail',
    color: 'text-amber-400',
    description: 'Cualquier buzón IMAP',
    unitLabel: 'emails',
    steps: [
      {
        label: 'Genera una contraseña de aplicación con tu proveedor de correo (IMAP debe estar activado) y escribe tu correo y esa contraseña. Los proveedores conocidos se detectan solos; para otros usa los ajustes opcionales del servidor.',
      },
    ],
    troubleshooting: [
      'La mayoría de proveedores piden una contraseña de aplicación, no tu contraseña normal.',
      'Use TLS for implicit TLS (usually port 993), or STARTTLS (usually port 143).',
      'For security, private, loopback, link-local, and otherwise non-public server addresses are rejected.',
    ],
    inputFields: [
      { name: 'email', placeholder: 'tu@ejemplo.com', type: 'text' },
      { name: 'password', placeholder: 'Contraseña de aplicación', type: 'password' },
      {
        name: 'host',
        placeholder: 'Servidor IMAP (opcional; se detecta solo)',
        type: 'text',
        required: false,
      },
      {
        name: 'port',
        placeholder: 'Puerto (opcional; 993 o 143)',
        type: 'number',
        required: false,
      },
      {
        name: 'security',
        placeholder: 'Seguridad de la conexión',
        type: 'select',
        defaultValue: 'tls',
        options: [
          { value: 'tls', label: 'TLS (normalmente puerto 993)' },
          { value: 'starttls', label: 'STARTTLS (normalmente puerto 143)' },
        ],
      },
    ],
  },
  {
    connector_id: 'slack',
    display_name: 'Slack',
    auth_type: 'oauth',
    category: 'communication',
    icon: 'Hash',
    color: 'text-purple-400',
    description: 'Lee los mensajes de todos los canales, canales privados y mensajes directos a los que tienes acceso',
    unitLabel: 'messages',
    steps: [
      {
        label: 'Ve a api.slack.com/apps y pulsa "Create New App" → elige "From scratch". Llámala "AXE" y elige tu espacio de trabajo',
        url: 'https://api.slack.com/apps',
        urlLabel: 'Abrir apps de Slack',
      },
      {
        label: 'En el menú de la izquierda, pulsa "OAuth & Permissions". Baja hasta "User Token Scopes" (NO "Bot Token Scopes"). Pulsa "Add an OAuth Scope" y añade CADA uno de estos permisos, uno por uno:',
      },
      {
        label: 'channels:history • channels:read • groups:history • groups:read • im:history • im:read • mpim:history • mpim:read • users:read',
      },
      {
        label: 'En el menú de la izquierda, pulsa "Install App" → "Install to Workspace" → "Allow". Después copia el "User OAuth Token" que aparece (empieza por xoxp-, NO xoxb-)',
      },
      {
        label: 'Pega el token abajo. Se sincronizarán todos los canales, canales privados y mensajes directos a los que tienes acceso; no hace falta invitar nada a los canales',
      },
      {
        label: '(Opcional) Pon el icono: en el menú de la izquierda pulsa "Basic Information" → baja a "Display Information" → sube el logo de AXE',
        url: 'https://github.com/open-jarvis/OpenJarvis/blob/main/assets/openjarvis-slack-icon.jpg',
        urlLabel: 'Descargar icono',
      },
    ],
    inputFields: [
      { name: 'token', placeholder: 'xoxp-...', type: 'password' },
    ],
  },
  {
    connector_id: 'notion',
    display_name: 'Notion',
    auth_type: 'oauth',
    category: 'documents',
    icon: 'FileText',
    color: 'text-gray-300',
    description: 'Páginas y bases de datos',
    unitLabel: 'pages',
    steps: [
      {
        label: 'Ve a notion.so/profile/integrations → pulsa "+ New integration". Llámala "AXE", elige tu espacio de trabajo y pulsa Submit',
        url: 'https://www.notion.so/profile/integrations',
        urlLabel: 'Abrir integraciones de Notion',
      },
      {
        label: 'Copia el "Internal Integration Secret" (empieza por ntn_) y pégalo abajo',
      },
      {
        label: 'Para compartir TODAS tus páginas: abre una página principal → pulsa "..." (arriba a la derecha) → "Connections" → "Add connections" → busca "AXE" → púlsalo. Así se comparten esa página y todas sus subpáginas. Repítelo con cada página principal',
      },
      {
        label: 'Consejo: si tienes una sola página principal que lo contiene todo, al compartirla se comparten también todas sus subpáginas',
      },
    ],
    inputFields: [
      { name: 'token', placeholder: 'ntn_...', type: 'password' },
    ],
  },
  {
    connector_id: 'granola',
    display_name: 'Granola',
    auth_type: 'oauth',
    category: 'documents',
    icon: 'Mic',
    color: 'text-amber-400',
    description: 'Notas de reuniones con IA',
    unitLabel: 'meeting notes',
    steps: [
      { label: 'Abre la app de escritorio de Granola. Pulsa el engranaje (Settings) abajo a la izquierda y luego "API"' },
      { label: 'Pulsa "Generate API Key" (o copia tu clave actual). Pégala abajo' },
    ],
    inputFields: [
      { name: 'token', placeholder: 'grn_...', type: 'password' },
    ],
  },
  {
    connector_id: 'imessage',
    display_name: 'iMessage',
    auth_type: 'local',
    category: 'communication',
    icon: 'MessageSquare',
    color: 'text-green-400',
    description: 'Historial de Mensajes de macOS',
    unitLabel: 'messages',
    steps: [
      {
        label: 'Open the Apple menu () → System Settings → Privacy & Security (in the left sidebar) → scroll down and click "Full Disk Access"',
      },
      {
        label: 'Pulsa el botón "+" debajo de la lista. Ve a Aplicaciones → Utilidades → elige "Terminal.app" (o iTerm2/Warp si los usas). Si usas la app de escritorio, añade también "AXE.app" desde Aplicaciones',
      },
      {
        label: 'Activa el interruptor junto a cada app que añadiste. Cierra y vuelve a abrir la terminal (o reinicia AXE). iMessage se detectará solo, sin credenciales',
      },
    ],
  },
  // ── Documents ──────────────────────────────────────────────────────
  {
    connector_id: 'obsidian',
    display_name: 'Obsidian',
    auth_type: 'filesystem',
    category: 'documents',
    icon: 'FolderOpen',
    color: 'text-purple-300',
    description: 'Bóveda de Markdown',
    unitLabel: 'notes',
    steps: [
      {
        label: 'Busca la ruta de tu bóveda: abre Obsidian → pulsa el nombre de la bóveda abajo a la izquierda → "Manage Vaults" → mira la ruta debajo del nombre. En Windows suele ser algo como C:\\Users\\tu\\Documents\\MiBoveda',
      },
      {
        label: 'También puedes abrir el Explorador de archivos → ir a la carpeta de la bóveda (tiene una carpeta oculta .obsidian) → clic derecho → "Copiar como ruta de acceso"',
      },
      {
        label: 'Pega la ruta completa abajo. AXE indexará todos los archivos .md de la bóveda',
      },
    ],
    inputFields: [
      { name: 'path', placeholder: '/Users/you/Documents/MyVault', type: 'text' },
    ],
  },
  {
    connector_id: 'gdrive',
    display_name: 'Google Drive',
    auth_type: 'oauth',
    category: 'documents',
    icon: 'FolderOpen',
    color: 'text-blue-400',
    description: 'Documentos, hojas de cálculo y archivos',
    unitLabel: 'files',
    steps: [
      {
        label: 'Ve a Google Cloud Console → crea un proyecto nuevo (o elige uno). Ponle cualquier nombre (p. ej. "AXE")',
        url: 'https://console.cloud.google.com/projectcreate',
        urlLabel: 'Crear proyecto',
      },
      {
        label: 'Activa la API de Google Drive: pulsa el enlace de abajo, comprueba que tu proyecto está elegido arriba y pulsa "Enable"',
        url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        urlLabel: 'Activar API de Drive',
      },
      {
        label: 'Crea las credenciales OAuth: ve a Credentials (enlace abajo) → "+ Create Credentials" → "OAuth client ID" → tipo: "Web application". En "Authorized redirect URIs" añade la dirección de retorno de este servidor (p. ej. http://localhost:1313/v1/connectors/gdrive/oauth/callback, con el puerto de tu servidor AXE) → "Create".',
        url: 'https://console.cloud.google.com/apis/credentials',
        urlLabel: 'Abrir credenciales',
      },
      {
        label: 'Verás tu Client ID y tu Client Secret. Cópialos, pégalos abajo y pulsa Conectar: se abrirá una ventana de Google para terminar. (Si cierras el aviso, pulsa el icono de descarga junto a tu cliente OAuth para verlos otra vez.)',
      },
    ],
    inputFields: [
      { name: 'email', placeholder: 'Client ID (p. ej. 123456-abc.apps.googleusercontent.com)', type: 'text' },
      { name: 'password', placeholder: 'Client Secret', type: 'password' },
    ],
  },
  // ── PIM (Calendar, Contacts) ───────────────────────────────────────
  {
    connector_id: 'gcalendar',
    display_name: 'Google Calendar',
    auth_type: 'oauth',
    category: 'pim',
    icon: 'Calendar',
    color: 'text-blue-400',
    description: 'Eventos y reuniones',
    unitLabel: 'events',
    steps: [
      {
        label: 'Ve a Google Cloud Console → usa el mismo proyecto que para Google Drive (o crea uno nuevo)',
        url: 'https://console.cloud.google.com/projectcreate',
        urlLabel: 'Abrir consola',
      },
      {
        label: 'Activa la API de Google Calendar: pulsa el enlace de abajo, elige tu proyecto y pulsa "Enable"',
        url: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com',
        urlLabel: 'Activar API de Calendar',
      },
      {
        label: 'Ve a Credentials → "+ Create Credentials" → "OAuth client ID" → tipo: "Desktop app" → "Create". Copia el Client ID y el Client Secret',
        url: 'https://console.cloud.google.com/apis/credentials',
        urlLabel: 'Abrir credenciales',
      },
      {
        label: 'Pega el Client ID y el Client Secret abajo (puedes usar el mismo cliente OAuth que para Google Drive si activaste ambas APIs en el mismo proyecto)',
      },
    ],
    inputFields: [
      { name: 'email', placeholder: 'Client ID', type: 'text' },
      { name: 'password', placeholder: 'Client Secret', type: 'password' },
    ],
  },
  {
    connector_id: 'gcontacts',
    display_name: 'Google Contacts',
    auth_type: 'oauth',
    category: 'pim',
    icon: 'Users',
    color: 'text-blue-400',
    description: 'Personas y contactos',
    unitLabel: 'contacts',
    steps: [
      {
        label: 'Ve a Google Cloud Console → usa el mismo proyecto que para Google Drive (o crea uno nuevo)',
        url: 'https://console.cloud.google.com/projectcreate',
        urlLabel: 'Abrir consola',
      },
      {
        label: 'Activa la People API: pulsa el enlace de abajo, elige tu proyecto y pulsa "Enable"',
        url: 'https://console.cloud.google.com/apis/library/people.googleapis.com',
        urlLabel: 'Activar People API',
      },
      {
        label: 'Ve a Credentials → "+ Create Credentials" → "OAuth client ID" → tipo: "Desktop app" → "Create". Copia el Client ID y el Client Secret',
        url: 'https://console.cloud.google.com/apis/credentials',
        urlLabel: 'Abrir credenciales',
      },
      {
        label: 'Pega el Client ID y el Client Secret abajo',
      },
    ],
    inputFields: [
      { name: 'email', placeholder: 'Client ID', type: 'text' },
      { name: 'password', placeholder: 'Client Secret', type: 'password' },
    ],
  },
  {
    connector_id: 'apple_notes',
    display_name: 'Apple Notes',
    auth_type: 'local',
    category: 'documents',
    icon: 'FileText',
    color: 'text-yellow-400',
    description: 'App Notas de macOS',
    unitLabel: 'notes',
    steps: [
      {
        label: 'Open the Apple menu () → System Settings → Privacy & Security (in the left sidebar) → scroll down and click "Full Disk Access"',
      },
      {
        label: 'Pulsa el botón "+" debajo de la lista. Ve a Aplicaciones → Utilidades → elige "Terminal.app" (o iTerm2/Warp si los usas). Si usas la app de escritorio, añade también "AXE.app" desde Aplicaciones',
      },
      {
        label: 'Activa el interruptor junto a cada app que añadiste. Cierra y vuelve a abrir la terminal (o reinicia AXE). Apple Notes se detectará solo, sin credenciales',
      },
    ],
  },
  {
    connector_id: 'apple_contacts',
    display_name: 'Apple Contacts',
    auth_type: 'local',
    category: 'pim',
    icon: 'Users',
    color: 'text-orange-400',
    description: 'App Contactos de macOS',
    unitLabel: 'contacts',
    steps: [
      {
        label: 'Open the Apple menu () → System Settings → Privacy & Security (in the left sidebar) → scroll down and click "Full Disk Access"',
      },
      {
        label: 'Pulsa el botón "+" debajo de la lista. Ve a Aplicaciones → Utilidades → elige "Terminal.app" (o iTerm2/Warp si los usas). Si usas la app de escritorio, añade también "AXE.app" desde Aplicaciones',
      },
      {
        label: 'Activa el interruptor junto a cada app que añadiste. Cierra y vuelve a abrir la terminal (o reinicia AXE). Apple Contacts se detectará solo, sin credenciales',
      },
    ],
  },
  {
    connector_id: 'outlook',
    display_name: 'Outlook',
    auth_type: 'oauth',
    category: 'communication',
    icon: 'Mail',
    color: 'text-blue-400',
    description: 'Correo y calendario de Microsoft',
    unitLabel: 'emails',
    steps: [
      {
        label: 'Ve al Azure Portal → App Registrations → "+ New registration". Llámala "AXE", elige "Accounts in this organizational directory only" y pulsa Register',
        url: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
        urlLabel: 'Abrir registros de apps de Azure',
      },
      {
        label: 'En el menú de la izquierda, pulsa "API Permissions" → "Add a permission" → "Microsoft Graph" → "Delegated permissions" → busca y marca "Mail.Read" → "Add permissions"',
      },
      {
        label: 'En el menú de la izquierda, pulsa "Certificates & secrets" → "New client secret" → pon una descripción y caducidad → "Add" → copia enseguida el "Value" (no lo volverás a ver)',
      },
      {
        label: 'Ve a "Overview" en el menú de la izquierda y copia el "Application (client) ID". Pega el Client ID y el Client Secret abajo',
      },
    ],
    inputFields: [
      { name: 'email', placeholder: 'Application (client) ID', type: 'text' },
      { name: 'password', placeholder: 'Client Secret Value', type: 'password' },
    ],
  },
  {
    connector_id: 'dropbox',
    display_name: 'Dropbox',
    auth_type: 'oauth',
    category: 'documents',
    icon: 'FolderOpen',
    color: 'text-blue-300',
    description: 'Archivos en la nube',
    unitLabel: 'files',
    steps: [
      {
        label: 'Ve a la Dropbox App Console y pulsa "Create app". Elige "Scoped access" → "Full Dropbox" → ponle un nombre (p. ej. "AXE") → "Create app"',
        url: 'https://www.dropbox.com/developers/apps/create',
        urlLabel: 'Abrir consola de apps de Dropbox',
      },
      {
        label: 'Pulsa la pestaña "Permissions" arriba. Marca "files.metadata.read" y "files.content.read" → pulsa "Submit" abajo para guardar',
      },
      {
        label: 'Vuelve a la pestaña "Settings". En "OAuth 2", busca "Generated access token" y pulsa "Generate". Copia el token y pégalo abajo',
      },
    ],
    inputFields: [
      { name: 'token', placeholder: 'Token de acceso (sl.u...)', type: 'password' },
    ],
  },
  {
    connector_id: 'whatsapp',
    display_name: 'WhatsApp',
    auth_type: 'oauth',
    category: 'communication',
    icon: 'MessageSquare',
    color: 'text-green-400',
    description: 'Mensajes de WhatsApp (API de Meta)',
    unitLabel: 'messages',
    steps: [
      {
        label: 'Ve a Meta for Developers → "Create App" → elige el tipo "Business" → rellena los datos y pulsa "Create App"',
        url: 'https://developers.facebook.com/apps/',
        urlLabel: 'Abrir portal de desarrolladores de Meta',
      },
      {
        label: 'En el panel de la app, busca "WhatsApp" y pulsa "Set up". Sigue los pasos para añadir un número de prueba. Ve a "API Setup" y copia el token de acceso temporal',
      },
      {
        label: 'Copia tu "Phone Number ID" (en la página API Setup) y el token. Pégalos abajo separados por dos puntos, p. ej. 123456789:EAABx...',
      },
    ],
    inputFields: [
      { name: 'token', placeholder: 'Phone Number ID:Access Token', type: 'password' },
    ],
  },
];
