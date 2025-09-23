// frontend/src/components/ui/Heatmap.jsx

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';
import L from 'leaflet';

const Heatmap = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !points || points.length === 0) return;

        // --- NEW: FINAL DIAGNOSTIC LOG ---
        // This will show us the exact data the component is receiving.
        console.log("Data points being sent to heatmap:", points);
        // ------------------------------------

        const latLngPoints = points.map(p => L.latLng(p[0], p[1], p[2]));

        const gradient = { 0.4: 'blue', 0.6: 'lime', 0.7: 'yellow', 0.8: 'orange', 1.0: 'red' };

        const heatLayer = L.heatLayer(latLngPoints, { 
            radius: 25, blur: 20, maxZoom: 18, minOpacity: 0.5, max: 100.0, gradient: gradient,
        });

        heatLayer.addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
};

export default Heatmap;