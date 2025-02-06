import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface ProcessingPlantProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
}

export const ProcessingPlant = ({ scene, position, onInspection, onSelect }: ProcessingPlantProps) => {
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
    plantMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);

    // Create main building
    const building = BABYLON.MeshBuilder.CreateBox(
        "processingPlant",
        { width: 6, height: 4, depth: 6 },
        scene
    );
    building.position = position;
    building.material = plantMaterial;

    // Create storage tank
    const storageTank = BABYLON.MeshBuilder.CreateCylinder(
        "storageTank",
        { height: 5, diameter: 2 },
        scene
    );
    storageTank.position = new BABYLON.Vector3(position.x + 4, position.y + 2.5, position.z);
    storageTank.material = new BABYLON.StandardMaterial("tankMaterial", scene);
    (storageTank.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);

    // Create bottling unit
    const bottlingUnit = BABYLON.MeshBuilder.CreateBox(
        "bottlingUnit",
        { width: 3, height: 2, depth: 2 },
        scene
    );
    bottlingUnit.position = new BABYLON.Vector3(position.x, position.y, position.z + 4);
    bottlingUnit.material = new BABYLON.StandardMaterial("bottlingMaterial", scene);
    (bottlingUnit.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);

    // Create inspection robot
    const inspectionRobot = createRobot(
        new BABYLON.Vector3(position.x - 4, position.y, position.z),
        scene,
        onInspection
    );

    // Function to create bottle mesh
    const createBottle = () => {
        const bottle = BABYLON.MeshBuilder.CreateCylinder(
            "bottle",
            { height: 0.3, diameterTop: 0.05, diameterBottom: 0.08 },
            scene
        );
        bottle.position = new BABYLON.Vector3(
            bottlingUnit.position.x,
            bottlingUnit.position.y + 1,
            bottlingUnit.position.z
        );
        return bottle;
    };

    // Function to handle milk processing
    const processMilk = async (quantity: number, quality: number) => {
        processedMilkRef.current = {
            quantity,
            bottleCount: Math.floor(quantity),
            status: 'PROCESSING'
        };

        // Animate robot inspection
        scene.beginAnimation(inspectionRobot, 0, 30, false);

        // Pasteurization animation
        const pasteurizationAnimation = new BABYLON.Animation(
            "tankPulse",
            "scaling",
            30,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keys = [];
        keys.push({ frame: 0, value: storageTank.scaling.clone() });
        keys.push({ frame: 15, value: storageTank.scaling.multiply(new BABYLON.Vector3(1.1, 1, 1.1)) });
        keys.push({ frame: 30, value: storageTank.scaling.clone() });

        pasteurizationAnimation.setKeys(keys);
        storageTank.animations = [pasteurizationAnimation];

        // Start processing animation
        await new Promise(resolve => {
            scene.beginAnimation(storageTank, 0, 30, true, 1, () => {
                setTimeout(resolve, 2000); // Processing time
            });
        });

        // Bottling process
        for (let i = 0; i < processedMilkRef.current.bottleCount; i++) {
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
        }

        // Update status when complete
        processedMilkRef.current = {
            ...processedMilkRef.current,
            status: 'COMPLETED'
        };

        onInspection({
            farmerId: -1,
            quantity: processedMilkRef.current.quantity,
            quality: quality,
            status: 'ACCEPTED',
            timestamp: new Date().toLocaleTimeString(),
            summary: {
                totalQuantity: processedMilkRef.current.quantity,
                bottleCount: processedMilkRef.current.bottleCount,
                processedStatus: 'Completed'
            }
        });
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
    building.actionManager = new BABYLON.ActionManager(scene);
    building.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => onSelect("Processing Plant")
        )
    );

    createLabel("Processing Plant", position, scene);

    return building;
}; 