import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGoals, Goal } from "@/hooks/useGoals";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalDialog } from "@/components/goals/GoalDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Goals = () => {
  const { user } = useAuth();
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenNew = () => {
    setSelectedGoal(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setDialogOpen(true);
  };

  const handleToggleComplete = async (goal: Goal) => {
    await updateGoal(goal.id, { is_completed: !goal.is_completed });
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteGoal(deleteId);
      setDeleteId(null);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Please sign in to view your goals.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create your goals</h1>
            <p className="text-muted-foreground mt-1">
              Set learning goals and track your progress
            </p>
          </div>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No goals yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first learning goal to organize your study materials and track your progress.
            </p>
            <Button onClick={handleOpenNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Create your first goal
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onOpen={handleOpenEdit}
                  onToggleComplete={handleToggleComplete}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Goal Dialog */}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={selectedGoal}
        onSave={createGoal}
        onUpdate={updateGoal}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Goals;
