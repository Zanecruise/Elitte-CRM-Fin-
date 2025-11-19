import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Activity, Notification } from '../types';
import Snackbar from '../components/Snackbar';
import apiClient from '../services/apiClient';

interface AppContextType {
  activities: Activity[];
  notifications: Notification[];
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<Activity>;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  showSnackbar: (message: string, type?: 'success' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [snackbar, setSnackbar] = useState<{ message: string, type: 'success'|'error' } | null>(null);

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);
  };

  useEffect(() => {
    apiClient<Activity[]>('/activities')
      .then(setActivities)
      .catch(() => setActivities([]));
  }, []);

  const addActivity = async (newActivity: Omit<Activity, 'id'>) => {
    const created = await apiClient<Activity>('/activities', {
      method: 'POST',
      body: JSON.stringify(newActivity),
    });
    setActivities(prev => [created, ...prev]);
    return created;
  };

  const addNotification = (newNotification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const notificationWithId: Notification = { 
      ...newNotification, 
      id: `notif_${Date.now()}`,
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notificationWithId, ...prev]);
  };

  return (
    <AppContext.Provider value={{ activities, notifications, addActivity, addNotification, showSnackbar }}>
      {children}
      {snackbar && <Snackbar message={snackbar.message} type={snackbar.type} onDismiss={() => setSnackbar(null)} />}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
