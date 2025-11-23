import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHistory, HistoryEntry } from '@/hooks/useHistory';
import { TurnData } from '@/types/turn.types';
import { formatDistanceToNow } from 'date-fns';
import { sq } from 'date-fns/locale';
import { History, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  turnNumber: 1 | 2;
  onRestore: (data: TurnData) => void;
}

export const HistoryDialog = ({
  isOpen,
  onClose,
  selectedDate,
  turnNumber,
  onRestore
}: HistoryDialogProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { getHistory, restoreFromHistory } = useHistory();

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, selectedDate, turnNumber]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getHistory(selectedDate, turnNumber);
    setHistory(data);
    setLoading(false);
  };

  const handleRestore = async (historyId: string) => {
    const data = await restoreFromHistory(historyId);
    if (data) {
      onRestore(data);
      toast.success('Të dhënat u rikthyen me sukses!');
      onClose();
    }
  };

  const getActionLabel = (actionType: string | null) => {
    switch (actionType) {
      case 'auto_save':
        return '💾 Ruajtje Automatike';
      case 'manual_save':
        return '✋ Ruajtje Manuale';
      case 'copy_t1_to_t2':
        return '📋 Kopjim T1 → T2';
      default:
        return '📝 Ndryshim';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historiku i Ndryshimeve - Turni {turnNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4">
          Data: {new Date(selectedDate).toLocaleDateString('sq-AL')}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nuk ka historik për këtë datë dhe turn
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {getActionLabel(entry.action_type)}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Më e fundit
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                          locale: sq
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Xhiro: {entry.data.xhiro.toLocaleString()} ALL
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(entry.id)}
                      className="shrink-0"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Rikthe
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
