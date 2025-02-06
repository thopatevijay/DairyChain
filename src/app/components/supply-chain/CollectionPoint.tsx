import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface CollectionPointProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
}

export const CollectionPoint = ({ scene, position, onInspection, onSelect }: CollectionPointProps) => {
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

    return tank;
}; 