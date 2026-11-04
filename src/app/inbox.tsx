import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';

/** M4 replaces this with realtime conversations. */
export default function InboxScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t('inbox.title')}>
      <EmptyState title={t('inbox.empty')} hint={t('inbox.emptyHint')} />
    </Screen>
  );
}
