import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../components/Card';
import {
  Client,
  RiskProfile,
  ProductType,
  ActivityType,
  Transaction,
  Report as ReportType,
} from '../types';
import { useAppContext } from '../contexts/AppContext';
import apiClient from '../services/apiClient';

const Reports: React.FC = () => {
  const { showSnackbar, activities } = useAppContext();
  const [riskProfileFilter, setRiskProfileFilter] = useState<
    RiskProfile | 'todos'
  >('todos');
  const [assetFilter, setAssetFilter] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<
    ProductType | 'todos'
  >('todos');
  const [advisorFilter, setAdvisorFilter] = useState('todos');
  const [activityAdvisorFilter, setActivityAdvisorFilter] = useState('todos');

  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient<Client[]>('/clients'),
      apiClient<Transaction[]>('/transactions'),
    ])
      .then(([clientsResponse, transactionsResponse]) => {
        setClients(clientsResponse);
        setTransactions(transactionsResponse);
      })
      .catch(() => showSnackbar('Falha ao carregar dados de relatórios.', 'error'));
  }, [showSnackbar]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const riskProfileMatch =
        riskProfileFilter === 'todos' ||
        client.financialProfile?.investorProfile === riskProfileFilter;
      const assetMatch =
        assetFilter === '' ||
        client.financialProfile?.assetPreferences?.some((pref) =>
          pref.toLowerCase().includes(assetFilter.toLowerCase()),
        );
      return riskProfileMatch && assetMatch;
    });
  }, [clients, riskProfileFilter, assetFilter]);

  const assetReportData = useMemo(() => {
    const filteredTransactions = transactions.filter((tx) => {
      const productMatch =
        productTypeFilter === 'todos' || tx.product.type === productTypeFilter;
      // Ainda não temos assessor na transação, então ignoramos advisorFilter.
      return productMatch;
    });

    const byClient = filteredTransactions.reduce((acc, tx) => {
      acc[tx.clientName] = (acc[tx.clientName] || 0) + (tx.value || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byClient).map(([clientName, totalValue]) => ({
      clientName,
      totalValue,
    }));
  }, [transactions, productTypeFilter, advisorFilter]);

  const activityReportData = useMemo(() => {
    const filteredActivities = activities.filter((act) => {
      const advisorMatch =
        activityAdvisorFilter === 'todos' || act.assessor === activityAdvisorFilter;
      return (
        advisorMatch &&
        (act.type === ActivityType.REUNIAO || act.type === ActivityType.LIGACAO)
      );
    });

    const byAssessor = filteredActivities.reduce((acc, act) => {
      const assessor = act.assessor || 'Desconhecido';
      if (!acc[assessor]) {
        acc[assessor] = { name: assessor, reunioes: 0, ligacoes: 0 };
      }
      if (act.type === ActivityType.REUNIAO) acc[assessor].reunioes++;
      if (act.type === ActivityType.LIGACAO) acc[assessor].ligacoes++;
      return acc;
    }, {} as Record<string, { name: string; reunioes: number; ligacoes: number }>);

    return Object.values(byAssessor);
  }, [activities, activityAdvisorFilter]);

  const uniqueAdvisors = useMemo(() => {
    const advisors = new Set<string>();
    clients.forEach((client) =>
      client.advisors?.forEach((advisor) => advisors.add(advisor)),
    );
    return Array.from(advisors);
  }, [clients]);

  const generatedReports: ReportType[] = useMemo(() => {
    return clients.slice(0, 5).map((client) => ({
      id: client.id,
      clientId: client.id,
      clientName: client.name,
      period: new Date().toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
      type: 'Performance',
      fileUrl: '#',
    }));
  }, [clients]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Relatório de Perfil de Cliente
        </h2>
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <label
                  htmlFor="riskProfile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Perfil de Risco
                </label>
                <select
                  id="riskProfile"
                  value={riskProfileFilter}
                  onChange={(e) =>
                    setRiskProfileFilter(e.target.value as RiskProfile | 'todos')
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="todos">Todos</option>
                  {Object.values(RiskProfile).map((rp) => (
                    <option key={rp} value={rp}>
                      {rp}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="assetPreference"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Preferência de Ativo
                </label>
                <input
                  id="assetPreference"
                  type="text"
                  placeholder="Ex: Ações BR"
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perfil de Risco
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preferências
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client.financialProfile?.investorProfile}
                      </td>
                      <td className="px-6 py-4">
                        {client.financialProfile?.assetPreferences?.join(', ')}
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td
                        className="px-6 py-4 text-sm text-gray-500"
                        colSpan={3}
                      >
                        Nenhum cliente com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Relatório de Ativos e Produtos
        </h2>
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <label
                  htmlFor="productType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tipo de Produto
                </label>
                <select
                  id="productType"
                  value={productTypeFilter}
                  onChange={(e) =>
                    setProductTypeFilter(e.target.value as ProductType | 'todos')
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="todos">Todos</option>
                  {Object.values(ProductType).map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Investido
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assetReportData.map((row) => (
                    <tr key={row.clientName}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(row.totalValue)}
                      </td>
                    </tr>
                  ))}
                  {assetReportData.length === 0 && (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500" colSpan={2}>
                        Nenhuma transação encontrada com os filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Volume por cliente
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assetReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="clientName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalValue" fill="#1E2A38" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Atividades por Assessor
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reunioes" fill="#1E2A38" name="Reuniões" />
                <Bar dataKey="ligacoes" fill="#E67E22" name="Ligações" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Relatórios Exportados
        </h2>
        <Card>
          <div className="p-6 space-y-4">
            {generatedReports.map((report) => (
              <div
                key={report.id}
                className="flex justify-between items-center border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-gray-800">{report.clientName}</p>
                  <p className="text-sm text-gray-500">
                    {report.type} — {report.period}
                  </p>
                </div>
                <button
                  onClick={() => showSnackbar('Download iniciado!')}
                  className="text-sm font-semibold text-[#1E2A38]"
                >
                  Baixar
                </button>
              </div>
            ))}
            {generatedReports.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum relatório disponível.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
