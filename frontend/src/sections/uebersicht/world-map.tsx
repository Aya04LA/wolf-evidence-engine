'use client';

import type { Feature, FeatureCollection } from 'geojson';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Country } from 'src/data/platform';

import { feature } from 'topojson-client';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Skeleton from '@mui/material/Skeleton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { fmtEUR, countries } from 'src/data/platform';

// ----------------------------------------------------------------------




const VIEW_W = 980;
const VIEW_H = 470;

const DEMO_ORANGE = '#FF7900';
const DEMO_ORANGE_MID = '#F5B463';
const DEMO_ORANGE_PALE = '#EDDED0';
const LAND_GREY = '#17302D';
const LAND_STROKE = '#405A55';

const STATUS_FILL: Record<Country['intakeStatus'], string> = {
  live: DEMO_ORANGE,
  'in progress': DEMO_ORANGE_MID,
  pending: DEMO_ORANGE_PALE,
};

const STATUS_LEGEND: { status: Country['intakeStatus']; label: string }[] = [
  { status: 'live', label: 'Intake live' },
  { status: 'in progress', label: 'Intake in progress' },
  { status: 'pending', label: 'Intake pending' },
];


const NUM_TO_ISO: Record<string, string> = {
  '040': 'AT', '276': 'DE', '752': 'SE', '250': 'FR', '380': 'IT', '724': 'ES',
  '620': 'PT', '756': 'CH', '616': 'PL', '203': 'CZ', '703': 'SK', '348': 'HU',
  '705': 'SI', '191': 'HR', '642': 'RO', '100': 'BG', '688': 'RS', '070': 'BA',
  '008': 'AL', '807': 'MK', '499': 'ME', '804': 'UA', '156': 'CN', '392': 'JP',
  '458': 'MY', '702': 'SG', '152': 'CL', '170': 'CO',
};

const marketByIso = new Map(countries.map((c) => [c.iso, c]));
const maxDealers = Math.max(...countries.map((c) => c.dealers));


const bboxFeature = (w: number, s: number, e: number, n: number): Feature => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'MultiPoint',
    coordinates: [
      [w, s],
      [e, s],
      [e, n],
      [w, n],
      [(w + e) / 2, (s + n) / 2],
    ],
  },
});

const EUROPE_BBOX = bboxFeature(-12, 33, 42, 68);
const ASIA_BBOX = bboxFeature(92, -10, 148, 52);
const SAM_BBOX = bboxFeature(-88, -58, -55, 14);

type MapView = 'europa' | 'welt';

type Badge = { country: Country; x: number; y: number; r: number };

type FlowArc = { d: string; width: number };

type TooltipState = { country: Country; x: number; y: number };

type Scene = {
  paths: { d: string; iso?: string }[];
  badges: Badge[];
  arcs: FlowArc[];
};

type WorldMapProps = {
  onSelect: (country: Country) => void;
  
  pingIso?: string | null;
};


function buildScene(
  world: FeatureCollection,
  fit: Feature | FeatureCollection,
  width: number,
  height: number,
  opts: { minBadgeDealers?: number; badgeScale?: number } = {}
): Scene {
  const { minBadgeDealers = 0, badgeScale = 1 } = opts;
  const projection = geoNaturalEarth1().fitSize([width, height], fit as never);
  const path = geoPath(projection);

  const paths = world.features.map((f) => ({
    d: path(f) ?? '',
    iso: NUM_TO_ISO[String(f.id)],
  }));

  const centroidByIso = new Map<string, [number, number]>();
  world.features.forEach((f) => {
    const iso = NUM_TO_ISO[String(f.id)];
    if (!iso) return;
    const c = path.centroid(f);
    if (Number.isFinite(c[0])) centroidByIso.set(iso, [c[0], c[1]]);
  });

  const inside = (x: number, y: number) => x >= -8 && x <= width + 8 && y >= -8 && y <= height + 8;

  const badges: Badge[] = countries.flatMap((c) => {
    // Fallback auf Koordinaten, wenn 110m-Geometrie fehlt (z. B. Singapur)
    const pos = centroidByIso.get(c.iso) ?? (projection([c.lon, c.lat]) as [number, number] | null);
    if (!pos || !inside(pos[0], pos[1])) return [];
    if (c.dealers < minBadgeDealers) return [];
    return [{ country: c, x: pos[0], y: pos[1], r: (8 + 6 * Math.sqrt(c.dealers / maxDealers)) * badgeScale }];
  });

  const badgeByIso = new Map(badges.map((b) => [b.country.iso, b]));
  const project = (lon: number, lat: number) => projection([lon, lat]) as [number, number] | null;
  const originFor: Record<string, [number, number] | null> = {
    'Import via North central warehouse': project(10.0, 52.0),
  };

  const arcs: FlowArc[] = badges.flatMap((b) => {
    const origin = originFor[b.country.supplyDependency];
    if (!origin || !inside(origin[0], origin[1])) return [];
    const [ox, oy] = origin;
    const dist = Math.hypot(b.x - ox, b.y - oy);
    if (dist < 8) return [];
    const mx = (ox + b.x) / 2;
    const my = (oy + b.y) / 2;
    return [
      {
        d: `M ${ox} ${oy} Q ${mx} ${my - dist * 0.22} ${b.x} ${b.y}`,
        width: 1 + 1.4 * Math.sqrt(b.country.dealers / maxDealers),
      },
    ];
  });

  return { paths, badges, arcs };
}

