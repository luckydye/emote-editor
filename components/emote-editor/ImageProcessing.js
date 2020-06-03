import { FlatRenderer, FlatShader } from '@uncut/viewport/src/renderer/FlatRenderer.js';
import { stateObject } from './State.js';

stateObject.chromaKey = [0.1, 1.0, 0.1];
stateObject.chromaTheshold = 0.6;

let renderer = null;
let canvas = null;

class ImageShader extends FlatShader {

    get customUniforms() {
        return {
            chromaKey: stateObject.chromaKey || [0, 1, 0],
            chromaTheshold: stateObject.chromaTheshold || 0.0,
        }
    }

    static fragmentSource() {
		return `#version 300 es

			precision mediump float;
			
            uniform sampler2D imageTexture;
            
            uniform float brightness;
            
			uniform vec3 chromaKey;
            uniform float chromaTheshold;

			in vec2 texCoords;

            out vec4 oFragColor;

            void main () {
				vec2 uv = vec2(
					texCoords.x,
					-texCoords.y
                );
                
                vec4 color = vec4(texture(imageTexture, uv));

                color.rgb += brightness;

                oFragColor = color;

                if(chromaKey.r + chromaKey.g + chromaKey.b > 0.0) {

                    bool fitR = color.r + chromaTheshold > chromaKey.r && color.r - chromaTheshold < chromaKey.r;
                    bool fitG = color.g + chromaTheshold > chromaKey.g && color.g - chromaTheshold < chromaKey.g;
                    bool fitB = color.b + chromaTheshold > chromaKey.b && color.b - chromaTheshold < chromaKey.b;

                    float diff = distance(chromaKey.rgb, color.rgb);

                    if(fitR && fitG && fitB) {
                        discard;
                    } else if(diff < 0.5) {
                        oFragColor.a = diff;
                    }
                }

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
