import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LearningStyleSelector, LearningStyle } from "@/components/LearningStyleSelector";
import { Goal } from "@/hooks/useGoals";
import { GoalMaterials } from "./GoalMaterials";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSave: (data: {
    title: string;
    description?: string;
    deadline?: string;
    learning_style?: string;
    color?: string;
  }) => Promise<Goal | null>;
  onUpdate?: (goalId: string, updates: Partial<Goal>) => Promise<Goal | null>;
}

const colorOptions = [
  { id: "orange", class: "bg-orange-400" },
  { id: "yellow", class: "bg-yellow-400" },
  { id: "green", class: "bg-green-400" },
  { id: "blue", class: "bg-blue-400" },
  { id: "pink", class: "bg-pink-400" },
  { id: "purple", class: "bg-purple-400" },
];

export const GoalDialog = ({
  open,
  onOpenChange,
  goal,
  onSave,
  onUpdate,
}: GoalDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [learningStyle, setLearningStyle] = useState<LearningStyle | null>(null);
  const [color, setColor] = useState("orange");
  const [saving, setSaving] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || "");
      setDeadline(goal.deadline ? new Date(goal.deadline) : undefined);
      setLearningStyle(goal.learning_style);
      setColor(goal.color || "orange");
      setCurrentGoal(goal);
    } else {
      setTitle("");
      setDescription("");
      setDeadline(undefined);
      setLearningStyle(null);
      setColor("orange");
      setCurrentGoal(null);
    }
  }, [goal, open]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (goal && onUpdate) {
        await onUpdate(goal.id, {
          title,
          description: description || null,
          deadline: deadline?.toISOString() || null,
          learning_style: learningStyle,
          color,
        });
      } else {
        const newGoal = await onSave({
          title,
          description,
          deadline: deadline?.toISOString(),
          learning_style: learningStyle || undefined,
          color,
        });
        if (newGoal) {
          setCurrentGoal(newGoal);
        }
      }
      if (!goal) {
        // Only close if creating new (for editing, keep open to manage materials)
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!goal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Goal" : "Create New Goal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Pass final exam"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What do you want to achieve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Learning Style */}
          <div className="space-y-2">
            <Label>Learning Style for this Goal</Label>
            <LearningStyleSelector
              currentStyle={learningStyle}
              onSelect={setLearningStyle}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Sticky Note Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    c.class,
                    color === c.id
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Materials Section (only when editing) */}
          {isEditing && currentGoal && (
            <GoalMaterials goalId={currentGoal.id} />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {isEditing ? "Close" : "Cancel"}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!title.trim() || saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Goal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
