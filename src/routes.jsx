// src/routes.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

import ProtectedLayout from "./auth/ProtectedLayout";
import AppShell from "./app/AppShell";

import LoginRegistro from "./pages/LoginRegistro/LoginRegistro";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// ===== Gestión comercial =====
import ComercialLayout from "./pages/Comercial/ComercialLayout";
import ComercialIndex from "./pages/Comercial/ComercialIndex";

import CalidadLayout from "./pages/Calidad/CalidadLayout";
import CalidadIndex from "./pages/Calidad/CalidadIndex";

import DigitalesLayout from "./pages/Digitales/DigitalesLayout";
import DigitalesProspectos from "./pages/Digitales/DigitalesProspectos";
import DigitalesContacto from "./pages/Digitales/DigitalesContacto";

import CitasLayout from "./pages/Citas/CitasLayout";
import CitasOverView from "./pages/Citas/CitasOverView";
import RegistroCitas from "./pages/Citas/RegistroCitas";
import AgendaCitas from "./pages/Citas/AgendaCitas";

import CitasPisoLayout from "./pages/CitasPiso/CitasPisoLayout";
import CitasPisoOverView from "./pages/CitasPiso/CitasPisoOverView";
import RegistroCitasPiso from "./pages/CitasPiso/RegistroCitasPiso";
import AgendaCitasPiso from "./pages/CitasPiso/AgendaCitasPiso";

import TraficoPiso from "./pages/TraficoPiso/TraficoPiso";

import CheckListEntrega from "./pages/CheckListEntrega/RegistroCheckEntrega";
import CheckListGeneral from "./pages/CheckListGeneral/RegistroCheckGeneral";
import CheckListRecepcion from "./pages/CheckListRecepcion/RegistroCheckRecepcion";

import PruebaManejoLayout from "./pages/PruebasManejo/PruebaManejoLayout";
import RegistroPruebaManejo from "./pages/PruebasManejo/RegistroPruebaManejo";

import CampanasMeta from "./pages/CampanasMeta/CampanasMeta";
import RegistroEntregas from "./pages/Entregas/RegistroEntregas";

export const router = createBrowserRouter(
    [
        {
            path: "/login",
            element: <LoginRegistro />,
        },
        {
            element: <ProtectedLayout />,
            children: [
                {
                    path: "/",
                    element: <AppShell />,
                    children: [
                        {
                            index: true,
                            element: <Home />,
                        },

                        // ===== Gestión comercial =====
                        {
                            path: "comercial",
                            element: <ComercialLayout />,
                            children: [
                                {
                                    index: true,
                                    element: <ComercialIndex />,
                                },
                                {
                                    path: "prospectos",
                                    element: <DigitalesLayout />,
                                    children: [
                                        {
                                            index: true,
                                            element: <DigitalesProspectos />,
                                        },
                                        {
                                            path: "contacto",
                                            element: <DigitalesContacto />,
                                        },
                                    ],
                                },
                                {
                                    path: "citas",
                                    element: <CitasLayout />,
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroCitas />,
                                        },
                                        {
                                            path: "agenda",
                                            element: <AgendaCitas />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <CitasOverView />,
                                        },
                                    ],
                                },
                                {
                                    path: "control_piso",
                                    element: <CitasPisoLayout />,
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroCitasPiso />,
                                        },
                                        {
                                            path: "agenda",
                                            element: <AgendaCitasPiso />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <CitasPisoOverView />,
                                        },
                                    ],
                                },
                                {
                                    path: "trafico_piso",
                                    element: <TraficoPiso />,
                                },
                                {
                                    path: "pruebas_manejo",
                                    element: <PruebaManejoLayout />,
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroPruebaManejo />,
                                        },
                                    ],
                                },
                                {
                                    path: "entregas",
                                    element: <RegistroEntregas />,
                                },
                                {
                                    path: "campanas_meta",
                                    element: <CampanasMeta />,
                                },
                            ],
                        },

                        // ===== Gestión Calidad =====
                        {
                            path: "calidad",
                            element: <CalidadLayout />,
                            children: [
                                {
                                    index: true,
                                    element: <CalidadIndex />,
                                },
                                {
                                    path: "checklist_recepcion",
                                    element: <CheckListRecepcion />,
                                },
                                {
                                    path: "checklist_entrega",
                                    element: <CheckListEntrega />,
                                },
                                {
                                    path: "checklist_general",
                                    element: <CheckListGeneral />,
                                },
                            ],
                        },

                        {
                            path: "*",
                            element: <NotFound />,
                        },
                    ],
                },
            ],
        },
        {
            path: "*",
            element: <NotFound />,
        },
    ],
    {
        basename: "/crm_volvo/",
    }
);