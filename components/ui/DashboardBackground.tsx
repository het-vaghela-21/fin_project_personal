"use client";

import { useCallback, useMemo } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";
import { usePathname } from "next/navigation";

export type BackgroundTheme = 'neon' | 'ocean' | 'matrix' | 'cosmic';

export function DashboardBackground() {
    const pathname = usePathname();

    // Determine theme based on path
    let theme: BackgroundTheme = 'neon';
    if (pathname.includes('/charts')) theme = 'ocean';
    else if (pathname.includes('/transactions')) theme = 'matrix';
    else if (pathname.includes('/ai-suggestions')) theme = 'cosmic';

    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine);
    }, []);

    const config = useMemo(() => {
        switch (theme) {
            case 'ocean':
                return {
                    color: "#0ea5e9",
                    shape: "triangle",
                    moveSpeed: 0.5,
                    linksOpacity: 0.15,
                    glowClass: "bg-[#0ea5e9]/5",
                };
            case 'matrix':
                return {
                    color: "#22c55e",
                    shape: "edge",
                    moveSpeed: 0.6,
                    linksOpacity: 0.05,
                    glowClass: "bg-[#22c55e]/5",
                    direction: "bottom",
                };
            case 'cosmic':
                return {
                    color: "#d946ef",
                    shape: "star",
                    moveSpeed: 0.2,
                    linksOpacity: 0.1,
                    glowClass: "bg-[#d946ef]/5",
                };
            case 'neon':
            default:
                return {
                    color: "#f97316",
                    shape: "circle",
                    moveSpeed: 0.3,
                    linksOpacity: 0.1,
                    glowClass: "bg-[#f97316]/5",
                };
        }
    }, [theme]);

    const particlesOptions = useMemo(() => ({
        fullScreen: { enable: false, zIndex: -10 },
        background: { color: { value: "transparent" } },
        fpsLimit: 30,
        interactivity: {
            detectsOn: "window" as const,
            events: {
                onHover: { enable: false },
            },
        },
        particles: {
            color: { value: config.color },
            links: {
                color: config.color,
                distance: 150,
                enable: true,
                opacity: config.linksOpacity,
                width: 1,
            },
            move: {
                enable: true,
                random: true,
                speed: config.moveSpeed,
                straight: false,
                direction: (config as any).direction || "none",
            },
            number: { density: { enable: true, area: 1200 }, value: 20 },
            opacity: { value: 0.2 },
            shape: { type: config.shape },
            size: { value: { min: 1, max: 3 } },
        },
        detectRetina: true,
    }), [config]);

    return (
        <div className="fixed inset-0 z-[-10] pointer-events-none">
            <Particles
                id={`dashboard-tsparticles-${theme}`}
                init={particlesInit}
                options={particlesOptions}
                className="absolute inset-0 w-full h-full transition-opacity duration-1000"
            />
            {/* Very faint background ambient glow matching the theme */}
            <div className={`fixed top-[-10%] left-[-10%] w-[50%] h-[50%] ${config.glowClass} rounded-full blur-[80px] pointer-events-none transition-colors duration-1000`} />
            <div className={`fixed bottom-[-10%] right-[-10%] w-[40%] h-[60%] ${config.glowClass} rounded-full blur-[60px] pointer-events-none transition-colors duration-1000 delay-500`} />
        </div>
    );
}
