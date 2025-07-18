'use client';

import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../../../components/layout';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  FileText, 
  Download, 
  Share2, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Type, 
  Palette,
  Zap,
  Star,
  Save,
  Image as ImageIcon
} from 'lucide-react';
import { useMonitoring } from '../../../components/monitoring/MonitoringProvider';
import { PremiumFeature } from '../../../components/premium/PremiumFeature';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'sonner';

interface FlyerData {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventDescription: string;
  eventType: 'birthday' | 'business' | 'party' | 'community';
  contactInfo: string;
}

interface GeneratedFlyer {
  id: string;
  design: {
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
    };
    layout: 'classic' | 'modern' | 'creative';
    elements: {
      title: string;
      subtitle: string;
      body: string;
      footer: string;
    };
  };
  imageUrl?: string;
  createdAt: string;
}

const EVENT_TYPES = {
  birthday: { label: 'Compleanno', color: 'bg-pink-100 text-pink-700' },
  business: { label: 'Business', color: 'bg-blue-100 text-blue-700' },
  party: { label: 'Festa', color: 'bg-purple-100 text-purple-700' },
  community: { label: 'Comunità', color: 'bg-green-100 text-green-700' }
};

const SAMPLE_DESIGNS = [
  {
    id: 'classic',
    name: 'Classico',
    description: 'Design elegante e professionale',
    preview: '/api/placeholder/200/280?text=Classico'
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Stile contemporaneo e pulito',
    preview: '/api/placeholder/200/280?text=Moderno'
  },
  {
    id: 'creative',
    name: 'Creativo',
    description: 'Design artistico e originale',
    preview: '/api/placeholder/200/280?text=Creativo'
  }
];

