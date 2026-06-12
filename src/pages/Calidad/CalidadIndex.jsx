// src/pages/Calidad/CalidadIndex.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_PATH = "/crm_volvo";

export default function CalidadIndex() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate(`${BASE_PATH}/calidad/checklist_recepcion`, {
            replace: true,
        });
    }, [navigate]);

    return null;
}