import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface DistributorProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
}

export const Distributor = ({ scene, position, onInspection, onSelect }: DistributorProps) => {
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

    return distributor;
};
