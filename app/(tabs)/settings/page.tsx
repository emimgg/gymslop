import { Header } from '@/components/layout/Header';
import { SettingsClient } from '@/components/settings/SettingsClient';

export default function SettingsPage() {
  return (
    <>
      <Header titleKey="settings.title" />
      <SettingsClient />
    </>
  );
}
