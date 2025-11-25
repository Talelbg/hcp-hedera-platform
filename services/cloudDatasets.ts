export interface CloudUploadResult {
  key: string;
  uploadedAt: string;
}

const FUNCTION_ENDPOINT = '/.netlify/functions/upload-dataset';

const parseResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

export const uploadDatasetToCloud = async (
  file: File,
  options?: { fallbackText?: string }
): Promise<CloudUploadResult> => {
  let response: Response | null = null;

  if (file) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('fileName', file.name);

    response = await fetch(FUNCTION_ENDPOINT, {
      method: 'POST',
      body: formData,
    });
  }

  if (!response && options?.fallbackText !== undefined) {
    response = await fetch(FUNCTION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file?.name ?? 'dataset.csv',
        content: options.fallbackText,
      }),
    });
  }

  if (!response) {
    throw new Error('No dataset payload provided.');
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Cloud upload failed.');
  }

  return payload as CloudUploadResult;
};

export const deleteDatasetFromCloud = async (key: string): Promise<void> => {
  const response = await fetch(FUNCTION_ENDPOINT, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    const payload = await parseResponse(response);
    throw new Error(payload?.error || 'Cloud delete failed.');
  }
};
