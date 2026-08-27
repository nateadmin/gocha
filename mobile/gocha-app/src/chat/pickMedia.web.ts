import type { PickedMedia } from './pickMedia';

function pickFile(accept: string, capture?: boolean): Promise<PickedMedia | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) {
      input.setAttribute('capture', 'environment');
    }

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      resolve({
        uri: URL.createObjectURL(file),
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      });
    };

    input.click();
  });
}

export async function pickCameraPhoto(): Promise<PickedMedia | null> {
  return pickFile('image/*', true);
}

export async function pickDocument(): Promise<PickedMedia | null> {
  return pickFile(
    'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar',
  );
}

export type { PickedMedia };
