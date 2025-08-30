import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface SessionUploadProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
  schoolName: string;
}

interface ClassData {
  className: string;
  students: {
    fullName: string;
    darkGarments: number;
    lightGarments: number;
    paid: boolean;
  }[];
}

export function SessionUpload({ onComplete, onCancel, schoolName }: SessionUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (files.length === 0) {
      toast({
        title: 'Invalid files',
        description: 'Please upload only Excel files (.xlsx, .xls)',
        variant: 'destructive'
      });
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: 'No files',
        description: 'Please upload at least one Excel file',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const classesData: ClassData[] = [];

      for (const file of uploadedFiles) {
        const className = file.name.replace(/\.(xlsx|xls)$/i, '');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row and process data
        const students = jsonData.slice(1).map((row: any) => ({
          fullName: row[0] || '',
          darkGarments: parseInt(row[1]) || 0,
          lightGarments: parseInt(row[2]) || 0,
          paid: row[3] === true || row[3] === 'TRUE' || row[3] === 1 || row[3] === '✓'
        })).filter(student => student.fullName && student.paid); // Only include paid students

        classesData.push({
          className,
          students
        });
      }

      // Calculate totals
      const totalClasses = classesData.length;
      const totalStudents = classesData.reduce((sum, cls) => sum + cls.students.length, 0);
      const totalDarkGarments = classesData.reduce((sum, cls) => 
        sum + cls.students.reduce((clsSum, student) => clsSum + student.darkGarments, 0), 0
      );
      const totalLightGarments = classesData.reduce((sum, cls) => 
        sum + cls.students.reduce((clsSum, student) => clsSum + student.lightGarments, 0), 0
      );

      const sessionData = {
        schoolName,
        classes: classesData,
        totals: {
          totalClasses,
          totalStudents,
          totalDarkGarments,
          totalLightGarments
        }
      };

      setTimeout(() => {
        setIsProcessing(false);
        onComplete(sessionData);
      }, 2000); // Simulate processing time

    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process Excel files. Please check the format.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <Card className="w-96 bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <FileSpreadsheet className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-xl font-semibold mt-6 mb-2">Generating Preview</h3>
            <p className="text-muted-foreground text-center">
              Processing your Excel files and validating student data...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="mb-4"
          >
            ← Back to Sessions
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Upload Class Files
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload Excel files for each class. File names should match exact class names.
          </p>
        </div>

        <Card className="mb-6 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>File Upload Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">File Format:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Excel files (.xlsx, .xls)</li>
                  <li>• File name = Class name (e.g., "FORM 1 A.xlsx")</li>
                  <li>• Four columns required</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Column Structure:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Column 1: Student Full Name</li>
                  <li>• Column 2: Dark Garments Count</li>
                  <li>• Column 3: Light Garments Count</li>
                  <li>• Column 4: Payment Status (✓ for paid)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Drag and drop your Excel files here
              </h3>
              <p className="text-muted-foreground mb-4">
                Or click to browse and select files
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-primary/50 hover:border-primary"
              >
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="font-medium">
                            {file.name.replace(/\.(xlsx|xls)$/i, '')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setUploadedFiles([])}
                >
                  Clear All
                </Button>
                <Button
                  onClick={processFiles}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
                >
                  Generate Preview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}