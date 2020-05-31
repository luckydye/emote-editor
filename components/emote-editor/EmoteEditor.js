import componentStyles from '@uncut/gyro/components/component.shadow.css';
import { html, render, svg } from 'lit-html';
import style from './EmoteEditor.shadow.css';
import '@uncut/gyro/components/settings/Settings.js';
import '@uncut/gyro/components/DropdownButton.js';
import '@uncut/gyro/components/FluidInput.js';
import { Action } from '@uncut/gyro/src/core/Actions';

export class EmoteEditor extends HTMLElement {

    renderTemplate() {
        const width = this.width;
        const height = this.height;
        const x = -this.width*0.5;
        const y = -this.height*0.5;

        const cropX = this.crop[0];
        const cropY = this.crop[1];
        const cropW = this.crop[2];
        const cropH = this.crop[3];

        const hadnleSize = 5 / this.scale;

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
            if(this.ascpetRatio == 0) {
                arButton.value = { name: `free` };
            } else if(this.ascpetRatio != 1 && this.ascpetRatio != .5) {
                arButton.value = { name: `1 / ${this.ascpetRatio.toFixed(1)}` };
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
                    <button class="tool-button" id="scale" title="Scale" @click=${e => this.setScale(1)}>
                        ${this.scale.toFixed(1)}
                    </button>
                    <span>Ascpet Ratio:</span>
                    <dropdown-button class="tool-button" 
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
                    <gyro-fluid-input min="-180" max="180" value="0" @change="${function(e) {
                        self.setRotation(this.value);
                    }}"></gyro-fluid-input>
                    <button class="tool-button" title="Flip Canvas Horizontally" @click=${e => this.flipCanvas()}>Flip</button>
				</div>
            </div>

            <div class="placeholder">
                <gyro-icon icon="Import"></gyro-icon>
                <span>
                    Darg and drop image to import.
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

        this.handles = [
            this.shadowRoot.querySelector('#handleTL'),
            this.shadowRoot.querySelector('#handleTR'),
            this.shadowRoot.querySelector('#handleBL'),
            this.shadowRoot.querySelector('#handleBR'),
            this.shadowRoot.querySelector('#cropArea'),
        ]

        for(let handle of this.handles) {
            let start = [0, 0];
            let startCrop = [...this.crop];

            handle.onmousedown = e => {
                if(!e.button == 0) return;

                start = [e.x, e.y];

                this.onmousemove = e => {
                    let delta = [
                        (e.x / this.scale) - (start[0] / this.scale), 
                        (e.y / this.scale) - (start[1] / this.scale)
                    ];

                    if(e.shiftKey) {
                        if(Math.abs(delta[0]) > Math.abs(delta[1])) {
                            delta[1] = 0;
                        } else {
                            delta[0] = 0;
                        }
                    }

                    if(e.ctrlKey) {
                        this.fixedRatio = false;
                    } else {
                        this.fixedRatio = true;
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
                this.fixedRatio = true;
            }
        }
    }

    loadImage(image, name) {
        this.source = image;
        this.name = name;

        this.setResolution(image.width, image.height);

        const x = Math.max(image.width, image.height);
        let deltaScale = 1;

        if(x == image.width) {
            deltaScale = this.clientWidth / x;
        }
        if(x == image.height) {
            deltaScale = this.clientHeight / x;
        }

        deltaScale = Math.min(deltaScale - 0.05, 1.0);

        this.setScale(deltaScale);

        this.render();

        this.removeAttribute('empty', '');
    }

    setCrop(x, y, width, height) {
        const prevCrop = [...this.crop];

        this.crop[0] = x != null ? x : prevCrop[0];
        this.crop[1] = y != null ? y : prevCrop[1];
        this.crop[2] = width != null ? width : prevCrop[2];
        this.crop[3] = height != null ? height : prevCrop[3];

        this.crop[2] = Math.max(this.crop[2], this.minResolution[0]);
        this.crop[3] = Math.max(this.crop[3], this.minResolution[1]);

        if(this.fixedRatio && this.ascpetRatio !== 0) {
            const croppedAr = this.crop[2] / this.crop[3];

            const preArHeight = this.crop[3];
            const preArWidth = this.crop[2];
            
            this.crop[2] = this.crop[2];
            this.crop[3] = this.crop[3] * (croppedAr * this.ascpetRatio);

            if(this.crop[1] != prevCrop[1]) {
                this.crop[1] += preArHeight - this.crop[3];
            }
            if(this.crop[0] != prevCrop[0]) {
                this.crop[0] += preArWidth - this.crop[2];
            }
        }

        this.crop = this.crop.map(v => Math.floor(v));

        if(!this.fixedRatio) {
            this.ascpetRatio = height / width;
        }

        this.render();
        
        this.dispatchEvent(new Event('change'));
    }

    setScale(scale) {
        this.scale = Math.max(scale, 0.1);
        this.style.setProperty('--s', this.scale);
        this.render();
    }

    setRotation(deg) {
        this.rotation = deg;
        this.style.setProperty('--r', this.rotation);
        this.render();

        this.dispatchEvent(new Event('change'));
    }

    setResolution(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;

        this.setCrop(0, 0, this.width, this.height);
    }

    setAscpetRatio(ar) {
        this.ascpetRatio = ar;
        this.setCrop(0, 0, this.width, this.height);
    }

    flipCanvas() {
        this.flip = !this.flip;

        this.draw();
        
        this.dispatchEvent(new Event('change'));
    }

    constructor() {
        super();

        this.source = null;

        this.flip = false;
        this.fixedRatio = true;
        this.ascpetRatio = 1.0;
        this.minResolution = [18, 18];
        this.origin = { x: 0, y: 0 };
        this.crop = [0, 0, 0, 0];
        this.width = 0;
        this.height = 0;
        this.scale = 1;
        this.rotation = 0;

        this.setAttribute('empty', '');

        this.attachShadow({ mode: "open" });
        this.render();

        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");

        this.addEventListener('wheel', e => {
            this.setScale(this.scale + (Math.sign(-e.deltaY) * 0.05));
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
                this.origin.x += e.movementX / this.scale;
                this.origin.y += e.movementY / this.scale;

                this.style.setProperty('--x', this.origin.x + 'px');
                this.style.setProperty('--y', this.origin.y + 'px');
            }
        };
    }

    draw() {
        if(this.source) {
            this.context.clearRect(0, 0, this.width, this.height);

            this.context.save();

            if(this.flip) {
                this.context.scale(-1, 1);
                this.context.drawImage(this.source, -this.width, 0);
            } else {
                this.context.drawImage(this.source, 0, 0);
            }

            this.context.restore();
        }
    }

    getSourceAspectRatio() {
        if(this.source) {
            return this.source.height / this.source.width;
        }
        return 1;
    }

    getFileName() {
        return this.name;
    }

    renderOutput() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const context = canvas.getContext("2d");
        context.save();

        // recreate transforms
        context.scale(this.width / this.crop[2], this.height / this.crop[3]);
        context.translate(canvas.width / 2, canvas.height / 2);
        context.translate(-this.crop[0], -this.crop[1]);
        context.rotate(this.rotation * Math.PI / 180);

        context.drawImage(this.canvas, -canvas.width / 2, -canvas.height / 2);

        context.restore();
        return canvas;
    }
}

customElements.define("gyro-emote-editor", EmoteEditor);
