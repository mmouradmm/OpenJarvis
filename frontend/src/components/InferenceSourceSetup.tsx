import { useReducer, useState, type FormEvent } from 'react';
import { ArrowLeft, Cpu, Download, Loader2, Server, ShieldCheck } from 'lucide-react';
import {
  resetInferenceSource,
  stageInferenceSource,
  startBackend,
  type InferenceSource,
} from '../lib/api';

export type InferenceSetupStep = 'choose' | 'ollama' | 'custom';
export type InferenceSetupAction = 'choose_ollama' | 'choose_custom' | 'back';
export type InferenceSourceSubmission = InferenceSource & { apiKey?: string };

/** Pure navigation state: merely inspecting a source can never start setup. */
export function inferenceSetupReducer(
  state: InferenceSetupStep,
  action: InferenceSetupAction,
): InferenceSetupStep {
  switch (action) {
    case 'choose_ollama':
      return 'ollama';
    case 'choose_custom':
      return 'custom';
    case 'back':
      return 'choose';
    default:
      return state;
  }
}

/**
 * Persist first, start second. Dependency injection keeps the consent boundary
 * directly testable without a Tauri runtime.
 */
export async function persistAndStartInferenceSource(
  source: InferenceSourceSubmission,
  persist: (value: InferenceSourceSubmission) => Promise<void> = stageInferenceSource,
  start: () => Promise<void> = startBackend,
  rollback: () => Promise<void> = resetInferenceSource,
): Promise<void> {
  let persisted = false;
  try {
    await persist(source);
    persisted = true;
    await start();
  } catch (error) {
    if (persisted) {
      await rollback().catch(() => {});
    }
    throw error;
  }
}

function SetupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg px-6">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
          >
            <Cpu size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Elige dónde funciona tu IA
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No se instala, inicia ni descarga nada hasta que confirmes una opción.
          </p>
        </div>
        <div
          className="p-6 rounded-2xl"
          style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function InferenceSourceChooser({
  onChoose,
}: {
  onChoose: (source: 'ollama' | 'custom') => void;
}) {
  return (
    <SetupFrame>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onChoose('ollama')}
          className="flex items-start gap-4 p-4 rounded-xl text-left transition-all cursor-pointer"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Cpu size={22} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
          <span>
            <span className="block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Ollama local
            </span>
            <span className="block text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Usa modelos en este equipo. Te pediremos confirmación antes de iniciar Ollama o descargar un modelo.
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChoose('custom')}
          className="flex items-start gap-4 p-4 rounded-xl text-left transition-all cursor-pointer"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Server size={22} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
          <span>
            <span className="block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Servidor compatible con OpenAI
            </span>
            <span className="block text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Conéctate a LM Studio, vLLM, SGLang, llama.cpp, MLX u otro servidor compatible. Ollama queda apagado.
            </span>
          </span>
        </button>
      </div>
    </SetupFrame>
  );
}

function BackButton({ onClick, label = 'Atrás', disabled = false }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-sm mb-5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  );
}

export function InferenceRecoveryButton({
  recovering,
  onChange,
}: {
  recovering: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={recovering}
      className="w-full mt-4 py-2.5 px-4 rounded-xl text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      {recovering ? 'Deteniendo la configuración...' : 'Cambiar origen de la IA'}
    </button>
  );
}

export function OllamaConsent({
  onBack,
  onConfirm,
  busy = false,
  error = '',
}: {
  onBack: () => void;
  onConfirm: () => void;
  busy?: boolean;
  error?: string;
}) {
  return (
    <SetupFrame>
      <BackButton onClick={onBack} disabled={busy} />
      <div className="flex items-start gap-3 mb-5">
        <Download size={22} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
            ¿Permitir instalar un modelo local?
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            AXE iniciará Ollama y puede descargar un modelo elegido para este equipo. Los modelos pueden ocupar varios gigabytes de disco y de datos de internet.
          </p>
        </div>
      </div>
      <div
        className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-xs mb-5"
        style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-text-secondary)' }}
      >
        <ShieldCheck size={16} className="shrink-0" style={{ color: 'var(--color-accent)' }} />
        Si vuelves atrás, Ollama sigue apagado y no se guarda esta opción.
      </div>
      {error && <SetupError message={error} />}
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: 'var(--color-accent)', color: 'white' }}
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? 'Iniciando la configuración local...' : 'Usar Ollama y continuar'}
      </button>
    </SetupFrame>
  );
}

