import * as THREE from 'three';

class RacingGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.car = null;
        this.road = null;
        this.environment = [];
        
        this.speed = 0;
        this.maxSpeed = 120;
        this.acceleration = 0;
        this.steering = 0;
        this.carRotation = 0;
        
        this.keys = {};
        this.gameStarted = false;
        this.startTime = 0;
        this.currentLap = 1;
        this.totalLaps = 3;
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Lighting
        this.setupLighting();
        
        // Create environment
        this.createRoad();
        this.createCar();
        this.createEnvironment();
        
        // Event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
        
        // Show start screen
        this.showStartScreen();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    createRoad() {
        const roadGeometry = new THREE.PlaneGeometry(100, 1000);
        const roadMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide
        });
        this.road = new THREE.Mesh(roadGeometry, roadMaterial);
        this.road.rotation.x = -Math.PI / 2;
        this.road.receiveShadow = true;
        this.scene.add(this.road);

        // Road markings
        this.createRoadMarkings();
    }

    createRoadMarkings() {
        const markingGeometry = new THREE.PlaneGeometry(0.5, 10);
        const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        for (let i = -500; i < 500; i += 20) {
            const marking = new THREE.Mesh(markingGeometry, markingMaterial);
            marking.position.set(0, 0.01, i);
            marking.rotation.x = -Math.PI / 2;
            this.scene.add(marking);
        }
    }

    createCar() {
        const carGroup = new THREE.Group();

        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        carGroup.add(body);

        // Car roof
        const roofGeometry = new THREE.BoxGeometry(1.5, 0.5, 2);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 0.5;
        roof.castShadow = true;
        carGroup.add(roof);

        // Wheels
        this.createWheel(carGroup, -1, 0.8, -1.2);
        this.createWheel(carGroup, 1, 0.8, -1.2);
        this.createWheel(carGroup, -1, 0.8, 1.2);
        this.createWheel(carGroup, 1, 0.8, 1.2);

        this.car = carGroup;
        this.car.position.y = 0.5;
        this.scene.add(this.car);
    }

    createWheel(carGroup, x, y, z) {
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, y, z);
        wheel.castShadow = true;
        carGroup.add(wheel);
    }

    createEnvironment() {
        // Trees
        for (let i = -400; i < 400; i += 50) {
            this.createTree(15, i);
            this.createTree(-15, i);
        }

        // Buildings
        for (let i = -300; i < 300; i += 80) {
            this.createBuilding(25, i);
            this.createBuilding(-25, i);
        }
    }

    createTree(x, z) {
        const treeGroup = new THREE.Group();

        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Leaves
        const leavesGeometry = new THREE.SphereGeometry(2);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 3;
        leaves.castShadow = true;
        treeGroup.add(leaves);

        treeGroup.position.set(x, 0, z);
        this.scene.add(treeGroup);
        this.environment.push(treeGroup);
    }

    createBuilding(x, z) {
        const height = Math.random() * 10 + 5;
        const buildingGeometry = new THREE.BoxGeometry(8, height, 8);
        const buildingMaterial = new THREE.MeshLambertMaterial({ 
            color: Math.random() * 0xffffff 
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.environment.push(building);
    }

    setupEventListeners() {
        window.addEventListener('keydown', (event) => {
            this.keys[event.key.toLowerCase()] = true;
            
            if (event.key === 'r' || event.key === 'R') {
                this.resetCar();
            }
        });

        window.addEventListener('keyup', (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }

    startGame() {
        this.gameStarted = true;
        this.startTime = Date.now();
        document.getElementById('startScreen').classList.add('hidden');
    }

    restartGame() {
        this.speed = 0;
        this.acceleration = 0;
        this.steering = 0;
        this.carRotation = 0;
        this.currentLap = 1;
        this.resetCar();
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.startGame();
    }

    resetCar() {
        this.car.position.set(0, 0.5, 0);
        this.car.rotation.y = 0;
        this.speed = 0;
        this.steering = 0;
        this.carRotation = 0;
    }

    updateCar(deltaTime) {
        if (!this.gameStarted) return;

        // Acceleration
        if (this.keys['arrowup'] || this.keys['w']) {
            this.acceleration = 0.1;
        } else if (this.keys['arrowdown'] || this.keys['s']) {
            this.acceleration = -0.08;
        } else {
            this.acceleration = -this.speed * 0.05; // Natural deceleration
        }

        // Steering
        this.steering = 0;
        if (this.keys['arrowleft'] || this.keys['a']) {
            this.steering = -0.03;
        }
        if (this.keys['arrowright'] || this.keys['d']) {
            this.steering = 0.03;
        }

        // Update speed
        this.speed += this.acceleration * deltaTime;
        this.speed = Math.max(Math.min(this.speed, this.maxSpeed), -this.maxSpeed * 0.5);

        // Update rotation based on steering and speed
        if (Math.abs(this.speed) > 1) {
            this.carRotation += this.steering * (this.speed / this.maxSpeed) * deltaTime * 50;
        }

        // Move car
        this.car.position.x += Math.sin(this.carRotation) * this.speed * deltaTime;
        this.car.position.z += Math.cos(this.carRotation) * this.speed * deltaTime;

        // Update car rotation
        this.car.rotation.y = this.carRotation;

        // Keep car on road
        this.car.position.x = Math.max(Math.min(this.car.position.x, 8), -8);

        // Update camera to follow car
        this.camera.position.x = this.car.position.x;
        this.camera.position.z = this.car.position.z + 10;
        this.camera.position.y = 5;
        this.camera.lookAt(this.car.position.x, 0, this.car.position.z);

        // Update UI
        this.updateUI();
        
        // Check lap completion
        this.checkLap();
    }

    updateUI() {
        document.getElementById('speed').textContent = Math.abs(Math.round(this.speed * 10)) + ' MPH';
        document.getElementById('rpm').textContent = 'RPM: ' + Math.round((Math.abs(this.speed) / this.maxSpeed) * 8000);
        
        if (this.gameStarted) {
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            document.getElementById('timer').textContent = 'Time: ' + elapsedTime.toFixed(1) + 's';
        }
        
        document.getElementById('lap').textContent = 'Lap: ' + this.currentLap + '/' + this.totalLaps;
    }

    checkLap() {
        if (this.car.position.z > 200 && this.currentLap < this.totalLaps) {
            this.currentLap++;
            this.car.position.z = -200; // Reset to start of track
        } else if (this.car.position.z > 200 && this.currentLap === this.totalLaps) {
            this.finishRace();
        }
    }

    finishRace() {
        this.gameStarted = false;
        const finalTime = (Date.now() - this.startTime) / 1000;
        document.getElementById('finalStats').innerHTML = `
            Final Time: ${finalTime.toFixed(2)}s<br>
            Average Speed: ${Math.round((this.totalLaps * 400) / finalTime)} MPH
        `;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = 0.016; // Approximate 60fps
        
        this.updateCar(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }

    showStartScreen() {
        document.getElementById('startScreen').classList.remove('hidden');
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new RacingGame();
});
