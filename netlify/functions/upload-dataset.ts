import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const DEFAULT_STORE_NAME = 'developer-datasets';
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB upload ceiling per ingest request

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const buildObjectKey = (fileName: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeName = sanitizeFileName(fileName || 'dataset.csv');
  return `${timestamp}-${safeName}`;
};

const jsonResponse = (statusCode: number, payload: Record<string, unknown>) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const parseJsonBody = (body: string | null | undefined) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const toRequest = (event: HandlerEvent): Request => {
  const headers = new Headers();
  Object.entries(event.headers || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
    } else if (typeof value === 'string') {
      headers.append(key, value);
    }
  });

  const url =
    event.rawUrl ||
    `https://${headers.get('host') || 'localhost'}${event.path || ''}`;

  const body =
    event.body !== undefined && event.body !== null
      ? Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
      : undefined;

  return new Request(url, {
    method: event.httpMethod,
    headers,
    body,
  });
};

export const handler: Handler = async (event) => {
  const storeName = process.env.DATASET_STORE_NAME || DEFAULT_STORE_NAME;
  const store = getStore(storeName);

  switch (event.httpMethod) {
    case 'OPTIONS':
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ok: true }),
      };
    case 'POST': {
      const contentType =
        event.headers?.['content-type'] ||
        event.headers?.['Content-Type'] ||
        '';

      const handleJsonPayload = async () => {
        const data = parseJsonBody(event.body);
        if (!data) {
          return jsonResponse(400, { error: 'Invalid JSON payload.' });
        }

        const { fileName, content } = data as {
          fileName?: string;
          content?: string;
        };

        if (!fileName || typeof fileName !== 'string') {
          return jsonResponse(400, { error: 'Missing fileName.' });
        }

        if (typeof content !== 'string' || content.length === 0) {
          return jsonResponse(400, { error: 'Missing content.' });
        }

        const contentBytes = Buffer.byteLength(content, 'utf8');
        if (contentBytes > MAX_UPLOAD_BYTES) {
          return jsonResponse(413, {
            error: `Payload exceeds ${Math.floor(
              MAX_UPLOAD_BYTES / (1024 * 1024)
            )} MB limit.`,
          });
        }

        const objectKey = buildObjectKey(fileName);
        try {
          await store.set(objectKey, content);
          return jsonResponse(200, {
            key: objectKey,
            uploadedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Blob upload failed', error);
          return jsonResponse(500, { error: 'Failed to upload dataset.' });
        }
      };

      if (contentType.includes('multipart/form-data')) {
        const request = toRequest(event);
        let formData: FormData;
        try {
          formData = await request.formData();
        } catch (error) {
          console.error('Form parsing failed', error);
          return jsonResponse(400, { error: 'Invalid form payload.' });
        }

        const fileEntry = formData.get('file');
        const providedName = formData.get('fileName');

        if (!(fileEntry instanceof File)) {
          return jsonResponse(400, { error: 'Missing file upload.' });
        }

        const fileName =
          (typeof providedName === 'string' && providedName.trim()) ||
          fileEntry.name ||
          'dataset.csv';

        if (fileEntry.size > MAX_UPLOAD_BYTES) {
          return jsonResponse(413, {
            error: `Payload exceeds ${Math.floor(
              MAX_UPLOAD_BYTES / (1024 * 1024)
            )} MB limit.`,
          });
        }

        const objectKey = buildObjectKey(fileName);

        try {
          await store.set(objectKey, fileEntry);
          return jsonResponse(200, {
            key: objectKey,
            uploadedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Blob upload failed', error);
          return jsonResponse(500, { error: 'Failed to upload dataset.' });
        }
      }

      return handleJsonPayload();
    }
    case 'DELETE': {
      const data = parseJsonBody(event.body);
      if (!data) {
        return jsonResponse(400, { error: 'Invalid JSON payload.' });
      }

      const { key } = data as { key?: string };
      if (!key || typeof key !== 'string') {
        return jsonResponse(400, { error: 'Missing key.' });
      }

      try {
        await store.delete(key);
        return jsonResponse(200, { deleted: true });
      } catch (error) {
        console.error('Blob delete failed', error);
        return jsonResponse(500, { error: 'Failed to delete dataset.' });
      }
    }
    default:
      return {
        statusCode: 405,
        headers: {
          Allow: 'POST,DELETE,OPTIONS',
        },
        body: 'Method Not Allowed',
      };
  }
};
