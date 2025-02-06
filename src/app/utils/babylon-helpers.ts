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
    onInspection: (data: MilkData) => void,
    color?: BABYLON.Color3
) => {
    const robotMaterial = new BABYLON.StandardMaterial("robotMaterial", scene);
    robotMaterial.diffuseColor = color || new BABYLON.Color3(0.7, 0.7, 0.7);
    robotMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    // Robot body
    const body = BABYLON.MeshBuilder.CreateBox(
        "robotBody",
        { height: 1.2, width: 0.8, depth: 0.6 },
        scene
    );
    body.position = position.add(new BABYLON.Vector3(0, 0.6, 0));
    body.material = robotMaterial;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere(
        "robotHead",
        { diameter: 0.4 },
        scene
    );
    head.position = body.position.add(new BABYLON.Vector3(0, 0.8, 0));
    head.material = robotMaterial;

    // Arms
    const createArm = (side: number) => {
        const arm = BABYLON.MeshBuilder.CreateCylinder(
            `robotArm${side}`,
            { height: 0.8, diameter: 0.15 },
            scene
        );
        arm.position = body.position.add(new BABYLON.Vector3(side * 0.5, 0, 0));
        arm.rotation.z = side * Math.PI / 4;
        arm.material = robotMaterial;
        return arm;
    };

    const leftArm = createArm(-1);
    const rightArm = createArm(1);

    // Eyes
    const createEye = (side: number) => {
        const eye = BABYLON.MeshBuilder.CreateSphere(
            `robotEye${side}`,
            { diameter: 0.1 },
            scene
        );
        eye.position = head.position.add(new BABYLON.Vector3(side * 0.15, 0, -0.15));
        const eyeMaterial = new BABYLON.StandardMaterial("eyeMaterial", scene);
        eyeMaterial.emissiveColor = new BABYLON.Color3(0, 1, 1);
        eye.material = eyeMaterial;
        return eye;
    };

    const leftEye = createEye(-1);
    const rightEye = createEye(1);

    // Create a parent mesh to group all robot parts
    const robot = new BABYLON.Mesh("robot", scene);
    [body, head, leftArm, rightArm, leftEye, rightEye].forEach(part => {
        part.parent = robot;
    });

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
                    status: Math.random() > 0.2 ? 'ACCEPTED' : 'REJECTED',
                    timestamp: new Date().toLocaleTimeString()
                };
                onInspection(milkData);
                
                // Animation
                const pulseAnimation = new BABYLON.Animation(
                    "pulse",
                    "scaling",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                
                const pulseKeys = [];
                pulseKeys.push({ frame: 0, value: robot.scaling.clone() });
                pulseKeys.push({ frame: 15, value: robot.scaling.multiply(new BABYLON.Vector3(1.2, 1.2, 1.2)) });
                pulseKeys.push({ frame: 30, value: robot.scaling.clone() });
                
                pulseAnimation.setKeys(pulseKeys);
                robot.animations = [pulseAnimation];
                scene.beginAnimation(robot, 0, 30, false);
            }
        )
    );

    return robot;
}; 