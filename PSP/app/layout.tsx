import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"PSP | Gestión de Seguros",description:"Panel de ventas y solicitudes de PSP Seguros"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
