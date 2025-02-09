import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';
import { createMilkTruck } from '@/app/utils/createMilkTruck';
import { transportMilk } from '@/app/utils/transportMilk';

interface DistributorProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
    retailerPosition: BABYLON.Vector3;
    addLogEntry: (log: string) => void;
}

export interface DistributorStats {
    totalQuantity: number;
    averageQuality: number;
    status: string;
}

export const Distributor = ({ scene, position, onInspection, onSelect, addLogEntry, retailerPosition }: DistributorProps) => {

    let distributorStats: DistributorStats = {
        totalQuantity: 0,
        averageQuality: 0,
        status: 'PENDING',
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

    const showNotice = (stats: DistributorStats) => {
        // Just call the callbacks to update UI
        onInspection({
            farmerId: -1,
            quantity: stats.totalQuantity,
            quality: stats.averageQuality,
            status: 'ACCEPTED',
            timestamp: new Date().toLocaleTimeString(),
            summary: {
                totalQuantity: stats.totalQuantity,
                averageQuality: stats.averageQuality
            }
        });
    };

    const handleMilkDelivery = (data: MilkData) => {
        console.log('Received milk delivery:', data);
        addLogEntry(`AGENT ACTIVATED: Distributor`);
        addLogEntry(`STATUS: RECEIVED_MILK_FROM_PROCESSING_PLANT`);
        addLogEntry(`Distributor Status: ` +
            `Total Bottles received: ${data.quantity}L\n` +
            `Received at: ${new Date().toLocaleTimeString()}`
        );
        distributorStats.status = 'INSPECTING_MILK_QUALITY';

        distributorStats.totalQuantity += data.quantity;
        distributorStats.averageQuality = data.quality;



        console.log('Distributor collected milk:', distributorStats);

        showNotice(distributorStats);


        distributorStats.status = 'DISPATCHED_TO_RETAILER'
        addLogEntry(`STATUS: DISPATCHED_TO_RETAILER`);
        addLogEntry(`Distributor Status: ` +
            `Total Bottles Dispatched: ${distributorStats.totalQuantity}L\n` +
            `Dispatched at: ${new Date().toLocaleTimeString()}`
        );

        const distributorDeliveryToRetailer = {
            distributorDeliveryToRetailer: {
                quantity: distributorStats.totalQuantity,
                quality: distributorStats.averageQuality
            }
        };

        // await new Promise(resolve => {
        // });

        setTimeout(() => {
            transportMilk(
                truck,
                position,
                retailerPosition,
                scene,
                distributorDeliveryToRetailer
            );
        }, 2000);


        distributorStats = {
            totalQuantity: 0,
            averageQuality: 0,
            status: 'ACCEPTED'
        };

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
