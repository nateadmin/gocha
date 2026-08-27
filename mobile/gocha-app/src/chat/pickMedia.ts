export type PickedMedia = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export async function pickCameraPhoto(): Promise<PickedMedia | null> {
  return null;
}

export async function pickDocument(): Promise<PickedMedia | null> {
  return null;
}
