export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDate(isoLike) {
  const date = new Date(isoLike.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return isoLike;
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getExtension(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0 || dot === filename.length - 1) return '—';
  return filename.slice(dot + 1).toUpperCase();
}

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'log', 'xml', 'yml', 'yaml',
  'ini', 'conf', 'cfg', 'env', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html',
  'htm', 'sh', 'bash', 'py', 'java', 'c', 'h', 'cpp', 'hpp', 'go', 'rs', 'php',
  'sql', 'rb', 'toml',
]);

/** Estensioni per cui ha senso un'anteprima testuale in-app. */
export function isTextLikeFile(filename) {
  return TEXT_EXTENSIONS.has(getExtension(filename).toLowerCase());
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico']);

/** Estensioni per cui ha senso un'anteprima immagine in-app. */
export function isImageFile(filename) {
  return IMAGE_EXTENSIONS.has(getExtension(filename).toLowerCase());
}

/** True per i PDF, previsualizzabili ma non modificabili in-app. */
export function isPdfFile(filename) {
  return getExtension(filename).toLowerCase() === 'pdf';
}

const MIME_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
};

/** Mime type dedotto dall'estensione: il blob decifrato non ne ha uno proprio. */
export function getMimeType(filename) {
  return MIME_TYPES[getExtension(filename).toLowerCase()] || 'application/octet-stream';
}
