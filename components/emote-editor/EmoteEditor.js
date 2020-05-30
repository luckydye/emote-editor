import componentStyles from '@uncut/gyro/components/component.shadow.css';
import { html, render, svg } from 'lit-html';
import style from './EmoteEditor.shadow.css';

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

        return html`
            <style>
                ${componentStyles}
                ${style}

                :host {
                    --ui-scale: calc(1 / var(--s));
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
                }

                canvas {
                    background: #fff;
                }

                .ui {
                    stroke: white;
                    stroke-width: var(--ui-scale);
                    fill: none;
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
                        <rect width="${cropW}" 
                                height="${cropH}" 
                                x="${x + cropX}" 
                                y="${y + cropY}"
                                class="ui">
                        </rect>
                    </g>
                </g>
            </svg>
		`;
    }

    render() {
        render(this.renderTemplate(), this.shadowRoot);
        this.draw();
    }

    loadImage(image) {
        this.source = image;

        this.setResolution(image.width, image.height);
        this.setCrop(0, 0, this.width, this.height);

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
        this.crop = [x, y, width, height];
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
    }

    constructor() {
        super();

        this.source = null;

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
            if(e.buttons == 2) {

            }

            if(e.buttons == 1) {
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

    renderOutput() {
        return this.canvas;
    }
}

customElements.define("gyro-emote-editor", EmoteEditor);
