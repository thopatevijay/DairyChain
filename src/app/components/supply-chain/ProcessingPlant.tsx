import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';
import { createMilkTruck } from '@/app/utils/createMilkTruck';
import { transportMilk } from '@/app/utils/transportMilk';

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
    status?: string;
}

interface ProcessingPlantProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
    onStatusUpdate?: (stats: ProcessingStats) => void;
    distributorPosition: BABYLON.Vector3;
    addLogEntry: (log: string) => void;
}

export const ProcessingPlant = ({ scene, position, onInspection, onSelect, onStatusUpdate, distributorPosition, addLogEntry }: ProcessingPlantProps) => {
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
            isDispatched: false,
            status: 'WAITING'
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

    const animateRobot = async (robot: BABYLON.Mesh, animationName: string, duration: number) => {
        const animation = new BABYLON.Animation(
            animationName,
            "position",
            duration,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [];
        keys.push({ frame: 0, value: robot.position.clone() });
        keys.push({
            frame: duration, value: new BABYLON.Vector3(
                robot.position.x,
                robot.position.y + 0.5,
                robot.position.z
            )
        });

        animation.setKeys(keys);
        robot.animations = [animation];
        scene.beginAnimation(robot, 0, duration, false);
        await new Promise(resolve => setTimeout(resolve, duration));
    };

    const truck = createMilkTruck(scene, position);
    truck.setEnabled(false); // Hide truck initially

    // Add robot-specific functions
    const inspectMilk = async (quantity: number, quality: number) => {
        statsRef.current.status = 'INSPECTING';
        showNotice({
            ...statsRef.current,
            status: 'INSPECTING'
        });

        addLogEntry(`AGENT ACTIVATED: Milk Inspector`);

        addLogEntry(`MILK INSPECTOR UPDATES:` +
            `Trucks: ${statsRef.current.trucksReceived}\n` +
            `Milk Quantity: ${quantity}L\n` +
            `Milk Quality: ${quality}`);

        // Inspection robot animation
        await animateRobot(inspectionRobot, "inspectionAnimation", 3000);

        statsRef.current.acceptedTrucks++;
        statsRef.current.totalMilkQty += quantity;
        statsRef.current.avgQuality =
            ((statsRef.current.avgQuality * (statsRef.current.acceptedTrucks - 1)) + quality) /
            statsRef.current.acceptedTrucks;

        statsRef.current.status = 'INSPECTION_COMPLETED';
        addLogEntry(`MILK INSPECTOR UPDATES:` +
            `Milk Quantity: ${statsRef.current.totalMilkQty}L\n` +
            `Milk Quality: ${statsRef.current.avgQuality}`);
        return true;
    };

    const processMilkBatch = async () => {
        addLogEntry(`AGENT ACTIVATED: Milk Processor`);
        addLogEntry(`STATUS: PROCESSING_STARTED`);
        addLogEntry(`MILK PROCESSOR UPDATES: ` +
            `Milk Quantity: ${statsRef.current.totalMilkQty}L\n` +
            `Milk Quality: ${statsRef.current.avgQuality}`);

        statsRef.current.status = 'PROCESSING_STARTED';
        statsRef.current.processingStartTime = new Date().toLocaleTimeString();
        showNotice({ ...statsRef.current, status: 'PROCESSING_STARTED' });

        // Processing robot animation
        await animateRobot(processingRobot, "processingAnimation", 3000);

        addLogEntry(`STATUS: PROCESSING_COMPLETED`);
        addLogEntry(`MILK PROCESSOR UPDATES: ` +
            `Milk Quantity: ${statsRef.current.totalMilkQty}L\n` +
            `Milk Quality: ${statsRef.current.avgQuality}`);

        statsRef.current.processingEndTime = new Date().toLocaleTimeString();
        statsRef.current.status = 'PROCESSING_COMPLETED';
    };

    const manageProduction = async () => {
        addLogEntry(`AGENT ACTIVATED: Production Manager`);
        addLogEntry(`STATUS: PRODUCTION_STARTED`);
        addLogEntry(`PRODUCTION MANAGER UPDATES: ` +
            `Total Milk Quantity: ${statsRef.current.totalMilkQty}L\n` +
            `Average Quality: ${statsRef.current.avgQuality}\n` +
            `Production Start Time: ${new Date().toLocaleTimeString()}`);

        statsRef.current.status = 'PRODUCTION_STARTED';
        statsRef.current.productionStartTime = new Date().toLocaleTimeString();
        showNotice({ ...statsRef.current, status: 'PRODUCTION_STARTED' });

        // Production robot animation
        await animateRobot(productionRobot, "productionAnimation", 3000);

        addLogEntry(`STATUS: BOTTLE_PACKING_STARTED`);
        // Bottling process
        const bottleCount = Math.floor(statsRef.current.totalMilkQty);
        for (let i = 0; i < bottleCount; i++) {
            const bottle = createBottle();

            await new Promise(resolve => {
                scene.beginAnimation(bottle, 0, 30, false, 1, () => {
                    setTimeout(() => {
                        bottle.dispose();
                        resolve(true);
                    }, 100);
                });
            });
            statsRef.current.bottlesPacked++;
        }

        addLogEntry(`STATUS: BOTTLE_PACKING_COMPLETED`);
        statsRef.current.productionEndTime = new Date().toLocaleTimeString();
        statsRef.current.status = 'PRODUCTION_COMPLETED';
        addLogEntry(`STATUS: PRODUCTION_COMPLETED`);
        addLogEntry(`PRODUCTION MANAGER UPDATES: ` +
            `Total Milk Quantity: ${statsRef.current.totalMilkQty}L\n` +
            `Production End Time: ${statsRef.current.productionEndTime}\n` +
            `Bottles Packed: ${statsRef.current.bottlesPacked}`);
    };

    const dispatchProducts = async () => {
        addLogEntry(`AGENT ACTIVATED: Production Dispatcher`);
        addLogEntry(`STATUS: DISPATCHING_TO_DISTRIBUTION`);
        statsRef.current.status = 'DISPATCHING';
        showNotice({ ...statsRef.current, status: 'DISPATCHING' });

        // Dispatch animation
        await animateRobot(dispatchRobot, "dispatchAnimation", 3000);

        statsRef.current.isDispatched = true;
        statsRef.current.status = 'DISPATCHED_TO_DISTRIBUTION';
        addLogEntry(`STATUS: DISPATCHED_TO_DISTRIBUTION`);
        addLogEntry(`PRODUCTION DISPATCHER UPDATES: ` +
            `Total Bottles Dispatched: ${statsRef.current.bottlesPacked}\n` +
            `Dispatch Time: ${new Date().toLocaleTimeString()}`);

        showNotice({
            ...statsRef.current,
            status: 'DISPATCHED_TO_DISTRIBUTION'
        });


        const distributorDelivery = {
            distributorDelivery: {
                quantity: statsRef.current.totalMilkQty,
                quality: statsRef.current.avgQuality
            }
        };

        transportMilk(
            truck,
            position,
            distributorPosition,
            scene,
            distributorDelivery
        );
    };

    // Updated processMilk function to orchestrate the workflow
    const processMilk = async (quantity: number, quality: number) => {
        statsRef.current.trucksReceived++;

        const isAccepted = await inspectMilk(quantity, quality);
        if (!isAccepted) return;
        if (statsRef.current.status === 'INSPECTION_COMPLETED') await processMilkBatch();
        if (statsRef.current.status === 'PROCESSING_COMPLETED') await manageProduction();
        if (statsRef.current.status === 'PRODUCTION_COMPLETED') await dispatchProducts();
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