function SetupError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="px-3.5 py-3 rounded-lg text-sm mb-4"
      style={{
        background: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)',
        color: 'var(--color-error)',
      }}
    >
      {message}
    </div>
  );
}

export function CustomEndpointSetup({
  onCancel,
  onConfirm,
  busy = false,
  error = '',
}: {
  onCancel: () => void;
  onConfirm: (source: InferenceSourceSubmission) => void;
  busy?: boolean;
  error?: string;
}) {
  const [host, setHost] = useState('http://localhost:1234/v1');
  const [model, setModel] = useState('');
  const [engine, setEngine] = useState('lmstudio');
  const [apiKey, setApiKey] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({
      kind: 'custom',
      host: host.trim(),
      model: model.trim(),
      engine,
      apiKey: apiKey.trim() || undefined,
    });
  };

  const fieldStyle = {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  };

  return (
    <SetupFrame>
      <BackButton onClick={onCancel} label="Cancelar" disabled={busy} />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
            Conecta tu servidor
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            AXE solo se conectará cuando envíes este formulario. Ollama no se iniciará ni descargará modelos.
          </p>
        </div>
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          URL del servidor
          <input
            aria-label="URL del servidor"
            type="url"
            required
            value={host}
            onChange={(event) => setHost(event.target.value)}
            className="block w-full mt-1.5 px-3 py-2 rounded-lg text-sm outline-none"
            style={fieldStyle}
          />
        </label>
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          ID del modelo
          <input
            aria-label="ID del modelo"
            type="text"
            required
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="qwen2.5-7b-instruct"
            className="block w-full mt-1.5 px-3 py-2 rounded-lg text-sm outline-none"
            style={fieldStyle}
          />
        </label>
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Tipo de servidor
          <select
            aria-label="Tipo de servidor"
            value={engine}
            onChange={(event) => setEngine(event.target.value)}
            className="block w-full mt-1.5 px-3 py-2 rounded-lg text-sm outline-none"
            style={fieldStyle}
          >
            <option value="lmstudio">LM Studio</option>
            <option value="vllm">vLLM</option>
            <option value="sglang">SGLang</option>
            <option value="llamacpp">llama.cpp</option>
            <option value="mlx">MLX</option>
          </select>
        </label>
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Clave API (opcional)
          <input
            aria-label="Clave API"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
            className="block w-full mt-1.5 px-3 py-2 rounded-lg text-sm outline-none"
            style={fieldStyle}
          />
        </label>
        {error && <SetupError message={error} />}
        <button
          type="submit"
          disabled={busy || !host.trim() || !model.trim()}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: 'white' }}
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {busy ? 'Conectando...' : 'Guardar y conectar'}
        </button>
      </form>
    </SetupFrame>
  );
}

export function InferenceSourceSetup({ onStarted }: { onStarted: () => void }) {
  const [step, dispatch] = useReducer(inferenceSetupReducer, 'choose');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const begin = async (source: InferenceSourceSubmission) => {
    setBusy(true);
    setError('');
    try {
      await persistAndStartInferenceSource(source);
      onStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  if (step === 'ollama') {
    return (
      <OllamaConsent
        busy={busy}
        error={error}
        onBack={() => dispatch('back')}
        onConfirm={() => void begin({ kind: 'ollama' })}
      />
    );
  }
  if (step === 'custom') {
    return (
      <CustomEndpointSetup
        busy={busy}
        error={error}
        onCancel={() => dispatch('back')}
        onConfirm={(source) => void begin(source)}
      />
    );
  }
  return (
    <InferenceSourceChooser
      onChoose={(source) => dispatch(source === 'ollama' ? 'choose_ollama' : 'choose_custom')}
    />
  );
}
