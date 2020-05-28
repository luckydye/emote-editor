import componentStyles from '@uncut/gyro/components/component.shadow.css';
import { html, render } from 'lit-html';
import style from './EmoteEditor.shadow.css';

class ImageEditorEvent extends Event {
    constructor(img) {
        super('image.editor.change');

        this.image = img;
    }
}

export class EmoteEditor extends HTMLElement {

    saveSnapshot() {
        const saveButton = this.shadowRoot.querySelector('#download');

        const source = this.source.getCanvas();

        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;

        const context = canvas.getContext("2d");
        context.drawImage(source, 0, 0);

        saveButton.setAttribute('disabled', '');
        canvas.toBlob(blob => {
            const link = createHTMLElement('a', {
                href: URL.createObjectURL(blob),
                download: "snapshot.png",
            });
            link.click();

            saveButton.removeAttribute('disabled');
        });
    }

    resetScale() {
        this.origin.x = 0;
        this.origin.y = 0;
        this.setScale(0);
    }

    renderTemplate() {
        const meta = this.metadata || { 
            color: [], 
            pos: [], 
            startPos: [] 
        };

        const scale = meta.scale ? meta.scale.toFixed(2) + "x" : html`<gyro-icon icon="Scale"></gyro-icon>`;

        const cylceScale = () => {
            if(meta.scale === 0) {
                this.setScale(1);
            } else {
                this.resetScale();
            }
        }

        return html`
            <style>
                ${componentStyles}
                ${style}
            </style>
			<div class="toolbar">
                <span>
					<button class="tool-button" id="scale" title="Scale" @click=${() => cylceScale()}>${scale}</button>
					<!--<button class="tool-button" id="open_in_viewer" title="Open in Viewer" @click=${() => this.openInViewer()}>
						<gyro-icon icon="Viewer"></gyro-icon>
					</button>-->
				</span>
			</div>
            <svg class="user-interface"></svg>
            <div class="preview">
                <canvas id="view"></canvas>
            </div>
            <div class="info">
                <div>
                    <span class="mouse-coords" title="Mouse X:Y">${meta.pos[0]}:${meta.pos[1]}</span>
                    <span class="mouse-delta" title="Mouse delta X:Y">${meta.pos[0] - meta.startPos[0]}:${meta.pos[1] - meta.startPos[1]}</span>
                    <span class="res" title="Resolution">${meta.width}x${meta.height}</span>
                    <span class="scale" title="Scale">${(meta.sourceScale || 0).toFixed(2)}</span>
                </div>
                <div>
                    <span class="picked-color-rgb" title="Color R,G,B,A">
                        (${meta.color[0]}, ${meta.color[1]}, ${meta.color[2]}, ${meta.color[3]})
                    </span>
                </div>
            </div>
		`;
    }

    get sourceWidth() {
        let sourceWidth;
        if(this.source) {
            const canvas = this.source.getCanvas();
            sourceWidth = canvas ? canvas.width : 1280;
        }
        return sourceWidth;
    }

    get sourceHeight() {
        let sourceHeight;
        if(this.source) {
            const canvas = this.source.getCanvas();
            sourceHeight = canvas ? canvas.height : 720;
        }
        return sourceHeight;
    }

    render() {
        render(this.renderTemplate(), this.shadowRoot);
    }

    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        this.render();

        this.canvas = this.shadowRoot.querySelector("#view");
        this.context = this.canvas.getContext("2d");

        this.width = this.clientWidth;
        this.height = this.clientHeight;

        this.origin = { x: 0, y: 0 };
        this.scale = 0;
        this.sourceScale = 1;

        this.image = {
            crop: [0, 0, 0, 0],
        }

        const self = this;

        this.metadata = {
            get sourceScale() { return self.sourceScale; },
            get scale() { return self.scale; },
            get width() { return self.sourceWidth; },
            get height() { return self.sourceHeight; },
            color: [0, 0, 0],
            startPos: [0, 0],
            pos: [0, 0]
        };

