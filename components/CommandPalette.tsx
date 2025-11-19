import React, { useState, useEffect, useMemo } from 'react';
import { Client, Opportunity, CommercialPartner } from '../types';
import apiClient from '../services/apiClient';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [partners, setPartners] = useState<CommercialPartner[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      apiClient<Client[]>('/clients'),
      apiClient<Opportunity[]>('/opportunities'),
      apiClient<CommercialPartner[]>('/partners'),
    ])
      .then(([clientsResponse, opportunitiesResponse, partnersResponse]) => {
        setClients(clientsResponse);
        setOpportunities(opportunitiesResponse);
        setPartners(partnersResponse);
      })
      .catch(() => {
        setClients([]);
        setOpportunities([]);
        setPartners([]);
      });
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!searchTerm) {
      return { clients: [], opportunities: [], partners: [], actions: [] as { name: string; action: () => void }[] };
    }

    const lowerCaseTerm = searchTerm.toLowerCase();

    const clientMatches = clients.filter((c) =>
      c.name.toLowerCase().includes(lowerCaseTerm),
    );
    const opportunityMatches = opportunities.filter((o) =>
      o.title.toLowerCase().includes(lowerCaseTerm),
    );
    const partnerMatches = partners.filter((p) =>
      p.name.toLowerCase().includes(lowerCaseTerm),
    );

    const actions = [
      { name: 'Nova Oportunidade', action: () => console.log('Abrir form de nova oportunidade') },
      { name: 'Novo Cliente', action: () => console.log('Abrir form de novo cliente') },
    ].filter((a) => a.name.toLowerCase().includes(lowerCaseTerm));

    return { clients: clientMatches, opportunities: opportunityMatches, partners: partnerMatches, actions };
  }, [searchTerm, clients, opportunities, partners]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-20" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Buscar ou ir para..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-500"
            autoFocus
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {searchResults.clients.length > 0 && (
            <div>
              <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Clientes</h3>
              <ul>
                {searchResults.clients.map((client) => (
                  <li key={client.id} className="px-4 py-3 hover:bg-gray-100 cursor-pointer">
                    {client.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {searchResults.opportunities.length > 0 && (
            <div>
              <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Oportunidades</h3>
              <ul>
                {searchResults.opportunities.map((opp) => (
                  <li key={opp.id} className="px-4 py-3 hover:bg-gray-100 cursor-pointer">
                    {opp.title} — {opp.clientName}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {searchResults.partners.length > 0 && (
            <div>
              <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Parceiros</h3>
              <ul>
                {searchResults.partners.map((partner) => (
                  <li key={partner.id} className="px-4 py-3 hover:bg-gray-100 cursor-pointer">
                    {partner.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {searchResults.actions.length > 0 && (
            <div>
              <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Ações</h3>
              <ul>
                {searchResults.actions.map((action) => (
                  <li
                    key={action.name}
                    onClick={() => action.action()}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-blue-600"
                  >
                    {action.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
