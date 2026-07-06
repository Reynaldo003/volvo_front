// src/pages/Comercial/ComercialIndex.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ComercialIndex() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/comercial/prospectos", {
            replace: true,
        });
    }, [navigate]);

    return null;
}