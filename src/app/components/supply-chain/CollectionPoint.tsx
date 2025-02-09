import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';
import { createMilkTruck } from '@/app/utils/createMilkTruck';
import { transportMilk } from '@/app/utils/transportMilk';

interface CollectionPointProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
    processingPlantPosition: BABYLON.Vector3;
    addLogEntry: (log: string) => void;
}

interface CollectedMilk {
    totalQuantity: number;
    farmerCount: number;
    averageQuality: number;
}

export const CollectionPoint = ({ scene, position, onInspection, onSelect, processingPlantPosition, addLogEntry }: CollectionPointProps) => {
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

    const truck = createMilkTruck(scene, position);
    truck.setEnabled(false); // Hide truck initially

    // Function to handle milk collection
    const handleMilkCollection = (data: MilkData) => {
        console.log('Received milk delivery:', data); // Debug log
        addLogEntry(`AGENT ACTIVATED: Milk Collector`);
        addLogEntry(`STATUS: COLLECTING MILK FROM FARMERS`);

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

                addLogEntry(`STATUS: MILK BATCH CREATED` +
                    `Average Quality: ${collectedMilk.averageQuality}SNF` +
                    `Total quantity: ${collectedMilk.totalQuantity}L` +
                    `Created at: ${new Date().toLocaleTimeString()}`
                );

                const processingDelivery = {
                    processingDelivery: {
                        quantity: collectedMilk.totalQuantity,
                        quality: collectedMilk.averageQuality
                    }
                };

                addLogEntry(`STATUS: MILK BATCH SENT TO PROCESSING PLANT`);

                transportMilk(
                    truck,
                    position,
                    processingPlantPosition,
                    scene,
                    processingDelivery
                );

                // Reset collection
                collectedMilk = {
                    totalQuantity: 0,
                    farmerCount: 0,
                    averageQuality: 0
                };

                // scene.metadata = {
                //     ...scene.metadata,
                //     processingDelivery: {
                //         quantity: collectedMilk.totalQuantity,
                //         quality: collectedMilk.averageQuality
                //     }
                // };
            }
        }
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