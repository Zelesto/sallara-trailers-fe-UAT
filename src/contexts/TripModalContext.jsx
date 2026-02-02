import React, { createContext, useState, useContext } from 'react';

const TripModalContext = createContext();

export const useTripModal = () => useContext(TripModalContext);

export const TripModalProvider = ({ children }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => setShowCreateModal(false);

  return (
    <TripModalContext.Provider value={{
      showCreateModal,
      openCreateModal,
      closeCreateModal
    }}>
      {children}
    </TripModalContext.Provider>
  );
};