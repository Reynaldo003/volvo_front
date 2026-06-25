// src/pages/PruebasManejo/PruebaManejoLayout.jsx
import { Outlet } from "react-router-dom";

export default function PruebaManejoLayout() {
    return (
        <div className="space-y-4">
            <Outlet />
        </div>
    );
}