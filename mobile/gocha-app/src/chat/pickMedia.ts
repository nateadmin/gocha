export type PickedMedia = {
  uri: string;
  fileName: string;
  mimeType: string;
};

/** Native has no image/file picker linked yet, so pick buttons are hidden. */
export const MEDIA_PICKING_SUPPORTED = false;

export async function pickCameraPhoto(): Promise<PickedMedia | null> {
  return null;
}

export async function pickDocument(): Promise<PickedMedia | null> {
  return null;
}

export async function pickImage(): Promise<PickedMedia | null> {
  return null;
}

export async function pickVideo(): Promise<PickedMedia | null> {
  return null;
}
