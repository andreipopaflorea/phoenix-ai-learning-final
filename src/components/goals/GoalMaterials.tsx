import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useGoals, GoalMaterial } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2, Loader2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GoalMaterialsProps {
  goalId: string;
}

interface StudyMaterial {
  id: string;
  file_name: string;
  file_path: string;
}

export const GoalMaterials = ({ goalId }: GoalMaterialsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchGoalMaterials, addMaterialToGoal, removeMaterialFromGoal } = useGoals();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<GoalMaterial[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");

  const loadMaterials = async () => {
    setLoading(true);
    const goalMats = await fetchGoalMaterials(goalId);
    setMaterials(goalMats);

    // Get all user's materials not already linked to this goal
    if (user) {
      const linkedIds = goalMats.map((m) => m.study_material_id);
      const { data } = await supabase
        .from("study_materials")
        .select("id, file_name, file_path")
        .eq("user_id", user.id);

      // Filter out already linked materials
      const available = (data || []).filter((m) => !linkedIds.includes(m.id));
      setAvailableMaterials(available);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMaterials();
  }, [goalId]);

  const handleAddExisting = async () => {
    if (!selectedMaterial) return;
    
    const success = await addMaterialToGoal(goalId, selectedMaterial);
    if (success) {
      setSelectedMaterial("");
      loadMaterials();
    }
  };

  const handleRemove = async (studyMaterialId: string) => {
    const success = await removeMaterialFromGoal(goalId, studyMaterialId);
    if (success) {
      loadMaterials();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create study material record
      const { data: material, error: insertError } = await supabase
        .from("study_materials")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Link to goal
      await addMaterialToGoal(goalId, material.id);
      loadMaterials();

      toast({
        title: "Material uploaded",
        description: "PDF has been uploaded and linked to your goal",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the PDF",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getDisplayName = (mat: GoalMaterial) => {
    if (mat.study_material?.file_name) {
      return mat.study_material.file_name.replace(".pdf", "");
    }
    return "Untitled";
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <Label className="text-base font-semibold">Materials</Label>

      {/* Upload Button */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload PDF
        </Button>
      </div>

      {/* Link Existing Material */}
      {availableMaterials.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Link existing material..." />
            </SelectTrigger>
            <SelectContent>
              {availableMaterials.map((mat) => (
                <SelectItem key={mat.id} value={mat.id}>
                  {mat.file_name.replace(".pdf", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddExisting}
            disabled={!selectedMaterial}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Linked Materials List */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : materials.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No materials linked yet
        </p>
      ) : (
        <div className="space-y-2">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {getDisplayName(mat)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-destructive"
                onClick={() => handleRemove(mat.study_material_id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
