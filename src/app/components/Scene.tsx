import { FC, useEffect, useRef } from 'react';
import { Engine, Scene, Vector3, HemisphericLight, ArcRotateCamera } from '@babylonjs/core';

const DairySupplyChainScene: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Create engine & scene
        const engine = new Engine(canvasRef.current, true);
        const scene = new Scene(engine);

        // Setup camera
        const camera = new ArcRotateCamera(
            "camera",
            0,
            Math.PI / 3,
            25, // Distance from target
            Vector3.Zero(),
            scene
        );
        camera.attachControl(canvasRef.current, true);
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 50;

        // Add lighting
        const light = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            scene
        );
        light.intensity = 0.7;

        // Start render loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            engine.resize();
        });

        // Cleanup
        return () => {
            scene.dispose();
            engine.dispose();
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            style={{ 
                width: '100vw', 
                height: '100vh',
                outline: 'none'
            }} 
        />
    );
};

export default DairySupplyChainScene;
