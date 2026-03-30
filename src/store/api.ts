/**
 * API client — talks to the Python FastAPI backend.
 * Falls back to the Next.js API route if backend is unavailable.
 */

import { SceneDocument, GenerateRequest, ReviseRequest, ExportRequest } from '@/schema/scene';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function callBackend<T>(path: string, body: unknown): Promise<T> {
  // Try Python backend first
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return await res.json();
    }
    // If backend returns error, throw it
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.error || 'Backend error');
  } catch (e) {
    // If it's a network error (backend unreachable), fall through to Next.js
    if (e instanceof TypeError && e.message.includes('fetch')) {
      return callNextApi<T>(path, body);
    }
    throw e;
  }
}

async function callNextApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.detail || 'API error');
  }
  return res.json();
}

export async function generateScene(request: GenerateRequest): Promise<SceneDocument> {
  const data = await callBackend<{ scene: SceneDocument }>('/api/generate', request);
  return data.scene;
}

export async function reviseScene(scene: SceneDocument, instruction: string): Promise<SceneDocument> {
  const body: ReviseRequest = { scene, instruction };
  const data = await callBackend<{ scene: SceneDocument }>('/api/revise', body);
  return data.scene;
}

export async function exportScene(
  scene: SceneDocument,
  format: ExportRequest['format']
): Promise<Record<string, unknown>> {
  return callBackend<Record<string, unknown>>('/api/export', { scene, format });
}

export async function validateScene(scene: SceneDocument): Promise<{ valid: boolean; issues: string[] }> {
  return callBackend<{ valid: boolean; issues: string[] }>('/api/validate', { scene });
}
