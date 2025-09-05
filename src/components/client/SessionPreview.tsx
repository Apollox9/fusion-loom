import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronLeft, 
  Users, 
  GraduationCap, 
  Shirt, 
  Upload,
  Eye
} from 'lucide-react';

interface SessionPreviewProps {
  data: {
    schoolName: string;
    classes: {
      className: string;
      students: {
        fullName: string;
        darkGarments: number;
        lightGarments: number;
        paid: boolean;
      }[];
    }[];
    totals: {
      totalClasses: number;
      totalStudents: number;
      totalDarkGarments: number;
      totalLightGarments: number;
    };
  };
  schoolName: string;
  onConfirm: (data: any) => void;
  onDiscard: () => void;
}

export function SessionPreview({ data, onConfirm, onDiscard }: SessionPreviewProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const selectedClassData = selectedClass 
    ? data.classes.find(cls => cls.className === selectedClass)
    : null;

  if (selectedClass && selectedClassData) {
    const classTotals = {
      totalStudents: selectedClassData.students.length,
      totalDarkGarments: selectedClassData.students.reduce((sum, s) => sum + s.darkGarments, 0),
      totalLightGarments: selectedClassData.students.reduce((sum, s) => sum + s.lightGarments, 0)
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setSelectedClass(null)}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {selectedClassData.className}
            </h1>
          </div>

          {/* Class Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center p-4">
                <Users className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{classTotals.totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center p-4">
                <Shirt className="w-8 h-8 text-gray-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{classTotals.totalDarkGarments}</p>
                  <p className="text-sm text-muted-foreground">Dark Garments</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center p-4">
                <Shirt className="w-8 h-8 text-gray-300 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{classTotals.totalLightGarments}</p>
                  <p className="text-sm text-muted-foreground">Light Garments</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center p-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-bold text-primary-foreground">
                    {classTotals.totalDarkGarments + classTotals.totalLightGarments}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {classTotals.totalDarkGarments + classTotals.totalLightGarments}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Garments</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students Table */}
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Students List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead className="text-center">Dark Garments</TableHead>
                    <TableHead className="text-center">Light Garments</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedClassData.students.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">
                        <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold mx-auto">
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell className="text-center">{student.darkGarments}</TableCell>
                      <TableCell className="text-center">{student.lightGarments}</TableCell>
                      <TableCell className="text-center font-medium">
                        {student.darkGarments + student.lightGarments}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Session Preview
          </h1>
          <p className="text-muted-foreground mt-2">
            Review your session data before uploading
          </p>
        </div>

        {/* School Summary */}
        <Card className="mb-6 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">{data.schoolName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{data.totals.totalClasses}</p>
                  <p className="text-sm text-muted-foreground">Class Units</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{data.totals.totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shirt className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold">{data.totals.totalDarkGarments}</p>
                  <p className="text-sm text-muted-foreground">Dark Garments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shirt className="w-8 h-8 text-gray-300" />
                <div>
                  <p className="text-2xl font-bold">{data.totals.totalLightGarments}</p>
                  <p className="text-sm text-muted-foreground">Light Garments</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes List */}
        <Card className="mb-6 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Classes Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {data.classes.map((classData, index) => {
                const classTotal = classData.students.reduce(
                  (sum, student) => sum + student.darkGarments + student.lightGarments, 
                  0
                );
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedClass(classData.className)}
                  >
                    <div className="flex items-center gap-4">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {classData.className}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {classData.students.length} students • {classTotal} garments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {classData.students.length} students
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onDiscard}
            size="lg"
          >
            Discard Upload
          </Button>
          <Button
            onClick={() => onConfirm(data)}
            className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
            size="lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Session
          </Button>
        </div>
      </div>
    </div>
  );
}