import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  accept = ".pdf,.jpg,.jpeg,.png,.txt",
  multiple = false,
  maxSize = 10,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      return sizeMB <= maxSize;
    });

    if (multiple) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      onFileSelect([...selectedFiles, ...validFiles]);
    } else {
      setSelectedFiles(validFiles);
      onFileSelect(validFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="text-slate-400 h-8 w-8" />
          </div>
          <h4 className="text-lg font-medium text-slate-900 mb-2">Drop your files here</h4>
          <p className="text-slate-600 mb-4">
            Supports PDF, images, and text files up to {maxSize}MB
          </p>
          <Button 
            type="button"
            className="bg-primary text-white hover:bg-blue-700"
            data-testid="button-choose-files"
          >
            Choose Files
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            data-testid="input-file-upload"
          />
        </CardContent>
      </Card>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-slate-700">Selected Files:</h5>
          {selectedFiles.map((file, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              data-testid={`file-${index}`}
            >
              <div className="flex items-center">
                <File className="h-4 w-4 text-slate-400 mr-2" />
                <span className="text-sm text-slate-700">{file.name}</span>
                <span className="text-xs text-slate-500 ml-2">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                data-testid={`button-remove-file-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
