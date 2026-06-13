import { Outlet } from "react-router-dom";
import DigitalesTopNav from "./DigitalesTopNav";

export default function DigitalesLayout() {
    return (
        <div className="space-y-4">
            <DigitalesTopNav />
            <Outlet />
        </div>
    );
}