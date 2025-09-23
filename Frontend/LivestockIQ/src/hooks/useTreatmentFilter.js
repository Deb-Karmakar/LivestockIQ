// frontend/src/hooks/useTreatmentFilter.js

import { useState, useMemo } from 'react';

// This helper function will live inside the hook file
const getWithdrawalInfo = (treatment) => {
    if (!treatment.withdrawalEndDate) return { status: 'pending' };
    const endDate = new Date(treatment.withdrawalEndDate);
    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    let status;
    if (daysLeft < 0) status = 'safe';
    else if (daysLeft <= 5) status = 'ending_soon';
    else status = 'active';
    return { status };
};

export const useTreatmentFilter = (treatments) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('all');

    const filteredAndSortedTreatments = useMemo(() => {
        if (!Array.isArray(treatments)) return [];

        const statusPriority = {
            'active': 1,
            'ending_soon': 2,
            'safe': 3,
            'pending': 4,
            'unknown': 5
        };

        return treatments
            .map(treatment => ({
                ...treatment,
                withdrawalStatus: getWithdrawalInfo(treatment).status
            }))
            .filter(t => {
                if (filterBy === 'all') return true;
                return t.withdrawalStatus === filterBy;
            })
            .filter(t => {
                return (t.animalId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                       (t.drugName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                return statusPriority[a.withdrawalStatus] - statusPriority[b.withdrawalStatus];
            });
    }, [treatments, searchTerm, filterBy]);

    return {
        searchTerm,
        setSearchTerm,
        filterBy,
        setFilterBy,
        filteredTreatments: filteredAndSortedTreatments
    };
};