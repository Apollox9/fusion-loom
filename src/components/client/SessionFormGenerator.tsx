import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Download, FileText, CheckCircle, X, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { generateClassFormPDF } from '@/utils/pdfGenerator';

interface ClassData {
  className: string;
  students: { fullName: string }[];
}

interface SessionFormGeneratorProps {
  schoolName: string;
}

export function SessionFormGenerator({ schoolName }: SessionFormGeneratorProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedClasses, setGeneratedClasses] = useState<ClassData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} file(s) added`);
    } else {
      toast.error('Please upload Excel files only');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const excelFiles = Array.from(files).filter(
        file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      
      if (excelFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...excelFiles]);
        toast.success(`${excelFiles.length} file(s) added`);
      } else {
        toast.error('Please upload Excel files only');
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processAcademicFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one academic list file');
      return;
    }

    setIsProcessing(true);
    const classes: ClassData[] = [];

    try {
      for (const file of uploadedFiles) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extract class name from file name (remove extension)
        const className = file.name.replace(/\.(xlsx|xls)$/i, '');

        // Extract student names from first column (skip header if present)
        const students = jsonData
          .slice(1) // Skip header row
          .filter(row => row[0]) // Filter out empty rows
          .map(row => ({
            fullName: String(row[0]).trim()
          }));

        if (students.length === 0) {
          toast.error(`No students found in ${file.name}`);
          continue;
        }

        classes.push({
          className,
          students
        });
      }

      if (classes.length === 0) {
        toast.error('No valid class data found in uploaded files');
        setIsProcessing(false);
        return;
      }

      setGeneratedClasses(classes);
      toast.success(`Successfully processed ${classes.length} class(es)`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process academic files');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAndDownloadPDFs = async () => {
    if (generatedClasses.length === 0) {
      toast.error('No classes to generate forms for');
      return;
    }

    setIsGenerating(true);

    try {
      const zip = new JSZip();

      for (const classData of generatedClasses) {
        const pdf = await generateClassFormPDF(classData, schoolName);
        const pdfBlob = pdf.output('blob');
        zip.file(`${classData.className}.pdf`, pdfBlob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${schoolName}_Session_Forms.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Forms generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDFs:', error);
      toast.error('Failed to generate PDF forms');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setGeneratedClasses([]);
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            File Upload Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>File Format:</strong>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
              <li>Excel files (.xlsx, .xls)</li>
              <li>File name = Class name (e.g., "FORM 1 A.xlsx")</li>
              <li>Column Structure:</li>
              <ul className="list-circle list-inside ml-4">
                <li>Column 1: Student Full Name</li>
              </ul>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Academic List (Generate Session Forms)</CardTitle>
          <CardDescription>
            Upload Excel files containing student names to automatically generate printable session forms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              Drag and drop your academic Excel files here
            </h3>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  multiple
                  onChange={handleFileInput}
                />
              </label>
            </Button>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Uploaded Files ({uploadedFiles.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={isProcessing}
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium truncate">
                        {file.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Classes Preview */}
          {generatedClasses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Forms Ready ({generatedClasses.length} classes)
              </h4>
              <div className="grid gap-2 md:grid-cols-2">
                {generatedClasses.map((classData, index) => (
                  <Card key={index} className="bg-green-50 dark:bg-green-950/20">
                    <CardContent className="p-4">
                      <div className="font-semibold">{classData.className}</div>
                      <div className="text-sm text-muted-foreground">
                        {classData.students.length} students
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {generatedClasses.length === 0 ? (
              <Button
                onClick={processAcademicFiles}
                disabled={uploadedFiles.length === 0 || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Process Files
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={generateAndDownloadPDFs}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDFs...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download All Forms (ZIP)
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
