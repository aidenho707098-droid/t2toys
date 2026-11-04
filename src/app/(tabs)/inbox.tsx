import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/features/auth/auth-provider';

/** M4 replaces the signed-in state with realtime conversations. */
export default function InboxScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  return (
    <Screen title={t('inbox.title')}>
      {session ? (
        <EmptyState title={t('inbox.empty')} hint={t('inbox.emptyHint')} />
      ) : (
        <EmptyState
          title={t('inbox.empty')}
          hint={t('gate.inbox')}
          action={<Button label={t('gate.signIn')} onPress={() => router.push('/sign-in')} />}
        />
      )}
    </Screen>
  );
}
