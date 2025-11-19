import React, { useEffect, useMemo, useState } from 'react';
import {
  Opportunity,
  OpportunityStage,
  ALL_OPPORTUNITY_STAGES,
  ActivityType,
  ActivityPriority,
  ActivityStatus,
  Client,
} from '../types';
import { PROBABILITY_COLORS } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import Modal from '../components/Modal';
import NewOpportunityForm from '../components/forms/NewOpportunityForm';
import apiClient from '../services/apiClient';

const KanbanCard: React.FC<{
  opportunity: Opportunity;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, opp: Opportunity) => void;
}> = ({ opportunity, onDragStart }) => {
  const clientEmail = 'cliente@email.com';
  const meetingTitle = `Reunião: ${opportunity.title}`;

  const handleScheduleMeeting = () => {
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      meetingTitle,
    )}&details=${encodeURIComponent(
      `Discussão sobre a oportunidade: ${opportunity.title}`,
    )}`;
    window.open(googleCalendarUrl, '_blank');
  };

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(
      opportunity.title,
    )}`;
    window.location.href = mailtoLink;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, opportunity)}
      className="bg-white p-3 rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing mb-3"
    >
      <div className="flex justify-between items-start">
        <p className="font-semibold text-sm text-gray-800 break-words">
          {opportunity.title}
        </p>
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${PROBABILITY_COLORS(opportunity.probability)}`}
          title={`Probabilidade: ${opportunity.probability}%`}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{opportunity.clientName}</p>
      <div className="flex justify-between items-end mt-3">
        <p className="text-sm font-bold text-[#1E2A38]">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(opportunity.estimatedValue)}
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleScheduleMeeting}
            title="Agendar Reunião"
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-gray-600">
              calendar_today
            </span>
          </button>
          <button
            onClick={handleSendEmail}
            title="Enviar E-mail"
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-gray-600">
              email
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{
  stage: OpportunityStage;
  opportunities: Opportunity[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, opp: Opportunity) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, stage: OpportunityStage) => void;
  isOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
}> = ({ stage, opportunities, onDragStart, onDrop, isOver, ...dragHandlers }) => (
  <div
    className="w-72 bg-gray-100 rounded-lg p-3 flex-shrink-0"
    onDrop={(e) => onDrop(e, stage)}
    {...dragHandlers}
  >
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-semibold text-sm text-gray-700">
        {stage} ({opportunities.length})
      </h3>
    </div>
    <div
      className={`min-h-[200px] rounded-lg transition-colors ${
        isOver ? 'bg-blue-100' : ''
      }`}
    >
      {opportunities.map((opp) => (
        <KanbanCard key={opp.id} opportunity={opp} onDragStart={onDragStart} />
      ))}
    </div>
  </div>
);

const Opportunities: React.FC = () => {
  const { showSnackbar, addActivity } = useAppContext();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [draggedOpp, setDraggedOpp] = useState<Opportunity | null>(null);
  const [dragOverStage, setDragOverStage] = useState<OpportunityStage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewOpportunityModalOpen, setIsNewOpportunityModalOpen] = useState(false);
  const [moveDetails, setMoveDetails] = useState<{
    opp: Opportunity;
    newStage: OpportunityStage;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [oppsResponse, clientsResponse] = await Promise.all([
        apiClient<Opportunity[]>('/opportunities'),
        apiClient<Client[]>('/clients'),
      ]);
      setOpportunities(oppsResponse);
      setClients(clientsResponse);
    } catch (err) {
      setError((err as Error).message);
      showSnackbar('Não foi possível carregar as oportunidades.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, opp: Opportunity) => {
    setDraggedOpp(opp);
    e.dataTransfer.setData('text/plain', opp.id);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    stage: OpportunityStage,
  ) => {
    e.preventDefault();
    if (draggedOpp && draggedOpp.stage !== stage) {
      setMoveDetails({ opp: draggedOpp, newStage: stage });
      setIsModalOpen(true);
    }
    setDraggedOpp(null);
    setDragOverStage(null);
  };

  const triggerOnboardingWorkflow = async (opp: Opportunity) => {
    const today = new Date();
    const activities = [
      {
        title: `Coletar Documentos KYC - ${opp.clientName}`,
        type: ActivityType.OPERACIONAL,
        clientId: opp.clientId,
        assessor: opp.responsible,
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: ActivityPriority.ALTA,
        status: ActivityStatus.A_FAZER,
        notes: `Início do processo de onboarding para a oportunidade: ${opp.title}`,
      },
      {
        title: `Agendar Reunião de Boas-Vindas - ${opp.clientName}`,
        type: ActivityType.REUNIAO,
        clientId: opp.clientId,
        assessor: opp.responsible,
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        priority: ActivityPriority.MEDIA,
        status: ActivityStatus.A_FAZER,
      },
      {
        title: `Preparar plano de alocação inicial - ${opp.clientName}`,
        type: ActivityType.OPERACIONAL,
        clientId: opp.clientId,
        assessor: opp.responsible,
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: ActivityPriority.ALTA,
        status: ActivityStatus.A_FAZER,
      },
    ];

    for (const activity of activities) {
      try {
        await addActivity(activity);
      } catch (err) {
        console.error('Falha ao criar atividade de onboarding', err);
      }
    }
    showSnackbar(
      `Workflow de onboarding criado! ${activities.length} atividades foram geradas.`,
      'success',
    );
  };

  const handleConfirmMove = async () => {
    if (!moveDetails) return;
    try {
      const updated = await apiClient<Opportunity>(
        `/opportunities/${moveDetails.opp.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ stage: moveDetails.newStage }),
        },
      );
      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === updated.id ? updated : opp)),
      );
      if (moveDetails.newStage === OpportunityStage.GANHO) {
        await triggerOnboardingWorkflow(updated);
      }
      showSnackbar(`Oportunidade movida para ${moveDetails.newStage}!`, 'success');
    } catch (err) {
      showSnackbar((err as Error).message, 'error');
    } finally {
      setIsModalOpen(false);
      setMoveDetails(null);
    }
  };

  const handleAddOpportunity = async (opportunity: Omit<Opportunity, 'id'>) => {
    try {
      const created = await apiClient<Opportunity>('/opportunities', {
        method: 'POST',
        body: JSON.stringify(opportunity),
      });
      setOpportunities((prev) => [created, ...prev]);
      showSnackbar('Oportunidade adicionada com sucesso!');
    } catch (err) {
      showSnackbar((err as Error).message, 'error');
      throw err;
    }
  };

  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<OpportunityStage, Opportunity[]> = {} as Record<
      OpportunityStage,
      Opportunity[]
    >;
    ALL_OPPORTUNITY_STAGES.forEach((stage) => {
      grouped[stage] = [];
    });
    opportunities.forEach((opp) => {
      if (grouped[opp.stage]) {
        grouped[opp.stage].push(opp);
      }
    });
    return grouped;
  }, [opportunities]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-1">
        <h1 className="text-2xl font-bold text-gray-800">Funil de Oportunidades</h1>
        <button
          onClick={() => setIsNewOpportunityModalOpen(true)}
          className="flex items-center justify-center py-2 px-4 bg-[#1E2A38] text-white rounded-md font-semibold text-sm hover:bg-opacity-90 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined mr-2 text-base">add</span>
          Nova Oportunidade
        </button>
      </div>

      {isLoading && (
        <div className="text-center text-gray-500 py-6">Carregando...</div>
      )}
      {error && !isLoading && (
        <div className="text-center text-red-500 py-6">{error}</div>
      )}

      <div className="flex-grow overflow-x-auto pb-4">
        <div className="flex space-x-4">
          {ALL_OPPORTUNITY_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              opportunities={opportunitiesByStage[stage] || []}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              isOver={dragOverStage === stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => setDragOverStage(stage)}
              onDragLeave={() => setDragOverStage(null)}
            />
          ))}
        </div>
      </div>

      {isModalOpen && moveDetails && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Mover para ${moveDetails.newStage}?`}
        >
          <p>
            Você tem certeza que deseja mover a oportunidade "
            {moveDetails.opp.title}" para "{moveDetails.newStage}"?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Esta ação é final e indica o resultado da negociação.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmMove}
              className="py-2 px-4 bg-[#1E2A38] text-white rounded-md font-semibold hover:bg-opacity-90"
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}

      <NewOpportunityForm
        isOpen={isNewOpportunityModalOpen}
        onClose={() => setIsNewOpportunityModalOpen(false)}
        onAddOpportunity={handleAddOpportunity}
        clients={clients}
      />
    </div>
  );
};

export default Opportunities;
