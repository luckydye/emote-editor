import componentStyles from '@uncut/gyro/components/component.shadow.css';
import { html, render, svg } from 'lit-html';
import style from './EmoteEditor.shadow.css';
import '@uncut/gyro/components/settings/Settings.js';

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

        return html`
            <style>
                ${componentStyles}
                ${style}

                :host {
                    --ui-scale: calc(.5 / var(--s));
                }

                #origin {
                    transform: translate(50%, 50%) scale(var(--s, 1));
                }

                #view {
                    transform: translate(var(--x), var(--y));
                }

                .canvas-wrapper {
                }

                foreignObject {
                    position: relative;
                    z-index: -1;
                    pointer-events: none;
                }

                canvas {
                    background: #fff;
                }

                .stroke {
                    stroke: white;
                    stroke-width: var(--ui-scale);
                    fill: transparent;
                }

                .handle {
                    fill: white;
                }

                .handle#handleTL {
                    cursor: nwse-resize;
                }
                .handle#handleTR {
                    cursor: nesw-resize;
                }
                .handle#handleBL {
                    cursor: nesw-resize;
                }
                .handle#handleBR {
                    cursor: nwse-resize;
                }

                .overlay {
                    opacity: 0.65;
                    pointer-events: none;
                }
            </style>

			<div class="toolbar">
                <span>
                    <button class="tool-button" id="scale" title="Scale" @click=${e => this.setScale(1)}>
                        ${this.scale.toFixed(1)}
                    </button>
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
                            <rect width="${cropW}" height="${cropH}" x="${x + cropX}" y="${y + cropY}" fill="black"></rect>
                        </mask>

                        <g id="crop">
                            <rect class="stroke" id="cropArea" width="${cropW}" height="${cropH}" x="${x + cropX}" y="${y + cropY}"></rect>

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

        this.setScale(deltaScale - 0.05);

        this.render();
    }

    setCrop(x, y, width, height) {
        const prevCrop = [...this.crop];

        this.crop[0] = x || this.crop[0];
        this.crop[1] = y || this.crop[1];
        this.crop[2] = width || this.crop[2];
        this.crop[3] = height || this.crop[3];

        this.crop = this.crop.map(v => Math.floor(v));

        if(this.fixedRatio) {
            const croppedAr = this.crop[2] / this.crop[3];
            const preArHeight = this.crop[3];
            
            this.crop[2] = this.crop[2];
            this.crop[3] = this.crop[3] * (croppedAr * this.ascpetRatio);

            if(this.crop[1] != prevCrop[1]) {
                const diff = preArHeight - this.crop[3];
                this.crop[1] += diff;
            }
        }

        this.dispatchEvent(new Event('change'));
    }

    setScale(scale) {
        this.scale = Math.max(scale, 0.1);
        this.style.setProperty('--s', this.scale);
        this.render();
    }

    setResolution(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;

        this.setCrop(0, 0, this.width, this.height);
    }

    constructor() {
        super();

        this.source = null;

        this.fixedRatio = true;
        this.ascpetRatio = 1.0;
        this.origin = { x: 0, y: 0 };
        this.crop = [0, 0, 0, 0];
        this.width = 0;
        this.height = 0;
        this.scale = 1;

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

        this.setResolution(400, 400);
        this.setScale(1);
    }

    draw() {
        if(this.source) {
            this.context.drawImage(this.source, 0, 0);
        }
    }

    getFileName() {
        return this.name;
    }

    renderOutput() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.width;
        const context = canvas.getContext("2d");
        const crop = this.crop;
        context.drawImage(this.canvas, crop[0], crop[1], crop[2], crop[3], 0, 0, canvas.width, canvas.height);
        return canvas;
    }
}

customElements.define("gyro-emote-editor", EmoteEditor);
