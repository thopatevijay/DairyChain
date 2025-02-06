import * as BABYLON from '@babylonjs/core';
import { createLabel, createRobot } from '@/app/utils/babylon-helpers';
import { MilkData } from '@/app/types/supply-chain';

interface FarmNodeProps {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    index: number;
    onInspection: (data: MilkData) => void;
    onSelect: (nodeName: string) => void;
}

export const FarmNode = ({ scene, position, index, onInspection, onSelect }: FarmNodeProps) => {
    const blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
    blueMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);

    const farm = BABYLON.MeshBuilder.CreateBox(
        `farm${index}`,
        { width: 1.5, height: 1.5, depth: 1.5 },
        scene
    );
    farm.position = position;
    farm.material = blueMaterial;

    createLabel(`Farmer ${index + 1}`, position, scene);
    createRobot(new BABYLON.Vector3(position.x - 2, position.y, position.z), scene, onInspection);

    farm.actionManager = new BABYLON.ActionManager(scene);

    // Add milk delivery animation
    const deliverMilk = () => {
        // Create milk container
        const container = BABYLON.MeshBuilder.CreateCylinder(
            `milkContainer${index}`,
            { height: 0.8, diameter: 0.4 },
            scene
        );
        container.position = position;
        
        // Animate container to collection point
        const targetPosition = new BABYLON.Vector3(position.x + 15, position.y, 0);
        const frameRate = 30;
        const animationDuration = 60;

        const animation = new BABYLON.Animation(
            "deliveryAnimation",
            "position",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [
            { frame: 0, value: position.clone() },
            { frame: animationDuration, value: targetPosition }
        ];
        animation.setKeys(keys);

        container.animations = [animation];
        scene.beginAnimation(container, 0, animationDuration, false, 1, () => {
            container.dispose();
            // Trigger inspection at collection point
            const milkData: MilkData = {
                farmerId: index + 1,
                quantity: Math.floor(Math.random() * 30) + 10,
                quality: Math.floor(Math.random() * 5) + 25,
                status: Math.random() > 0.2 ? 'ACCEPTED' : 'REJECTED',
                timestamp: new Date().toLocaleTimeString()
            };
            onInspection(milkData);
        });
    };

    // Add click action for delivery
    farm.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => {
                onSelect(`Farmer ${index + 1}`);
                deliverMilk();
            }
        )
    );

    return farm;
}; 