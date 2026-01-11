import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type LearningStyleType = "visual" | "auditory" | "reading_writing" | "kinesthetic";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  learning_style: LearningStyleType | null;
  color: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  materials_count?: number;
}

export interface GoalMaterial {
  id: string;
  goal_id: string;
  study_material_id: string;
  created_at: string;
  study_material?: {
    id: string;
    file_name: string;
    file_path: string;
  };
}

const mapRowToGoal = (row: GoalRow, materialsCount = 0): Goal => ({
  id: row.id,
  user_id: row.user_id,
  title: row.title,
  description: row.description,
  deadline: row.deadline,
  learning_style: row.learning_style as LearningStyleType | null,
  color: row.color || "orange",
  is_completed: row.is_completed || false,
  created_at: row.created_at,
  updated_at: row.updated_at,
  materials_count: materialsCount,
});

export const useGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get material counts for each goal
      const goalsWithCounts = await Promise.all(
        (data || []).map(async (goal) => {
          const { count } = await supabase
            .from("goal_materials")
            .select("*", { count: "exact", head: true })
            .eq("goal_id", goal.id);
          
          return mapRowToGoal(goal, count || 0);
        })
      );

      setGoals(goalsWithCounts);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: {
    title: string;
    description?: string;
    deadline?: string;
    learning_style?: string;
    color?: string;
  }): Promise<Goal | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          title: goalData.title,
          description: goalData.description || null,
          deadline: goalData.deadline || null,
          learning_style: goalData.learning_style || null,
          color: goalData.color || "orange",
        })
        .select()
        .single();

      if (error) throw error;

      const newGoal = mapRowToGoal(data, 0);
      setGoals((prev) => [newGoal, ...prev]);
      toast({
        title: "Goal created",
        description: "Your new goal has been added",
      });
      return newGoal;
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateGoal = async (
    goalId: string,
    updates: Partial<Omit<Goal, "id" | "user_id" | "created_at" | "updated_at">>
  ): Promise<Goal | null> => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", goalId)
        .select()
        .single();

      if (error) throw error;

      const existingGoal = goals.find((g) => g.id === goalId);
      const updatedGoal = mapRowToGoal(data, existingGoal?.materials_count || 0);
      
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? updatedGoal : g))
      );
      return updatedGoal;
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", goalId);

      if (error) throw error;

      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      toast({
        title: "Goal deleted",
        description: "Your goal has been removed",
      });
      return true;
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
      return false;
    }
  };

  const fetchGoalMaterials = async (goalId: string): Promise<GoalMaterial[]> => {
    try {
      const { data, error } = await supabase
        .from("goal_materials")
        .select(`
          *,
          study_material:study_materials(id, file_name, file_path)
        `)
        .eq("goal_id", goalId);

      if (error) throw error;
      return (data || []) as GoalMaterial[];
    } catch (error) {
      console.error("Error fetching goal materials:", error);
      return [];
    }
  };

  const addMaterialToGoal = async (goalId: string, studyMaterialId: string) => {
    try {
      const { error } = await supabase.from("goal_materials").insert({
        goal_id: goalId,
        study_material_id: studyMaterialId,
      });

      if (error) throw error;

      // Update materials count
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, materials_count: (g.materials_count || 0) + 1 }
            : g
        )
      );

      toast({
        title: "Material added",
        description: "Material has been linked to your goal",
      });
      return true;
    } catch (error) {
      console.error("Error adding material to goal:", error);
      toast({
        title: "Error",
        description: "Failed to add material",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeMaterialFromGoal = async (goalId: string, studyMaterialId: string) => {
    try {
      const { error } = await supabase
        .from("goal_materials")
        .delete()
        .eq("goal_id", goalId)
        .eq("study_material_id", studyMaterialId);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, materials_count: Math.max((g.materials_count || 1) - 1, 0) }
            : g
        )
      );

      return true;
    } catch (error) {
      console.error("Error removing material from goal:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    fetchGoalMaterials,
    addMaterialToGoal,
    removeMaterialFromGoal,
    refetch: fetchGoals,
  };
};
