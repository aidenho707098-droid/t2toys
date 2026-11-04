import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/features/auth/auth-provider';

/** M2 replaces the signed-in state with the create-listing flow. */
export default function SellScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  return (
    <Screen title={t('sell.title')}>
      {session ? (
        <EmptyState title={t('sell.free')} action={<Button label={t('sell.start')} />} />
      ) : (
        <EmptyState
          title={t('sell.free')}
          hint={t('gate.sell')}
          action={<Button label={t('gate.signIn')} onPress={() => router.push('/sign-in')} />}
        />
      )}
    </Screen>
  );
}
