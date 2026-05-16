let scene, camera, renderer, box;

init();

function init() {
    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x121212);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

    renderer = new THREE.WebGLRenderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight();
    light.position.set(0, 1, 2).normalize();
    scene.add(light);

    const material = new THREE.MeshStandardMaterial({ color: 0x81D8D0 });

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    box = new THREE.Mesh(geometry, material);
    box.position.x = 0;
    scene.add(box);

    window.addEventListener('resize', onWindowResize, false);

    update();
}

function update() {
    requestAnimationFrame(update);
    box.rotation.x += 0.01;
    box.rotation.y += 0.01;
    renderer.render(scene, camera);
}

function onresize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
