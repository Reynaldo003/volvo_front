// src/pages/Comercial/ComercialIndex.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_PATH = "/crm_volvo";

export default function ComercialIndex() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate(`${BASE_PATH}/comercial/prospectos`, {
            replace: true,
        });
    }, [navigate]);

    return null;
}