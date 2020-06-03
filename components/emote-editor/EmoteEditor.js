import componentStyles from '@uncut/gyro/components/component.shadow.css';
import '@uncut/gyro/components/DropdownButton.js';
import '@uncut/gyro/components/FluidInput.js';
import '@uncut/gyro/components/Input.js';
import Notification from '@uncut/gyro/components/Notification';
import '@uncut/gyro/components/settings/Settings.js';
import { html, render } from 'lit-html';
import style from './EmoteEditor.shadow.css';
import { preprocess } from './ImageProcessing.js';
import { loadStateFromLocal, setState, stateObject, redo, undo, pushStateHistory } from './State.js';

export class EmoteEditor extends HTMLElement {

    redo() {
        redo();
        this.render();
    }

    undo() {
        undo();
        this.render();
    }

    get width() {
        return stateObject.width;
    }

    get height() {
        return stateObject.height;
    }

    renderTemplate() {
        const width = stateObject.width;
        const height = stateObject.height;
        const x = -stateObject.width*0.5;
        const y = -stateObject.height*0.5;

        const cropX = stateObject.crop[0];
        const cropY = stateObject.crop[1];
        const cropW = stateObject.crop[2];
        const cropH = stateObject.crop[3];

        const hadnleSize = 5 / stateObject.scale;

        const self = this;

        let arOptions = [
            { name: "1 / 1", value: 1 },
            { name: "1 / 2", value: .5 },
            { name: "2 / 1", value: 2 },
            { name: "free", value: 0 },
            { name: "source", value: this.getSourceAspectRatio() },
        ];
        
        const arButton = this.shadowRoot.querySelector('#arButton');

        if(arButton) {
            if(stateObject.ascpetRatio == 0) {
                arButton.value = { name: `free` };
            } else if(stateObject.ascpetRatio != 1 && stateObject.ascpetRatio != .5) {
                arButton.value = { name: `1 / ${stateObject.ascpetRatio.toFixed(1)}` };
            }
        }

        return html`
            <style>
                ${componentStyles}
                ${style}
            </style>

			<div class="toolbar">
                <div class="toolbar-row">
                    <span>Scale:</span>
                    <button class="tool-button holo" id="scale" title="Scale" @click=${e => this.setScale(1)}>
                        ${stateObject.scale.toFixed(1)}
                    </button>
                    <span>Ascpet Ratio:</span>
                    <dropdown-button class="tool-button holo" 
                                    title="Aspect Ratio" 
                                    id="arButton"
                                    .options="${arOptions}" 
                                    @change="${function(e) {
                                        if(self.width > 0) {
                                            self.setAscpetRatio(+this.value.value);
                                        }
                                    }}">
                    </dropdown-button>
                    <span>Rotation:</span>
                    <gyro-fluid-input class="holo" min="-180" max="180" value="0" @change="${function(e) {
                        self.setRotation(this.value);
                    }}"></gyro-fluid-input>
                    <button class="tool-button holo" title="Flip Canvas Horizontally" @click=${e => self.flipCanvas()}>Flip</button>
				</div>
                <div class="toolbar-row">
                    <gyro-input placeholder="Untitled Emote" value="${this.getFileName() || ''}" @input="${function(e) {
                        self.name = this.value;
                    }}"></gyro-input>
				</div>
            </div>

            <div class="placeholder">
                <gyro-icon icon="Import"></gyro-icon>
                <span>
                    Drag and drop image to import.
                </span>
            </div>
            
            <svg class="preview" 
                width="${this.clientWidth}" 
                height="${this.clientHeight}" 
                viewbox="${`0 0 ${this.clientWidth} ${this.clientHeight}`}">

                <g id="origin">
                    <g id="view">

                        <foreignObject width="${width}" 
                                        height="${height}" 
                                        x="${x}" 
                                        y="${y}">
                            <div class="canvas-wrapper">
                                ${this.canvas}
                            </div>
                        </foreignObject>

                        <mask id="cropMask">
                            <rect width="${width}" height="${height}" x="${x}" y="${y}" fill="white"></rect>
                            <rect width="${cropW}" id="canvasMask" height="${cropH}" x="${x + cropX}" y="${y + cropY}" fill="black"></rect>
                        </mask>

                        <g id="crop">
                            <rect class="border" id="cropArea" width="${cropW}" height="${cropH}" x="${x + cropX}" y="${y + cropY}"></rect>

                            <rect class="overlay" width="${width}" height="${height}" x="${x}" y="${y}" mask="url(#cropMask)"></rect>
                            
                            <circle class="handle" id="handleTL" r="${hadnleSize}" cx="${x + cropX}" cy="${y + cropY}"></circle>
                            <circle class="handle" id="handleTR" r="${hadnleSize}" cx="${x + cropX + cropW}" cy="${y + cropY}"></circle>
                            <circle class="handle" id="handleBL" r="${hadnleSize}" cx="${x + cropX}" cy="${y + cropY + cropH}"></circle>
                            <circle class="handle" id="handleBR" r="${hadnleSize}" cx="${x + cropX + cropW}" cy="${y + cropY + cropH}"></circle>
                        </g>
                    </g>
                </g>
            </svg>
		`;
    }

