import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { Layout, Radii, Spacing } from '@/theme/tokens';

const TABS = [
  { name: 'home', href: '/', label: 'tabs.home' },
  { name: 'search', href: '/search', label: 'tabs.search' },
  { name: 'sell', href: '/sell', label: 'tabs.sell' },
  { name: 'inbox', href: '/inbox', label: 'tabs.inbox' },
  { name: 'me', href: '/me', label: 'tabs.me' },
] as const;

/** Web: bottom bar on narrow screens, same labels as native. */
export default function AppTabs() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        {/* Slot children need a single style object, not an array. */}
        <View style={StyleSheet.flatten([styles.bar, { backgroundColor: theme.background, borderColor: theme.border }])}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton>{t(tab.label)}</TabButton>
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  // The slot's ref is typed for a View; Pressable doesn't need it to handle presses.
  const { ref: _ref, ...pressableProps } = props as typeof props & { ref?: unknown };
  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={({ pressed }) => [
        styles.tab,
        { backgroundColor: isFocused ? theme.primarySoft : 'transparent', opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text variant="bodyStrong" color={isFocused ? 'primary' : 'tabInactive'}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    maxWidth: Layout.maxContentWidth / 5,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
  },
});
