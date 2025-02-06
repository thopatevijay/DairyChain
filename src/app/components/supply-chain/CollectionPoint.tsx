import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface CollectionPointProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
    processingPlantPosition: BABYLON.Vector3;
}

interface CollectedMilk {
    totalQuantity: number;
    farmerCount: number;
    averageQuality: number;
}

export const CollectionPoint = ({ scene, position, onInspection, onSelect, processingPlantPosition }: CollectionPointProps) => {
    let collectedMilk: CollectedMilk = {
        totalQuantity: 0,
        farmerCount: 0,
        averageQuality: 0
    };

    const iotActiveMaterial = new BABYLON.StandardMaterial("iotActive", scene);
    iotActiveMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);

    const tank = BABYLON.MeshBuilder.CreateCylinder(
        "tank",
        { height: 3, diameter: 1.5 },
        scene
    );
    tank.position = position;
    tank.material = iotActiveMaterial;

    tank.actionManager = new BABYLON.ActionManager(scene);
    tank.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => onSelect("Collection Point")
        )
    );

    createLabel("Collection Point", position, scene);
    createRobot(new BABYLON.Vector3(position.x - 2, position.y, position.z), scene, onInspection);

    // Create IoT-enabled milk transport truck
    const createMilkTruck = () => {
        // Create parent mesh for the truck
        const truck = new BABYLON.Mesh("truck", scene);
        
        // Truck cabin
        const cabin = BABYLON.MeshBuilder.CreateBox(
            "cabin",
            { width: 1.2, height: 1.2, depth: 1 },
            scene
        );
        cabin.position = new BABYLON.Vector3(0, 0.6, 0);
        cabin.parent = truck;

        // Truck hood (engine compartment)
        const hood = BABYLON.MeshBuilder.CreateBox(
            "hood",
            { width: 0.8, height: 0.6, depth: 1 },
            scene
        );
        hood.position = new BABYLON.Vector3(1, 0.3, 0);
        hood.parent = truck;

        // Milk tank
        const tank = BABYLON.MeshBuilder.CreateCylinder(
            "tank",
            { height: 2.5, diameter: 1 },
            scene
        );
        tank.position = new BABYLON.Vector3(-1, 0.8, 0);
        tank.rotation.z = Math.PI/2;
        tank.parent = truck;

        // Wheels
        const createWheel = (x: number, z: number) => {
            const wheel = BABYLON.MeshBuilder.CreateCylinder(
                `wheel_${x}_${z}`,
                { height: 0.2, diameter: 0.4 },
                scene
            );
            wheel.rotation.x = Math.PI/2;
            wheel.position = new BABYLON.Vector3(x, 0.2, z);
            wheel.parent = truck;
            return wheel;
        };

        // Create 6 wheels (3 on each side)
        createWheel(0.8, 0.6);  // Front right
        createWheel(0.8, -0.6); // Front left
        createWheel(-0.8, 0.6);  // Back right
        createWheel(-0.8, -0.6); // Back left
        createWheel(-1.4, 0.6);  // Far back right
        createWheel(-1.4, -0.6); // Far back left

        // Materials
        const cabinMaterial = new BABYLON.StandardMaterial("cabinMaterial", scene);
        cabinMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3);
        cabin.material = cabinMaterial;
        hood.material = cabinMaterial;

        const tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
        tankMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        tankMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        tank.material = tankMaterial;

        const wheelMaterial = new BABYLON.StandardMaterial("wheelMaterial", scene);
        wheelMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        truck.getChildMeshes()
            .filter(mesh => mesh.name.startsWith('wheel'))
            .forEach(wheel => wheel.material = wheelMaterial);

        // Position the entire truck
        truck.position = new BABYLON.Vector3(position.x - 3, position.y, position.z);
        
        return truck;
    };

    const truck = createMilkTruck();
    truck.setEnabled(false); // Hide truck initially

    // Function to handle milk collection
    const handleMilkCollection = (data: MilkData) => {
        console.log('Received milk delivery:', data); // Debug log
        
        if (data.status === 'ACCEPTED') {
            collectedMilk.totalQuantity += data.quantity;
            collectedMilk.farmerCount++;
            collectedMilk.averageQuality = 
                ((collectedMilk.averageQuality * (collectedMilk.farmerCount - 1)) + data.quality) / 
                collectedMilk.farmerCount;

            console.log('Updated collection:', collectedMilk); // Debug log

            // If collected from all farmers (3 in this case)
            if (collectedMilk.farmerCount === 3) {
                console.log('Collection complete, preparing transport'); // Debug log
                
                // Show collection summary alert
                onInspection({
                    farmerId: 0,
                    quantity: collectedMilk.totalQuantity,
                    quality: collectedMilk.averageQuality,
                    status: 'ACCEPTED',
                    timestamp: new Date().toLocaleTimeString(),
                    summary: {
                        totalQuantity: collectedMilk.totalQuantity,
                        farmerCount: collectedMilk.farmerCount,
                        averageQuality: collectedMilk.averageQuality
                    }
                });

                // Start transport to processing plant
                transportMilk();

                // Reset collection
                collectedMilk = {
                    totalQuantity: 0,
                    farmerCount: 0,
                    averageQuality: 0
                };
            }
        }
    };

    // Function to transport milk to processing plant
    const transportMilk = () => {
        truck.setEnabled(true);
        const frameRate = 30;
        const animationDuration = 120;

        // Create straight path animation
        const animation = new BABYLON.Animation(
            "truckDelivery",
            "position",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Calculate direct path
        const startPos = truck.position.clone();
        const endPos = new BABYLON.Vector3(processingPlantPosition.x - 3, position.y, position.z);

        const keys = [
            { frame: 0, value: startPos },
            { frame: animationDuration, value: endPos }
        ];
        animation.setKeys(keys);

        // Single rotation at start to face direction of travel
        const rotationAnimation = new BABYLON.Animation(
            "truckRotation",
            "rotation.y",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const rotationKeys = [
            { frame: 0, value: 0 },
            { frame: 5, value: 0 } // Keep truck straight
        ];
        rotationAnimation.setKeys(rotationKeys);

        truck.animations = [animation, rotationAnimation];

        scene.beginAnimation(truck, 0, animationDuration, false, 1, () => {
            truck.setEnabled(false);
            truck.position = startPos;
            truck.rotation.y = 0;
            
            // Trigger processing plant
            scene.metadata = {
                ...scene.metadata,
                processingDelivery: {
                    quantity: collectedMilk.totalQuantity,
                    quality: collectedMilk.averageQuality
                }
            };
        });
    };

    // Register for milk collection events with more frequent checks
    scene.onBeforeRenderObservable.add(() => {
        if (scene.metadata?.milkDelivery) {
            console.log('Detected milk delivery event'); // Debug log
            handleMilkCollection(scene.metadata.milkDelivery);
            scene.metadata.milkDelivery = null;
        }
    });

    return tank;
}; 