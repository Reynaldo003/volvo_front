// src/pages/Citas/CitasLayout.jsx
import { Outlet } from "react-router-dom";

export default function CitasLayout() {
    return (
        <div className="space-y-4">
            <Outlet />
        </div>
    );
}