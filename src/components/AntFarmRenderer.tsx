import { useMemo } from 'react';
import Svg, {
  Rect,
  Path,
  Ellipse,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { AntFarm, Ant } from '../types';
import { Colors } from '../constants/colors';
import SpriteAnt from './SpriteAnt';
import { ANT_TYPE_SPRITE } from '../game/sprites/pavementAnts';

interface Props {
  farm: AntFarm;
  ants: Ant[];
  width?: number;
  height?: number;
}

export default function AntFarmRenderer({ farm, ants, width = 340, height = 300 }: Props) {
  const soilTop = height * 0.28;
  const layerH = (height - soilTop) / 3;

  const tunnels = useMemo(() => {
    if (!farm.tunnels?.length) {
      return [<Path key="default-tunnel" d="M 170,85 L 170,300" stroke="#2E1B0E" strokeWidth={6} fill="none" />];
    }
    return farm.tunnels.map((t) => {
      const d = t.points.map((p, i) => {
        const [px, py] = [p.x * (width / farm.size.width), soilTop + p.y * ((height - soilTop) / farm.size.height)];
        return i === 0 ? `M ${px},${py}` : `L ${px},${py}`;
      }).join(' ');
      return <Path key={t.id} d={d} stroke="#2E1B0E" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    });
  }, [farm.tunnels, farm.size, width, height, soilTop]);

  const chambers = useMemo(() => {
    if (!farm.chambers?.length) {
      return [
        <Rect key="default-queen" x={140} y={soilTop + 60} width={60} height={40} rx={8} fill="#3E2723" />,
        <Rect key="default-nursery" x={60} y={soilTop + 120} width={50} height={35} rx={8} fill="#3E2723" />,
        <Rect key="default-food" x={210} y={soilTop + 120} width={50} height={35} rx={8} fill="#3E2723" />,
      ];
    }
    return farm.chambers.map((c) => {
      const cx = c.x * (width / farm.size.width);
      const cy = soilTop + c.y * ((height - soilTop) / farm.size.height);
      const cw = c.width * (width / farm.size.width);
      const ch = c.height * ((height - soilTop) / farm.size.height);
      return (
        <G key={c.id}>
          <Rect x={cx} y={cy} width={cw} height={ch} rx={8} fill="#2E1B0E" />
          {c.type === 'queen' && (
            <SvgText
              x={cx + cw / 2}
              y={cy + ch / 2}
              fontSize={ch * 0.6}
              textAnchor="middle"
              alignmentBaseline="central"
              fontWeight="bold"
            >
              👑
            </SvgText>
          )}
          {c.type === 'food_storage' && (
            <Circle cx={cx + cw / 2} cy={cy + ch / 2} r={6} fill={Colors.food} />
          )}
        </G>
      );
    });
  }, [farm.chambers, farm.size, width, height, soilTop]);

  const antSprites = useMemo(() => {
    return ants.map((ant) => {
      const ax = ant.x * (width / farm.size.width);
      const ay = soilTop + ant.y * ((height - soilTop) / farm.size.height);
      if (ant.type === 'egg') {
        return <Ellipse key={ant.id} cx={ax} cy={ay} rx={3} ry={2} fill="#d9cba8" />;
      }
      const config = ANT_TYPE_SPRITE[ant.type];
      return <SpriteAnt key={ant.id} ant={ant} x={ax} y={ay} size={config.size} />;
    });
  }, [ants, farm.size, width, height, soilTop]);

  const decorations = useMemo(() => {
    if (!farm.decorations) return null;
    return farm.decorations.map((d) => {
      const dx = d.x * (width / farm.size.width);
      const dy = d.y * (height / farm.size.height);
      if (d.type === 'plant') {
        return (
          <G key={d.id}>
            <Line x1={dx} y1={dy} x2={dx} y2={dy - 20} stroke={Colors.leaf} strokeWidth={3} />
            <Ellipse cx={dx} cy={dy - 20} rx={8} ry={4} fill={Colors.grass} />
          </G>
        );
      }
      if (d.type === 'rock') {
        return <Ellipse key={d.id} cx={dx} cy={dy} rx={12} ry={8} fill="#888" />;
      }
      return null;
    });
  }, [farm.decorations, farm.size, width, height]);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#87CEEB" />
          <Stop offset="1" stopColor="#B0E0E6" />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={width} height={soilTop} fill="url(#skyGrad)" />
      <Rect x={0} y={soilTop} width={width} height={4} fill={Colors.grass} />
      <Rect x={0} y={soilTop + 4} width={width} height={layerH - 4} fill={Colors.soil.surface} />
      <Rect x={0} y={soilTop + layerH} width={width} height={layerH} fill={Colors.soil.mid} />
      <Rect x={0} y={soilTop + layerH * 2} width={width} height={layerH} fill={Colors.soil.dark} />

      {decorations}
      {tunnels}
      {chambers}
      {antSprites}
    </Svg>
  );
}
