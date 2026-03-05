import { Link } from 'react-router';
import { Button } from '../components/ui/button';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 text-center">
      <p className="text-[120px] font-bold leading-none text-primary/15 select-none">404</p>

      <img
        src="/assets/Walking.png"
        alt="Character walking back home"
        className="h-40 w-40 object-contain -mt-4 mb-6"
        style={{ imageRendering: 'pixelated' }}
      />

      <h1 className="text-2xl mb-2">Looks like this page wandered off.</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you're looking for doesn't exist — or maybe it took a walk and never came back.
      </p>

      <Button asChild className="bg-primary">
        <Link to="/">Walk me back home</Link>
      </Button>
    </div>
  );
}
