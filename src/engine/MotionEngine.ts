import * as THREE from 'three';
import { AnimationSpec } from './types';
import { getEasing } from '../lib/easings';

export function processAnimation(
  obj: THREE.Object3D,
  anim: AnimationSpec,
  elapsed: number,
  delta: number
) {
  // 1. Continuous rotation
  if (anim.rotateX) obj.rotation.x += anim.rotateX * delta;
  if (anim.rotateY) obj.rotation.y += anim.rotateY * delta;
  if (anim.rotateZ) obj.rotation.z += anim.rotateZ * delta;

  // 2. Float (sinusoidal Y oscillation)
  if (anim.float) {
    const f = anim.float;
    const baseY = f.baseY ?? obj.userData._floatBaseY ?? obj.position.y;
    if (obj.userData._floatBaseY === undefined) obj.userData._floatBaseY = baseY;
    obj.position.y = obj.userData._floatBaseY + Math.sin(elapsed * f.speed + (f.phase || 0)) * f.amplitude;
  }

  // 3. Sway (rotation oscillation)
  if (anim.sway) {
    const s = anim.sway;
    const base = s.baseAngle ?? 0;
    const angle = base + Math.sin(elapsed * s.speed + (s.phase || 0)) * s.amplitude;
    if (s.axis === 'x') obj.rotation.x = angle;
    else if (s.axis === 'y') obj.rotation.y = angle;
    else obj.rotation.z = angle;
  }

  // 4. Pulse (scale oscillation)
  if (anim.pulse) {
    const p = anim.pulse;
    const base = p.baseScale ?? 1;
    const s = base + Math.sin(elapsed * p.speed + (p.phase || 0)) * p.amplitude;
    obj.scale.setScalar(s);
  }

  // 5. Orbit (revolve around center)
  if (anim.orbit) {
    const o = anim.orbit;
    const cx = o.center?.[0] ?? 0;
    const cy = o.center?.[1] ?? obj.position.y;
    const cz = o.center?.[2] ?? 0;
    const angle = elapsed * o.speed + (o.phase || 0);
    const tilt = o.tilt || 0;
    obj.position.x = cx + Math.cos(angle) * o.radius;
    obj.position.z = cz + Math.sin(angle) * o.radius;
    obj.position.y = cy + Math.sin(angle) * Math.sin(tilt) * o.radius * 0.3;
    if (o.faceCenter) {
      obj.lookAt(cx, cy, cz);
    }
  }

  // 6. Path (move along waypoints)
  if (anim.path) {
    const pa = anim.path;
    const pts = pa.points;
    if (pts.length >= 2) {
      // Calculate total path length
      const segments: number[] = [];
      let totalLength = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const dx = pts[i + 1][0] - pts[i][0];
        const dy = pts[i + 1][1] - pts[i][1];
        const dz = pts[i + 1][2] - pts[i][2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        segments.push(len);
        totalLength += len;
      }
      if (totalLength === 0) totalLength = 1;
      const duration = totalLength / pa.speed;
      let t = (elapsed % duration) / duration;
      if (!pa.loop) t = Math.min(t, 1);

      let dist = t * totalLength;
      let segIdx = 0;
      while (segIdx < segments.length - 1 && dist > segments[segIdx]) {
        dist -= segments[segIdx];
        segIdx++;
      }
      const segT = segments[segIdx] > 0 ? dist / segments[segIdx] : 0;
      const a = pts[segIdx];
      const b = pts[Math.min(segIdx + 1, pts.length - 1)];
      obj.position.set(
        a[0] + (b[0] - a[0]) * segT,
        a[1] + (b[1] - a[1]) * segT,
        a[2] + (b[2] - a[2]) * segT
      );
      if (pa.faceDirection) {
        obj.lookAt(b[0], b[1], b[2]);
      }
    }
  }

  // 7. Keyframes (multi-step timeline)
  if (anim.keyframes) {
    const kf = anim.keyframes;
    const frames = kf.frames;
    if (frames.length > 0) {
      const totalDur = kf.duration ?? frames.reduce((s, f) => s + f.dur, 0);
      let t = elapsed % totalDur;
      if (!kf.loop && elapsed > totalDur) t = totalDur;

      let accumulated = 0;
      let frameIdx = 0;
      for (let i = 0; i < frames.length; i++) {
        if (accumulated + frames[i].dur > t) {
          frameIdx = i;
          break;
        }
        accumulated += frames[i].dur;
        if (i === frames.length - 1) frameIdx = i;
      }

      const frame = frames[frameIdx];
      const prevFrame = frameIdx > 0 ? frames[frameIdx - 1] : null;
      const localT = frame.dur > 0 ? Math.min((t - accumulated) / frame.dur, 1) : 1;
      const eased = getEasing(frame.ease)(Math.max(0, localT));

      if (frame.position) {
        const prev = prevFrame?.position || [obj.position.x, obj.position.y, obj.position.z];
        obj.position.set(
          prev[0] + (frame.position[0] - prev[0]) * eased,
          prev[1] + (frame.position[1] - prev[1]) * eased,
          prev[2] + (frame.position[2] - prev[2]) * eased
        );
      }
      if (frame.rotation) {
        const prev = prevFrame?.rotation || [obj.rotation.x, obj.rotation.y, obj.rotation.z];
        obj.rotation.set(
          prev[0] + (frame.rotation[0] - prev[0]) * eased,
          prev[1] + (frame.rotation[1] - prev[1]) * eased,
          prev[2] + (frame.rotation[2] - prev[2]) * eased
        );
      }
      if (frame.scale !== undefined) {
        const target = typeof frame.scale === 'number' ? [frame.scale, frame.scale, frame.scale] : frame.scale;
        const prev = prevFrame?.scale
          ? typeof prevFrame.scale === 'number'
            ? [prevFrame.scale, prevFrame.scale, prevFrame.scale]
            : prevFrame.scale
          : [obj.scale.x, obj.scale.y, obj.scale.z];
        obj.scale.set(
          prev[0] + (target[0] - prev[0]) * eased,
          prev[1] + (target[1] - prev[1]) * eased,
          prev[2] + (target[2] - prev[2]) * eased
        );
      }
    }
  }

  // 8. Emissive pulse
  if (anim.emissivePulse) {
    const ep = anim.emissivePulse;
    const intensity =
      ep.min + (ep.max - ep.min) * (0.5 + 0.5 * Math.sin(elapsed * ep.speed + (ep.phase || 0)));
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissiveIntensity = intensity;
      }
    });
  }

  // 9. Part animations (animate children of compound objects)
  if (anim.partAnimations) {
    for (const pa of anim.partAnimations) {
      const child = obj.children[pa.partIndex];
      if (child) {
        processAnimation(child, pa, elapsed, delta);
      }
    }
  }
}
