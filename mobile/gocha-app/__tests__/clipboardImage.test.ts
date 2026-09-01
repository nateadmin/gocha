import {
  filesFromClipboardData,
  isPasteableImageType,
  MAX_CHAT_PASTE_IMAGE_BYTES,
  shouldAcceptPastedImage,
} from '../src/chat/clipboardImage';

function fakeFile(type: string, size: number, name = 'shot.png'): File {
  const file = new File([new Uint8Array(Math.min(size, 16))], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('clipboardImage', () => {
  it('accepts image types under the size cap', () => {
    expect(isPasteableImageType('image/png')).toBe(true);
    expect(isPasteableImageType('text/plain')).toBe(false);
    expect(shouldAcceptPastedImage('image/jpeg', 1200)).toBe(true);
    expect(shouldAcceptPastedImage('image/png', 0)).toBe(false);
    expect(shouldAcceptPastedImage('image/png', MAX_CHAT_PASTE_IMAGE_BYTES + 1)).toBe(false);
  });

  it('reads image files from clipboard items and ignores text', () => {
    const png = fakeFile('image/png', 800);
    const files = filesFromClipboardData({
      items: [
        { kind: 'string', type: 'text/plain', getAsFile: () => null },
        { kind: 'file', type: 'image/png', getAsFile: () => png },
      ],
    });
    expect(files).toEqual([png]);
  });

  it('falls back to clipboard files when items are empty', () => {
    const jpeg = fakeFile('image/jpeg', 400, 'paste.jpg');
    expect(filesFromClipboardData({ files: [jpeg] })).toEqual([jpeg]);
  });

  it('returns nothing when the clipboard has no image', () => {
    expect(filesFromClipboardData({ items: [] })).toEqual([]);
    expect(filesFromClipboardData(null)).toEqual([]);
  });
});
