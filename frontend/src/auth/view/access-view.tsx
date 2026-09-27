'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { FormHead } from '../components/form-head';

// ----------------------------------------------------------------------

export type AccessSchemaType = z.infer<typeof AccessSchema>;

export const AccessSchema = z.object({
  password: z.string().min(1, { message: 'Enter an access code' }),
});

// ----------------------------------------------------------------------

export function AccessView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const showPassword = useBoolean();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const methods = useForm<AccessSchemaType>({
    resolver: zodResolver(AccessSchema),
    defaultValues: { password: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);

    const res = await fetch('/api/access/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: data.password }),
    });

    if (res.ok) {
      const raw = searchParams.get('returnTo');
      const returnTo = raw?.startsWith('/') ? raw : '/dashboard';
      router.push(returnTo);
      router.refresh();
    } else {
      setErrorMessage('The access code is incorrect.');
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="password"
        label="Access code"
        type={showPassword.value ? 'text' : 'password'}
        autoFocus
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        fullWidth
        color="primary"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Signing in…"
      >
        Sign in
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Sign in"
        description="Restricted area: access for authorised Luxury Automotive Group staff and project partners."
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>
    </>
  );
}
