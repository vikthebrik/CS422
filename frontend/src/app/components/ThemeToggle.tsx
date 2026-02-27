import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';

/** Returns true if the current local time falls in "dark hours" (6 PM – 6 AM). */
function isDarkHour(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // On first mount: if no explicit user preference is stored, apply the
  // sunset/sunrise auto-schedule (6 PM – 6 AM = dark, 6 AM – 6 PM = light).
  useEffect(() => {
    if (!theme || theme === 'system') {
      setTheme(isDarkHour() ? 'dark' : 'light');
    }
  }, []);

  const toggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {resolvedTheme === 'dark'
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />}
    </Button>
  );
}
