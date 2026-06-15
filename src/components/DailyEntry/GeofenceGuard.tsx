import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, ShieldAlert, RotateCw, Lock } from 'lucide-react';
import { useGeofence } from '@/hooks/useGeofence';
import { VENUE_RADIUS_M } from '@/lib/geofence';
import type { ReactNode } from 'react';

interface GeofenceGuardProps {
  /** When true, geofence checks are skipped (admin or elevated access). */
  bypass: boolean;
  /** Called when the user opts to authenticate as admin from the blocked dialog. */
  onAdminLogin: () => void;
  children: ReactNode;
}

/**
 * Wraps the daily-entry experience and blocks staff who are not physically
 * within VENUE_RADIUS_M meters of the venue. Admin (or anyone passing
 * `bypass`) sees the children immediately.
 */
export const GeofenceGuard = ({ bypass, onAdminLogin, children }: GeofenceGuardProps) => {
  const { status, result, recheck } = useGeofence(!bypass);

  if (bypass || status === 'allowed') {
    return <>{children}</>;
  }

  const isChecking = status === 'checking';
  const reason = result?.reason;

  let title = 'Po kontrollojmë vendndodhjen…';
  let message: ReactNode = 'Të lutem prit pak. Sigurohu që ke aktivizuar GPS-in dhe ke dhënë lejen.';

  if (status === 'blocked') {
    if (reason === 'too_far') {
      title = 'Je jashtë lokalit';
      message = (
        <>
          Je rreth <strong>{result?.distance}m</strong> larg lokalit. Hyrja për stafin
          lejohet vetëm brenda <strong>{VENUE_RADIUS_M}m</strong>.
          {result?.accuracy && result.accuracy > 50 && (
            <span className="block text-xs text-muted-foreground mt-2">
              Saktësia e GPS-it: ±{result.accuracy}m
            </span>
          )}
        </>
      );
    } else if (reason === 'denied') {
      title = 'Leja për vendndodhjen u refuzua';
      message =
        'Që të punosh nga lokali, telefoni duhet të lejojë GPS-in. Hap Cilësimet → Safari/Chrome → Vendndodhja dhe lejo për këtë faqe.';
    } else if (reason === 'timeout') {
      title = 'GPS-i nuk u përgjigj';
      message = 'GPS-i mori shumë kohë. Sigurohu që je në një vend me sinjal dhe provo përsëri.';
    } else if (reason === 'unsupported') {
      title = 'GPS nuk mbështetet';
      message = 'Ky pajisje nuk e mbështet GPS-in. Përdor një telefon tjetër ose kontakto adminin.';
    } else {
      title = 'GPS i padisponueshëm';
      message = 'Nuk morëm dot vendndodhjen. Aktivizo GPS-in dhe provo përsëri.';
    }
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="[&>button]:hidden"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isChecking ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : reason === 'too_far' ? (
              <MapPin className="h-5 w-5 text-destructive" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">{message}</p>
          {!isChecking && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={recheck} className="gap-2">
                <RotateCw className="h-4 w-4" />
                Riprovo
              </Button>
              <Button variant="default" onClick={onAdminLogin} className="gap-2">
                <Lock className="h-4 w-4" />
                Hyr si Admin
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
