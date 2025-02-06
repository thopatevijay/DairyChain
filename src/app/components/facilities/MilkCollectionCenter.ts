import { 
    Scene, 
    Vector3, 
    MeshBuilder, 
    StandardMaterial, 
    Color3,
    Animation,
    Mesh,
    DynamicTexture
} from '@babylonjs/core';

// Add GUI imports from the correct package
import { 
    AdvancedDynamicTexture,
    TextBlock,
    StackPanel
} from '@babylonjs/gui';

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

    // Add rejection area
    const rejectionArea = MeshBuilder.CreateBox("rejectionArea", {
        height: 0.2,
        width: 2,
        depth: 2
    }, scene);
    rejectionArea.position = new Vector3(position.x - 4, position.y - 1.5, position.z + 6);
    
    const rejectionMaterial = new StandardMaterial("rejectionMaterial", scene);
    rejectionMaterial.diffuseColor = new Color3(0.8, 0.2, 0.2);
    rejectionArea.material = rejectionMaterial;

    // Add truck loading area
    const truckLoadingArea = MeshBuilder.CreateBox("truckLoadingArea", {
        height: 0.2,
        width: 3,
        depth: 4
    }, scene);
    truckLoadingArea.position = new Vector3(position.x + 6, position.y - 1.5, position.z);
    
    // Create milk can movement animations
    const animateMilkInspection = (can: Mesh, isAccepted: boolean) => {
        const inspectionAnimation = new Animation(
            "canInspection",
            "position",
            30,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const frames = [];
        // Move to inspection
        frames.push({
            frame: 0,
            value: can.position.clone()
        });
        frames.push({
            frame: 30,
            value: new Vector3(position.x - 4, position.y - 1, position.z + 4)
        });
        // Wait for inspection
        frames.push({
            frame: 60,
            value: new Vector3(position.x - 4, position.y - 1, position.z + 4)
        });
        // Move to destination based on inspection result
        frames.push({
            frame: 90,
            value: isAccepted 
                ? new Vector3(position.x + 6, position.y - 1, position.z) // Truck area
                : new Vector3(position.x - 4, position.y - 1, position.z + 6) // Rejection area
        });

        inspectionAnimation.setKeys(frames);
        can.animations = [inspectionAnimation];
        
        // Start the animation
        scene.beginAnimation(can, 0, 90, false, 1, () => {
            // Optional: Remove the can after animation
            can.dispose();
        });
    };

    // Modify simulateMilkDelivery to update notice board
    const simulateMilkDelivery = () => {
        const newCan = createMilkCan(-1);
        const isAccepted = Math.random() < 0.8;
        
        // Generate random data for demonstration
        const deliveryData = {
            batchId: `B${Math.floor(Math.random() * 1000)}`,
            totalQuantity: Math.floor(Math.random() * 20) + 10, // 10-30 L
            quality: isAccepted ? 'Grade A' : 'Below Standard',
            status: isAccepted ? 'ACCEPTED' : 'REJECTED' as const,
            timestamp: new Date().toISOString()
        };

        // Update notice board with new delivery
        updateNoticeBoard(deliveryData);

        setTimeout(() => {
            animateMilkInspection(newCan, isAccepted);
        }, 1000);
    };

    // Simulate periodic milk deliveries
    setInterval(simulateMilkDelivery, 5000);

    // Create flow indicators (arrows)
    const createFlowArrow = (start: Vector3, end: Vector3) => {
        const points = [start, end];
        const lines = MeshBuilder.CreateLines("flowArrow", { points }, scene);
        lines.color = new Color3(0.3, 0.3, 0.8);
        return lines;
    };

    // Add flow indicators
    createFlowArrow(
        new Vector3(position.x - 8, position.y, position.z),
        new Vector3(position.x - 4, position.y, position.z)
    );
    createFlowArrow(
        new Vector3(position.x + 4, position.y, position.z),
        new Vector3(position.x + 8, position.y, position.z)
    );

    // Create notice board
    const createNoticeBoard = () => {
        // Notice board background
        const board = MeshBuilder.CreatePlane("noticeBoard", {
            width: 4,
            height: 3
        }, scene);
        board.position = new Vector3(position.x - 3, position.y + 2, position.z - 2);
        board.rotation.y = Math.PI / 4; // Angle for better visibility

        // Create dynamic texture for the notice board
        const texture = new DynamicTexture("noticeTexture", {
            width: 512,
            height: 384
        }, scene);
        const material = new StandardMaterial("noticeBoardMaterial", scene);
        material.diffuseTexture = texture;
        board.material = material;

        // Create GUI texture
        const gui = AdvancedDynamicTexture.CreateForMesh(board);
        
        // Create container for content
        const container = new StackPanel();
        container.width = "100%";
        container.height = "100%";
        container.background = "#2c2c2c";
        container.alpha = 0.8;
        gui.addControl(container);

        // Function to update notice board
        const updateNoticeBoard = (data: {
            batchId: string;
            totalQuantity: number;
            quality: string;
            status: 'ACCEPTED' | 'REJECTED';
            timestamp: string;
        }) => {
            container.clearControls();

            const addTextLine = (text: string, color: string = "white") => {
                const textBlock = new TextBlock();
                textBlock.text = text;
                textBlock.color = color;
                textBlock.height = "40px";
                textBlock.fontSize = 24;
                container.addControl(textBlock);
            };

            addTextLine("BULK COLLECTION STATUS", "#4CAF50");
            addTextLine("-------------------");
            addTextLine(`Batch ID: ${data.batchId}`);
            addTextLine(`Total Quantity: ${data.totalQuantity} L`);
            addTextLine(`Quality Check: ${data.quality}`);
            addTextLine(`Status: ${data.status}`, 
                data.status === 'ACCEPTED' ? '#4CAF50' : '#FF5252');
            addTextLine(`Time: ${data.timestamp}`);
            addTextLine("-------------------");
        };

        return updateNoticeBoard;
    };

    const updateNoticeBoard = createNoticeBoard();

    // Create simple text labels using meshes instead of GUI3D
    const createLabel = (text: string, targetMesh: Mesh, yOffset: number = 2) => {
        const plane = MeshBuilder.CreatePlane("label", { width: 2, height: 0.5 }, scene);
        plane.position = new Vector3(
            targetMesh.position.x,
            targetMesh.position.y + yOffset,
            targetMesh.position.z
        );
        plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

        const texture = new DynamicTexture("labelTexture", { width: 256, height: 64 }, scene, true);
        const material = new StandardMaterial("labelMaterial", scene);
        material.diffuseTexture = texture;
        material.specularColor = new Color3(0, 0, 0);
        material.emissiveColor = new Color3(1, 1, 1);
        material.backFaceCulling = false;
        plane.material = material;

        // Draw text on texture
        texture.drawText(text, null, 50, "bold 36px Arial", "white", "transparent", true);

        return plane;
    };

    // Add labels to components
    createLabel("Collection Center", building, 3);
    createLabel("Testing Station", testingStation, 1);
    createLabel("Storage Tank", tank, 3);
    createLabel("Rejection Area", rejectionArea, 1);
    createLabel("Loading Area", truckLoadingArea, 1);

    return {
        building,
        testingStation,
        tank,
        robot,
        milkCans,
        rejectionArea,
        truckLoadingArea,
        simulateMilkDelivery,
        updateNoticeBoard
    };
};