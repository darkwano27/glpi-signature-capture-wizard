
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User, Users, PenTool, FileText, LogOut } from 'lucide-react';
import SignaturePad from 'signature_pad';
import { useToast } from '@/hooks/use-toast';
import TechnicianSignature from './TechnicianSignature';
import UserAssetsSelection from './UserAssetsSelection';
import UserSignature from './UserSignature';

interface TechnicianSignatureWizardProps {
  onLogout: () => void;
}

interface Technician {
  id: number;
  name: string;
  email: string;
  signature?: string;
}

const TechnicianSignatureWizard = ({ onLogout }: TechnicianSignatureWizardProps) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [technicianSignature, setTechnicianSignature] = useState<string>('');
  const [userSignature, setUserSignature] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians');
      const data = await response.json();
      setTechnicians(data);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const handleTechnicianSelect = (technicianId: string) => {
    const technician = technicians.find(t => t.id === parseInt(technicianId));
    setSelectedTechnician(technician || null);
    if (technician?.signature) {
      setTechnicianSignature(technician.signature);
    }
  };

  const handleTechnicianSignatureSave = async (signature: string) => {
    if (selectedTechnician) {
      try {
        await fetch('/api/technicians/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            technicianId: selectedTechnician.id,
            signature: signature,
          }),
        });
        setTechnicianSignature(signature);
        toast({
          title: "Firma guardada",
          description: "La firma del técnico ha sido guardada correctamente",
        });
      } catch (error) {
        console.error('Error saving technician signature:', error);
      }
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedTechnician || !selectedUser || !technicianSignature || !userSignature) {
      toast({
        title: "Información incompleta",
        description: "Por favor complete todos los campos y firmas antes de generar el PDF",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          technician: selectedTechnician,
          user: selectedUser,
          assets: selectedAssets,
          technicianSignature,
          userSignature,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `entrega_activos_${selectedUser.name}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "PDF generado",
          description: "El PDF ha sido generado y enviado por email correctamente",
        });
      } else {
        throw new Error('Error generating PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">GLPI Signature Capture Wizard</h1>
        <Button onClick={onLogout} variant="outline" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>

      {/* Technician Selection */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Selección de Técnico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Seleccionar Técnico</label>
            <Select onValueChange={handleTechnicianSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Elige un técnico" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id.toString()}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTechnician && (
            <TechnicianSignature
              technician={selectedTechnician}
              existingSignature={technicianSignature}
              onSignatureSave={handleTechnicianSignatureSave}
            />
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* User & Assets Selection */}
      <UserAssetsSelection
        onUserSelect={setSelectedUser}
        onAssetsChange={setSelectedAssets}
      />

      {selectedUser && (
        <UserSignature
          user={selectedUser}
          onSignatureSave={setUserSignature}
        />
      )}

      <Separator />

      {/* Generate PDF Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF || !selectedTechnician || !selectedUser || !technicianSignature || !userSignature}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
        >
          <FileText className="w-5 h-5 mr-2" />
          {isGeneratingPDF ? 'Generando PDF...' : 'Generar PDF & Enviar Email'}
        </Button>
      </div>
    </div>
  );
};

export default TechnicianSignatureWizard;
