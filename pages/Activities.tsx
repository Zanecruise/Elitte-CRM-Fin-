import React, { useEffect, useState } from 'react';
import { Activity, Client } from '../types';
import Card from '../components/Card';
import NewActivityForm from '../components/forms/NewActivityForm';
import { useAppContext } from '../contexts/AppContext';
import apiClient from '../services/apiClient';

const Activities: React.FC = () => {
    const { activities, addActivity, showSnackbar } = useAppContext();
    const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        apiClient<Client[]>('/clients')
          .then(setClients)
          .catch(() => setClients([]));
    }, []);

    const handleAddActivity = async (activity: Omit<Activity, 'id'>) => {
        await addActivity(activity);
        setIsNewActivityModalOpen(false);
        showSnackbar('Atividade adicionada com sucesso!', 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Atividades</h1>
                <button onClick={() => setIsNewActivityModalOpen(true)} className="flex items-center justify-center py-2 px-4 bg-[#1E2A38] text-white rounded-md font-semibold text-sm hover:bg-opacity-90 transition-all shadow-sm">
                    <span className="material-symbols-outlined mr-2 text-base">add_box</span>
                    Nova Atividade
                </button>
            </div>
            
            <Card>
              <div className="p-4">
                <ul className="space-y-3">
                  {activities.length > 0 ? (
                    activities.map(activity => (
                      <li key={activity.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{activity.title} <span className="text-sm font-normal text-gray-500">({activity.type})</span></p>
                          <p className="text-xs text-gray-600">Vencimento: {new Date(activity.dueDate).toLocaleString('pt-BR')}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-700">{activity.status}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-center text-gray-500 py-4">Nenhuma atividade agendada.</li>
                  )}
                </ul>
              </div>
            </Card>

            <NewActivityForm
              isOpen={isNewActivityModalOpen}
              onClose={() => setIsNewActivityModalOpen(false)}
              onAddActivity={handleAddActivity}
              clients={clients}
            />
        </div>
    );
};

export default Activities;