export function WorldMap({ onSelect, pingIso }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [world, setWorld] = useState<FeatureCollection | null>(null);
  const [view, setView] = useState<MapView>('europa');
  const [showArcs, setShowArcs] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [pingSeq, setPingSeq] = useState(0);

  
  useEffect(() => {
    if (pingIso) setPingSeq((s) => s + 1);
  }, [pingIso]);

  useEffect(() => {
    let active = true;

    fetch('/countries-110m.json')
      .then((res) => res.json())
      .then((topo) => {
        if (!active) return;
        setWorld(feature(topo, topo.objects.countries) as unknown as FeatureCollection);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const scenes = useMemo(() => {
    if (!world) return null;
    if (view === 'welt') {
      return {
        main: buildScene(world, world, VIEW_W, VIEW_H, { minBadgeDealers: 3 }),
        insets: [] as { title: string; scene: Scene; w: number; h: number }[],
      };
    }
    const INSET_W = 195;
    const INSET_H = 148;
    return {
      main: buildScene(world, EUROPE_BBOX, VIEW_W, VIEW_H),
      insets: [
        { title: 'Asia', scene: buildScene(world, ASIA_BBOX, INSET_W, INSET_H, { badgeScale: 0.85 }), w: INSET_W, h: INSET_H },
        { title: 'South America', scene: buildScene(world, SAM_BBOX, INSET_W, INSET_H, { badgeScale: 0.85 }), w: INSET_W, h: INSET_H },
      ],
    };
  }, [world, view]);

  const handleMove = (country: Country) => (event: ReactMouseEvent<SVGElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ country, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const renderScene = (scene: Scene, badgeFont: number) => (
    <>
      {scene.paths.map((p, i) => {
        const market = p.iso ? marketByIso.get(p.iso) : undefined;
        return (
          <path
            key={i}
            d={p.d}
            fill={market ? STATUS_FILL[market.intakeStatus] : LAND_GREY}
            stroke={LAND_STROKE}
            strokeWidth={0.6}
            style={market ? { cursor: 'pointer' } : undefined}
            onClick={market ? () => onSelect(market) : undefined}
            onMouseEnter={market ? handleMove(market) : undefined}
            onMouseMove={market ? handleMove(market) : undefined}
            onMouseLeave={market ? () => setTooltip(null) : undefined}
          />
        );
      })}

      {showArcs &&
        scene.arcs.map((arc, i) => (
          <path
            key={`arc-${i}`}
            d={arc.d}
            className="wolf-flow"
            fill="none"
            stroke="#C85F00"
            strokeWidth={arc.width}
            strokeOpacity={0.5}
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
        ))}

      {scene.badges.map((b) => (
        <g
          key={b.country.iso}
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect(b.country)}
          onMouseEnter={handleMove(b.country)}
          onMouseMove={handleMove(b.country)}
          onMouseLeave={() => setTooltip(null)}
        >
          {b.country.intakeStatus === 'live' && (
            <circle className="wolf-pulse" cx={b.x} cy={b.y} r={b.r} fill="none" stroke={DEMO_ORANGE} strokeWidth={1.5} />
          )}
          {pingSeq > 0 && pingIso === b.country.iso && (
            <circle
              key={`ping-${pingSeq}`}
              className="wolf-ping"
              cx={b.x}
              cy={b.y}
              r={b.r}
              fill="none"
              stroke={DEMO_ORANGE}
              strokeWidth={2.5}
            />
          )}
          <circle
            cx={b.x}
            cy={b.y}
            r={b.r}
            fill="#122422"
            stroke={STATUS_FILL[b.country.intakeStatus] === DEMO_ORANGE_PALE ? '#C9CFD6' : STATUS_FILL[b.country.intakeStatus]}
            strokeWidth={2}
          />
          <text
            x={b.x}
            y={b.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={badgeFont + (b.country.dealers >= 100 ? -1 : 0)}
            fontWeight={700}
            fill="#FFFFFF"
            style={{ pointerEvents: 'none', fontFamily: 'inherit' }}
          >
            {b.country.dealers}
          </text>
        </g>
      ))}
    </>
  );

  return (
    <Card sx={{ height: 560, display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Supply flows & Intake status"
        subheader={`${countries.length} Markets · ${countries.reduce((s, c) => s + c.dealers, 0).toLocaleString('en-GB')} locations. Numbers indicate locations per market; click to open the country profile.`}
        slotProps={{
          title: {
            sx: { color: 'primary.main', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' },
          },
        }}
        action={
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
            <FormControlLabel
              control={<Switch size="small" checked={showArcs} onChange={(e) => setShowArcs(e.target.checked)} color="primary" />}
              label={<Typography variant="caption">Supply flows</Typography>}
              sx={{ mr: 0 }}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, v) => v && setView(v)}
              sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.25, textTransform: 'none', fontSize: 13 } }}
            >
              <ToggleButton value="europa">Europe</ToggleButton>
              <ToggleButton value="welt">World</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        }
      />
      <Box sx={{ mx: 3, mt: 2, height: 3, flexShrink: 0, bgcolor: 'primary.main' }} />

      <Box
        ref={containerRef}
        onMouseLeave={() => setTooltip(null)}
        sx={{
          mx: 3,
          mt: 2,
          flex: 1,
          minHeight: 0,
          borderRadius: 1.5,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: 'background.default',
          '@keyframes wolfPulse': {
            '0%': { transform: 'scale(1)', opacity: 0.56 },
            '100%': { transform: 'scale(2.2)', opacity: 0 },
          },
          '@keyframes wolfPing': {
            '0%': { transform: 'scale(1)', opacity: 0.9 },
            '100%': { transform: 'scale(3)', opacity: 0 },
          },
          '@keyframes wolfFlow': { to: { strokeDashoffset: -96 } },
          '& .wolf-pulse': {
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: 'wolfPulse 2.4s ease-out infinite',
          },
          '& .wolf-ping': {
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: 'wolfPing 1.5s ease-out both',
          },
          '& .wolf-flow': { animation: 'wolfFlow 7s linear infinite' },
          '@media (prefers-reduced-motion: reduce)': {
            '& .wolf-pulse': { animation: 'none', opacity: 0 },
            '& .wolf-ping': { animation: 'none', opacity: 0 },
            '& .wolf-flow': { animation: 'none' },
          },
        }}
      >
        {!scenes ? (
          <Skeleton variant="rectangular" sx={{ width: 1, height: 1 }} />
        ) : (
          <>
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              {renderScene(scenes.main, view === 'europa' ? 10 : 9)}
            </svg>

            
            {scenes.insets.length > 0 && (
              <Stack spacing={1.25} sx={{ position: 'absolute', left: 12, top: 12 }}>
                {scenes.insets.map((inset) => (
                  <Box
                    key={inset.title}
                    sx={{
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
                      boxShadow: (theme) => theme.shadows[2],
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{ px: 1, pt: 0.5, display: 'block', lineHeight: 1.4, color: 'primary.main', fontWeight: 700 }}
                    >
                      {inset.title}
                    </Typography>
                    <svg viewBox={`0 0 ${inset.w} ${inset.h}`} width={inset.w} height={inset.h} style={{ display: 'block' }}>
                      {renderScene(inset.scene, 9)}
                    </svg>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}

        {tooltip && (
          <Box
            sx={{
              p: 1.25,
              zIndex: 9,
              minWidth: 184,
              borderRadius: 1.5,
              position: 'absolute',
              pointerEvents: 'none',
              bgcolor: 'background.paper',
              border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
              boxShadow: (theme) => theme.shadows[8],
              left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 600) - 200),
              top: Math.min(tooltip.y + 14, (containerRef.current?.clientHeight ?? 380) - 150),
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {tooltip.country.name}
            </Typography>
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary">
                {tooltip.country.region} · Market since {tooltip.country.entryYear}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Locations: {tooltip.country.dealers.toLocaleString('en-GB')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Materials revenue: {fmtEUR(tooltip.country.revenueEUR)} Jan–Aug 2026
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submissions: {tooltip.country.submissions} / {tooltip.country.submissionTarget}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supply route: {tooltip.country.supplyDependency}
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        sx={{ px: 3, pt: 1.5, pb: 2.5, columnGap: 3, rowGap: 1 }}
      >
        {STATUS_LEGEND.map((item) => (
          <Stack key={item.status} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: STATUS_FILL[item.status] }} />
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          </Stack>
        ))}

        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 28, borderBottom: '2px dashed #B26B00', opacity: 0.7 }} />
          <Typography variant="caption" color="text.secondary">
            Supply flows (today)
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
          <Typography variant="caption" color="text.disabled">
            Location source: synthetic location dataset
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}