    render() {
        render(this.renderTemplate(), this.shadowRoot);
        this.draw();

        this.style.setProperty('--s', stateObject.scale);
        this.style.setProperty('--r', stateObject.rotation);
        this.style.setProperty('--x', stateObject.origin.x + 'px');
        this.style.setProperty('--y', stateObject.origin.y + 'px');

        this.handles = [
            this.shadowRoot.querySelector('#handleTL'),
            this.shadowRoot.querySelector('#handleTR'),
            this.shadowRoot.querySelector('#handleBL'),
            this.shadowRoot.querySelector('#handleBR'),
            this.shadowRoot.querySelector('#cropArea'),
        ]

        for(let handle of this.handles) {
            let start = [0, 0];
            let startCrop = [...stateObject.crop];

            handle.onmousedown = e => {
                if(!e.button == 0) return;

                start = [e.x, e.y];

                this.onmousemove = e => {
                    let delta = [
                        (e.x / stateObject.scale) - (start[0] / stateObject.scale), 
                        (e.y / stateObject.scale) - (start[1] / stateObject.scale)
                    ];

                    if(e.shiftKey) {
                        if(Math.abs(delta[0]) > Math.abs(delta[1])) {
                            delta[1] = 0;
                        } else {
                            delta[0] = 0;
                        }
                    }

                    if(e.ctrlKey) {
                        stateObject.fixedRatio = false;
                    } else {
                        stateObject.fixedRatio = true;
                    }

                    if(handle.id == "handleTL") {
                        this.setCrop(
                            startCrop[0] + delta[0],
                            startCrop[1] + delta[1],
                            startCrop[2] - delta[0],
                            startCrop[3] - delta[1]
                        );
                    }

                    if(handle.id == "handleTR") {
                        this.setCrop(
                            null,
                            startCrop[1] + delta[1],
                            startCrop[2] + delta[0],
                            startCrop[3] - delta[1]
                        );
                    }

                    if(handle.id == "handleBL") {
                        this.setCrop(
                            startCrop[0] + delta[0],
                            null,
                            startCrop[2] - delta[0],
                            startCrop[3] + delta[1]
                        );
                    }

                    if(handle.id == "handleBR") {
                        this.setCrop(
                            null,
                            null,
                            startCrop[2] + delta[0],
                            startCrop[3] + delta[1]
                        );
                    }

                    if(handle.id == "cropArea") {
                        this.setCrop(
                            startCrop[0] + delta[0],
                            startCrop[1] + delta[1],
                            null,
                            null
                        );
                    }

                    this.render();
                }
            }
            this.onmouseup = e => {
                this.onmousemove = null;
                stateObject.fixedRatio = true;
            }
        }
    }

    loadImage(image, name) {
        stateObject.source = image;
        this.name = name;

        this.setResolution(image.width, image.height);

        const x = Math.max(image.width, image.height);
        let deltaScale = 1;

        if(x == image.width) {
            deltaScale = window.innerWidth / x;
        }
        if(x == image.height) {
            deltaScale = window.innerHeight / x;
        }

        deltaScale = Math.min(deltaScale - 0.05, 1.0);

        this.setScale(deltaScale);

        this.render();

        this.removeAttribute('empty', '');
    }

    setCrop(x, y, width, height) {
        const prevCrop = [...stateObject.crop];

        stateObject.crop[0] = x != null ? x : prevCrop[0];
        stateObject.crop[1] = y != null ? y : prevCrop[1];
        stateObject.crop[2] = width != null ? width : prevCrop[2];
        stateObject.crop[3] = height != null ? height : prevCrop[3];

        stateObject.crop[2] = Math.max(stateObject.crop[2], stateObject.minResolution[0]);
        stateObject.crop[3] = Math.max(stateObject.crop[3], stateObject.minResolution[1]);

        if(stateObject.fixedRatio && stateObject.ascpetRatio !== 0) {
            const croppedAr = stateObject.crop[2] / stateObject.crop[3];

            const preArHeight = stateObject.crop[3];
            const preArWidth = stateObject.crop[2];
            
            stateObject.crop[2] = stateObject.crop[2];
            stateObject.crop[3] = stateObject.crop[3] * (croppedAr * stateObject.ascpetRatio);

            if(stateObject.crop[1] != prevCrop[1]) {
                stateObject.crop[1] += preArHeight - stateObject.crop[3];
            }
            if(stateObject.crop[0] != prevCrop[0]) {
                stateObject.crop[0] += preArWidth - stateObject.crop[2];
            }
        }

        stateObject.crop = stateObject.crop.map(v => Math.floor(v));

        if(!stateObject.fixedRatio) {
            stateObject.ascpetRatio = height / width;
        }

        this.render();
        
        this.dispatchEvent(new Event('change'));
    }

