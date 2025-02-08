import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';
import { createMilkTruck } from '@/app/utils/createMilkTruck';

interface DistributorProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
}

interface CollectedMilk {
    totalQuantity: number;
    farmerCount: number;
    averageQuality: number;
}

export const Distributor = ({ scene, position, onInspection, onSelect }: DistributorProps) => {

    let collectedMilk: CollectedMilk = {
        totalQuantity: 0,
        farmerCount: 0,
        averageQuality: 0
    };

    const blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
    blueMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);

    const distributor = BABYLON.MeshBuilder.CreateBox(
        "distributor",
        { width: 2, height: 2, depth: 2 },
        scene
    );
    distributor.position = new BABYLON.Vector3(15, 0, 0);
    distributor.material = blueMaterial;

    distributor.actionManager = new BABYLON.ActionManager(scene);
    distributor.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => onSelect("Distributor")
        )
    );
    createLabel("Distributor", position, scene);
    createRobot(new BABYLON.Vector3(position.x + 2, position.y, position.z), scene, onInspection);

    const truck = createMilkTruck(scene, position);
    truck.setEnabled(false); // Hide truck initially

    const handleMilkDelivery = (data: MilkData) => {
        console.log('Received milk delivery:', data);

        if (data.status === 'ACCEPTED') {
            collectedMilk.totalQuantity += data.quantity;
            collectedMilk.farmerCount++;
            collectedMilk.averageQuality =
                ((collectedMilk.averageQuality * (collectedMilk.farmerCount - 1)) + data.quality) /
                collectedMilk.farmerCount;

            console.log('Distributor collected milk:', collectedMilk);

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

            collectedMilk = {
                totalQuantity: 0,
                farmerCount: 0,
                averageQuality: 0
            };
        }

    };

    // Function to transport milk to 


    // Listen for milk delivery from processing plant
    scene.onBeforeRenderObservable.add(() => {
        if (scene.metadata?.distributorDelivery) {
            const delivery = scene.metadata.distributorDelivery;
            handleMilkDelivery(delivery);
            scene.metadata.distributorDelivery = null;
        }
    });

    return distributor;
};
