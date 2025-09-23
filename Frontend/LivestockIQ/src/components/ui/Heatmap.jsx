// frontend/src/components/ui/Heatmap.jsx

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';
import L from 'leaflet';

const Heatmap = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !points || points.length === 0) return;

        // NEW: Define a custom color gradient from blue (cool) to red (hot)
        const gradient = {
            0.4: 'blue',
            0.6: 'lime',
            0.7: 'yellow',
            0.8: 'orange',
            1.0: 'red'
        };

        // UPDATED: Pass the new gradient and other options to the heat layer
        const heatLayer = L.heatLayer(points, { 
            radius: 25,
            blur: 20,
            maxZoom: 18,
            gradient: gradient, // Use the custom gradient
        });

        heatLayer.addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
};

export default Heatmap;