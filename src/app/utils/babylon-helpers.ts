import * as BABYLON from '@babylonjs/core';
import { MilkData } from '@/app/types/supply-chain';

export const createLabel = (text: string, position: BABYLON.Vector3, scene: BABYLON.Scene) => {
    const plane = BABYLON.MeshBuilder.CreatePlane(
        "label",
        { width: 4, height: 1 },
        scene
    );
    plane.position = new BABYLON.Vector3(
        position.x,
        position.y + 3,
        position.z
    );
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const dynamicTexture = new BABYLON.DynamicTexture(
        "labelTexture",
        { width: 1024, height: 256 },
        scene
    );
    const labelMaterial = new BABYLON.StandardMaterial("labelMaterial", scene);
    labelMaterial.diffuseTexture = dynamicTexture;
    labelMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    labelMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    plane.material = labelMaterial;

    dynamicTexture.drawText(
        text,
        null,
        180,
        "bold 72px Arial",
        "white",
        "#00000088",
        true
    );

    return plane;
};

export const createRobot = (
    position: BABYLON.Vector3,
    scene: BABYLON.Scene,
    onInspection: (data: MilkData) => void
) => {
    const robotMaterial = new BABYLON.StandardMaterial("robotMaterial", scene);
    robotMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);

    // Robot body
    const body = BABYLON.MeshBuilder.CreateBox(
        "robotBody",
        { height: 1.5, width: 1, depth: 0.7 },
        scene
    );
    body.position = new BABYLON.Vector3(position.x, position.y + 0.75, position.z);
    body.material = robotMaterial;

    // Robot head
    const head = BABYLON.MeshBuilder.CreateSphere(
        "robotHead",
        { diameter: 0.5 },
        scene
    );
    head.position = new BABYLON.Vector3(position.x, position.y + 1.75, position.z);
    head.material = robotMaterial;

    // Robot eyes
    const createEye = (offset: number) => {
        const eye = BABYLON.MeshBuilder.CreateSphere(
            "robotEye",
            { diameter: 0.1 },
            scene
        );
        eye.position = new BABYLON.Vector3(
            position.x + offset,
            position.y + 1.8,
            position.z + 0.2
        );
        const eyeMaterial = new BABYLON.StandardMaterial("eyeMaterial", scene);
        eyeMaterial.emissiveColor = new BABYLON.Color3(0, 1, 1);
        eye.material = eyeMaterial;
        return eye;
    };

    createEye(-0.1);
    createEye(0.1);

    // Add hover animation
    const animation = new BABYLON.Animation(
        "robotHover",
        "position.y",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [];
    keys.push({ frame: 0, value: position.y + 0.75 });
    keys.push({ frame: 30, value: position.y + 1.0 });
    keys.push({ frame: 60, value: position.y + 0.75 });
    animation.setKeys(keys);

    body.animations = [animation];
    scene.beginAnimation(body, 0, 60, true);

    // Add interaction
    body.isPickable = true;
    body.actionManager = new BABYLON.ActionManager(scene);
    body.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => {
                const milkData: MilkData = {
                    farmerId: Math.floor(Math.random() * 3) + 1,
                    quantity: Math.floor(Math.random() * 30) + 10,
                    quality: Math.floor(Math.random() * 5) + 25,
                    status: Math.random() > 0.2 ? 'ACCEPTED' : 'REJECTED'
                };
                onInspection(milkData);

                // Visual feedback animation
                const pulseAnimation = new BABYLON.Animation(
                    "pulse",
                    "scaling",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );

                const pulseKeys = [];
                pulseKeys.push({ frame: 0, value: new BABYLON.Vector3(1, 1, 1) });
                pulseKeys.push({ frame: 15, value: new BABYLON.Vector3(1.2, 1.2, 1.2) });
                pulseKeys.push({ frame: 30, value: new BABYLON.Vector3(1, 1, 1) });

                pulseAnimation.setKeys(pulseKeys);
                body.animations = [pulseAnimation];
                scene.beginAnimation(body, 0, 30, false);
            }
        )
    );

    return body;
}; 