let joystickData = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
let characteristic = null;

document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
        characteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
        
        console.log("✅ Connected to ESP32!");
    } catch (error) {
        console.error("❌ Bluetooth Error:", error);
    }
});

// 🕹️ Joystick movement handling
function setupJoystick(joystickId, dataX, dataY) {
    const joystick = document.getElementById(joystickId);
    const joystickCenter = joystick.querySelector(".joystick-center");
    let startX = 0, startY = 0;

    function moveJoystick(x, y) {
        joystick.style.transform = `translate(${x}px, ${y}px)`;
        joystickCenter.style.transform = `translate(${x / 2}px, ${y / 2}px)`;
    }

    function updateData(x, y) {
        joystickData[dataX] = x / 30;  // Normalize value
        joystickData[dataY] = -y / 30;
        sendJoystickData();
    }

    joystick.addEventListener("mousedown", startMove);
    joystick.addEventListener("touchstart", startMove);

    function startMove(event) {
        event.preventDefault();
        const touch = event.touches ? event.touches[0] : event;
        startX = touch.clientX;
        startY = touch.clientY;

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stopMove);
        document.addEventListener("touchmove", move);
        document.addEventListener("touchend", stopMove);
    }

    function move(event) {
        event.preventDefault();
        const touch = event.touches ? event.touches[0] : event;
        let deltaX = touch.clientX - startX;
        let deltaY = touch.clientY - startY;

        deltaX = Math.min(30, Math.max(-30, deltaX));
        deltaY = Math.min(30, Math.max(-30, deltaY));

        moveJoystick(deltaX, deltaY);
        updateData(deltaX, deltaY);
    }

    function stopMove() {
        moveJoystick(0, 0);
        updateData(0, 0);
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stopMove);
        document.removeEventListener("touchmove", move);
        document.removeEventListener("touchend", stopMove);
    }
}

// 🔧 Attach to both joysticks
setupJoystick("joystickLeft", "yaw", "throttle");
setupJoystick("joystickRight", "roll", "pitch");

// 🔵 Send joystick data to ESP32
function sendJoystickData() {
    if (!characteristic) return;
    const dataString = `${joystickData.throttle},${joystickData.yaw},${joystickData.pitch},${joystickData.roll}`;
    characteristic.writeWithoutResponse(new TextEncoder().encode(dataString));
    console.log("📡 Sent:", dataString);
}
