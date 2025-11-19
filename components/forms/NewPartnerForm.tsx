import React, { useState } from 'react';
import { CommercialPartner, CommissionType } from '../../types';
import Modal from '../Modal';

interface NewPartnerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPartner: (
    partner: Omit<
      CommercialPartner,
      'id' | 'indicatedClientsCount' | 'totalVolume' | 'commissionHistory'
    >,
  ) => Promise<void> | void;
}

const NewPartnerForm: React.FC<NewPartnerFormProps> = ({
  isOpen,
  onClose,
  onAddPartner,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [responsible, setResponsible] = useState('');
  const [commissionType, setCommissionType] = useState(CommissionType.PERCENTAGE);
  const [commissionValue, setCommissionValue] = useState(20);
  const [contractType, setContractType] = useState('Contrato Padrão');
  const [startDate, setStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddPartner({
        name,
        phone,
        address: null,
        responsiblePersons: [
          { name: responsible, role: 'Principal', email: '', phone: '' },
        ],
        contract: {
          type: contractType,
          startDate,
          commissionType,
          commissionValue,
        },
      });
      onClose();
      setName('');
      setPhone('');
      setResponsible('');
      setCommissionValue(20);
      setStartDate('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Parceiro Comercial">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome do Parceiro"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-style"
            required
          />
          <input
            type="tel"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-style"
          />
          <input
            type="text"
            placeholder="Responsável"
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            className="input-style md:col-span-2"
          />

          <h3 className="text-lg font-semibold text-gray-700 md:col-span-2 mt-4">
            Detalhes do Contrato
          </h3>
          <input
            type="text"
            placeholder="Tipo de Contrato"
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="input-style"
          />
          <input
            type="date"
            aria-label="Data de Início"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-style"
          />
          <select
            aria-label="Tipo de Comissão"
            value={commissionType}
            onChange={(e) =>
              setCommissionType(e.target.value as CommissionType)
            }
            className="input-style"
          >
            {Object.values(CommissionType).map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Valor da Comissão"
            value={commissionValue}
            onChange={(e) => setCommissionValue(Number(e.target.value))}
            className="input-style"
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

export default NewPartnerForm;
