import { Link2, Calendar, MessageSquare, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ConnectionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLabel: string;
  targetLabel: string;
  sourceType: string;
  targetType: string;
  insightNote: string | null;
  connectionType: 'inspiration' | 'node' | 'legacy' | 'identity';
}

const ConnectionDetailsDialog = ({
  open,
  onOpenChange,
  sourceLabel,
  targetLabel,
  sourceType,
  targetType,
  insightNote,
  connectionType,
}: ConnectionDetailsDialogProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'goal': return 'bg-primary/20 text-primary';
      case 'interest': return 'bg-purple-500/20 text-purple-400';
      case 'inspiration': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getConnectionTypeLabel = () => {
    switch (connectionType) {
      case 'inspiration': return 'Goal-Inspiration';
      case 'node': return 'Custom';
      case 'legacy': return 'AI-Generated';
      case 'identity': return 'System';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Connection Details
          </DialogTitle>
          <DialogDescription>
            View information about this connection
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Connection visualization */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <Badge className={getTypeColor(sourceType)} variant="secondary">
                {sourceType}
              </Badge>
              <p className="mt-2 text-sm font-medium">{sourceLabel}</p>
            </div>
            
            <div className="flex-shrink-0">
              <div className="w-12 h-0.5 bg-primary relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-primary border-y-4 border-y-transparent" />
              </div>
            </div>
            
            <div className="text-center">
              <Badge className={getTypeColor(targetType)} variant="secondary">
                {targetType}
              </Badge>
              <p className="mt-2 text-sm font-medium">{targetLabel}</p>
            </div>
          </div>
          
          {/* Connection type */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Connection Type</span>
            <Badge variant="outline">{getConnectionTypeLabel()}</Badge>
          </div>
          
          {/* Insight note */}
          {insightNote ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="w-4 h-4 text-primary" />
                Insight Note
              </div>
              <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                {insightNote}
              </p>
            </div>
          ) : (
            <div className="text-center p-4 border border-dashed border-border rounded-lg">
              <MessageSquare className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No insight note added yet
              </p>
            </div>
          )}
          
          {connectionType === 'legacy' && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-500">
                This connection was discovered by AI analysis
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionDetailsDialog;
