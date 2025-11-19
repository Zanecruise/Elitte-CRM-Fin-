import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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
  Activity,
  ActivityType,
  Client,
  Opportunity,
  OpportunityStage,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../types';
import apiClient from '../services/apiClient';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

const ResponsiveGridLayout = WidthProvider(Responsive);

const KpiCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) => (
  <Card className="h-full flex flex-col justify-center">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className={`p-2 rounded-full ${color}`}>
        <span className="material-symbols-outlined text-white">{icon}</span>
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
  </Card>
);

const MainChart: React.FC<{
  data: Array<{ name: string; aplicacoes: number; resgates: number }>;
}> = ({ data }) => (
  <Card className="h-full flex flex-col">
    <h3 className="font-semibold text-gray-800 mb-4 p-4">
      Aplicações vs. Resgates
    </h3>
    <div className="flex-grow">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="aplicacoes" fill="#1E2A38" name="Aplicações" />
          <Bar dataKey="resgates" fill="#E74C3C" name="Resgates" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

const AdvisorRanking: React.FC<{ activities: Activity[] }> = ({ activities }) => {
  const ranking = useMemo(() => {
    const counts = activities.reduce((acc, act) => {
      if (
        act.type === ActivityType.REUNIAO ||
        act.type === ActivityType.LIGACAO
      ) {
        const key = act.assessor || 'Desconhecido';
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [activities]);

  return (
    <Card className="h-full">
      <h3 className="font-semibold text-gray-800 mb-4 p-4">
        Ranking de Assessores
      </h3>
      <ul className="space-y-3 px-4">
        {ranking.map(([name, count], i) => (
          <li key={name} className="flex items-center justify-between">
            <span className="font-medium text-gray-700">
              {i + 1}. {name}
            </span>
            <span className="font-bold text-gray-800">{count} atividades</span>
          </li>
        ))}
        {ranking.length === 0 && (
          <li className="text-sm text-gray-500">Sem atividades registradas.</li>
        )}
      </ul>
    </Card>
  );
};

const defaultLayouts = {
  lg: [
    { i: 'kpi-receita', x: 0, y: 0, w: 1, h: 1 },
    { i: 'kpi-conversao', x: 1, y: 0, w: 1, h: 1 },
    { i: 'kpi-inadimplencia', x: 2, y: 0, w: 1, h: 1 },
    { i: 'kpi-kyc', x: 3, y: 0, w: 1, h: 1 },
    { i: 'main-chart', x: 0, y: 1, w: 3, h: 2 },
    { i: 'ranking', x: 3, y: 1, w: 1, h: 2 },
  ],
};

const Dashboard: React.FC = () => {
  const { showSnackbar, activities } = useAppContext();
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState(() =>
    loadFromLocalStorage('dashboardLayouts', defaultLayouts),
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient<Transaction[]>('/transactions'),
      apiClient<Opportunity[]>('/opportunities'),
      apiClient<Client[]>('/clients'),
    ])
      .then(([transactionsResponse, opportunitiesResponse, clientsResponse]) => {
        setTransactions(transactionsResponse);
        setOpportunities(opportunitiesResponse);
        setClients(clientsResponse);
      })
      .catch(() => showSnackbar('Falha ao carregar dados do dashboard.', 'error'));
  }, [showSnackbar]);

  const revenue30Days = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return transactions
      .filter((tx) => new Date(tx.timestamp).getTime() >= cutoff)
      .reduce((sum, tx) => sum + (tx.value || 0), 0);
  }, [transactions]);

  const conversionRate = useMemo(() => {
    if (opportunities.length === 0) return 0;
    const won = opportunities.filter(
      (opp) => opp.stage === OpportunityStage.GANHO,
    ).length;
    return Math.round((won / opportunities.length) * 100);
  }, [opportunities]);

  const pendingAmount = useMemo(() => {
    return transactions
      .filter((tx) => tx.status === TransactionStatus.REQUER_APROVACAO)
      .reduce((sum, tx) => sum + (tx.value || 0), 0);
  }, [transactions]);

  const pendingKyc = useMemo(() => {
    return clients.filter((client) =>
      ['Pendente', 'Atrasado'].includes(client.complianceStatus),
    ).length;
  }, [clients]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return date;
    });
    return months.map((monthDate) => {
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      const label = monthDate.toLocaleString('pt-BR', { month: 'short' });
      const monthTransactions = transactions.filter((tx) => {
        const txDate = new Date(tx.timestamp);
        return (
          txDate.getFullYear() === monthDate.getFullYear() &&
          txDate.getMonth() === monthDate.getMonth()
        );
      });
      return {
        name: label,
        aplicacoes: monthTransactions
          .filter((tx) => tx.type === TransactionType.APLICACAO)
          .reduce((sum, tx) => sum + (tx.value || 0), 0),
        resgates: monthTransactions
          .filter((tx) => tx.type === TransactionType.RESGATE)
          .reduce((sum, tx) => sum + (tx.value || 0), 0),
      };
    });
  }, [transactions]);

  const onLayoutChange = (_: any, newLayouts: any) => {
    saveToLocalStorage('dashboardLayouts', newLayouts);
    setLayouts(newLayouts);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`py-2 px-4 rounded-md font-semibold text-sm ${
            isEditMode ? 'bg-green-500 text-white' : 'bg-gray-200'
          }`}
        >
          {isEditMode ? 'Salvar Layout' : 'Personalizar'}
        </button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={150}
        onLayoutChange={onLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
      >
        <div key="kpi-receita">
          <KpiCard
            title="Receita Projetada (30d)"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(revenue30Days)}
            icon="trending_up"
            color="bg-blue-500"
          />
        </div>
        <div key="kpi-conversao">
          <KpiCard
            title="Conversão Pipeline"
            value={`${conversionRate}%`}
            icon="percent"
            color="bg-orange-500"
          />
        </div>
        <div key="kpi-inadimplencia">
          <KpiCard
            title="Pendências Financeiras"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(pendingAmount)}
            icon="money_off"
            color="bg-red-500"
          />
        </div>
        <div key="kpi-kyc">
          <KpiCard
            title="Pendências KYC"
            value={`${pendingKyc}`}
            icon="shield_question"
            color="bg-yellow-500"
          />
        </div>
        <div key="main-chart">
          <MainChart data={chartData} />
        </div>
        <div key="ranking">
          <AdvisorRanking activities={activities} />
        </div>
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;
