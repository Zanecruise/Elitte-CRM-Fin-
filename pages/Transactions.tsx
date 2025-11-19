import React, { useEffect, useState } from 'react';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
  ActivityType,
  ActivityPriority,
  ActivityStatus,
  Client,
} from '../types';
import { TRANSACTION_STATUS_COLORS } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import Card from '../components/Card';
import Chip from '../components/Chip';
import NewTransactionForm from '../components/forms/NewTransactionForm';
import apiClient from '../services/apiClient';

const TransactionIcon: React.FC<{ type: TransactionType }> = ({ type }) => {
  const iconMap = {
    [TransactionType.APLICACAO]: { icon: 'add_card', color: 'text-green-500' },
    [TransactionType.RESGATE]: {
      icon: 'credit_card_off',
      color: 'text-red-500',
    },
    [TransactionType.FEE]: { icon: 'percent', color: 'text-yellow-500' },
    [TransactionType.FATURA]: { icon: 'receipt_long', color: 'text-blue-500' },
  };
  return (
    <span className={`material-symbols-outlined ${iconMap[type].color}`}>
      {iconMap[type].icon}
    </span>
  );
};

const Transactions: React.FC = () => {
  const { showSnackbar, addActivity } = useAppContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [transactionsResponse, clientsResponse] = await Promise.all([
        apiClient<Transaction[]>('/transactions'),
        apiClient<Client[]>('/clients'),
      ]);
      setTransactions(transactionsResponse);
      setClients(clientsResponse);
    } catch (err) {
      setError((err as Error).message);
      showSnackbar('Não foi possível carregar as transações.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createOperationalReminder = async (transaction: Transaction) => {
    if (!transaction.liquidationDate) return;
    const liquidation = new Date(transaction.liquidationDate);
    const reminderDate = new Date(
      liquidation.getTime() - 2 * 24 * 60 * 60 * 1000,
    );

    const activity = {
      title: `Verificar recursos para ${transaction.product.description}`,
      type: ActivityType.OPERACIONAL,
      clientId: transaction.clientId,
      assessor: 'Sistema',
      dueDate: reminderDate.toISOString(),
      priority: ActivityPriority.ALTA,
      status: ActivityStatus.A_FAZER,
      notes: `Lembrar cliente ${transaction.clientName} sobre a liquidação de ${transaction.value?.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })} em ${new Date(transaction.liquidationDate).toLocaleDateString('pt-BR')}.`,
    };

    try {
      await addActivity(activity);
      showSnackbar('Tarefa operacional criada automaticamente!');
    } catch (err) {
      console.error('Falha ao criar lembrete operacional', err);
    }
  };

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const created = await apiClient<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction),
      });
      setTransactions((prev) => [created, ...prev]);
      showSnackbar('Transação adicionada com sucesso!');
      await createOperationalReminder(created);
    } catch (err) {
      showSnackbar((err as Error).message, 'error');
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Transações</h1>
        <button
          onClick={() => setIsNewTransactionModalOpen(true)}
          className="flex items-center justify-center py-2 px-4 bg-[#1E2A38] text-white rounded-md font-semibold text-sm hover:bg-opacity-90 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined mr-2 text-base">add_box</span>
          Nova Transação
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <Chip label="Últimos 7 dias" colorClasses="bg-blue-100 text-blue-800" />
        <Chip label="Últimos 30 dias" colorClasses="bg-gray-200 text-gray-800" />
        <Chip label="Últimos 90 dias" colorClasses="bg-gray-200 text-gray-800" />
      </div>

      {isLoading && (
        <div className="text-center text-gray-500 py-6">Carregando...</div>
      )}
      {error && !isLoading && (
        <div className="text-center text-red-500 py-6">{error}</div>
      )}

      <Card variant="outlined" className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Produto
              </th>
              <th scope="col" className="px-6 py-3">
                Cliente
              </th>
              <th scope="col" className="px-6 py-3">
                Valor Total
              </th>
              <th scope="col" className="px-6 py-3">
                Data Liq.
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <TransactionIcon type={tx.type} />
                    <div className="ml-2">
                      <p className="font-medium text-gray-800">{tx.product.type}</p>
                      <p className="text-xs text-gray-500">
                        {tx.product.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {tx.clientName}
                </td>
                <td className="px-6 py-4">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(tx.value || 0)}
                </td>
                <td className="px-6 py-4">
                  {tx.liquidationDate
                    ? new Date(tx.liquidationDate).toLocaleDateString('pt-BR')
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span
                      className={`h-2 w-2 rounded-full mr-2 ${TRANSACTION_STATUS_COLORS[tx.status].replace('text-', 'bg-')}`}
                    />
                    <span className={TRANSACTION_STATUS_COLORS[tx.status]}>
                      {tx.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {tx.status === TransactionStatus.REQUER_APROVACAO ? (
                    <button
                      onClick={() => showSnackbar('Ação realizada!')}
                      className="font-medium text-blue-600 hover:underline text-xs"
                    >
                      Analisar
                    </button>
                  ) : (
                    <button className="font-medium text-gray-400 text-xs">
                      Detalhes
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <NewTransactionForm
        isOpen={isNewTransactionModalOpen}
        onClose={() => setIsNewTransactionModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        clients={clients}
      />
    </div>
  );
};

export default Transactions;
