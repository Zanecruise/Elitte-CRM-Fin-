import React, { useState } from 'react';
import { Opportunity, OpportunityStage, Client } from '../../types';
import Modal from '../Modal';

interface NewOpportunityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOpportunity: (opportunity: Omit<Opportunity, 'id'>) => Promise<void> | void;
  clients: Client[];
}

const NewOpportunityForm: React.FC<NewOpportunityFormProps> = ({
  isOpen,
  onClose,
  onAddOpportunity,
  clients,
}) => {
  const [formState, setFormState] = useState({
    title: '',
    clientId: '',
    estimatedValue: 0,
    stage: OpportunityStage.PESQUISA,
    probability: 0,
    expectedCloseDate: '',
    responsible: '',
    nextAction: '',
    source: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]:
        name === 'estimatedValue' || name === 'probability'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.clientId) return;
    const client = clients.find((c) => c.id === formState.clientId);
    if (!client) return;

    const payload: Omit<Opportunity, 'id'> = {
      ...formState,
      clientName: client.name,
      clientId: formState.clientId,
    };

    setIsSubmitting(true);
    try {
      await onAddOpportunity(payload);
      onClose();
      setFormState({
        title: '',
        clientId: '',
        estimatedValue: 0,
        stage: OpportunityStage.PESQUISA,
        probability: 0,
        expectedCloseDate: '',
        responsible: '',
        nextAction: '',
        source: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Oportunidade">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="title"
            placeholder="Título"
            value={formState.title}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
            required
          />
          <select
            name="clientId"
            value={formState.clientId}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
            required
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="estimatedValue"
            placeholder="Valor Estimado"
            value={formState.estimatedValue}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
          />
          <select
            name="stage"
            value={formState.stage}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
          >
            {Object.values(OpportunityStage).map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="probability"
            placeholder="Probabilidade (%)"
            value={formState.probability}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
          />
          <input
            type="date"
            name="expectedCloseDate"
            value={formState.expectedCloseDate}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
          />
          <input
            type="text"
            name="responsible"
            placeholder="Responsável"
            value={formState.responsible}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
          />
          <input
            type="text"
            name="nextAction"
            placeholder="Próxima Ação"
            value={formState.nextAction}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
          />
          <input
            type="text"
            name="source"
            placeholder="Fonte"
            value={formState.source}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 bg-[#1E2A38] text-white rounded-md font-semibold hover:bg-opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewOpportunityForm;
