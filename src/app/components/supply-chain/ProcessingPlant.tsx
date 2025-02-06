import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

export interface ProcessingStats {
    trucksReceived: number;
    acceptedTrucks: number;
    rejectedTrucks: number;
    totalMilkQty: number;
    avgQuality: number;
    processingStartTime: string;
    processingEndTime: string;
    productionStartTime: string;
    productionEndTime: string;
    bottlesPacked: number;
    finalQuality: number;
    isDispatched: boolean;
}

interface ProcessingPlantProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
    onStatusUpdate?: (stats: ProcessingStats) => void;
}

export const ProcessingPlant = ({ scene, position, onInspection, onSelect, onStatusUpdate }: ProcessingPlantProps) => {
    // Stats tracking
    const statsRef = {
        current: {
            trucksReceived: 0,
            acceptedTrucks: 0,
            rejectedTrucks: 0,
            totalMilkQty: 0,
            avgQuality: 0,
            processingStartTime: '',
            processingEndTime: '',
            productionStartTime: '',
            productionEndTime: '',
            bottlesPacked: 0,
            finalQuality: 0,
            isDispatched: false
        } as ProcessingStats
    };

    // Use ref pattern for mutable state
    const processedMilkRef = {
        current: {
            quantity: 0,
            bottleCount: 0,
            status: 'COMPLETED' as const
        }
    };

    // Materials
    const plantMaterial = new BABYLON.StandardMaterial("plantMaterial", scene);
    plantMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.8);

    const metalMaterial = new BABYLON.StandardMaterial("metalMaterial", scene);
    metalMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    metalMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    const glassMaterial = new BABYLON.StandardMaterial("glassMaterial", scene);
    glassMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4);
    glassMaterial.alpha = 0.5;

    // Create main factory building (more horizontal)
    const mainBuilding = BABYLON.MeshBuilder.CreateBox(
        "processingPlant",
        { width: 12, height: 3, depth: 4 },
        scene
    );
    mainBuilding.position = position;
    mainBuilding.rotation.y = Math.PI;
    mainBuilding.material = plantMaterial;

    // Add elevated horizontal tanks
    const createElevatedTank = (offsetX: number) => {
        // Support pillars
        const pillar1 = BABYLON.MeshBuilder.CreateCylinder(
            "pillar1",
            { height: 4, diameter: 0.4 },
            scene
        );
        pillar1.position = new BABYLON.Vector3(
            position.x + offsetX,
            position.y,
            position.z
        );
        pillar1.material = metalMaterial;

        const pillar2 = BABYLON.MeshBuilder.CreateCylinder(
            "pillar2",
            { height: 4, diameter: 0.4 },
            scene
        );
        pillar2.position = new BABYLON.Vector3(
            position.x + offsetX,
            position.y,
            position.z + 1
        );
        pillar2.material = metalMaterial;

        // Horizontal tank
        const tank = BABYLON.MeshBuilder.CreateCylinder(
            "storageTank",
            { height: 4, diameter: 1.5 },
            scene
        );
        tank.rotation.z = Math.PI / 2; // Lay the tank horizontally
        tank.position = new BABYLON.Vector3(
            position.x + offsetX,
            position.y + 2,
            position.z + 0.5
        );
        tank.material = metalMaterial;

        // End caps
        const createEndCap = (offsetZ: number) => {
            const cap = BABYLON.MeshBuilder.CreateCylinder(
                "tankCap",
                { height: 0.1, diameter: 1.5 },
                scene
            );
            cap.position = new BABYLON.Vector3(
                position.x + offsetX,
                position.y + 2,
                position.z + offsetZ
            );
            cap.material = metalMaterial;
        };

        createEndCap(-1.5);
        createEndCap(2.5);
    };

    // Create two elevated tanks
    createElevatedTank(-4);
    createElevatedTank(4);

    // Add connecting pipes
    const createPipe = (startX: number, endX: number) => {
        const pipe = BABYLON.MeshBuilder.CreateCylinder(
            "pipe",
            { height: endX - startX, diameter: 0.3 },
            scene
        );
        pipe.rotation.z = Math.PI / 2;
        pipe.position = new BABYLON.Vector3(
            position.x + (startX + endX) / 2,
            position.y + 2,
            position.z + 0.5
        );
        pipe.material = metalMaterial;
    };

    createPipe(-4, 4);

    // Position robots along the front with distinct colors and improved labels
    const inspectionRobot = createRobot(
        new BABYLON.Vector3(position.x - 5, position.y, position.z - 3),
        scene,
        onInspection,
        new BABYLON.Color3(0.2, 0.6, 1)  // Blue
    );
    createLabel("Milk Inspector", 
        new BABYLON.Vector3(position.x - 5, position.y - 3.7, position.z - 3),  // Lowered position
        scene,
    );
    
    const processingRobot = createRobot(
        new BABYLON.Vector3(position.x - 2, position.y, position.z - 3),
        scene,
        onInspection,
        new BABYLON.Color3(0.2, 0.8, 0.2)  // Green
    );
    createLabel("Milk Processor", 
        new BABYLON.Vector3(position.x - 2, position.y - 3.7, position.z - 3),  // Lowered position
        scene,
    );
    
    const productionRobot = createRobot(
        new BABYLON.Vector3(position.x + 2, position.y, position.z - 3),
        scene,
        onInspection,
        new BABYLON.Color3(0.8, 0.4, 0.1)  // Orange
    );
    createLabel("Production Manager", 
        new BABYLON.Vector3(position.x + 2, position.y - 3.7, position.z - 3),  // Lowered position
        scene,
    );
    
    const dispatchRobot = createRobot(
        new BABYLON.Vector3(position.x + 5, position.y, position.z - 3),
        scene,
        onInspection,
        new BABYLON.Color3(0.8, 0.2, 0.2)  // Red
    );
    createLabel("Production Dispatcher", 
        new BABYLON.Vector3(position.x + 5, position.y - 3.7, position.z - 3),  // Lowered position
        scene,
    );

    // Add conveyor belt in front (adjusted z position)
    const conveyor = BABYLON.MeshBuilder.CreateBox(
        "conveyor",
        { width: 10, height: 0.2, depth: 1 },
        scene
    );
    conveyor.position = new BABYLON.Vector3(
        position.x,
        position.y - 0.5,
        position.z - 3
    );
    conveyor.material = metalMaterial;

    // Update showNotice function
    const showNotice = (stats: ProcessingStats) => {
        // Just call the callbacks to update UI
        onInspection({
            farmerId: -1,
            quantity: stats.totalMilkQty,
            quality: stats.avgQuality,
            status: 'ACCEPTED',
            timestamp: new Date().toLocaleTimeString(),
            summary: {
                totalQuantity: stats.totalMilkQty,
                processStats: stats
            }
        });

        // Update status in parent component
        if (onStatusUpdate) {
            onStatusUpdate(stats);
        }
    };

    // Update process milk function to use alerts instead of notice board
    const processMilk = async (quantity: number, quality: number) => {
        // Show notice board immediately when truck arrives
        statsRef.current.trucksReceived++;
        showNotice({
            ...statsRef.current,
            totalMilkQty: quantity,
            avgQuality: quality,
        });
        
        // Inspection robot animation
        scene.beginAnimation(inspectionRobot, 0, 30, false);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Quality check
        const isAccepted = quality >= 25;
        if (!isAccepted) {
            statsRef.current.rejectedTrucks++;
            
            onInspection({
                farmerId: -1,
                quantity,
                quality,
                status: 'REJECTED',
                timestamp: new Date().toLocaleTimeString()
            });
            return;
        }

        // Accept and process
        statsRef.current.acceptedTrucks++;
        statsRef.current.totalMilkQty += quantity;
        statsRef.current.avgQuality = 
            ((statsRef.current.avgQuality * (statsRef.current.acceptedTrucks - 1)) + quality) / 
            statsRef.current.acceptedTrucks;
        statsRef.current.processingStartTime = new Date().toLocaleTimeString();

        // Processing robot animation
        scene.beginAnimation(processingRobot, 0, 30, true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        statsRef.current.processingEndTime = new Date().toLocaleTimeString();

        // Production robot animation
        statsRef.current.productionStartTime = new Date().toLocaleTimeString();
        scene.beginAnimation(productionRobot, 0, 30, true);
        
        // Bottling process
        const bottleCount = Math.floor(quantity);
        for (let i = 0; i < bottleCount; i++) {
            const bottle = createBottle();
            const bottleAnimation = new BABYLON.Animation(
                "bottleMove",
                "position",
                30,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            const bottleKeys = [];
            bottleKeys.push({ frame: 0, value: bottle.position.clone() });
            bottleKeys.push({ 
                frame: 30, 
                value: new BABYLON.Vector3(
                    bottle.position.x + 2,
                    bottle.position.y,
                    bottle.position.z
                )
            });

            bottleAnimation.setKeys(bottleKeys);
            bottle.animations = [bottleAnimation];

            await new Promise(resolve => {
                scene.beginAnimation(bottle, 0, 30, false, 1, () => {
                    setTimeout(() => {
                        bottle.dispose();
                        resolve(true);
                    }, 500);
                });
            });
            statsRef.current.bottlesPacked++;
        }

        statsRef.current.productionEndTime = new Date().toLocaleTimeString();
        statsRef.current.finalQuality = quality * 1.1; // Improved quality after processing

        // Dispatch animation
        scene.beginAnimation(dispatchRobot, 0, 30, false);
        await new Promise(resolve => setTimeout(resolve, 2000));
        statsRef.current.isDispatched = true;

        showNotice(statsRef.current);
    };

    // Function to create bottle mesh
    const createBottle = () => {
        const bottle = BABYLON.MeshBuilder.CreateCylinder(
            "bottle",
            { height: 0.3, diameterTop: 0.05, diameterBottom: 0.08 },
            scene
        );
        bottle.position = new BABYLON.Vector3(
            mainBuilding.position.x,
            mainBuilding.position.y + 1,
            mainBuilding.position.z
        );
        return bottle;
    };

    // Listen for milk delivery
    scene.onBeforeRenderObservable.add(() => {
        if (scene.metadata?.processingDelivery && processedMilkRef.current.status === 'COMPLETED') {
            const delivery = scene.metadata.processingDelivery;
            processMilk(delivery.quantity, delivery.quality);
            scene.metadata.processingDelivery = null;
        }
    });

    // Add click action
    mainBuilding.actionManager = new BABYLON.ActionManager(scene);
    mainBuilding.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => onSelect("Processing Plant")
        )
    );

    createLabel("Processing Plant", position, scene);

    return mainBuilding;
}; 