'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { hubs, countryName, domesticWarehouses } from 'src/data/lieferlinie';

// ----------------------------------------------------------------------




const fmtPct = (v: number) =>
  `+${(v * 100).toLocaleString('en-GB', { maximumFractionDigits: 2 })} %`;

const NODE_W = 40;
const NODE_STEP = 44;
const NODE_Y = 210;
const HUB_Y = 30;
const HUB_H = 46;
const HUB_W = 160;

type SpokeNode = { iso: string; cx: number; tag: string; hasRate: boolean };

export function Netzwerk() {
  const theme = useTheme();

  const hubNorth = hubs.find((h) => h.id === 'HUB-N');
  const hubSouth = hubs.find((h) => h.id === 'HUB-S');
  if (!hubNorth || !hubSouth) return null;

  
  const hubNorthTargets = hubNorth.deliversTo
    .filter((iso) => iso !== hubSouth.country)
    .map((iso) => {
      const rate = hubNorth.surchargeByTarget[iso];
      return {
        iso,
        hasRate: rate !== undefined,
        tag:
          rate !== undefined
            ? `${fmtPct(rate)}${iso === 'CZ' ? '*' : ''}`
            : iso === hubNorth.country
              ? 'Domestic'
              : 'no rate',
        rate: rate ?? Number.POSITIVE_INFINITY,
        isHome: iso === hubNorth.country,
      };
    })
    .sort((a, b) => (a.isHome ? -1 : b.isHome ? 1 : a.rate - b.rate));

  const hubSouthTargets = hubSouth.deliversTo.map((iso) => ({
    iso,
    hasRate: true,
    tag: fmtPct(hubSouth.surchargeFlat ?? 0),
    isHome: iso === hubSouth.country,
  }));

  const hubNorthNodes: SpokeNode[] = hubNorthTargets.map((t, i) => ({
    ...t,
    cx: 38 + i * NODE_STEP,
  }));
  const hubSouthNodes: SpokeNode[] = hubSouthTargets.map((t, i) => ({
    ...t,
    cx: 464 + i * NODE_STEP,
  }));

  const hubNorthHubCx = (hubNorthNodes[0].cx + hubNorthNodes[hubNorthNodes.length - 1].cx) / 2;
  const hubSouthHubCx = (hubSouthNodes[0].cx + hubSouthNodes[hubSouthNodes.length - 1].cx) / 2;

  const c = {
    hub: theme.palette.primary.main, // Demo-Orange
    hubText: theme.palette.primary.contrastText,
    node: theme.palette.background.neutral,
    nodeStroke: theme.palette.divider,
    line: theme.palette.divider,
    text: theme.palette.text.primary,
    textSec: theme.palette.text.secondary,
    textDis: theme.palette.text.disabled,
  };

  const renderHub = (cx: number, title: string, iso: string) => (
    <g>
      <rect
        x={cx - HUB_W / 2}
        y={HUB_Y}
        width={HUB_W}
        height={HUB_H}
        rx={6}
        fill={c.hub}
      />
      <text
        x={cx}
        y={HUB_Y + 19}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={c.hubText}
      >
        {title}
      </text>
      <text x={cx} y={HUB_Y + 36} textAnchor="middle" fontSize={10} fill={c.hubText}>
        {countryName(iso)} ({iso})
      </text>
    </g>
  );

  const renderSpokes = (hubCx: number, nodes: SpokeNode[]) =>
    nodes.map((n) => (
      <g key={n.iso}>
        <line
          x1={hubCx}
          y1={HUB_Y + HUB_H}
          x2={n.cx}
          y2={NODE_Y}
          stroke={c.line}
          strokeWidth={1.25}
          strokeDasharray={n.hasRate || n.tag === 'Domestic' ? undefined : '4 3'}
        />
        <rect
          x={n.cx - NODE_W / 2}
          y={NODE_Y}
          width={NODE_W}
          height={26}
          rx={5}
          fill={c.node}
          stroke={c.nodeStroke}
        />
        <text
          x={n.cx}
          y={NODE_Y + 17}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={700}
          fill={c.text}
        >
          {n.iso}
        </text>
        <text
          x={n.cx}
          y={NODE_Y + 42}
          textAnchor="middle"
          fontSize={9}
          fill={n.hasRate ? c.textSec : c.textDis}
        >
          {n.tag}
        </text>
      </g>
    ));

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Box
          component="svg"
          viewBox="0 0 840 262"
          sx={{ display: 'block', width: 1, minWidth: 720, height: 'auto' }}
        >
          
          <line
            x1={hubNorthHubCx + HUB_W / 2}
            y1={HUB_Y + HUB_H / 2}
            x2={hubSouthHubCx - HUB_W / 2}
            y2={HUB_Y + HUB_H / 2}
            stroke={c.hub}
            strokeWidth={2}
          />
          <text
            x={(hubNorthHubCx + hubSouthHubCx) / 2}
            y={HUB_Y + HUB_H / 2 - 8}
            textAnchor="middle"
            fontSize={10.5}
            fontWeight={700}
            fill={c.hub}
          >
            {fmtPct(hubNorth.surchargeByTarget['HUB-S'] ?? 0)} Transfer
          </text>
          <text
            x={(hubNorthHubCx + hubSouthHubCx) / 2}
            y={HUB_Y + HUB_H / 2 + 16}
            textAnchor="middle"
            fontSize={9}
            fill={c.textSec}
          >
            HUB-N supplies the HUB-S hub
          </text>

          {renderSpokes(hubNorthHubCx, hubNorthNodes)}
          {renderSpokes(hubSouthHubCx, hubSouthNodes)}

          {renderHub(hubNorthHubCx, 'North hub', hubNorth.country)}
          {renderHub(hubSouthHubCx, 'South hub', hubSouth.country)}
        </Box>
      </Box>

      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.disabled' }}>
        All routes and surcharges are synthetic scenario assumptions. Dashed routes are alternatives without a defined surcharge.
      </Typography>

      
      <Typography variant="overline" sx={{ mt: 2.5, display: 'block', color: 'text.disabled' }}>
        Domestic warehouses: domestic supply only
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
        {domesticWarehouses.map((w) => (
          <Box
            key={w.country}
            sx={{
              flex: 1,
              minWidth: 0,
              p: 1.75,
              borderRadius: 1.5,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'background.neutral',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  flexShrink: 0,
                  borderRadius: '3px',
                  bgcolor: 'text.disabled',
                }}
              />
              <Typography variant="subtitle2">
                Warehouse {w.countryName} ({w.country})
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
              {w.note}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
