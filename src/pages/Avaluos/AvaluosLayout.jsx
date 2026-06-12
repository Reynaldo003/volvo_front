import React from "react";
import { Outlet } from "react-router-dom";
import CitasTopNav from "../Avaluos/AvaluosTopNav";

export default function CitasLayout() {
    return (
        <div className="space-y-4">
            <Outlet />
        </div>
    );
}
