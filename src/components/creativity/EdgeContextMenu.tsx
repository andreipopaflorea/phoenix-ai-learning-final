import { useState } from "react";
import { Edge } from "reactflow";
import { Trash2, MessageSquare, Eye, Link2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";

export interface EdgeContextData {
  edge: Edge;
  x: number;
  y: number;
  sourceLabel: string;
  targetLabel: string;
  insightNote?: string | null;
  connectionType: 'inspiration' | 'node' | 'legacy' | 'identity';
}

interface EdgeContextMenuProps {
  contextData: EdgeContextData | null;
  onClose: () => void;
  onDelete: () => void;
  onEditNote: () => void;
  onViewDetails: () => void;
}

const EdgeContextMenu = ({
  contextData,
  onClose,
  onDelete,
  onEditNote,
  onViewDetails,
}: EdgeContextMenuProps) => {
  if (!contextData) return null;

  const { sourceLabel, targetLabel, insightNote, connectionType } = contextData;
  const canEdit = connectionType === 'inspiration' || connectionType === 'node';
  const canDelete = connectionType === 'inspiration' || connectionType === 'node';

  return (
    <div
      className="fixed z-50"
      style={{ left: contextData.x, top: contextData.y }}
    >
      <div className="min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80">
        <div className="px-2 py-1.5 text-sm font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Connection
        </div>
        <div className="px-2 py-1 text-xs text-muted-foreground">
          {sourceLabel} → {targetLabel}
        </div>
        
        {insightNote && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-t border-border mt-1 pt-1">
            <span className="font-medium">Note:</span> {insightNote}
          </div>
        )}
        
        <div className="-mx-1 my-1 h-px bg-border" />
        
        <button
          onClick={() => {
            onViewDetails();
            onClose();
          }}
          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </button>
        
        {canEdit && (
          <button
            onClick={() => {
              onEditNote();
              onClose();
            }}
            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {insightNote ? "Edit Note" : "Add Note"}
          </button>
        )}
        
        {canDelete && (
          <>
            <div className="-mx-1 my-1 h-px bg-border" />
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Connection
            </button>
          </>
        )}
        
        {connectionType === 'identity' && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
            System connection (cannot be modified)
          </div>
        )}
        
        {connectionType === 'legacy' && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
            AI-generated connection
          </div>
        )}
      </div>
      
      {/* Click outside to close */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
};

export default EdgeContextMenu;
