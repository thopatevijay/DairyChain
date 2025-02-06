"use client";
import { FC, useEffect, useRef } from 'react';
import { 
    Scene, 
    Vector3, 
    Color4, 
    HemisphericLight, 
    ArcRotateCamera,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Engine,
    PointLight,
    Mesh
} from '@babylonjs/core';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader';
import { GridMaterial } from '@babylonjs/materials/grid';
import { createProcessingPlant } from './facilities/ProcessingPlant';

const DairySupplyChain: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<Scene | null>(null);
    const engineRef = useRef<Engine | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize engine and scene
        const engine = new Engine(canvasRef.current, true);
        const scene = new Scene(engine);
        
        engineRef.current = engine;
        sceneRef.current = scene;

        // Scene setup
        scene.clearColor = new Color4(0.1, 0.1, 0.2, 1); // Dark blue background

        // Setup camera
        const camera = new ArcRotateCamera(
            "camera",
            Math.PI / 3, // alpha
            Math.PI / 3, // beta
            50, // radius
            new Vector3(0, 0, 0),
            scene
        );
        camera.attachControl(canvasRef.current, true);
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 100;
        camera.wheelDeltaPercentage = 0.01; // Slower zoom

        // Lighting
        const hemisphericLight = new HemisphericLight(
            "hemisphericLight",
            new Vector3(0, 1, 0),
            scene
        );
        hemisphericLight.intensity = 0.7;

        // Add point lights for better visibility
        const pointLight1 = new PointLight(
            "pointLight1",
            new Vector3(20, 20, 20),
            scene
        );
        pointLight1.intensity = 0.5;

        // Create ground
        const ground = MeshBuilder.CreateGround(
            "ground",
            { 
                width: 100, 
                height: 60,
                subdivisions: 20
            },
            scene
        );

        // Create grid material
        const gridMaterial = new GridMaterial("gridMaterial", scene);
        gridMaterial.majorUnitFrequency = 5;
        gridMaterial.minorUnitVisibility = 0.3;
        gridMaterial.gridRatio = 1;
        gridMaterial.backFaceCulling = false;
        gridMaterial.mainColor = new Color3(0.2, 0.2, 0.3);
        gridMaterial.lineColor = new Color3(0.3, 0.3, 0.4);
        ground.material = gridMaterial;

        // Create placeholder boxes for facilities
        const createFacility = (position: Vector3, color: Color3, name: string): Mesh => {
            const box = MeshBuilder.CreateBox(
                name,
                { height: 4, width: 6, depth: 6 },
                scene
            );
            box.position = position;
            
            const material = new StandardMaterial(`${name}Material`, scene);
            material.diffuseColor = color;
            material.alpha = 0.8;
            box.material = material;
            
            return box;
        };

        // Create facilities
        const facilities = [
            {
                name: "farms",
                position: new Vector3(-30, 2, 0),
                color: new Color3(0.2, 0.6, 0.2), // Green
                create: (scene: Scene, position: Vector3) => createFacility(position, new Color3(0.2, 0.6, 0.2), "farms")
            },
            {
                name: "milkPooling",
                position: new Vector3(-15, 2, 0),
                color: new Color3(0.6, 0.4, 0.2), // Brown
                create: (scene: Scene, position: Vector3) => createFacility(position, new Color3(0.6, 0.4, 0.2), "milkPooling")
            },
            {
                name: "processingPlant",
                position: new Vector3(0, 2, 0),
                color: new Color3(0.2, 0.4, 0.6), // Blue
                create: (scene: Scene, position: Vector3) => createProcessingPlant(scene, position)
            },
            {
                name: "distributors",
                position: new Vector3(15, 2, 0),
                color: new Color3(0.6, 0.2, 0.6), // Purple
                create: (scene: Scene, position: Vector3) => createFacility(position, new Color3(0.6, 0.2, 0.6), "distributors")
            },
            {
                name: "retailers",
                position: new Vector3(30, 2, 0),
                color: new Color3(0.6, 0.6, 0.2), // Yellow
                create: (scene: Scene, position: Vector3) => createFacility(position, new Color3(0.6, 0.6, 0.2), "retailers")
            }
        ];

        facilities.forEach(facility => {
            if (facility.name === "processingPlant") {
                facility.create(scene, facility.position);
            } else {
                createFacility(
                    facility.position,
                    facility.color,
                    facility.name
                );
            }
        });

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
    }, []);

    return (
        <div className="w-full h-full">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full outline-none"
                style={{ touchAction: 'none' }}
            />
        </div>
    );
};

export default DairySupplyChain;
