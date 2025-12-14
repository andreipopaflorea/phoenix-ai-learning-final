import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Check, 
  Trash2, 
  Loader2,
  BookOpen,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";

interface StudyMaterial {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

interface LearningUnit {
  id: string;
  study_material_id: string;
  unit_title: string;
}

interface SystemCourse {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
}

interface CourseProgress {
  courseId: string;
  totalUnits: number;
  completedUnits: number;
}

const Materials = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [learningUnits, setLearningUnits] = useState<Record<string, LearningUnit[]>>({});
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [materialProgress, setMaterialProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [processingMaterial, setProcessingMaterial] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch materials
      const { data: materialsData } = await supabase
        .from("study_materials")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (materialsData) setMaterials(materialsData);

      // Fetch learning units
      if (materialsData && materialsData.length > 0) {
        const materialIds = materialsData.map(m => m.id);
        const { data: unitsData } = await supabase
          .from("learning_units")
          .select("*")
          .in("study_material_id", materialIds);
        
        if (unitsData) {
          const unitsMap: Record<string, LearningUnit[]> = {};
          unitsData.forEach(unit => {
            if (!unitsMap[unit.study_material_id!]) {
              unitsMap[unit.study_material_id!] = [];
            }
            unitsMap[unit.study_material_id!].push(unit);
          });
          setLearningUnits(unitsMap);

          // Fetch user progress for these units
          const unitIds = unitsData.map(u => u.id);
          const { data: progressData } = await supabase
            .from("user_progress")
            .select("learning_unit_id, status")
            .eq("user_id", user.id)
            .in("learning_unit_id", unitIds);

          if (progressData) {
            const progressMap: Record<string, number> = {};
            materialIds.forEach(materialId => {
              const matUnits = unitsMap[materialId] || [];
              if (matUnits.length === 0) {
                progressMap[materialId] = 0;
              } else {
                const completed = matUnits.filter(u => {
                  const prog = progressData.find(p => p.learning_unit_id === u.id);
                  return prog?.status === "complete" || prog?.status === "mastered";
                }).length;
                progressMap[materialId] = Math.round((completed / matUnits.length) * 100);
              }
            });
            setMaterialProgress(progressMap);
          }
        }
      }

      // Fetch system courses
      const { data: coursesData } = await supabase
        .from("system_learning_courses")
        .select("*")
        .order("course_order", { ascending: true });
      if (coursesData) setCourses(coursesData);

      // Fetch course progress for system courses
      if (coursesData && coursesData.length > 0) {
        const courseIds = coursesData.map(c => c.id);
        
        // Fetch all learning units for these courses
        const { data: courseUnits } = await supabase
          .from("learning_units")
          .select("id, course_id")
          .in("course_id", courseIds);

        // Fetch user progress for those units
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("learning_unit_id, status")
          .eq("user_id", user.id);

        if (courseUnits) {
          const progressMap: Record<string, CourseProgress> = {};
          const completedUnitIds = new Set(
            (progressData || [])
              .filter(p => p.status === "complete" || p.status === "mastered")
              .map(p => p.learning_unit_id)
          );

          courseIds.forEach(courseId => {
            const unitsForCourse = courseUnits.filter(u => u.course_id === courseId);
            const completedForCourse = unitsForCourse.filter(u => completedUnitIds.has(u.id)).length;
            progressMap[courseId] = {
              courseId,
              totalUnits: unitsForCourse.length,
              completedUnits: completedForCourse,
            };
          });
          setCourseProgress(progressMap);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("study_materials").insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
      });

      if (dbError) throw dbError;

      const { data: newMaterials } = await supabase
        .from("study_materials")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (newMaterials) setMaterials(newMaterials);
      toast.success("PDF uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMaterial = async (material: StudyMaterial) => {
    try {
      await supabase.storage.from("study-materials").remove([material.file_path]);
      await supabase.from("study_materials").delete().eq("id", material.id);
      setMaterials(prev => prev.filter(m => m.id !== material.id));
      toast.success("Material deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete material");
    }
  };

  const handleProcessPdf = async (material: StudyMaterial) => {
    setProcessingMaterial(material.id);
    try {
      const { data, error } = await supabase.functions.invoke("chunk-pdf", {
        body: {
          studyMaterialId: material.id,
          filePath: material.file_path,
          userId: user!.id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setLearningUnits(prev => ({
        ...prev,
        [material.id]: data.units,
      }));

      toast.success(`Created ${data.count} learning units!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to process PDF");
    } finally {
      setProcessingMaterial(null);
    }
  };

  const hasUnits = (materialId: string) => (learningUnits[materialId]?.length || 0) > 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-1">Materials</h1>
          <p className="text-muted-foreground">
            Upload PDFs to generate micro-learning sessions
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            ) : (
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            )}
            <p className="text-foreground font-medium">
              Drop PDFs here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Maximum file size: 10MB
            </p>
          </button>
        </motion.div>

        {/* Your Materials */}
        {materials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Materials</h2>
            <div className="space-y-4">
              {materials.map(material => {
                const progress = materialProgress[material.id] || 0;
                const unitsCount = learningUnits[material.id]?.length || 0;
                
                return (
                  <div 
                    key={material.id} 
                    className="bg-card border border-border rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                          {hasUnits(material.id) && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                              <span className="text-[10px] font-semibold text-primary">{progress}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{material.file_name}</h3>
                            {hasUnits(material.id) && (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <Check className="w-4 h-4" /> Ready
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(material.created_at).toLocaleDateString()}
                            {unitsCount > 0 && ` • ${unitsCount} lessons`}
                          </p>
                          {hasUnits(material.id) && (
                            <div className="w-32 h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all" 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  
                  <div className="flex items-center gap-3 mt-4">
                    {hasUnits(material.id) ? (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate(`/material/${material.id}`)}
                      >
                        View Topics
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => handleProcessPdf(material)}
                        disabled={processingMaterial === material.id}
                      >
                        {processingMaterial === material.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                        Process PDF
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMaterial(material)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Preloaded Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Preloaded Courses</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div 
                key={course.id} 
                className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium text-foreground">
                    {courseProgress[course.id] 
                      ? `${Math.round((courseProgress[course.id].completedUnits / courseProgress[course.id].totalUnits) * 100) || 0}%`
                      : "0%"}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full mt-2">
                  <div 
                    className="h-full bg-primary rounded-full transition-all" 
                    style={{ 
                      width: courseProgress[course.id] 
                        ? `${(courseProgress[course.id].completedUnits / courseProgress[course.id].totalUnits) * 100}%` 
                        : "0%" 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Materials;
