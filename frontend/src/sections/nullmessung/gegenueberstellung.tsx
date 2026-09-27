'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { fmtEURk, brandColor, rfiSuppliers, nullmessungCountries } from 'src/data/nullmessung';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------





const SUPPLIER_TO_BRAND: Record<string, string> = {
  '3M': '3M',
  'Mirka': 'Mirka',
  'Würth': 'Würth',
  'Kovax': 'Kovax',
  'Starcke': 'Starcke',
  'Glasurit (BASF)': 'Glasurit (BASF)',
  'Finixa': 'Finixa',
  'SATA': 'SATA',
  'tesa': 'tesa',
  'PPG / Nexa': 'PPG / Nexa',
};


const isDirect = (s: string) => /\bdirect\b/i.test(s) && !/\bindirect\b/i.test(s) && !/out of scope/i.test(s);
const isIndirect = (s: string) => /\bindirect\b/i.test(s);

export function Gegenueberstellung() {
  const spendCountries = nullmessungCountries.filter((c) => c.topBrands.length > 0);

  if (!spendCountries.length || !rfiSuppliers.length) return null;

  const rows = spendCountries.map((c) => {
    const directHere = rfiSuppliers.filter((s) =>
      s.gtm.some((g) => g.iso === c.iso && isDirect(g.possible))
    );
    const indirectHere = rfiSuppliers.filter((s) =>
      s.gtm.some((g) => g.iso === c.iso && isIndirect(g.possible))
    );

    
    
    
    
    
    const lever = directHere.filter((s) => {
      const brand = SUPPLIER_TO_BRAND[s.name];
      if (!brand) return false;
      if (c.directVendors.includes(brand)) return false;
      
      
      const bought = c.brandsBought.some((b) => b.name === brand && b.valueEUR > 0);
      const currentIndirect = s.gtm.some((g) => g.iso === c.iso && isIndirect(g.current));
      return bought && currentIndirect;
    });

    return { country: c, directHere, indirectHere, lever };
  });

  return (
    <TableContainer sx={{ px: 1, pb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Country</TableCell>
            <TableCell>Current purchases in accounting data</TableCell>
            <TableCell>RFI: Direct supply offered</TableCell>
            <TableCell>Opportunity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ country, directHere, indirectHere, lever }) => (
            <TableRow key={country.iso} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {country.name}
                </Typography>
              </TableCell>

              <TableCell sx={{ minWidth: 220 }}>
                <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5 }}>
                  {country.topBrands.slice(0, 4).map((b) => (
                    <Chip
                      key={b.name}
                      size="small"
                      variant="outlined"
                      label={`${b.name} ${fmtEURk(b.valueEUR)}`}
                      icon={
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            ml: '6px !important',
                            borderRadius: '50%',
                            bgcolor: brandColor(b.name),
                          }}
                        />
                      }
                      sx={{ height: 22, fontSize: 11 }}
                    />
                  ))}
                </Stack>
              </TableCell>

              <TableCell sx={{ minWidth: 180 }}>
                <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5 }}>
                  {directHere.map((s) => (
                    <Tooltip
                      key={s.name}
                      title={
                        s.gtm.find((g) => g.iso === country.iso)?.possible ?? 'direct supply'
                      }
                      placement="top"
                      arrow
                    >
                      <Chip size="small" label={s.name} sx={{ height: 22, fontSize: 11 }} />
                    </Tooltip>
                  ))}
                  {!directHere.length && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      indirect only ({indirectHere.length} Suppliers)
                    </Typography>
                  )}
                </Stack>
              </TableCell>

              <TableCell sx={{ minWidth: 200 }}>
                {lever.length ? (
                  <Stack direction="row" alignItems="flex-start" spacing={0.75}>
                    <Iconify
                      icon="solar:chart-square-outline"
                      width={16}
                      sx={{ mt: '2px', color: 'success.main', flexShrink: 0 }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {lever.map((s) => s.name).join(', ')}: RFI indicates current indirect purchasing,
                      with direct supply offered
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    –
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
