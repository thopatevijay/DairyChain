import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface RetailerProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
    addLogEntry: (log: string) => void;
}

export const Retailer = ({ scene, position, onInspection, onSelect, addLogEntry }: RetailerProps) => {
    const blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
    blueMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);

    const retailer = BABYLON.MeshBuilder.CreateBox(
        "retailer",
        { width: 1.5, height: 2, depth: 1.5 },
        scene
    );
    retailer.position = position;
    retailer.material = blueMaterial;

    retailer.actionManager = new BABYLON.ActionManager(scene);
    retailer.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => onSelect("Retailer")
        )
    );

    createLabel("Retailer", position, scene);
    createRobot(new BABYLON.Vector3(position.x + 2, position.y, position.z), scene, onInspection);


    const handleAcceptDeliveryByDistributor = (delivery: MilkData) => {
        addLogEntry(`AGENT ACTIVATED: Retailer`);
        addLogEntry(`STATUS: RECEIVED_MILK_FROM_DISTRIBUTOR`);
        onInspection(delivery);
        addLogEntry(`Retailer Status: ` +
            `Total Bottles received: ${delivery.quantity}L\n` +
            `Received at: ${new Date().toLocaleTimeString()}`
        );
        addLogEntry(`STATUS: ACCEPTED_MILK_FROM_DISTRIBUTOR`);
    };
    // Listen for milk delivery
    scene.onBeforeRenderObservable.add(() => {
        if (scene.metadata?.distributorDeliveryToRetailer) {
            const delivery = scene.metadata.distributorDeliveryToRetailer;
            handleAcceptDeliveryByDistributor(delivery);
            scene.metadata.distributorDeliveryToRetailer = null;
        }
    });

    return retailer;
};
