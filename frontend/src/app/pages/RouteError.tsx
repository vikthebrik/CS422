import { Link, useRouteError, isRouteErrorResponse } from 'react-router';
import { Button } from '../components/ui/button';

export function RouteError() {
  const error = useRouteError();

  let code = '500';
  let heading = 'Something went wrong.';
  let detail = 'An unexpected error occurred. The team has been notified.';

  if (isRouteErrorResponse(error)) {
    code = String(error.status);
    if (error.status === 404) {
      heading = 'Looks like this page wandered off.';
      detail = "The page you're looking for doesn't exist — or maybe it took a walk and never came back.";
    } else {
      heading = error.statusText || 'Something went wrong.';
      detail = typeof error.data === 'string' ? error.data : 'An unexpected error occurred.';
    }
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 text-center">
      <p className="text-[120px] font-bold leading-none text-primary/15 select-none">{code}</p>

      <img
        src="/assets/Walking.png"
        alt="Character walking back home"
        className="h-40 w-40 object-contain -mt-4 mb-6"
        style={{ imageRendering: 'pixelated' }}
      />

      <h1 className="text-2xl mb-2">{heading}</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">{detail}</p>

      <Button asChild className="bg-primary">
        <Link to="/">Walk me back home</Link>
      </Button>
    </div>
  );
}
