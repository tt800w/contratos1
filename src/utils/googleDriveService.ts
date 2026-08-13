const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export interface DriveFolder {
  id: string;
  name: string;
}

/**
 * Searches for a folder by name. Optionally restrict to a parent folder.
 */
export const findFolder = async (accessToken: string, folderName: string, parentId?: string): Promise<DriveFolder | null> => {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const response = await fetch(`${DRIVE_API_URL}?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error buscando carpeta: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
};

/**
 * Creates a new folder.
 */
export const createFolder = async (accessToken: string, folderName: string, parentId?: string): Promise<DriveFolder> => {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    throw new Error(`Error creando carpeta: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Ensures a folder exists, creates it if not.
 */
export const ensureFolder = async (accessToken: string, folderName: string, parentId?: string): Promise<DriveFolder> => {
  const folder = await findFolder(accessToken, folderName, parentId);
  if (folder) return folder;
  return createFolder(accessToken, folderName, parentId);
};

/**
 * Uploads a file (Blob) to a specific Drive folder using Multipart upload.
 */
export const uploadFileToDrive = async (accessToken: string, blob: Blob, fileName: string, parentId: string) => {
  const metadata = {
    name: fileName,
    parents: [parentId],
    // mimeType will be set by the blob type, or we can force it
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Error subiendo archivo ${fileName}: ${response.statusText}`);
  }

  return response.json();
};
