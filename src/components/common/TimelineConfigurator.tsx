import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { Button } from './Button';
import { Milestone, MilestoneType } from '@/types/timeline';

interface TimelineConfiguratorProps {
  milestones: Milestone[];
  onSave: (milestones: Milestone[]) => void;
}

export function TimelineConfigurator({ milestones, onSave }: TimelineConfiguratorProps) {
  const [editableMilestones, setEditableMilestones] = useState<Milestone[]>(milestones);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map milestone types to display names
  const milestoneLabels: Record<MilestoneType, string> = {
    radicacion: 'Radicación',
    comision_primera: 'Comisión Primera',
    comision_segunda: 'Comisión Segunda',
    plenaria: 'Plenaria',
    conciliacion: 'Conciliación',
    sancion: 'Sanción',
  };

  useEffect(() => {
    // Update local state when external milestones change
    setEditableMilestones(milestones);
  }, [milestones]);

  const handleAddMilestone = () => {
    // Determine the next available milestone type
    const milestoneTypes: MilestoneType[] = [
      'radicacion',
      'comision_primera',
      'comision_segunda',
      'plenaria',
      'conciliacion',
      'sancion'
    ];

    // Check which types are already used
    const usedTypes = new Set(editableMilestones.map(m => m.type));

    // Find the first unused type
    let nextType: MilestoneType = 'radicacion';
    for (const type of milestoneTypes) {
      if (!usedTypes.has(type)) {
        nextType = type;
        break;
      }
    }

    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      type: nextType,
      title: milestoneLabels[nextType] || 'Nuevo Hito',
      date: new Date().toISOString().split('T')[0],
      description: '',
    };

    setEditableMilestones([...editableMilestones, newMilestone]);
    setIsEditing(true);
    setErrorMessage(null);
    console.log("Milestones after adding:", [...editableMilestones, newMilestone]);
  };

  const handleRemoveMilestone = (id: string) => {
    setEditableMilestones(editableMilestones.filter(m => m.id !== id));
    setIsEditing(true);
  };

  const handleSave = () => {
    // Check for duplicates before saving
    const typeCount = new Map<MilestoneType, number>();
    let hasDuplicates = false;
    let duplicateType = '';

    for (const milestone of editableMilestones) {
      const count = (typeCount.get(milestone.type) || 0) + 1;
      typeCount.set(milestone.type, count);

      if (count > 1) {
        hasDuplicates = true;
        duplicateType = milestoneLabels[milestone.type];
        break;
      }
    }

    if (hasDuplicates) {
      setErrorMessage(`No se puede guardar: hay múltiples hitos de tipo ${duplicateType}.`);
      return;
    }

    // Sort by natural legislative process order
    const milestoneOrder: MilestoneType[] = [
      'radicacion',
      'comision_primera',
      'comision_segunda',
      'plenaria',
      'conciliacion',
      'sancion'
    ];

    const sortedMilestones = [...editableMilestones].sort((a, b) => {
      const aIndex = milestoneOrder.indexOf(a.type);
      const bIndex = milestoneOrder.indexOf(b.type);
      return aIndex - bIndex;
    });

    onSave(sortedMilestones);
    setIsEditing(false);
    setErrorMessage(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-800">Configurar Línea de Tiempo</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddMilestone}
            className="text-xs px-2 py-1 h-auto"
            disabled={Object.keys(milestoneLabels).length <= editableMilestones.length ||
                      // Check if all milestone types are already used
                      Object.keys(milestoneLabels).every(type =>
                        editableMilestones.some(m => m.type === type)
                      )}
          >
            <PlusCircle className="w-3 h-3 mr-1" />
            Añadir Hito
          </Button>

          {isEditing && (
            <Button
              size="sm"
              onClick={handleSave}
              className="text-xs px-2 py-1 h-auto bg-blue-600 text-white hover:bg-blue-700"
            >
              <Save className="w-3 h-3 mr-1" />
              Guardar Cambios
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 px-3 py-2 bg-red-100 text-red-800 rounded-md text-xs">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {editableMilestones.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No hay hitos configurados. Añade uno para empezar.
          </div>
        ) : (
          editableMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
            >
              <div className="text-sm font-medium text-gray-800">
                Hito {editableMilestones.indexOf(milestone) + 1}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMilestone(milestone.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