        this.addEventListener('mousedown', e => {
            if(e.buttons == 1) {
                this.getCursorInfo(e);
                this.metadata.startPos = [...this.metadata.pos];
            }
            this.addEventListener('mousemove', mouseDrag);
        })

        this.addEventListener('mouseup', () => {
            this.removeEventListener('mousemove', mouseDrag);
        })

        window.addEventListener('resize', e => {
            this.width = this.clientWidth;
            this.height = this.clientHeight;
        });

        window.addEventListener('layout', e => {
            this.width = this.clientWidth;
            this.height = this.clientHeight;
        });

        this.addEventListener('wheel', e => {
            this.setScale((this.scale || this.sourceScale) - (0.033 * Math.sign(e.deltaY)));
        });

        const mouseDrag = e => {
            moveTransform(e);

            if(e.buttons == 2) {
                this.origin.x += e.movementX / this.sourceScale;
                this.origin.y += e.movementY / this.sourceScale;

                this.setScale(this.scale);
            }

            if(e.buttons == 1) {
                this.getCursorInfo(e);

                const deltaX = e.movementX / this.sourceScale;
                const deltaY = e.movementY / this.sourceScale;

                this.image.crop[0] += deltaX;
                this.image.crop[1] += deltaY;
                
                this.dispatchEvent(new Event('change'));
            }
        };

        const moveTransform = (e) => {
            if (this.selectedNode) {
                let x = this.selectedNode.getParameterValue('position_x');
                let y = this.selectedNode.getParameterValue('position_y');

                x += Math.floor(e.movementX / this.scale);
                y += Math.floor(e.movementY / this.scale);

                this.selectedNode.setParameterValue('position_x', x);
                this.selectedNode.setParameterValue('position_y', y);
            }
        }

