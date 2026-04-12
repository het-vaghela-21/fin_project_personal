"use client";

import { useCallback, useMemo } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

export function AmbientBackground() {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine);
    }, []);

    // Memoize the options object so it doesn't trigger re-renders
    const particlesOptions = useMemo(() => ({
        fullScreen: { enable: false, zIndex: 0 },
        background: {
            color: {
                value: "transparent",
            },
        },
        fpsLimit: 30,
        interactivity: {
            detectsOn: "window" as const,
            events: {
                onHover: {
                    enable: true,
                    mode: "repulse",
                },
                onClick: {
                    enable: false,
                },
                resize: true,
            },
            modes: {
                repulse: {
                    distance: 80,
                    duration: 0.4,
                },
            },
        },
        particles: {
            color: {
                value: "#f97316",
            },
            links: {
                color: "#f97316",
                distance: 150,
                enable: true,
                opacity: 0.3,
                width: 1,
            },
            move: {
                enable: true,
                random: true,
                speed: 1,
                straight: false,
            },
            number: {
                density: {
                    enable: true,
                    area: 800,
                },
                value: 30,
            },
            opacity: {
                value: 0.5,
            },
            shape: {
                type: "circle",
            },
            size: {
                value: { min: 1, max: 4 },
            },
        },
        detectRetina: true,
    }), []);

    return (
        <>
            <div className="fixed inset-0 z-0">
                <Particles
                    id="tsparticles"
                    init={particlesInit}
                    options={particlesOptions}
                    className="absolute inset-0 w-full h-full"
                />
            </div>

            {/* Ambient Aurora Glows - CSS-only animation for better perf */}
            <div
                className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f97316]/10 rounded-full blur-[80px] z-[-1] pointer-events-none animate-pulse"
                style={{ animationDuration: "10s" }}
            />
            <div
                className="fixed top-[20%] right-[-5%] w-[40%] h-[60%] bg-[#ea580c]/10 rounded-full blur-[80px] z-[-1] pointer-events-none animate-pulse"
                style={{ animationDuration: "12s", animationDelay: "2s" }}
            />
        </>
    );
}
