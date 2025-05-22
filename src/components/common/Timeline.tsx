import React from 'react';
import { Milestone, MilestoneType } from '@/types/timeline';
import { Check, Clock, ChevronRight } from 'lucide-react';

interface TimelineProps {
  milestones: Milestone[];
  onMilestoneClick: (milestone: Milestone) => void;
  currentMilestoneId?: string;
  currentStage?: MilestoneType; // Actual etapa del proceso legislativo
}

// Definir el orden natural de los hitos legislativos
const milestoneOrder: MilestoneType[] = [
  'radicacion',
  'comision_primera',
  'comision_segunda',
  'plenaria',
  'conciliacion',
  'sancion'
];

// Map milestone types to display names
const milestoneLabels: Record<MilestoneType, string> = {
  radicacion: 'Radicación',
  comision_primera: 'Comisión Primera',
  comision_segunda: 'Comisión Segunda',
  plenaria: 'Plenaria',
  conciliacion: 'Conciliación',
  sancion: 'Sanción',
};

export function Timeline({ milestones, onMilestoneClick, currentMilestoneId, currentStage }: TimelineProps) {
  // Si no hay hitos, mostrar timeline vacío
  if (milestones.length === 0) {
    return (
      <div className="w-full mb-6 text-center py-4">
        <div className="text-gray-500 text-sm">
          No hay hitos configurados. Comience a comparar y guarde su hito.
        </div>
      </div>
    );
  }

  // Sort milestones por orden natural de proceso legislativo
  const sortedMilestones = [...milestones].sort((a, b) => {
    const aIndex = milestoneOrder.indexOf(a.type);
    const bIndex = milestoneOrder.indexOf(b.type);
    return aIndex - bIndex;
  });

  // Calcular el progreso basado en el hito actual
  const calculateProgress = () => {
    if (!currentStage) return 0;
    
    const currentIndex = milestoneOrder.indexOf(currentStage);
    if (currentIndex === -1) return 0;
    
    return Math.min(100, (currentIndex / (milestoneOrder.length - 1)) * 100);
  };

  const progress = calculateProgress();

  // Crear un array con los tipos de hitos que deberían mostrarse
  // Esto asegura que siempre se muestren todos los hitos en el orden correcto
  const displayMilestones: Milestone[] = [];
  
  // Para cada tipo de hito en el orden correcto
  for (const type of milestoneOrder) {
    // Buscar si existe un hito de este tipo
    const milestone = sortedMilestones.find(m => m.type === type);
    
    if (milestone) {
      // Si existe, agregarlo a los hitos a mostrar
      displayMilestones.push(milestone);
    }
  }

  return (
    <div className="w-full mb-6">
      <div className="relative flex items-center justify-between">
        {/* Línea de fondo */}
        <div className="absolute h-1 bg-gray-200 w-full z-0 rounded-full"></div>
        
        {/* Barra de progreso */}
        <div 
          className="absolute h-1 bg-blue-500 z-1 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
        
        {/* Hitos */}
        {displayMilestones.map((milestone, index) => {
          const isActive = milestone.id === currentMilestoneId;
          const isCurrentOrPast = currentStage 
            ? milestoneOrder.indexOf(milestone.type) <= milestoneOrder.indexOf(currentStage)
            : false;
          
          // Posición exacta basada en el tipo de hito
          const milestoneOrderIndex = milestoneOrder.indexOf(milestone.type);
          const totalPositions = milestoneOrder.length - 1; // -1 porque las posiciones empiezan en 0%
          const position = totalPositions > 0 
            ? (milestoneOrderIndex / totalPositions) * 100 
            : 0;
          
          return (
            <div 
              key={milestone.id}
              className="relative z-10 flex flex-col items-center"
              style={{ left: `${position}%`, position: 'absolute', transform: 'translateX(-50%)' }}
            >
              {/* Hito con icono de estado */}
              <button
                onClick={() => onMilestoneClick(milestone)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 ring-4 ring-blue-200 text-white' 
                    : isCurrentOrPast 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                }`}
                title={milestone.title}
              >
                {isCurrentOrPast ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
              </button>
              
              {/* Etiqueta */}
              <div 
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  isActive 
                    ? 'text-blue-700' 
                    : isCurrentOrPast 
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                }`}
              >
                {milestoneLabels[milestone.type] || milestone.title}
              </div>
              
              {/* Meta información */}
              <div className="text-xs text-gray-500 mt-1 flex items-center">
                {new Date(milestone.date).toLocaleDateString()}
                {milestone.documentVersion && (
                  <span className="ml-1 text-blue-500 cursor-pointer flex items-center" onClick={(e) => {
                    e.stopPropagation();
                    // Aquí se puede agregar lógica para navegar a la versión del documento
                    onMilestoneClick(milestone);
                  }}>
                    <ChevronRight className="w-3 h-3" />
                    Ver versión
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimelineCompact({ milestones, onMilestoneClick, currentMilestoneId, currentStage }: TimelineProps) {
  // Si no hay hitos, mostrar timeline vacío
  if (milestones.length === 0) {
    return (
      <div className="w-full text-center py-2">
        <div className="text-gray-500 text-sm">
          No hay hitos. Configure la línea de tiempo.
        </div>
      </div>
    );
  }

  // Crear un array con los tipos de hitos en el orden correcto
  const displayMilestones: Milestone[] = [];
  
  // Para cada tipo de hito en el orden correcto
  for (const type of milestoneOrder) {
    // Buscar si existe un hito de este tipo
    const milestone = milestones.find(m => m.type === type);
    
    if (milestone) {
      // Si existe, agregarlo a los hitos a mostrar
      displayMilestones.push(milestone);
    }
  }

  return (
    <div className="w-full">
      {/* Barra de progreso */}
      <div className="h-1 bg-gray-200 w-full rounded-full mb-3 relative">
        {currentStage && (
          <div 
            className="absolute top-0 left-0 h-1 bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
            style={{ 
              width: `${Math.min(100, (milestoneOrder.indexOf(currentStage) / (milestoneOrder.length - 1)) * 100)}%` 
            }}
          ></div>
        )}
      </div>
      
      {/* Botones de hitos */}
      <div className="flex items-center gap-2 py-2 overflow-x-auto">
        {displayMilestones.map((milestone) => {
          const isActive = milestone.id === currentMilestoneId;
          const isCurrentOrPast = currentStage 
            ? milestoneOrder.indexOf(milestone.type) <= milestoneOrder.indexOf(currentStage)
            : false;
          
          return (
            <button
              key={milestone.id}
              onClick={() => onMilestoneClick(milestone)}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors flex items-center ${
                isActive 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : isCurrentOrPast
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isCurrentOrPast && <Check className="w-3 h-3 mr-1" />}
              {!isCurrentOrPast && <Clock className="w-3 h-3 mr-1" />}
              {milestoneLabels[milestone.type] || milestone.title}
              {milestone.documentVersion && (
                <ChevronRight className="w-3 h-3 ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 