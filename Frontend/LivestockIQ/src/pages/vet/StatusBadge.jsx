import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const config = {
        'Pending': { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
        'Approved': { text: 'Approved', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
        'Rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> };

    return (
        <Badge className={`flex items-center gap-1.5 w-fit ${finalConfig.color} hover:${finalConfig.color}`}>
            {finalConfig.icon}
            {finalConfig.text}
        </Badge>
    );
};

export default StatusBadge;