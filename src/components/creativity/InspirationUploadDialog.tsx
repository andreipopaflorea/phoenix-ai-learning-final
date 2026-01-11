import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, Sparkles, X } from "lucide-react";
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

interface Goal {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

interface Inspiration {
  id: string;
  title: string;
  description: string | null;
  hidden_insight: string | null;
  connected_goal_id: string | null;
  insight_strength: number | null;
}

interface InspirationUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  onUploaded: (inspiration: Inspiration) => void;
}

const InspirationUploadDialog = ({
  open,
  onOpenChange,
  goals,
  onUploaded,
}: InspirationUploadDialogProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!user || (!title && !file)) {
      toast.error("Please provide a title or upload a file");
      return;
    }

    setUploading(true);
    
    try {
      let filePath = null;
      let fileType = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("inspiration")
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        filePath = fileName;
        fileType = file.type;
      }

      // Create inspiration record
      const { data: inspiration, error: insertError } = await supabase
        .from("inspirations")
        .insert({
          user_id: user.id,
          title: title || file?.name || "Untitled",
          description,
          file_path: filePath,
          file_type: fileType,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploading(false);
      setAnalyzing(true);

      // Trigger AI analysis
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        "analyze-inspiration",
        {
          body: {
            inspirationId: inspiration.id,
            title,
            description,
            filePath,
            goals: goals.map(g => ({ id: g.id, title: g.title, description: g.description })),
          },
        }
      );

      if (analysisError) {
        console.error("Analysis error:", analysisError);
        // Still continue - the inspiration was created
      }

      // Fetch the updated inspiration with analysis results
      const { data: updatedInspiration } = await supabase
        .from("inspirations")
        .select("*")
        .eq("id", inspiration.id)
        .single();

      onUploaded(updatedInspiration || inspiration);
      toast.success("Inspiration uploaded and analyzed!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload inspiration");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Upload Inspiration
          </DialogTitle>
          <DialogDescription>
            Add articles, PDFs, or notes. AI will find hidden connections to your goals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-center gap-3"
                >
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Drop a file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, TXT, MD supported
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's this about?"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context or key takeaways..."
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || analyzing || (!title && !file)}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : analyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Analyze
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspirationUploadDialog;
