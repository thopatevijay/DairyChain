import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface CustomerProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
}

export const Customer = ({ scene, position, onInspection, onSelect }: CustomerProps) => {
    const blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
    blueMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);

    const customer = BABYLON.MeshBuilder.CreateSphere(
        "customer",
        { diameter: 1 },
        scene
    );
    customer.position = position;
    customer.material = blueMaterial;

    customer.actionManager = new BABYLON.ActionManager(scene);
    customer.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => onSelect("Customer")
        )
    );

    createLabel("Customer", position, scene);
    createRobot(new BABYLON.Vector3(position.x + 2, position.y, position.z), scene, onInspection);

    return customer;
};
