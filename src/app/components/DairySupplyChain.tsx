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
    Mesh,
    DynamicTexture
} from '@babylonjs/core';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader';
import { GridMaterial } from '@babylonjs/materials/grid';
import { createProcessingPlant } from './facilities/ProcessingPlant';
import { createMilkCollectionCenter } from './facilities/MilkCollectionCenter';

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

        // Create labels
        const createLabel = (scene: Scene, text: string, position: Vector3) => {
            // Create a plane for the label
            const plane = MeshBuilder.CreatePlane("label", { width: 8, height: 2 }, scene);
            plane.position = new Vector3(position.x, position.y + 5, position.z);
            plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

            // Create dynamic texture for text
            const texture = new DynamicTexture("labelTexture", { width: 512, height: 128 }, scene, true);
            const context = texture.getContext();
            context.fillStyle = 'white';
            context.fillRect(0, 0, 512, 128);
            
            texture.drawText(text, null, 80, "bold 72px Arial", "black", "transparent", true);

            // Create material with texture
            const material = new StandardMaterial("labelMaterial", scene);
            material.diffuseTexture = texture;
            material.specularColor = new Color3(0, 0, 0);
            material.emissiveColor = new Color3(1, 1, 1);
            material.backFaceCulling = false;
            plane.material = material;

            return plane;
        };

        // Create facilities
        const facilities = [
            {
                name: "farms",
                label: "Farms",
                position: new Vector3(-40, 2, 0),
                color: new Color3(0.2, 0.6, 0.2),
                create: undefined
            },
            {
                name: "milkPooling",
                label: "Collection Center",
                position: new Vector3(-20, 2, 0),
                create: (scene: Scene, position: Vector3) => createMilkCollectionCenter(scene, position)
            },
            {
                name: "processingPlant",
                label: "Processing Plant",
                position: new Vector3(0, 2, 0),
                create: (scene: Scene, position: Vector3) => createProcessingPlant(scene, position)
            },
            {
                name: "distributors",
                label: "Distributors",
                position: new Vector3(20, 2, 0),
                color: new Color3(0.6, 0.2, 0.6),
                create: undefined
            },
            {
                name: "retailers",
                label: "Retailers",
                position: new Vector3(40, 2, 0),
                color: new Color3(0.6, 0.6, 0.2),
                create: undefined
            }
        ];

        facilities.forEach(facility => {
            if (facility.create) {
                facility.create(scene, facility.position);
            } else {
                createFacility(
                    facility.position,
                    facility.color!,
                    facility.name
                );
            }
            createLabel(scene, facility.label, facility.position);
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
