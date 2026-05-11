export function sanitizeFilename(name, fallback = 'natakala-file') {
  const cleanName = String(name || fallback)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanName || fallback;
}

export function datedFilename(baseName, extension) {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = extension.startsWith('.') ? extension : `.${extension}`;

  return sanitizeFilename(`${baseName} - ${date}${suffix}`);
}

export async function saveBlob(blob, suggestedName, types = []) {
  const filename = sanitizeFilename(suggestedName);

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { savedWithPicker: true };
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { cancelled: true };
      }
    }
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return { savedWithPicker: false };
}
