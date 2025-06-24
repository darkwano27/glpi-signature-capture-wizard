
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Trash2, CheckCircle } from 'lucide-react';
import SignaturePad from 'signature_pad';

interface UserSignatureProps {
  user: any;
  onSignatureSave: (signature: string) => void;
}

const UserSignature = ({ user, onSignatureSave }: UserSignatureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      // Prevent scrolling on mobile when signing
      const preventScroll = (e: TouchEvent) => {
        e.preventDefault();
      };

      const canvas = canvasRef.current;
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
      });

      // Prevent mobile scroll when drawing
      canvas.addEventListener('touchstart', preventScroll, { passive: false });
      canvas.addEventListener('touchmove', preventScroll, { passive: false });

      signaturePadRef.current.addEventListener('beginStroke', () => {
        setHasSignature(true);
        setIsSaved(false);
      });

      // Resize canvas to fit container
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        canvas.getContext('2d')!.scale(ratio, ratio);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      return () => {
        canvas.removeEventListener('touchstart', preventScroll);
        canvas.removeEventListener('touchmove', preventScroll);
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, []);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setHasSignature(false);
      setIsSaved(false);
    }
  };

  const saveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataURL = signaturePadRef.current.toDataURL();
      onSignatureSave(dataURL);
      setIsSaved(true);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="w-5 h-5 text-purple-600" />
          Firma del Usuario: {user.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Usuario: {user.name}</p>
            <p>Email: {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={clearSignature}
              variant="outline"
              size="sm"
              disabled={!hasSignature}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
            <Button
              onClick={saveSignature}
              size="sm"
              disabled={!hasSignature}
              className={isSaved ? 'bg-green-600' : ''}
            >
              {isSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Guardado
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 mr-1" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg touch-none"
            style={{ touchAction: 'none' }}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-gray-400 text-center">
                <PenTool className="w-8 h-8 mx-auto mb-2" />
                <p>El usuario debe firmar aquí</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSignature;