        const tick = () => {
            this.draw();
            this.setScale();
            requestAnimationFrame(tick);
        }
        tick();
    }

    getCursorInfo(e) {
        const box = this.canvas.getBoundingClientRect();

        const scale = this.sourceScale || 1;

        const mouseX = Math.floor((e.x - box.left) / scale);
        const mouseY = Math.floor((e.y - box.top) / scale);

        const color = this.pickColor(mouseX, mouseY);

        this.metadata.pos = [mouseX, mouseY];
        this.metadata.color = color;
        
        this.shadowRoot.querySelector('.picked-color-rgb').style.setProperty('--color', `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`);

        this.render();

        if (this.trackerNode) {
            const tracker = this.trackerNode;
            tracker.setParameterValue('color', [
                Math.floor((color[0] / 255) * 100) / 100,
                Math.floor((color[1] / 255) * 100) / 100,
                Math.floor((color[2] / 255) * 100) / 100,
                1,
            ]);
        }
    }

    getPreviewOutput() {
        const canvas = document.createElement('canvas');
        canvas.width = this.image.crop[2];
        canvas.height = this.image.crop[3];
        const context = canvas.getContext("2d");
        context.drawImage(
            this.source.getCanvas(), 
            this.image.crop[0], 
            this.image.crop[1], 
            canvas.width, canvas.height, 
            0, 0, 
            canvas.width, canvas.height
        );
        return canvas;
    }

    pickColor(x, y) {
        if(!Number.isNaN(x) && !Number.isNaN(y)) {
            try {
                return this.context.getImageData(x, y, 1, 1).data;
            } catch(err) {
                return [0, 0, 0, 0];
            }
        } else {
            return [0, 0, 0, 0];
        }
    }

    setScale(scale) {
        scale = scale != null ? scale : this.scale;

        this.scale = scale;

        this.style.setProperty('--x', this.origin.x);
        this.style.setProperty('--y', this.origin.y);

        if(scale === 0) {
            const w = (this.width - 40) / this.sourceWidth;
            const h = (this.height - 80) / this.sourceHeight;
            scale = Math.min(w, h);
        }

        this.sourceScale = scale;

        this.style.setProperty('--s', scale);

        this.render();
    }

    viewAsset(asset) {
        this.source = {
            getCanvas() {
                return asset.data;
            }
        };

        const ar = asset.data.width / asset.data.height;

        this.image = {
            crop: [20, 20, 700, 700],
        }

        window.dispatchEvent(new ImageEditorEvent(asset.data));

        this.render();
    }
    
    updateViews() {
        this.shadowRoot.querySelector('#output').value = this.source;
        this.shadowRoot.querySelector('#output').options = [...Gyro.structure.findNodes('Output')];
    }

    draw() {
        const viewWidth = this.width;
        const viewHeight = this.height;

        const scale = 1;

        const width = this.sourceWidth * scale;
        const height = this.sourceHeight * scale;

        const x = (viewWidth / 2) - (width / 2);
        const y = (viewHeight / 2) - (height / 2);

        this.canvas.width = width;
        this.canvas.height = height;

        // actually draw
        this.context.clearRect(0, 0, viewWidth, viewHeight);

        if(this.source) {
            this.drawSource(0, 0, this.canvas.width, this.canvas.width / (width / height), scale);
        }

        this.drawGuides(x, y, scale);

        // set viewport stats
        let fps = 0;
        if (this.lastTick) {
            const delta = Date.now() - this.lastTick;
            fps = 1000 / delta;
        }
        this.lastTick = Date.now();
    }

    drawSource(x, y, width, height, scale) {
        let source1 = this.source ? this.source.getCanvas() : null;

        // draw source
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, width, height);

        if (width > 0 && height > 0) {
            this.context.drawImage(
                source1,
                x + ((source1.x || 0) * scale),
                y + ((source1.y || 0) * scale),
                width,
                height
            );
        }
    }

    drawGuides(sourceX, sourceY, scale) {
        const ctx = this.context;

        const width = this.canvas.width;
        const height = this.canvas.height;

        const crop = this.image.crop;

        if(crop) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2 / (this.scale || 1);

            const cropWidth = crop[0] + crop[2];
            const cropHeight = crop[1] + crop[3];

            ctx.fillRect(0, 0, crop[0], height);
            ctx.fillRect(cropWidth, 0, width - cropWidth, height);

            ctx.fillRect(crop[0], 0, crop[2], crop[1]);
            ctx.fillRect(crop[0], cropHeight, crop[2], height - cropHeight);

            const handleRadius = Math.max(5 / (this.scale || 1), 0);

            ctx.arc(crop[0], crop[1], handleRadius, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cropWidth, crop[1], handleRadius, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(crop[0], cropHeight, handleRadius, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cropWidth, cropHeight, handleRadius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // draw transform helpers
        if (this.selectedNode) {
            const w = this.selectedNode.canvas.width * scale;
            const h = this.selectedNode.canvas.height * scale;
            const x = this.selectedNode.getParameterValue('position_x');
            const y = this.selectedNode.getParameterValue('position_y');

            ctx.strokeStyle = "#eee";
            ctx.strokeRect(sourceX + (x * scale), sourceY + (y * scale), w, h);

            ctx.fillStyle = "#eee";
            ctx.fillRect(sourceX + (x * scale), sourceY + (y * scale), 10, 10);
            ctx.fillRect(sourceX + (x * scale) + w - 10, sourceY + (y * scale), 10, 10);
            ctx.fillRect(sourceX + (x * scale), sourceY + (y * scale) + h - 10, 10, 10);
            ctx.fillRect(sourceX + (x * scale) + w - 10, sourceY + (y * scale) + h - 10, 10, 10);

            ctx.fillRect(sourceX + (x * scale) + (w / 2) - 2, sourceY + (y * scale) + (h / 2) - 2, 4, 4);
        }
    }
}

customElements.define("gyro-emote-editor", EmoteEditor);
