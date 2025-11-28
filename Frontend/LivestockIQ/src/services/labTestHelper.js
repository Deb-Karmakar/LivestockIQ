// api service for getLabTestHistory, which is used by MRL Compliance page

const getAuthToken = () => {
    return JSON.parse(localStorage.getItem('userInfo'))?.token || localStorage.getItem('token');
};

export const getLabTestHistory = async () => {
    try {
        // First, try the dedicated endpoint
        const token = getAuthToken();
        if (!token) {
            throw new Error('No auth token found');
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mrl/my-tests`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching lab test history:', error);
        // Return empty array instead of throwing to prevent page crashes
        return { data: [] };
    }
};
