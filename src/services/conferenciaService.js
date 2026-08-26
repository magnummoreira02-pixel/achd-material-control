/**
 * Serviço de persistência e áudio para o módulo de Conferência de Ensaio
 * Chave de storage independente do histórico existente: ACHD_CONFERENCIA_ENSAIO_V1
 */

const STORAGE_KEY = "ACHD_CONFERENCIA_ENSAIO_V1";

let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn("AudioContext indisponível.", error);
      return null;
    }
  }
  return audioContext;
}

/**
 * Toca um beep de sucesso (curto, mais agudo)
 */
export function playSuccessBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (error) {
    // ignora erros de áudio
  }
}

/**
 * Toca um beep de erro (mais longo, mais grave)
 */
export function playErrorBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 320;
    osc.type = "sawtooth";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (error) {
    // ignora erros de áudio
  }
}

/**
 * Vibração curta (sucesso)
 */
export function vibrateSuccess() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(100);
  }
}

/**
 * Vibração mais forte (erro)
 */
export function vibrateError() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

/**
 * Carrega o histórico de conferência do localStorage
 * @returns {Array}
 */
export function loadConferencia() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Falha ao carregar conferência de ensaio.", error);
    return [];
  }
}

/**
 * Salva o histórico de conferência no localStorage
 * @param {Array} records
 */
export function saveConferencia(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records || []));
  } catch (error) {
    console.warn("Falha ao salvar conferência de ensaio.", error);
  }
}

/**
 * Limpa o histórico de conferência
 */
export function clearConferencia() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Falha ao limpar conferência de ensaio.", error);
  }
}