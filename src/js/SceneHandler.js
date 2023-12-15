"use strict";

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneHandler {
    /**
     * @type {THREE.Scene}
     */
    scene;

    /**
     * @type {THREE.Mesh[]}
     */
    meshes = [];

    #wireframeMaterialBlack = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, side: THREE.DoubleSide });
    #wireframeMaterialYellow = new THREE.MeshBasicMaterial({ color: 0xFFFF00, wireframe: true, side: THREE.DoubleSide });

    #volumeMaterialPhong = new THREE.MeshPhongMaterial({ side: THREE.FrontSide, vertexColors: true });
    #volumeMaterialBasic = new THREE.MeshBasicMaterial({ side: THREE.FrontSide, vertexColors: true });

    constructor() {
        this.volumeGroup = new THREE.Group();
        this.#initScene();
        this.scene.add(this.volumeGroup);
    }

    #initScene() {
        this.scene = new THREE.Scene();

        const canvas = document.querySelector('#canvas');
        const canvasContainer = canvas.parentElement;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas }); // alpha: true, premultipliedAlpha: false, 

        const fov = 60;
        const aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
        const near = 1;
        const far = 10000;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

        const color = 0xFFFFFF;
        const mainLight = new THREE.DirectionalLight(color, 1.75);
        mainLight.position.set(1, 2, 1);
        this.scene.add(mainLight);

        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
        this.scene.add(ambientLight);

        this.originGizmo = new THREE.AxesHelper(5);
        this.scene.add(this.originGizmo);
    }

    renderScene(time) {
        //time *= 0.001;

        if (this.#resizeRendererToDisplaySize()) {
            const canvas = this.renderer.domElement;
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }

        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }

    #resizeRendererToDisplaySize() {
        const canvas = this.renderer.domElement;
        const wrapper = canvas.parentElement;

        const width = wrapper.clientWidth;
        const height = wrapper.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
    }

    volumeMeshInfo = new Map();

    clearScene() {
        for (const mesh of this.meshes) {
            this.scene.remove(mesh);
        }
        this.meshes.length = 0;

        for (const [uuid, info] of this.volumeMeshInfo) {
            const mesh = this.volumeGroup.children.find(x => x.uuid === uuid);
            if (mesh) {
                this.volumeGroup.remove(mesh);
                this.volumeMeshInfo.delete(uuid);
            }
        }
    }

    #bufferGeometryFromRaw(rawGeometry) {
        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(new THREE.Uint16BufferAttribute(rawGeometry.indices, 1));
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(rawGeometry.vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(rawGeometry.normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(rawGeometry.colors, 3));
        return geometry;
    }

    /**
     * @param {{wireframe: boolean, aabb: boolean, subAABB: boolean}} settings 
     */
    async updateScene(data, settings) {
        const { wireframe, aabb, subAABB } = settings;

        const bufferGeometry = this.#bufferGeometryFromRaw(data.rawGeometry);
        const mesh = new THREE.Mesh(bufferGeometry, this.#volumeMaterialPhong);

        mesh.position.x = data.worldPosition[0];
        mesh.position.y = data.worldPosition[1];
        mesh.position.z = data.worldPosition[2];

        this.volumeMeshInfo.set(mesh.uuid, {});
        this.volumeGroup.add(mesh);

        if (subAABB) {
            const box = new THREE.BoxHelper(mesh, 0xffff00);
            box.geometry.computeBoundingBox();
            this.meshes.push(box);
            this.scene.add(box);
        }

        if (wireframe) {
            const wireframeMesh = new THREE.Mesh(
                geometry,
                this.#wireframeMaterialBlack
            );
            mesh.add(wireframeMesh);
        }

        if (aabb) {
            const box = new THREE.BoxHelper(this.volumeGroup, 0xffff00);
            box.geometry.computeBoundingBox();
            this.meshes.push(box);
            this.scene.add(box);
        }
    }

    centerCamera() {
        this.centerCameraOn(this.volumeGroup);
    }

    /**
     * @param {THREE.Object3D} object3d 
     * @returns 
     */
    centerCameraOn(object3d) {
        const box = new THREE.BoxHelper(object3d, 0xffff00);
        box.geometry.computeBoundingBox();

        const boundingBoxCenter = new THREE.Vector3();
        const boundingBoxSize = new THREE.Vector3();

        box.geometry.boundingBox.getCenter(boundingBoxCenter);
        box.geometry.boundingBox.getSize(boundingBoxSize);

        const distance = Math.max(boundingBoxSize.x, boundingBoxSize.y, boundingBoxSize.z) * 1.1;
        const cameraPosition = boundingBoxCenter.clone().add(new THREE.Vector3(distance, distance, -distance));
        this.camera.position.copy(cameraPosition);
        this.camera.lookAt(boundingBoxCenter);
        this.controls.target.copy(boundingBoxCenter);
        this.controls.update();

        return box;
    }

    /**
     * @param {[number, number, number, number, number, number]} aabb 
     * @returns 
     */
    centerCameraOnAABB(aabb) {
        const boundingBoxCenter = new THREE.Vector3(aabb[0] + aabb[3] / 2, aabb[1] + aabb[4] / 2, aabb[2] + aabb[5] / 2);
        const distance = Math.max(aabb[3], aabb[4], aabb[5]) * 1.1;
        const cameraPosition = boundingBoxCenter.clone().add(new THREE.Vector3(distance, distance, -distance));
        this.camera.position.copy(cameraPosition);
        this.camera.lookAt(boundingBoxCenter);
        this.controls.target.copy(boundingBoxCenter);
        this.controls.update();
    }
}
