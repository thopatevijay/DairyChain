import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { FarmNode } from './supply-chain/FarmNode';
import { CollectionPoint } from './supply-chain/CollectionPoint';
import { IoTConnection } from './supply-chain/IoTConnection';
import { ProcessingPlant } from './supply-chain/ProcessingPlant';
import { ProcessingStats } from './supply-chain/ProcessingPlant';
import { Distributor } from './supply-chain/Distributor';
import { Retailer } from './supply-chain/Retailer';
import { Customer } from './supply-chain/Customer';

interface MilkData {
    farmerId: number;
    quantity: number;
    quality: number;
    status: 'ACCEPTED' | 'REJECTED';
    timestamp: string;
}

const MilkSupplyChain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [milkInspectionData, setMilkInspectionData] = useState<MilkData | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [inspectionHistory, setInspectionHistory] = useState<MilkData[]>([]);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);

    // Create a handler for milk inspection that updates both current and history
    const handleMilkInspection = (data: MilkData) => {
        setMilkInspectionData(data);
        setInspectionHistory(prev => [data, ...prev].slice(0, 5));

        // Clear current inspection alert after 5 seconds
        setTimeout(() => {
            setMilkInspectionData(null);
            setInspectionHistory([]);
        }, 5000);
    };

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);

        // Camera setup
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            0,
            Math.PI / 3,
            60,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvasRef.current, true);

        camera.panningAxis = new BABYLON.Vector3(1, 0, 1); // Allow panning in X and Z
        camera.panningInertia = 0.9; // Increase panning speed
        camera.panningDistanceLimit = 100; // Allow panning over larger distances

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
                position: new BABYLON.Vector3(-30, 0, -8 + (i * 8)),
                index: i,
                onInspection: handleMilkInspection,
                onSelect: (nodeName) => {
                    setSelectedNode(nodeName);
                    camera.setTarget(new BABYLON.Vector3(-22, 0, -8 + (i * 8)));
                    camera.radius = 30;
                }
            })
        );

        const processingPlantPosition = new BABYLON.Vector3(0, 0, 0);
        const distributorPosition = new BABYLON.Vector3(15, 0, 0);

        const collectionPoint = CollectionPoint({
            scene,
            position: new BABYLON.Vector3(-15, 0, 0),
            onInspection: handleMilkInspection,
            onSelect: (nodeName) => {
                setSelectedNode(nodeName);
                camera.setTarget(new BABYLON.Vector3(-15, 0, 0));
                camera.radius = 20;
            },
            processingPlantPosition
        });

        const processingPlant = ProcessingPlant({
            scene,
            position: processingPlantPosition,
            onInspection: handleMilkInspection,
            onSelect: (nodeName) => {
                setSelectedNode(nodeName);
                camera.setTarget(processingPlantPosition);
                camera.radius = 20;
            },
            onStatusUpdate: (stats) => setProcessingStats(stats),
            distributorPosition
        });

        // Single distributor with robot
        const distributor = Distributor({
            scene,
            position: distributorPosition,
            onInspection: handleMilkInspection,
            onSelect: (nodeName) => {
                setSelectedNode(nodeName);
                camera.setTarget(new BABYLON.Vector3(17, 0, 0));
                camera.radius = 20;
            },
        });

        // Single retailer with robot
        const retailer = Retailer({
            scene,
            position: new BABYLON.Vector3(30, 0, 0),
            onInspection: handleMilkInspection,
            onSelect: (nodeName) => {
                setSelectedNode(nodeName);
                camera.setTarget(new BABYLON.Vector3(32, 0, 0));
                camera.radius = 20;
            }
        });

        // Single customer with robot
        const customer = Customer({
            scene,
            position: new BABYLON.Vector3(45, 0, 0),
            onInspection: handleMilkInspection,
            onSelect: (nodeName) => {
                setSelectedNode(nodeName);
                camera.setTarget(new BABYLON.Vector3(47, 0, 0));
                camera.radius = 20;
            }
        });

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
            {/* Processing Plant Stats Alert */}
            {processingStats && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-96">
                    <Alert variant={processingStats.isDispatched ? 'success' : 'info'}>
                        <AlertTitle>Processing Plant Status</AlertTitle>
                        <AlertDescription>
                            <div className="grid grid-cols-2 gap-2">
                                <div>Trucks Received:</div>
                                <div>{processingStats.trucksReceived}</div>

                                <div>Accepted/Rejected:</div>
                                <div>{processingStats.acceptedTrucks}/{processingStats.rejectedTrucks}</div>

                                <div>Total Milk:</div>
                                <div>{processingStats.totalMilkQty.toFixed(1)}L</div>

                                <div>Average Quality:</div>
                                <div>{processingStats.avgQuality.toFixed(1)}</div>

                                <div>Processing Start Time:</div>
                                <div>{processingStats.processingStartTime}</div>

                                <div>Processing End Time:</div>
                                <div>{processingStats.processingEndTime}</div>

                                <div>Production Start Time:</div>
                                <div>{processingStats.productionStartTime}</div>

                                <div>Production End Time:</div>
                                <div>{processingStats.productionEndTime}</div>

                                <div>Bottles Packed:</div>
                                <div>{processingStats.bottlesPacked}</div>

                                <div>Status:</div>
                                <div>{processingStats.status}</div>

                                {/* {processingStats.processingStartTime && (
                                    <>
                                        <div>Processing Time:</div>
                                        <div>{processingStats.processingStartTime} - {processingStats.processingEndTime}</div>
                                    </>
                                )} */}
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {/* Current Inspection Alert */}
            {milkInspectionData && (
                <div className="absolute top-4 right-4 w-80">
                    <Alert variant={milkInspectionData.status === 'ACCEPTED' ? 'success' : 'error'}>
                        <AlertTitle>
                            New Milk Inspection - {milkInspectionData.timestamp}
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
            {/* Inspection History */}
            <div className="absolute bottom-4 right-4 w-80 space-y-2">
                {inspectionHistory.map((data, index) => (
                    <Alert
                        key={index}
                        variant={data.status === 'ACCEPTED' ? 'success' : 'error'}
                    >
                        <AlertTitle>
                            {selectedNode && `${selectedNode} - `}
                            Farmer {data.farmerId} - {data.timestamp}
                        </AlertTitle>
                        <AlertDescription>
                            {data.quantity}L - {data.status}
                        </AlertDescription>
                    </Alert>
                ))}
            </div>
        </div>
    );
};

export default MilkSupplyChain;