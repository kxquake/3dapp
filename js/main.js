import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let scene, camera, renderer, controls;
let currentModel = null;
let mixer = null;
let clock = new THREE.Clock();
let autoRotate = false;
let animationPlaying = false;
let spotLight, spotLightOn = false, spotLightIntensity = 3;


function init() {
    const container = document.getElementById('threejs-container');
    if (!container) return; 

    const width  = container.clientWidth;
    const height = container.clientHeight || 500;

    // Scene
    scene = new THREE.Scene();


    // Camera
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1, 3);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    spotLight = new THREE.SpotLight(0xfff4e0, 0);
    spotLight.position.set(0, 5, 3);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.3;
    spotLight.decay = 1;
    spotLight.distance = 25;
    spotLight.castShadow = true;
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.5, 0);
    controls.update();

    // Resize handler
    window.addEventListener('resize', onResize);

    animate();
}

function onResize() {
    const container = document.getElementById('threejs-container');
    if (!container || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animation 
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);
    if (autoRotate && currentModel) currentModel.rotation.y += 0.008;

    controls.update();
    renderer.render(scene, camera);
}

//Load models by product ID
function loadModel(id) {
    const modelMap = {
        1: 'models/product1.glb',   // Vinyl Record
        2: 'models/product2.glb',   // Speakers
        3: 'models/product3.glb'    // Headphones
    };

    const path = modelMap[id];
    if (!path) return;


    if (!renderer) init();

    if (currentModel) {
        scene.remove(currentModel);
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                const mats = Array.isArray(child.material)
                    ? child.material : [child.material];
                mats.forEach(m => m.dispose());
            }
        });
        currentModel = null;
        mixer = null;
        animationPlaying = false;
        const btn = document.querySelector("button[onclick='playAnimation()']");
        if (btn) {
            btn.textContent = 'Play Animation';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
        }
    }


    const container = document.getElementById('threejs-container');
    const loader_div = document.createElement('div');
    loader_div.id = 'model-loader';
    loader_div.style.cssText = `
        position:absolute; top:50%; left:50%;
        transform:translate(-50%,-50%);
        color:white; font-size:1rem; z-index:10;
    `;
    container.style.position = 'relative';
    container.appendChild(loader_div);

    const loader = new GLTFLoader();
    loader.load(
        path,

        // onLoad 
        (gltf) => {
            // Remove loading text
            const ld = document.getElementById('model-loader');
            if (ld) ld.remove();

            currentModel = gltf.scene;

            // Auto-centre and scale the model
            const box = new THREE.Box3().setFromObject(currentModel);
            const centre = box.getCenter(new THREE.Vector3());
            const size   = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale  = 2 / maxDim;             // normalise to ~2 units tall
            currentModel.scale.setScalar(scale);
            currentModel.position.sub(centre.multiplyScalar(scale));

            scene.add(currentModel);


            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(currentModel);
                currentModel.userData.animations = gltf.animations;
                console.log(`Model ${id} has ${gltf.animations.length} animation(s)`);
            }

            if (window.populateProductInfo) {
                window.populateProductInfo(id);
            }
        },


        (xhr) => {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            const ld = document.getElementById('model-loader');
            if (ld) ld.textContent = `Loading… ${pct}%`;
        },

        (error) => {
            console.error('GLTFLoader error:', error);
            const ld = document.getElementById('model-loader');
            if (ld) ld.textContent = '⚠ Could not load model. Check the console.';
        }
    );
}


window.loadProduct = function(id) {

    if (window.showSection) window.showSection('products');

    
    setTimeout(() => loadModel(id), 50);
};

window.toggleWireframe = function() {
    if (!currentModel) return;
    currentModel.traverse((child) => {
        if (child.isMesh) {
            const mats = Array.isArray(child.material)
                ? child.material : [child.material];
            mats.forEach(m => { m.wireframe = !m.wireframe; });
        }
    });
};

window.toggleRotate = function() {
    autoRotate = !autoRotate;
};

window.playAnimation = function() {
    if (!mixer || !currentModel?.userData?.animations?.length) {
        console.log('No animation found on this model');
        return;
    }

    animationPlaying = !animationPlaying;

    const animations = currentModel.userData.animations;
    animations.forEach(clip => {
        const action = mixer.clipAction(clip);
        if (animationPlaying) {
            action.reset();
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            action.play();
        } else {
            action.stop();
        }
    });

    const btn = document.querySelector("button[onclick='playAnimation()']");
    if (btn) {
        btn.textContent = animationPlaying ? 'Animation ON' : 'Play Animation';
        btn.classList.toggle('btn-secondary', !animationPlaying);
        btn.classList.toggle('btn-success', animationPlaying);
    }
};

window.setCamera = function(preset) {
    const positions = {
        front: [0, 1, 3],
        top:   [0, 4, 0.1],
        hero:  [2, 1.5, 2.5]
    };
    const pos = positions[preset] || positions.front;
    camera.position.set(...pos);
    controls.target.set(0, 0.5, 0);
    controls.update();
};

window.toggleLight = function(type) {
    if (type !== 'spot light') return;
    spotLightOn = !spotLightOn;
    spotLight.intensity = spotLightOn ? spotLightIntensity : 0;

    const btn = document.querySelector("button[onclick=\"toggleLight('spot light')\"]");
    if (btn) {
        btn.textContent = spotLightOn ? 'Spot Light ON' : 'Spot Light';
        btn.classList.toggle('btn-warning', !spotLightOn);
        btn.classList.toggle('btn-success', spotLightOn);
    }
};

window.setLightIntensity = function(value) {
    spotLightIntensity = parseFloat(value) * 3;  // slider 0-2 → intensity 0-6
    if (spotLightOn) spotLight.intensity = spotLightIntensity;
};

window.playSound = function() {
    const audio = new Audio('audio/speaker-demo.mp3');
    audio.play().catch(() => console.log('Audio needs a user gesture first'));
};