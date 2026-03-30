import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { scene } = await req.json();
  const issues: string[] = [];
  if (!scene) return NextResponse.json({ valid: false, issues: ['No scene provided'] });
  if (!scene.lights || scene.lights.length === 0) issues.push('No lights in scene');
  if (!scene.objects || scene.objects.length === 0) issues.push('No objects in scene');
  if (!scene.camera) issues.push('No camera defined');
  return NextResponse.json({ valid: issues.length === 0, issues });
}
