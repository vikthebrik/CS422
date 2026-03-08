/**
 * @file ErrorState.tsx
 * @description Friendly error fallback shown when data fetches fail.
 * Replaces raw HTTP 500 text blocks on Dashboard, ClubRoster, and similar pages.
 */

interface ErrorStateProps {
  title?: string;
  message?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this data right now. Please try refreshing the page.",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-lg border border-border">
      <div className="mb-4 opacity-70">
        <img src="/assets/Waving.png" alt="MCC Duck" className="h-20 w-20 object-contain" />
      </div>
      <h3 className="text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md text-sm">{message}</p>
    </div>
  );
}
