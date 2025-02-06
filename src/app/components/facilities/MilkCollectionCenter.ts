import { 
    Scene, 
    Vector3, 
    MeshBuilder, 
    StandardMaterial, 
    Color3,
    Animation,
    Mesh
} from '@babylonjs/core';

export const createMilkCollectionCenter = (scene: Scene, position: Vector3) => {
    // Collection Center Building
    const building = MeshBuilder.CreateBox("collectionCenter", {
        height: 4,
        width: 8,
        depth: 6
    }, scene);
    building.position = position;

    // Testing Station (where robots inspect milk)
    const testingStation = MeshBuilder.CreateBox("testingStation", {
        height: 1,
        width: 3,
        depth: 2
    }, scene);
    testingStation.position = new Vector3(position.x - 4, position.y - 1, position.z + 4);

    // IoT Tank
    const tank = MeshBuilder.CreateCylinder("storageTank", {
        height: 4,
        diameter: 3,
        tessellation: 20
    }, scene);
    tank.position = new Vector3(position.x + 4, position.y, position.z);

    // Robot
    const createRobot = () => {
        const body = MeshBuilder.CreateBox("robotBody", {
            height: 1.5,
            width: 1,
            depth: 1
        }, scene);
        body.position = new Vector3(position.x - 4, position.y - 1.25, position.z + 4);

        const head = MeshBuilder.CreateSphere("robotHead", {
            diameter: 0.5
        }, scene);
        head.position = new Vector3(body.position.x, body.position.y + 1, body.position.z);

        // Robot arm animation
        const arm = MeshBuilder.CreateBox("robotArm", {
            height: 0.2,
            width: 1,
            depth: 0.2
        }, scene);
        arm.position = new Vector3(body.position.x + 0.5, body.position.y + 0.5, body.position.z);

        // Create arm inspection animation
        const armAnimation = new Animation(
            "armAnimation",
            "rotation.x",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keyFrames = [];
        keyFrames.push({
            frame: 0,
            value: 0
        });
        keyFrames.push({
            frame: 30,
            value: Math.PI / 4
        });
        keyFrames.push({
            frame: 60,
            value: 0
        });

        armAnimation.setKeys(keyFrames);
        arm.animations = [armAnimation];
        scene.beginAnimation(arm, 0, 60, true);

        return { body, head, arm };
    };

    // Create milk cans
    const createMilkCan = (offsetX: number): Mesh => {
        const can = MeshBuilder.CreateCylinder("milkCan", {
            height: 1,
            diameter: 0.5,
            tessellation: 12
        }, scene);
        can.position = new Vector3(position.x - 6 + offsetX, position.y - 1.5, position.z + 4);
        return can;
    };

    // Create multiple milk cans
    const milkCans = [-1, 0, 1].map(offset => createMilkCan(offset));

    // Materials
    const buildingMaterial = new StandardMaterial("buildingMaterial", scene);
    buildingMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2);
    building.material = buildingMaterial;

    const tankMaterial = new StandardMaterial("tankMaterial", scene);
    tankMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
    tank.material = tankMaterial;

    const robotMaterial = new StandardMaterial("robotMaterial", scene);
    robotMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);

    const robot = createRobot();
    robot.body.material = robotMaterial;
    robot.head.material = robotMaterial;
    robot.arm.material = robotMaterial;

    return {
        building,
        testingStation,
        tank,
        robot,
        milkCans
    };
};