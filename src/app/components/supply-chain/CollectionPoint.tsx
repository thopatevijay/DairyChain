import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface CollectionPointProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    onInspection: (data: MilkData) => void;
}

export const CollectionPoint = ({ scene, position, onInspection }: CollectionPointProps) => {
    const iotActiveMaterial = new BABYLON.StandardMaterial("iotActive", scene);
    iotActiveMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);

    const tank = BABYLON.MeshBuilder.CreateCylinder(
        "tank",
        { height: 3, diameter: 1.5 },
        scene
    );
    tank.position = position;
    tank.material = iotActiveMaterial;

    createLabel("Collection Point", position);
    createRobot(new BABYLON.Vector3(position.x - 2, position.y, position.z), scene, onInspection);

    return tank;
}; 