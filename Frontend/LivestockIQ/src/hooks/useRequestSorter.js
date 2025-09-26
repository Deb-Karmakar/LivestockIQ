// frontend/src/hooks/useRequestSorter.js

import { useState, useMemo } from 'react';

export const useRequestSorter = (requests) => {
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

    const sortedRequests = useMemo(() => {
        let sortableRequests = [...requests];
        
        sortableRequests.sort((a, b) => {
            let aValue, bValue;

            // Handle sorting by nested farmer name
            if (sortConfig.key === 'farmer') {
                aValue = a.farmerId?.farmOwner || '';
                bValue = b.farmerId?.farmOwner || '';
            } else {
                aValue = a[sortConfig.key];
                bValue = b[sortConfig.key];
            }

            // Handle custom sorting for status
            if (sortConfig.key === 'status') {
                const statusOrder = { 'Pending': 1, 'Approved': 2, 'Rejected': 3 };
                aValue = statusOrder[a.status || 'Pending'] || 4;
                bValue = statusOrder[b.status || 'Pending'] || 4;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        
        return sortableRequests;
    }, [requests, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { sortedRequests, requestSort, sortConfig };
};