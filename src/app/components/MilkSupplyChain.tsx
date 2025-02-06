import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { FarmNode } from './supply-chain/FarmNode';
import { CollectionPoint } from './supply-chain/CollectionPoint';
import { IoTConnection } from './supply-chain/IoTConnection';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';

interface MilkData {
    farmerId: number;
    quantity: number;
    quality: number;
    status: 'ACCEPTED' | 'REJECTED';
}

const MilkSupplyChain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [milkInspectionData, setMilkInspectionData] = useState<MilkData | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        // Camera setup with two positions
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            0,
            Math.PI / 3,
            60, // Increased distance for better overview
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvasRef.current, true);
        camera.lowerRadiusLimit = 15;
        camera.upperRadiusLimit = 100;

        // Lighting
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );
        light.intensity = 1;
        // Add point lights for better visibility
        const pointLight = new BABYLON.PointLight(
            "pointLight",
            new BABYLON.Vector3(0, 10, 0),
            scene
        );
        pointLight.intensity = 0.5;

        // Materials
        const blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
        blueMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);

        const iotActiveMaterial = new BABYLON.StandardMaterial("iotActive", scene);
        iotActiveMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);

        const robotMaterial = new BABYLON.StandardMaterial("robotMaterial", scene);
        robotMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);

        // Create farm nodes with robot
        const farms = Array.from({ length: 3 }, (_, i) =>
            FarmNode({
                scene,
                position: new BABYLON.Vector3(-30, 0, -8 + (i * 8)), // Reduced spacing
                index: i,
                onInspection: setMilkInspectionData,
                onSelect: (nodeName) => {
                    setSelectedNode(nodeName);
                    camera.setTarget(new BABYLON.Vector3(-30, 0, -8 + (i * 8)));
                    camera.radius = 20;
                }
            })
        );

        const collectionPoint = CollectionPoint({
            scene,
            position: new BABYLON.Vector3(-15, 0, 0), // Reduced spacing
            onInspection: setMilkInspectionData,
            onSelect: (nodeName) => {
                setSelectedNode(nodeName);
                camera.setTarget(new BABYLON.Vector3(-15, 0, 0));
                camera.radius = 20;
            }
        });

        // Create processing plant with robot
        const createProcessingPlant = (position: BABYLON.Vector3) => {
            const building = BABYLON.MeshBuilder.CreateBox(
                "plant",
                { width: 6, height: 4, depth: 6 },
                scene
            );
            building.position = position;
            building.material = blueMaterial;
            createLabel("Processing Plant", position, scene);
            createRobot(new BABYLON.Vector3(position.x - 4, position.y, position.z), scene, setMilkInspectionData);
            return building;
        };

        const processingPlant = createProcessingPlant(new BABYLON.Vector3(0, 0, 0));

        // Single distributor with robot
        const distributor = BABYLON.MeshBuilder.CreateBox(
            "distributor",
            { width: 2, height: 2, depth: 2 },
            scene
        );
        distributor.position = new BABYLON.Vector3(15, 0, 0);
        distributor.material = blueMaterial;
        createLabel("Distributor", distributor.position, scene);
        createRobot(new BABYLON.Vector3(17, 0, 0), scene, setMilkInspectionData);

        // Single retailer with robot
        const retailer = BABYLON.MeshBuilder.CreateBox(
            "retailer",
            { width: 1.5, height: 2, depth: 1.5 },
            scene
        );
        retailer.position = new BABYLON.Vector3(30, 0, 0);
        retailer.material = iotActiveMaterial;
        createLabel("Retailer", retailer.position, scene);
        createRobot(new BABYLON.Vector3(32, 0, 0), scene, setMilkInspectionData);

        // Single customer with robot
        const customer = BABYLON.MeshBuilder.CreateSphere(
            "customer",
            { diameter: 1 },
            scene
        );
        customer.position = new BABYLON.Vector3(45, 0, 0);
        customer.material = blueMaterial;
        createLabel("Customer", customer.position, scene);
        createRobot(new BABYLON.Vector3(47, 0, 0), scene, setMilkInspectionData);

        // Create IoT connections
        farms.forEach(farm => {
            IoTConnection({
                scene,
                start: farm.position,
                end: collectionPoint.position
            });
        });

        IoTConnection({
            scene,
            start: collectionPoint.position,
            end: processingPlant.position
        });

        IoTConnection({
            scene,
            start: processingPlant.position,
            end: distributor.position
        });

        IoTConnection({
            scene,
            start: distributor.position,
            end: retailer.position
        });

        IoTConnection({
            scene,
            start: retailer.position,
            end: customer.position
        });

        // Add overview button
        const overviewButton = document.createElement('button');
        overviewButton.textContent = "Overview";
        overviewButton.className = "absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded";
        overviewButton.onclick = () => {
            setSelectedNode(null);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 60;
            camera.alpha = 0;
            camera.beta = Math.PI / 3;
        };
        canvasRef.current.parentElement?.appendChild(overviewButton);

        // Animation loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            engine.resize();
        });

        // Cleanup
        return () => {
            overviewButton.remove();
            scene.dispose();
            engine.dispose();
        };
    }, []);

    return (
        <div className="relative w-full h-screen">
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
            />
            {milkInspectionData && (
                <div className="absolute top-4 right-4 w-80">
                    <Alert variant={milkInspectionData.status === 'ACCEPTED' ? 'success' : 'error'}>
                        <AlertTitle>
                            {selectedNode ? `${selectedNode} - Inspection Result` : 'Milk Inspection Result'}
                        </AlertTitle>
                        <AlertDescription>
                            <div className="space-y-2">
                                <p>Farmer ID: {milkInspectionData.farmerId}</p>
                                <p>Quantity: {milkInspectionData.quantity} Ltr</p>
                                <p>Quality: {milkInspectionData.quality} SNF</p>
                                <p>Status: {milkInspectionData.status}</p>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
};

export default MilkSupplyChain;