import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GestionNegocioIndex() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/gestion-negocio/leads-crm", {
            replace: true,
        });
    }, [navigate]);

    return null;
}