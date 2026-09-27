'use client';

import type { Iso2, ReferenceArticle } from 'src/data/lieferlinie';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {
  hubs,
  countryName,
  inCountryParams,
  referenceArticles,
} from 'src/data/lieferlinie';

// ----------------------------------------------------------------------





const hubNorth = hubs.find((h) => h.id === 'HUB-N')!;
const hubSouth = hubs.find((h) => h.id === 'HUB-S')!;

const fmtEUR = (v: number) =>
  `${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const fmtPct = (v: number, digits = 2) =>
  `${(v * 100).toLocaleString('en-GB', { maximumFractionDigits: digits })} %`;

type Stage = { label: string; rate: number };


function stagesFor(target: Iso2): Stage[] | null {
  const direct = hubNorth.surchargeByTarget[target];
  if (direct !== undefined) {
    return [{ label: `North hub → ${countryName(target)}`, rate: direct }];
  }
  if (hubSouth.deliversTo.includes(target)) {
    return [
      { label: 'North hub → South hub', rate: hubNorth.surchargeByTarget['HUB-S'] ?? 0 },
      { label: `South hub → ${countryName(target)}`, rate: hubSouth.surchargeFlat ?? 0 },
    ];
  }
  return null;
}


const eligibleTargets = (a: ReferenceArticle): Iso2[] =>
  Object.keys(a.prices).filter((iso) => iso !== a.bestSourceCountry && stagesFor(iso) !== null);

type WaterfallStep = {
  label: string;
  sub?: string;
  amount: number;
  
  cum: number;
  kind: 'base' | 'hub' | 'logistik' | 'marge' | 'end' | 'local';
};

const PLOT_H = 190;

export function SzenarioRechner() {
  const theme = useTheme();

  const [articleCode, setArticleCode] = useState(referenceArticles[0].code);
  const [targetSel, setTargetSel] = useState<Iso2 | null>(null);
  const [logistik, setLogistik] = useState(inCountryParams.logistikpauschale.default);
  const [marge, setMarge] = useState(inCountryParams.grosshandelsmarge.default);

  const article = referenceArticles.find((a) => a.code === articleCode) ?? referenceArticles[0];
  const targets = eligibleTargets(article);
  const target = targetSel && targets.includes(targetSel) ? targetSel : targets[0];

  const calc = useMemo(() => {
    const stages = stagesFor(target) ?? [];
    const source = article.bestSourceCountry;
    const p0 = article.prices[source];

    const steps: WaterfallStep[] = [
      { label: 'Source price', sub: countryName(source), amount: p0, cum: p0, kind: 'base' },
    ];
    let p = p0;
    stages.forEach((st) => {
      const add = p * st.rate;
      p += add;
      steps.push({ label: `+${fmtPct(st.rate)}`, sub: st.label, amount: add, cum: p, kind: 'hub' });
    });
    const logAdd = p * logistik;
    p += logAdd;
    steps.push({
      label: `+${fmtPct(logistik, 1)}`,
      sub: 'Logistics fee',
      amount: logAdd,
      cum: p,
      kind: 'logistik',
    });
    const margeAdd = p * marge;
    p += margeAdd;
    steps.push({
      label: `+${fmtPct(marge, 1)}`,
      sub: 'Wholesale margin',
      amount: margeAdd,
      cum: p,
      kind: 'marge',
    });
    const end = p;
    steps.push({ label: 'Final price', sub: 'internal supply chain', amount: end, cum: end, kind: 'end' });

    const local = article.prices[target];
    steps.push({ label: 'Current price', sub: countryName(target), amount: local, cum: local, kind: 'local' });

    return { steps, end, local, delta: local - end, source, p0 };
  }, [article, target, logistik, marge]);

  const maxV = Math.max(calc.end, calc.local);
  const saving = calc.delta >= 0;

  const stepColor: Record<WaterfallStep['kind'], string> = {
    base: theme.palette.grey[500],
    hub: theme.palette.primary.main, // Demo-Orange
    logistik: theme.palette.warning.main,
    marge: theme.palette.info.main,
    end: theme.palette.grey[700],
    local: theme.palette.grey[300],
  };

  return (
    <Box>
      
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={3}
        alignItems={{ lg: 'center' }}
        sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <TextField
          select
          size="small"
          label="Synthetic reference item"
          value={article.code}
          onChange={(e) => {
            setArticleCode(e.target.value);
            setTargetSel(null);
          }}
          sx={{ minWidth: 280 }}
        >
          {referenceArticles.map((a) => (
            <MenuItem key={a.code} value={a.code}>
              {a.code} · {a.name}
            </MenuItem>
          ))}
        </TextField>

        <Stack spacing={0.75}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Target country
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={target}
            onChange={(_, v) => v && setTargetSel(v)}
          >
            {targets.map((iso) => (
              <ToggleButton key={iso} value={iso} sx={{ px: 1.5 }}>
                {countryName(iso)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={0.75} sx={{ minWidth: 200, flexGrow: 1, maxWidth: 300 }}>
          <Tooltip arrow title={inCountryParams.logistikpauschale.note}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {inCountryParams.logistikpauschale.label}: <b>{fmtPct(logistik, 1)}</b> (Assumption)
            </Typography>
          </Tooltip>
          <Slider
            size="small"
            value={logistik}
            min={inCountryParams.logistikpauschale.min}
            max={inCountryParams.logistikpauschale.max}
            step={0.0025}
            onChange={(_, v) => setLogistik(v as number)}
          />
        </Stack>

        <Stack spacing={0.75} sx={{ minWidth: 200, flexGrow: 1, maxWidth: 300 }}>
          <Tooltip arrow title={inCountryParams.grosshandelsmarge.note}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {inCountryParams.grosshandelsmarge.label}: <b>{fmtPct(marge, 1)}</b> (Assumption)
            </Typography>
          </Tooltip>
          <Slider
            size="small"
            value={marge}
            min={inCountryParams.grosshandelsmarge.min}
            max={inCountryParams.grosshandelsmarge.max}
            step={0.005}
            onChange={(_, v) => setMarge(v as number)}
          />
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ p: 3 }}>
        
        <Box sx={{ flexGrow: 1, minWidth: 0, overflowX: 'auto' }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="flex-end"
            sx={{ minWidth: 560, height: PLOT_H + 58 }}
          >
            {calc.steps.map((st, i) => {
              const h = Math.max((st.amount / maxV) * PLOT_H, 2);
              const bottom = ((st.cum - st.amount) / maxV) * PLOT_H;
              const floating = st.kind === 'hub' || st.kind === 'logistik' || st.kind === 'marge';
              return (
                <Box key={i} sx={{ flex: 1, minWidth: 72 }}>
                  <Box sx={{ position: 'relative', height: PLOT_H }}>
                    <Tooltip
                      arrow
                      title={`${st.sub ?? st.label}: ${floating ? '+' : ''}${fmtEUR(st.amount)} → kumuliert ${fmtEUR(st.cum)}`}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: floating ? bottom : 0,
                          height: floating ? h : (st.cum / maxV) * PLOT_H,
                          borderRadius: 0.75,
                          bgcolor: stepColor[st.kind],
                          border: st.kind === 'local' ? '1px dashed' : 'none',
                          borderColor: 'text.disabled',
                        }}
                      />
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: (floating ? bottom + h : (st.cum / maxV) * PLOT_H) + 4,
                        textAlign: 'center',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {floating ? `+${fmtEUR(st.amount)}` : fmtEUR(st.cum)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.75, display: 'block', textAlign: 'center', fontWeight: 600 }}
                  >
                    {st.label}
                  </Typography>
                  {st.sub && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: 'center',
                        color: 'text.disabled',
                        lineHeight: 1.2,
                      }}
                    >
                      {st.sub}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>

        
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: 1, lg: 300 },
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: saving ? 'success.main' : 'error.main',
            alignSelf: { lg: 'flex-start' },
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {article.name} · to {countryName(target)} · per {article.unit}
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5 }}>
            <Typography variant="h4" noWrap>
              {fmtEUR(calc.end)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              internal supply chain
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            versus local current price {fmtEUR(calc.local)}
          </Typography>
          <Chip
            size="small"
            color={saving ? 'success' : 'error'}
            sx={{ mt: 1, fontWeight: 700 }}
            label={`${saving ? 'Savings' : 'Additional cost'} ${fmtEUR(Math.abs(calc.delta))} (${fmtPct(
              Math.abs(calc.delta) / calc.local,
              1
            )})`}
          />
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.disabled' }}>
            Source price {fmtEUR(calc.p0)} ({countryName(calc.source)}, Baseline) → Hub surcharge →
            Logistics fee → Margin. Delta compared with the local current price.
          </Typography>
        </Box>
      </Stack>

      
      <Box
        sx={{
          mx: 3,
          mb: 3,
          p: 2,
          borderRadius: 1,
          bgcolor: 'background.neutral',
          borderLeft: '3px solid',
          borderColor: 'warning.main',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Synthetisches Szenario with frei einstellbaren Assumptionn.
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          All prices, hub surcharges and slider defaults are synthetic assumptions. The calculation illustrates how the selected parameters affect the result.
        </Typography>
      </Box>
    </Box>
  );
}
