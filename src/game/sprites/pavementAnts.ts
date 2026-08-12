import { Ant } from '../../types';
import workerJson from '../../../assets/ants/pavement/worker_atlas.json';
import queenJson from '../../../assets/ants/pavement/queen_atlas.json';
import alateQueenJson from '../../../assets/ants/pavement/alate_queen_atlas.json';
import droneJson from '../../../assets/ants/pavement/drone_atlas.json';
import pupaJson from '../../../assets/ants/pavement/pupa_atlas.json';
import larvaJson from '../../../assets/ants/pavement/larva_atlas.json';

export type AntCaste = 'worker' | 'queen' | 'alate_queen' | 'drone' | 'pupa' | 'larva';

export interface AnimationSpec {
  frames: number;
  row: number;
  frame_ms: number;
  loop: boolean;
}

export interface PavementAntAtlas {
  caste: string;
  cell: number;
  facing: string;
  ground_line_y: number;
  animations: Record<string, AnimationSpec>;
  atlas: { file: string; cols: number; rows: number };
}

export const PAVEMENT_ANT_ATLASES: Record<AntCaste, PavementAntAtlas> = {
  worker: workerJson as PavementAntAtlas,
  queen: queenJson as PavementAntAtlas,
  alate_queen: alateQueenJson as PavementAntAtlas,
  drone: droneJson as PavementAntAtlas,
  pupa: pupaJson as PavementAntAtlas,
  larva: larvaJson as PavementAntAtlas,
};

const ATLAS_SOURCES: Record<AntCaste, number> = {
  worker: require('../../../assets/ants/pavement/worker_atlas.png'),
  queen: require('../../../assets/ants/pavement/queen_atlas.png'),
  alate_queen: require('../../../assets/ants/pavement/alate_queen_atlas.png'),
  drone: require('../../../assets/ants/pavement/drone_atlas.png'),
  pupa: require('../../../assets/ants/pavement/pupa_atlas.png'),
  larva: require('../../../assets/ants/pavement/larva_atlas.png'),
};

export function atlasSource(caste: AntCaste): number {
  return ATLAS_SOURCES[caste];
}

export interface FrameInfo {
  col: number;
  row: number;
  anim: AnimationSpec;
}

export function getFrame(meta: PavementAntAtlas, animation: string, frame: number): FrameInfo {
  const anim = meta.animations[animation] ?? meta.animations.idle;
  const safe = anim.loop ? frame % anim.frames : Math.min(frame, anim.frames - 1);
  return {
    col: safe % meta.atlas.cols,
    row: anim.row + Math.floor(safe / meta.atlas.cols),
    anim,
  };
}

export interface SpriteConfig {
  caste: AntCaste;
  size: number;
}

export const ANT_TYPE_SPRITE: Record<'queen' | 'worker' | 'soldier' | 'larva', SpriteConfig> = {
  queen: { caste: 'queen', size: 26 },
  worker: { caste: 'worker', size: 16 },
  soldier: { caste: 'worker', size: 17 },
  larva: { caste: 'larva', size: 13 },
};

export function animationForAnt(ant: Ant): string {
  const { type, state } = ant;
  if (type === 'larva') {
    if (state === 'moving') return 'squirm';
    if (state === 'eating') return 'feed';
    return 'idle';
  }
  if (type === 'queen') {
    if (state === 'moving') return 'walk';
    if (state === 'eating') return 'groom';
    return 'idle';
  }
  if (state === 'moving' || state === 'digging') return 'walk';
  if (state === 'carrying') return 'carry';
  if (state === 'eating') return 'feed';
  return 'idle';
}
