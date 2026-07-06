// src/pages/Calidad/CalidadIndex.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CalidadIndex() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/calidad/checklist_recepcion", {
            replace: true,
        });
    }, [navigate]);

    return null;
}