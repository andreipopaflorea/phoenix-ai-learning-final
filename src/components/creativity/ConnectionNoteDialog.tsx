import { useState, useEffect } from "react";
import { MessageSquare, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ConnectionNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLabel: string;
  targetLabel: string;
  currentNote: string | null;
  onSave: (note: string) => void;
}

const ConnectionNoteDialog = ({
  open,
  onOpenChange,
  sourceLabel,
  targetLabel,
  currentNote,
  onSave,
}: ConnectionNoteDialogProps) => {
  const [note, setNote] = useState(currentNote || "");

  useEffect(() => {
    if (open) {
      setNote(currentNote || "");
    }
  }, [open, currentNote]);

  const handleSave = () => {
    onSave(note);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Connection Note
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            {sourceLabel} → {targetLabel}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">Insight or Note</Label>
            <Textarea
              id="note"
              placeholder="Add an insight about how these are connected..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Describe why this connection is meaningful or what insight it represents.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionNoteDialog;
