import React from "react";
import { Outlet } from "react-router-dom";
import DigitalesTopNav from "../Digitales/DigitalesTopNav";

export default function DigitalesLayout() {
    return (
        <div className="space-y-4">
            <Outlet />
        </div>
    );
}
