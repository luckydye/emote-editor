import { FlatRenderer, FlatShader } from '@uncut/viewport/src/renderer/FlatRenderer.js';
import { stateObject } from './State.js';

let renderer = null;
let canvas = null;

class ImageShader extends FlatShader {

    get customUniforms() {
        return {
            time: performance.now(),
        }
    }

    static fragmentSource() {
		return `#version 300 es

			precision mediump float;
			
			uniform sampler2D imageTexture;
			uniform float time;

			in vec2 texCoords;

			out vec4 oFragColor;

            void main () {
				vec2 uv = vec2(
					texCoords.x,
					-texCoords.y
				);

                oFragColor = vec4(texture(imageTexture, uv));
            }
        `;
	}
}

let imageCache = null;

export function preprocess(img) {    
    if(!renderer || imageCache != img) {
        const width = stateObject.width;
        const height = stateObject.height;

        canvas = document.createElement('canvas');
    
        canvas.width = width;
        canvas.height = height;

        renderer = new FlatRenderer(canvas);
        renderer.setImage(img);
        renderer.setShader(new ImageShader());

        canvas.style.position = "fixed";
        canvas.style.zIndex = '10000000';
        canvas.style.margin = '60px';
        canvas.style.border = '2px solid black';
        canvas.style.width = '200px';
    
        imageCache = img;
    }
    
    renderer.draw();

    return canvas;
}
