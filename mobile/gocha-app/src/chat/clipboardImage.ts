import type { PickedMedia } from './pickMedia';

export const MAX_CHAT_PASTE_IMAGE_BYTES = 8 * 1024 * 1024;

type ClipboardItemLike = {
  kind: string;
  type: string;
  getAsFile: () => File | null;
};

type ClipboardDataLike = {
  items?: ArrayLike<ClipboardItemLike>;
  files?: ArrayLike<File>;
};

export function isPasteableImageType(type: string): boolean {
  return type.toLowerCase().startsWith('image/');
}

export function shouldAcceptPastedImage(type: string, size: number): boolean {
  return isPasteableImageType(type) && size > 0 && size <= MAX_CHAT_PASTE_IMAGE_BYTES;
}

export function filesFromClipboardData(data: ClipboardDataLike | null | undefined): File[] {
  if (!data) {
    return [];
  }

  const found: File[] = [];
  const seen = new Set<File>();

  if (data.items) {
    for (let index = 0; index < data.items.length; index += 1) {
      const item = data.items[index];
      if (item.kind !== 'file' || !isPasteableImageType(item.type)) {
        continue;
      }
      const file = item.getAsFile();
      if (!file || !shouldAcceptPastedImage(file.type || item.type, file.size) || seen.has(file)) {
        continue;
      }
      seen.add(file);
      found.push(file);
    }
  }

  if (found.length === 0 && data.files) {
    for (let index = 0; index < data.files.length; index += 1) {
      const file = data.files[index];
      if (!shouldAcceptPastedImage(file.type, file.size) || seen.has(file)) {
        continue;
      }
      seen.add(file);
      found.push(file);
    }
  }

  return found;
}

export function pickedMediaFromImageFile(file: File): PickedMedia {
  const mimeType = file.type || 'image/png';
  const ext = mimeType.split('/')[1] || 'png';
  return {
    uri: URL.createObjectURL(file),
    fileName: file.name && file.name.trim() ? file.name : `pasted-image.${ext}`,
    mimeType,
  };
}
