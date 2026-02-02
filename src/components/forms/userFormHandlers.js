import { useState } from 'react';
import { useSnackbar } from 'notistack';

const useFormHandlers = (entityName, apiService) => {
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenForm = (item = null) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedItem(null);
    setFormOpen(false);
  };

  const handleSave = async (formData) => {
    setLoading(true);
    try {
      let response;
      if (selectedItem) {
        response = await apiService.update(selectedItem.id, formData);
        enqueueSnackbar(`${entityName} updated successfully`, { variant: 'success' });
      } else {
        response = await apiService.create(formData);
        enqueueSnackbar(`${entityName} created successfully`, { variant: 'success' });
      }
      handleCloseForm();
      return response;
    } catch (error) {
      console.error(`Error saving ${entityName}:`, error);
      enqueueSnackbar(`Failed to save ${entityName}: ${error.message}`, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this ${entityName}?`)) {
      return;
    }

    setLoading(true);
    try {
      await apiService.delete(item.id);
      enqueueSnackbar(`${entityName} deleted successfully`, { variant: 'success' });
      return true;
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error);
      enqueueSnackbar(`Failed to delete ${entityName}: ${error.message}`, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    formOpen,
    selectedItem,
    handleOpenForm,
    handleCloseForm,
    handleSave,
    handleDelete
  };
};

export default useFormHandlers;