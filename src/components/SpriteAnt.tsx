import { useEffect, useId, useState } from 'react';
import { ClipPath, Defs, G, Image as SvgImage, Rect } from 'react-native-svg';
import { Ant } from '../types';
import {
  ANT_TYPE_SPRITE,
  animationForAnt,
  atlasSource,
  getFrame,
  PAVEMENT_ANT_ATLASES,
} from '../game/sprites/pavementAnts';

interface Props {
  ant: Ant;
  x: number;
  y: number;
  size: number;
}

export default function SpriteAnt({ ant, x, y, size }: Props) {
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const config = ANT_TYPE_SPRITE[ant.type as keyof typeof ANT_TYPE_SPRITE];
  const meta = PAVEMENT_ANT_ATLASES[config.caste];
  const animation = animationForAnt(ant);
  const anim = meta.animations[animation] ?? meta.animations.idle;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    const id = setInterval(() => {
      setFrame((f) => {
        if (!anim.loop && f >= anim.frames - 1) return f;
        return (f + 1) % anim.frames;
      });
    }, anim.frame_ms);
    return () => clearInterval(id);
  }, [animation, anim.frame_ms, anim.frames, anim.loop]);

  const { col, row } = getFrame(meta, animation, frame);
  const facing = ant.facing === 'left' ? -1 : 1;
  // Subtle walk bob for active ants, derived from the frame we already animate
  // (no extra timers or re-renders) so movement reads as alive without cost.
  const isActive = animation === 'walk' || ant.state === 'moving' || ant.state === 'carrying';
  const bob = isActive && anim.frames > 1 ? Math.sin((frame / anim.frames) * Math.PI * 2) * 1.2 : 0;
  const frameX = x - size / 2;
  const frameY = y - size / 2 + bob;

  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={frameX} y={frameY} width={size} height={size} />
        </ClipPath>
      </Defs>
      <G
        clipPath={`url(#${clipId})`}
        transform={`translate(${x}, ${y}) scale(${facing}, 1) translate(${-x}, ${-y})`}
      >
        <SvgImage
          href={atlasSource(config.caste)}
          x={frameX - col * size}
          y={frameY - row * size}
          width={meta.atlas.cols * size}
          height={meta.atlas.rows * size}
        />
      </G>
    </G>
  );
}
