import axios from 'axios';

const API_URL = 'http://localhost:5001/api'; // Your Flask backend URL

export const analyzeFloorplanApi = async (file, settings) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('geminiApiKey', settings.geminiApiKey);
  formData.append('roboflowApiKey', settings.roboflowApiKey);
  formData.append('scale', settings.scale);
  formData.append('dpi', settings.dpi);

  try {
    const response = await axios.post(`${API_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    // Enhance error message
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data.error || `Server responded with status ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Analysis server could not be reached. Is the backend running?');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message);
    }
  }
};