    setScale(scale) {
        stateObject.scale = Math.max(scale, 0.1);
        this.render();
    }

    setRotation(deg) {
        stateObject.rotation = deg;
        this.render();

        this.dispatchEvent(new Event('change'));
    }

    setResolution(width, height) {
        stateObject.width = width;
        stateObject.height = height;
        this.canvas.width = width;
        this.canvas.height = height;

        this.setCrop(0, 0, stateObject.width, stateObject.height);
    }

    setAscpetRatio(ar) {
        stateObject.ascpetRatio = ar;
        this.setCrop(0, 0, stateObject.width, stateObject.height);
    }

    flipCanvas() {
        stateObject.flip = !stateObject.flip;

        this.draw();
        
        this.dispatchEvent(new Event('change'));
    }

    constructor() {
        super();

        stateObject.source = null;

        stateObject.flip = false;
        stateObject.fixedRatio = true;
        stateObject.ascpetRatio = 1.0;
        stateObject.minResolution = [18, 18];
        stateObject.origin = { x: 0, y: 0 };
        stateObject.crop = [0, 0, 0, 0];
        stateObject.width = 0;
        stateObject.height = 0;
        stateObject.scale = 1;
        stateObject.rotation = 0;

        this.setAttribute('empty', '');

        this.attachShadow({ mode: "open" });
        this.render();

        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");

        this.addEventListener('wheel', e => {
            this.setScale(stateObject.scale + (Math.sign(-e.deltaY) * 0.075));
        })

        this.addEventListener('mousedown', e => {
            this.addEventListener('mousemove', mouseDrag);
        })

        this.addEventListener('mouseup', () => {
            this.removeEventListener('mousemove', mouseDrag);
        })

        window.addEventListener('resize', e => this.render());
        window.addEventListener('layout', e => this.render());

        const mouseDrag = e => {
            if(e.buttons == 4) {
                stateObject.origin.x += e.movementX / stateObject.scale;
                stateObject.origin.y += e.movementY / stateObject.scale;

                this.render();
            }
        };
        
        const state = loadStateFromLocal();

        if(state && state.source) {
            new Notification({ 
                text: `
                    <div style="display: flex; align-items: center;">
                        <gyro-icon icon="Save" style="display: inline-block; margin-right: 10px;"></gyro-icon>
                        Click here to load last save.
                    </div>
                `, 
                time: 1000 * 5,
                onclick: () => {
                    this.loadImage(state.source);
                    setState(state);
                    this.render();
                }
            }).show();
        }
        
        this.addEventListener('mousedown', () => {
            if(stateObject.source) {
                pushStateHistory();
            }
        });
    }

    draw() {
        const imageSource = stateObject.source;

        if(imageSource) {

            const image = preprocess(imageSource);

            this.context.clearRect(0, 0, stateObject.width, stateObject.height);

            this.context.save();

            if(stateObject.flip) {
                this.context.scale(-1, 1);
                this.context.drawImage(image, -stateObject.width, 0);
            } else {
                this.context.drawImage(image, 0, 0);
            }

            this.context.restore();
        }
    }

    getSourceAspectRatio() {
        if(stateObject.source) {
            return stateObject.source.height / stateObject.source.width;
        }
        return 1;
    }

    getFileName() {
        return this.name;
    }

    renderOutput() {
        const imageSource = this.canvas;
        
        const canvas = document.createElement('canvas');
        canvas.width = stateObject.width;
        canvas.height = stateObject.height;
        const context = canvas.getContext("2d");
        context.save();

        // recreate transforms
        context.scale(stateObject.width / stateObject.crop[2], stateObject.height / stateObject.crop[3]);
        context.translate(canvas.width / 2, canvas.height / 2);
        context.translate(-stateObject.crop[0], -stateObject.crop[1]);
        context.rotate(stateObject.rotation * Math.PI / 180);

        context.drawImage(imageSource, -canvas.width / 2, -canvas.height / 2);

        context.restore();
        return canvas;
    }
}

customElements.define("gyro-emote-editor", EmoteEditor);
