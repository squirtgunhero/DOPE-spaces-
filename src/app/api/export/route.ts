import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { scene, format } = await req.json();
  if (!scene) return NextResponse.json({ error: 'No scene provided' }, { status: 400 });

  if (format === 'json') {
    return NextResponse.json({ data: scene, filename: 'dope-scene.json' });
  }

  if (format === 'gltf_config') {
    return NextResponse.json({
      data: {
        format: 'gltf_config',
        note: 'Three.js-compatible scene configuration',
        scene,
      },
      filename: 'dope-scene-config.json',
    });
  }

  if (format === 'embed_config') {
    return NextResponse.json({
      data: `<!-- DOPE [spaces] Embed -->\n<script>const DOPE_SCENE=${JSON.stringify(scene)};</script>`,
      filename: 'dope-embed.html',
      contentType: 'text/html',
    });
  }

  return NextResponse.json({ error: 'Unknown format' }, { status: 400 });
}
