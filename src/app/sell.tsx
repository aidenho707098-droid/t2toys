import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';

/** M2 replaces this with the create-listing flow (requires sign-in from M1). */
export default function SellScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t('sell.title')}>
      <EmptyState
        title={t('sell.free')}
        hint={t('sell.signInRequired')}
        action={<Button label={t('sell.start')} />}
      />
    </Screen>
  );
}
