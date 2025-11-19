import React, { useState } from 'react';
import {
  Activity,
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  Client,
} from '../../types';
import Modal from '../Modal';

interface NewActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (activity: Omit<Activity, 'id'>) => Promise<void> | void;
  clients: Client[];
}

const NewActivityForm: React.FC<NewActivityFormProps> = ({
  isOpen,
  onClose,
  onAddActivity,
  clients,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: ActivityType.REUNIAO,
    clientId: '',
    assessor: '',
    guests: '',
    location: '',
    dueDate: '',
    priority: ActivityPriority.MEDIA,
    status: ActivityStatus.A_FAZER,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateGoogleCalendarLink = () => {
    const client = clients.find((c) => c.id === formData.clientId);
    const guestEmails = [client?.email, ...formData.guests.split(',').map((g) => g.trim())]
      .filter(Boolean)
      .join(',');
    const start = new Date(formData.dueDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const formatDate = (date: Date) =>
      date.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', formData.title);
    url.searchParams.set('dates', `${formatDate(start)}/${formatDate(end)}`);
    url.searchParams.set('details', formData.notes);
    url.searchParams.set('location', formData.location);
    url.searchParams.set('add', guestEmails);

    window.open(url.toString(), '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload: Omit<Activity, 'id'> = {
      ...formData,
      guests: formData.guests
        .split(',')
        .map((guest) => guest.trim())
        .filter(Boolean),
    };

    try {
      await onAddActivity(payload);
      onClose();
      setFormData({
        title: '',
        type: ActivityType.REUNIAO,
        clientId: '',
        assessor: '',
        guests: '',
        location: '',
        dueDate: '',
        priority: ActivityPriority.MEDIA,
        status: ActivityStatus.A_FAZER,
        notes: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Atividade">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="title"
            placeholder="Título da Atividade"
            value={formData.title}
            onChange={handleInputChange}
            className="input-style md:col-span-2"
            required
          />
          <select
            name="type"
            aria-label="Tipo de Atividade"
            value={formData.type}
            onChange={handleInputChange}
            className="input-style"
          >
            {Object.values(ActivityType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            name="clientId"
            aria-label="Cliente"
            value={formData.clientId}
            onChange={handleInputChange}
            className="input-style"
          >
            <option value="">Nenhum Cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="assessor"
            placeholder="Assessor Responsável"
            value={formData.assessor}
            onChange={handleInputChange}
            className="input-style"
            required
          />
          <input
            type="datetime-local"
            name="dueDate"
            aria-label="Data e Hora"
            value={formData.dueDate}
            onChange={handleInputChange}
            className="input-style"
            required
          />
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="input-style"
          >
            {Object.values(ActivityPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="input-style"
          >
            {Object.values(ActivityStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="guests"
            placeholder="Convidados (e-mails, separados por vírgula)"
            value={formData.guests}
            onChange={handleInputChange}
            className="input-style md:col-span-2"
          />
          <input
            type="text"
            name="location"
            placeholder="Local (URL ou endereço)"
            value={formData.location}
            onChange={handleInputChange}
            className="input-style md:col-span-2"
          />
          <textarea
            name="notes"
            placeholder="Notas"
            value={formData.notes}
            onChange={handleInputChange}
            className="input-style md:col-span-2"
          />
        </div>
        <div className="mt-6 flex justify-between items-center">
          <button
            type="button"
            onClick={generateGoogleCalendarLink}
            className="flex items-center gap-2 py-2 px-4 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600"
          >
            <span className="material-symbols-outlined">calendar_add_on</span>
            Adicionar ao Google Agenda
          </button>
          <div className="flex gap-3">
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
              {isSubmitting ? 'Salvando...' : 'Salvar Atividade'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewActivityForm;
