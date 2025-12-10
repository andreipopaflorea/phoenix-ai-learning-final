import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Brain, 
  Calendar, 
  Clock, 
  Flame, 
  LogOut, 
  Target,
  Loader2,
  Sparkles,
  FileText,
  Upload,
  Trash2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LearningStyleSelector, type LearningStyle } from "@/components/LearningStyleSelector";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

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
  description: string | null;
  estimated_minutes: number;
  unit_order: number;
}

interface UserProgress {
  learning_unit_id: string;
  status: string;
  tier1_completed_at: string | null;
  tier2_completed_at: string | null;
  tier3_completed_at: string | null;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [uploading, setUploading] = useState(false);
  const [learningStyle, setLearningStyle] = useState<LearningStyle | null>(null);
  const [savingStyle, setSavingStyle] = useState(false);
  const [learningUnits, setLearningUnits] = useState<Record<string, LearningUnit[]>>({});
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [processingMaterial, setProcessingMaterial] = useState<string | null>(null);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchLearningPreferences = async () => {
      if (user) {
        const { data } = await supabase
          .from("user_learning_preferences")
          .select("learning_style")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data) {
          setLearningStyle(data.learning_style as LearningStyle);
        }
      }
    };

    fetchLearningPreferences();
  }, [user]);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("study_materials")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        if (data && !error) {
          setMaterials(data);
        }
      }
    };

    fetchMaterials();
  }, [user]);

  useEffect(() => {
    const fetchLearningUnits = async () => {
      if (user && materials.length > 0) {
        const materialIds = materials.map(m => m.id);
        const { data, error } = await supabase
          .from("learning_units")
          .select("*")
          .eq("user_id", user.id)
          .in("study_material_id", materialIds)
          .order("unit_order", { ascending: true });
        
        if (data && !error) {
          const unitsMap: Record<string, LearningUnit[]> = {};
          data.forEach(unit => {
            if (!unitsMap[unit.study_material_id]) {
              unitsMap[unit.study_material_id] = [];
            }
            unitsMap[unit.study_material_id].push(unit);
          });
          setLearningUnits(unitsMap);
        }
      }
    };

    fetchLearningUnits();
  }, [user, materials]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id);
        
        if (data && !error) {
          const progressMap: Record<string, UserProgress> = {};
          data.forEach(p => {
            progressMap[p.learning_unit_id] = p;
          });
          setUserProgress(progressMap);
        }
      }
    };

    fetchProgress();
  }, [user, learningUnits]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleLearningStyleSelect = async (style: LearningStyle) => {
    if (!user) return;
    
    setSavingStyle(true);
    try {
      const { data: existing } = await supabase
        .from("user_learning_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_learning_preferences")
          .update({ learning_style: style })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_learning_preferences")
          .insert({ user_id: user.id, learning_style: style });
      }

      setLearningStyle(style);
      toast.success("Learning style saved!");
    } catch (error: any) {
      toast.error("Failed to save learning style");
    } finally {
      setSavingStyle(false);
    }
  };

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

      const { error: dbError } = await supabase
        .from("study_materials")
        .insert({
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

      if (newMaterials) {
        setMaterials(newMaterials);
      }

      toast.success("PDF uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteMaterial = async (material: StudyMaterial) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("study-materials")
        .remove([material.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("study_materials")
        .delete()
        .eq("id", material.id);

      if (dbError) throw dbError;

      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
      const newUnits = { ...learningUnits };
      delete newUnits[material.id];
      setLearningUnits(newUnits);
      toast.success("Material deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete material");
    }
  };

  const handleChunkPdf = async (material: StudyMaterial) => {
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

      setExpandedMaterial(material.id);
      toast.success(`Created ${data.count} learning units!`);
    } catch (error: any) {
      console.error("Chunk PDF error:", error);
      toast.error(error.message || "Failed to process PDF");
    } finally {
      setProcessingMaterial(null);
    }
  };

  const getUnitProgress = (unitId: string) => {
    const progress = userProgress[unitId];
    if (!progress) return { status: "not_started", completedTiers: 0 };
    
    let completedTiers = 0;
    if (progress.tier1_completed_at) completedTiers = 1;
    if (progress.tier2_completed_at) completedTiers = 2;
    if (progress.tier3_completed_at) completedTiers = 3;
    
    return { status: progress.status, completedTiers };
  };

  // Calculate stats
  const allUnits = Object.values(learningUnits).flat();
  const completedCount = allUnits.filter(u => userProgress[u.id]?.status === "complete" || userProgress[u.id]?.status === "mastered").length;
  const masteredCount = allUnits.filter(u => userProgress[u.id]?.status === "mastered").length;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    { icon: Flame, label: "Day Streak", value: "0", color: "text-orange-500" },
    { icon: Clock, label: "Time Today", value: "0m", color: "text-blue-500" },
    { icon: Target, label: "Completed", value: String(completedCount), color: "text-green-500" },
    { icon: Brain, label: "Mastered", value: String(masteredCount), color: "text-purple-500" },
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Phoenix</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground hidden sm:block">
              {profile?.display_name || user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{profile?.display_name || "Learner"}</span>!
          </h1>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Study Materials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Study Materials
                </h2>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload PDF
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {materials.map((material) => {
                  const units = learningUnits[material.id] || [];
                  const hasUnits = units.length > 0;
                  const isExpanded = expandedMaterial === material.id;
                  const isProcessing = processingMaterial === material.id;

                  return (
                    <div key={material.id} className="rounded-xl border border-border overflow-hidden">
                      <div className="p-4 bg-secondary/50 hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{material.file_name}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <span>{formatFileSize(material.file_size)}</span>
                                <span>•</span>
                                <span>{new Date(material.created_at).toLocaleDateString()}</span>
                                {hasUnits && (
                                  <>
                                    <span>•</span>
                                    <span>{units.length} units</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasUnits ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedMaterial(isExpanded ? null : material.id)}
                                className="gap-2"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Hide Units
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    View Units
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChunkPdf(material)}
                                disabled={isProcessing}
                                className="gap-2"
                              >
                                {isProcessing ? (
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
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {hasUnits && isExpanded && (
                        <div className="p-4 border-t border-border bg-background space-y-3">
                          {units.map((unit) => {
                            const { status, completedTiers } = getUnitProgress(unit.id);
                            return (
                              <div
                                key={unit.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((tier) => (
                                      <Star
                                        key={tier}
                                        className={`w-4 h-4 ${
                                          tier <= completedTiers
                                            ? "text-yellow-500 fill-yellow-500"
                                            : "text-muted-foreground/30"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{unit.unit_title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {unit.estimated_minutes} min
                                      {status === "complete" && " • Complete"}
                                      {status === "mastered" && " • Mastered"}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant={status === "not_started" ? "default" : "outline"}
                                  onClick={() => navigate(`/learn/${unit.id}`)}
                                  className="gap-1"
                                >
                                  {status === "not_started" ? (
                                    <>
                                      <Play className="w-3 h-3" />
                                      Start
                                    </>
                                  ) : status === "mastered" ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Review
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3 h-3" />
                                      Continue
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {materials.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No materials yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Upload your PDF study materials to get started
                  </p>
                  <Button 
                    variant="hero"
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
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Learning Style Card */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-primary" />
                Learning Style
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Select how you learn best to personalize your micro-lessons
              </p>
              <LearningStyleSelector
                currentStyle={learningStyle}
                onSelect={handleLearningStyleSelect}
                loading={savingStyle}
              />
            </div>

            {/* Schedule Card */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-primary" />
                Schedule
              </h2>

              <div className="space-y-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                  <div
                    key={day}
                    className={`p-3 rounded-lg border ${
                      index === new Date().getDay() - 1
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{day}</span>
                      <span className="text-sm text-muted-foreground">No sessions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
