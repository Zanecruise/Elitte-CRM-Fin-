import React, { useState } from 'react';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  ProductType,
  Client,
} from '../../types';
import Modal from '../Modal';

interface NewTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void> | void;
  clients: Client[];
}

const NewTransactionForm: React.FC<NewTransactionFormProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  clients,
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    type: TransactionType.APLICACAO,
    productType: ProductType.FUNDO_INVESTIMENTO,
    productDescription: '',
    value: 0,
    unitValue: 0,
    quantity: 0,
    reservationDate: '',
    liquidationDate: '',
    status: TransactionStatus.PENDENTE,
    institution: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find((c) => c.id === formData.clientId);
    if (!selectedClient) return;

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        clientId: formData.clientId,
        clientName: selectedClient.name,
        type: formData.type,
        product: {
          type: formData.productType,
          description: formData.productDescription,
        },
        value: Number(formData.value),
        unitValue: Number(formData.unitValue),
        quantity: Number(formData.quantity),
        reservationDate: formData.reservationDate || undefined,
        liquidationDate: formData.liquidationDate || undefined,
        timestamp: new Date().toISOString(),
        status: formData.status,
        institution: formData.institution,
      });
      onClose();
      setFormData({
        clientId: '',
        type: TransactionType.APLICACAO,
        productType: ProductType.FUNDO_INVESTIMENTO,
        productDescription: '',
        value: 0,
        unitValue: 0,
        quantity: 0,
        reservationDate: '',
        liquidationDate: '',
        status: TransactionStatus.PENDENTE,
        institution: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            name="clientId"
            aria-label="Cliente"
            value={formData.clientId}
            onChange={handleInputChange}
            className="input-style md:col-span-2"
            required
          >
            <option value="">Selecione um Cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <h3 className="text-lg font-semibold text-gray-700 md:col-span-2 mt-2">
            Detalhes do Produto
          </h3>
          <select
            name="productType"
            aria-label="Tipo de Produto"
            value={formData.productType}
            onChange={handleInputChange}
            className="input-style"
          >
            {Object.values(ProductType).map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="productDescription"
            placeholder="Descrição do Ativo"
            value={formData.productDescription}
            onChange={handleInputChange}
            className="input-style"
            required
          />

          <h3 className="text-lg font-semibold text-gray-700 md:col-span-2 mt-2">
            Valores
          </h3>
          <input
            type="number"
            name="value"
            placeholder="Valor Total"
            value={formData.value}
            onChange={handleInputChange}
            className="input-style"
          />
          <input
            type="number"
            name="unitValue"
            placeholder="Valor Unitário"
            value={formData.unitValue}
            onChange={handleInputChange}
            className="input-style"
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantidade"
            value={formData.quantity}
            onChange={handleInputChange}
            className="input-style"
          />

          <h3 className="text-lg font-semibold text-gray-700 md:col-span-2 mt-2">
            Datas e Status
          </h3>
          <div>
            <label htmlFor="reservationDate" className="text-sm">
              Data de Reserva
            </label>
            <input
              id="reservationDate"
              type="date"
              name="reservationDate"
              aria-label="Data de Reserva"
              value={formData.reservationDate}
              onChange={handleInputChange}
              className="input-style"
            />
          </div>
          <div>
            <label htmlFor="liquidationDate" className="text-sm">
              Data de Liquidação
            </label>
            <input
              id="liquidationDate"
              type="date"
              name="liquidationDate"
              aria-label="Data de Liquidação"
              value={formData.liquidationDate}
              onChange={handleInputChange}
              className="input-style"
            />
          </div>
          <select
            name="status"
            aria-label="Status da Transação"
            value={formData.status}
            onChange={handleInputChange}
            className="input-style"
          >
            {Object.values(TransactionStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="institution"
            placeholder="Instituição"
            value={formData.institution}
            onChange={handleInputChange}
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

export default NewTransactionForm;
