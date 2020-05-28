import Notification from '@uncut/gyro/components/Notification.js';
import '@uncut/gyro/css/gyro.css';
import '@uncut/gyro-layout';
import '@uncut/gyro/components/menu-bar/Menubar';
import '@uncut/gyro/components/Icon.js';
import '@uncut/gyro/components/Knob.js';
import '@uncut/gyro/components/FluidInput.js';
import '@uncut/gyro/components/LevelSlider.js';
import '@uncut/gyro/components/Input.js';
import '../components/emote-editor/EmoteEditor.js';

window.log = (...str) => {
    new Notification({ text: str.join(" "), time: 2000 }).show();
    console.log(...str);
}

window.addEventListener('DOMContentLoaded', init());

function updatePreviews(croppedImage) {

    if(!croppedImage) return;

    const canvases = document.querySelectorAll('.emote-preview');

    for(let canvas of canvases) {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(croppedImage, 0, 0, canvas.width, canvas.height);
    }

}

window.addEventListener('dragover', e => {
    e.preventDefault();
});

window.addEventListener('drop', e => {
    if(e.dataTransfer.items) {
        for(let item of e.dataTransfer.items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();

                const reader  = new FileReader();
                reader.onload = function(e)  {
                    const img = new Image();
                    img.src = e.target.result;

                    img.onload = () => {
                        const editor = document.querySelector('gyro-emote-editor');
                        editor.viewAsset({ data: img });

                        updatePreviews(editor.getPreviewOutput());
                    }
                }
                reader.readAsDataURL(file);
            }
        }
    }
})

async function init() {
    const editor = document.querySelector('gyro-emote-editor');

    editor.addEventListener('contextmenu', e => {
        e.preventDefault();
    });

    editor.addEventListener('change', e => {
        updatePreviews(editor.getPreviewOutput());
    })

    hideLoading();
}

function showLoading() {
    document.body.setAttribute('loading', '');
}

function hideLoading() {
    document.body.removeAttribute('loading');
}
