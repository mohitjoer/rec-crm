import { redirect } from 'next/navigation';

export default function SettingsPromptRedirect() {
  redirect('/agent/prompt');
}
