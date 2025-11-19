import React, { useEffect, useMemo, useState } from 'react';
import { Client, ComplianceStatus, RiskProfile, CommercialPartner } from '../types';
import { RISK_COLORS, COMPLIANCE_COLORS } from '../constants';
import Card from '../components/Card';
import Chip from '../components/Chip';
import { ClientDetail } from '../components/ClientDetail';
import NewClientForm from '../components/forms/NewClientForm';
import { useAppContext } from '../contexts/AppContext';
import apiClient from '../services/apiClient';

const ClientCard: React.FC<{ client: Client; onClick: () => void }> = ({
  client,
  onClick,
}) => (
  <Card
    onClick={onClick}
    className="hover:border-[#1E2A38] border-transparent border-2 cursor-pointer"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="font-bold text-lg text-[#1E2A38]">{client.name}</p>
        <p className="text-sm text-gray-500">
          {client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
        </p>
      </div>
      <Chip
        label={client.complianceStatus as ComplianceStatus}
        colorClasses={COMPLIANCE_COLORS[client.complianceStatus as ComplianceStatus]}
      />
    </div>
    <div className="mt-4 flex justify-between items-end">
      <div>
        <p className="text-xs text-gray-500">Perfil de Risco</p>
        <Chip
          label={client.financialProfile?.investorProfile || RiskProfile.MODERADO}
          colorClasses={
            RISK_COLORS[
              (client.financialProfile?.investorProfile || RiskProfile.MODERADO) as RiskProfile
            ]
          }
        />
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">Score</p>
        <p className="font-semibold text-gray-800">
          {(client as any).creditScore ?? '-'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">Valor em Carteira</p>
        <p className="font-semibold text-gray-800">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(client.walletValue || 0)}
        </p>
      </div>
    </div>
  </Card>
);

const Clients: React.FC = () => {
  const { showSnackbar, addNotification } = useAppContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<CommercialPartner[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    risk: 'all',
    compliance: 'all',
    type: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clientsResponse, partnersResponse] = await Promise.all([
        apiClient<Client[]>('/clients'),
        apiClient<CommercialPartner[]>('/partners'),
      ]);
      setClients(clientsResponse);
      setPartners(partnersResponse);
    } catch (err) {
      setError((err as Error).message);
      showSnackbar('Falha ao carregar dados de clientes.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async (
    clientData: Omit<Client, 'id' | 'lastActivity' | 'interactionHistory' | 'reminders'>,
  ) => {
    try {
      const newClient = await apiClient<Client>('/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
      });
      setClients((prev) => [newClient, ...prev]);
      showSnackbar('Cliente adicionado com sucesso!');
    } catch (err) {
      showSnackbar((err as Error).message, 'error');
      throw err;
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const typeMatch = filters.type === 'all' || client.type === filters.type;
      const riskMatch =
        filters.risk === 'all' ||
        client.financialProfile?.investorProfile === filters.risk;
      const complianceMatch =
        filters.compliance === 'all' ||
        client.complianceStatus === filters.compliance;
      return typeMatch && riskMatch && complianceMatch;
    });
  }, [clients, filters]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => setIsNewClientModalOpen(true)}
          className="flex items-center justify-center py-2 px-4 bg-[#1E2A38] text-white rounded-md font-semibold text-sm hover:bg-opacity-90 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined mr-2 text-base">add</span>
          Novo Cliente
        </button>
      </div>

      <Card variant="outlined" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <h3 className="text-md font-semibold text-gray-700 col-span-1">
            Filtros:
          </h3>

          <div className="col-span-1">
            <label htmlFor="risk-filter" className="sr-only">
              Perfil de Risco
            </label>
            <select
              id="risk-filter"
              name="risk"
              value={filters.risk}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
            >
              <option value="all">Todo Perfil de Risco</option>
              {Object.values(RiskProfile).map((rp) => (
                <option key={rp} value={rp}>
                  {rp}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label htmlFor="compliance-filter" className="sr-only">
              Status de Compliance
            </label>
            <select
              id="compliance-filter"
              name="compliance"
              value={filters.compliance}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
            >
              <option value="all">Todo Status Compliance</option>
              {Object.values(ComplianceStatus).map((cs) => (
                <option key={cs} value={cs}>
                  {cs}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label htmlFor="type-filter" className="sr-only">
              Tipo de Cliente
            </label>
            <select
              id="type-filter"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#1E2A38] focus:ring-[#1E2A38] sm:text-sm"
            >
              <option value="all">Todo Tipo de Cliente</option>
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>
        </div>
      </Card>

      {isLoading && (
        <div className="text-center text-gray-500 py-10">Carregando...</div>
      )}

      {error && !isLoading && (
        <div className="text-center text-red-500 py-4">{error}</div>
      )}

      {!isLoading && filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => setSelectedClient(client)}
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300">
              search_off
            </span>
            <h3 className="mt-2 text-lg font-medium text-gray-800">
              Nenhum cliente encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar seus filtros para encontrar o que procura.
            </p>
          </div>
        )
      )}

      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          showSnackbar={showSnackbar}
          addNotification={addNotification}
        />
      )}

      <NewClientForm
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onAddClient={handleAddClient}
        partners={partners}
      />
    </div>
  );
};

export default Clients;