export default function VolantinoGeneratorPage() {
  const { user } = useAuth();
  const { recordUserAction, recordBusinessMetric } = useMonitoring();
  
  const [flyerData, setFlyerData] = useState<FlyerData>({
    eventName: '',
    eventDate: '',
    eventLocation: '',
    eventDescription: '',
    eventType: 'community',
    contactInfo: ''
  });
  
  const [generatedFlyer, setGeneratedFlyer] = useState<GeneratedFlyer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<string>('classic');
  const [previewMode, setPreviewMode] = useState<'form' | 'preview'>('form');
  
  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('volantino-generator-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFlyerData(parsed);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('volantino-generator-data', JSON.stringify(flyerData));
  }, [flyerData]);
  
  // Record page view
  useEffect(() => {
    recordUserAction('volantino_generator_visit', { userId: user?.id });
  }, [user?.id, recordUserAction]);
  
  const handleInputChange = (field: keyof FlyerData, value: string) => {
    setFlyerData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleGenerate = async () => {
    if (!flyerData.eventName || !flyerData.eventDate || !flyerData.eventLocation) {
      toast.error('Compila almeno nome evento, data e luogo');
      return;
    }
    
    setIsGenerating(true);
    recordUserAction('volantino_generate_attempt', { 
      eventType: flyerData.eventType,
      designStyle: selectedDesign,
      userId: user?.id
    });
    
    try {
      const response = await fetch('/api/apps/volantino-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...flyerData,
          designStyle: selectedDesign
        })
      });
      
      if (!response.ok) {
        throw new Error('Errore durante la generazione');
      }
      
      const result = await response.json();
      setGeneratedFlyer(result.flyer);
      setPreviewMode('preview');
      
      recordBusinessMetric('volantino_generated', 1, {
        eventType: flyerData.eventType,
        designStyle: selectedDesign,
        userId: user?.id
      });
      
      toast.success('Volantino generato con successo!');
      
    } catch (error) {
      console.error('Error generating flyer:', error);
      toast.error('Errore durante la generazione del volantino');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!generatedFlyer) return;
    
    recordUserAction('volantino_download_attempt', { 
      format,
      flyerId: generatedFlyer.id,
      userId: user?.id
    });
    
    try {
      const response = await fetch('/api/apps/volantino-generator/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flyerId: generatedFlyer.id,
          format
        })
      });
      
      if (!response.ok) {
        throw new Error('Errore durante il download');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `volantino-${flyerData.eventName.replace(/\s+/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      recordBusinessMetric('volantino_downloaded', 1, {
        format,
        flyerId: generatedFlyer.id,
        userId: user?.id
      });
      
      toast.success(`Volantino scaricato come ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error('Error downloading flyer:', error);
      toast.error('Errore durante il download');
    }
  };
  
  const handleShare = async () => {
    if (!generatedFlyer) return;
    
    recordUserAction('volantino_share_attempt', { 
      flyerId: generatedFlyer.id,
      userId: user?.id
    });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Volantino: ${flyerData.eventName}`,
          text: `Partecipa al mio evento: ${flyerData.eventName}`,
          url: window.location.href
        });
        
        recordBusinessMetric('volantino_shared', 1, {
          method: 'native',
          flyerId: generatedFlyer.id,
          userId: user?.id
        });
        
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `Partecipa al mio evento: ${flyerData.eventName}\n${flyerData.eventDate} - ${flyerData.eventLocation}`;
      await navigator.clipboard.writeText(text);
      toast.success('Testo copiato negli appunti');
    }
  };
  
  const resetForm = () => {
    setFlyerData({
      eventName: '',
      eventDate: '',
      eventLocation: '',
      eventDescription: '',
      eventType: 'community',
      contactInfo: ''
    });
    setGeneratedFlyer(null);
    setPreviewMode('form');
    localStorage.removeItem('volantino-generator-data');
    toast.success('Modulo reimpostato');
  };
  
  const renderFormView = () => (
    <div className="space-y-6">
      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dettagli Evento
          </CardTitle>
          <CardDescription>
            Inserisci le informazioni principali del tuo evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Evento *
            </label>
            <input
              type="text"
              value={flyerData.eventName}
              onChange={(e) => handleInputChange('eventName', e.target.value)}
              placeholder="es. Festa di Compleanno di Maria"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data e Ora *
              </label>
              <input
                type="datetime-local"
                value={flyerData.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Luogo *
              </label>
              <input
                type="text"
                value={flyerData.eventLocation}
                onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                placeholder="es. Via Roma 123, Milano"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Evento
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
                <button
                  key={key}
                  onClick={() => handleInputChange('eventType', key as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    flyerData.eventType === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              value={flyerData.eventDescription}
              onChange={(e) => handleInputChange('eventDescription', e.target.value)}
              placeholder="Descrivi brevemente il tuo evento..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contatti
            </label>
            <input
              type="text"
              value={flyerData.contactInfo}
              onChange={(e) => handleInputChange('contactInfo', e.target.value)}
              placeholder="es. Tel: 123-456-7890, Email: info@evento.it"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Design Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Scegli il Design
          </CardTitle>
          <CardDescription>
            Seleziona lo stile che preferisci per il tuo volantino
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_DESIGNS.map((design) => (
              <button
                key={design.id}
                onClick={() => setSelectedDesign(design.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDesign === design.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <Type className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900">{design.name}</h3>
                <p className="text-sm text-gray-600">{design.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !flyerData.eventName || !flyerData.eventDate || !flyerData.eventLocation}
          className="flex-1 h-12"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generazione in corso...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Genera Volantino
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={resetForm}
          className="h-12"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reimposta
        </Button>
      </div>
    </div>
  );
  
  const renderPreviewView = () => (
    <div className="space-y-6">
      {/* Generated Flyer Preview */}
      {generatedFlyer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Il Tuo Volantino
            </CardTitle>
            <CardDescription>
              Volantino generato con successo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg border-2 border-gray-200 p-8 max-w-md mx-auto">
              {/* Flyer Design Preview */}
              <div 
                className="aspect-[3/4] rounded-lg p-6 text-white relative overflow-hidden"
                style={{ backgroundColor: generatedFlyer.design.colorScheme.primary }}
              >
                <div className="relative z-10">
                  <h1 className="text-2xl font-bold mb-2">{generatedFlyer.design.elements.title}</h1>
                  <p className="text-lg mb-4">{generatedFlyer.design.elements.subtitle}</p>
                  <div className="space-y-2 text-sm">
                    <p>{generatedFlyer.design.elements.body}</p>
                  </div>
                  <div className="absolute bottom-4 left-6 right-6">
                    <p className="text-xs">{generatedFlyer.design.elements.footer}</p>
                  </div>
                </div>
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundColor: generatedFlyer.design.colorScheme.accent }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Download Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Download e Condivisione</CardTitle>
          <CardDescription>
            Scarica il tuo volantino nei formati disponibili
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Features */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Funzionalità Base</h4>
              <Button
                onClick={() => handleDownload('png')}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG (con watermark)
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full justify-start"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Condividi
              </Button>
            </div>
            
            {/* Premium Features */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                Funzionalità Premium
                <Star className="h-4 w-4 text-yellow-500" />
              </h4>
              <PremiumFeature
                feature="download-pdf"
                fallback={
                  <Button variant="outline" disabled className="w-full justify-start opacity-60">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF (Premium)
                  </Button>
                }
              >
                <Button
                  onClick={() => handleDownload('pdf')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Alta Qualità
                </Button>
              </PremiumFeature>
              
              <PremiumFeature
                feature="no-watermark"
                fallback={
                  <Button variant="outline" disabled className="w-full justify-start opacity-60">
                    <Download className="h-4 w-4 mr-2" />
                    Senza Watermark (Premium)
                  </Button>
                }
              >
                <Button
                  onClick={() => handleDownload('png')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG Senza Watermark
                </Button>
              </PremiumFeature>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Back to Edit */}
      <div className="flex gap-4">
        <Button
          onClick={() => setPreviewMode('form')}
          variant="outline"
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          Modifica Volantino
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Rigenera
        </Button>
      </div>
    </div>
  );
  
  return (
    <AuthenticatedLayout title="Generatore di Volantini">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generatore di Volantini
          </h1>
          <p className="text-gray-600 mb-4">
            Crea volantini professionali in pochi click con l'aiuto dell'AI
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">AI-Powered</Badge>
            <Badge variant="secondary">Facile da Usare</Badge>
            <Badge variant="secondary">Download Istantaneo</Badge>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setPreviewMode('form')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                previewMode === 'form'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Modifica
            </button>
            <button
              onClick={() => setPreviewMode('preview')}
              disabled={!generatedFlyer}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                previewMode === 'preview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
              }`}
            >
              <ImageIcon className="h-4 w-4 mr-2 inline" />
              Anteprima
            </button>
          </div>
        </div>
        
        {/* Content */}
        {previewMode === 'form' ? renderFormView() : renderPreviewView()}
        
        {/* Save Progress Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Save className="h-4 w-4" />
          <span>I tuoi dati vengono salvati automaticamente</span>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}