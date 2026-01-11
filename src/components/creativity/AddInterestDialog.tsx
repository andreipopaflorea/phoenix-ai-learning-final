import { useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Interest {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

interface AddInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (interest: Interest) => void;
}

const COLORS = [
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
];

const AddInterestDialog = ({ open, onOpenChange, onAdded }: AddInterestDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("interests")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          color: selectedColor,
        })
        .select()
        .single();

      if (error) throw error;

      onAdded(data);
      toast.success("Interest added!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setSelectedColor(COLORS[0]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding interest:", error);
      toast.error("Failed to add interest");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-500" />
            Add Interest
          </DialogTitle>
          <DialogDescription>
            What topics fascinate you? These will appear on your mind map.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="interest-title">What are you curious about?</Label>
            <Input
              id="interest-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quantum Computing, Ancient History..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="interest-description">Notes (optional)</Label>
            <Textarea
              id="interest-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does this interest you?"
              rows={2}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
          <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ 
                    backgroundColor: color,
                    boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="gap-2"
            style={{ backgroundColor: selectedColor }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add Interest"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddInterestDialog;
