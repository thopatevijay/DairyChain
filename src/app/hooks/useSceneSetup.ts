import { useEffect, useRef } from 'react';
import { 
    Engine, 
    Scene, 
    Vector3, 
    Color4, 
    HemisphericLight, 
    ArcRotateCamera,
    MeshBuilder,
    StandardMaterial,
    Color3
} from '@babylonjs/core';

interface SceneSetupReturn {
    scene: Scene | null;
    engine: Engine | null;
}

export const useSceneSetup = (canvas: HTMLCanvasElement | null): SceneSetupReturn => {
    const sceneRef = useRef<Scene | null>(null);
    const engineRef = useRef<Engine | null>(null);

    useEffect(() => {
        if (!canvas) return;

        // Initialize engine and scene
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);
        
        // Store refs
        engineRef.current = engine;
        sceneRef.current = scene;

        // Scene setup
        scene.clearColor = new Color4(0.9, 0.9, 0.9, 1); // Light gray background

        // Setup camera
        const camera = new ArcRotateCamera(
            "camera",
            0,
            Math.PI / 3,
            25,
            Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 50;

        // Add lighting
        const light = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            scene
        );
        light.intensity = 0.7;

        // Add ground
        const ground = MeshBuilder.CreateGround(
            "ground",
            { width: 50, height: 30 },
            scene
        );
        const groundMaterial = new StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
        ground.material = groundMaterial;

        // Start render loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Handle window resize
        const handleResize = () => {
            engine.resize();
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            scene.dispose();
            engine.dispose();
        };
    }, [canvas]);

    return {
        scene: sceneRef.current,
        engine: engineRef.current
    };
};
