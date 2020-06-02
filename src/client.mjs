import '@uncut/gyro-layout';
import '@uncut/gyro/components/FluidInput.js';
import '@uncut/gyro/components/Icon.js';
import '@uncut/gyro/components/Input.js';
import '@uncut/gyro/components/Knob.js';
import '@uncut/gyro/components/LevelSlider.js';
import '@uncut/gyro/components/Slider.js';
import '@uncut/gyro/components/menu-bar/Menubar';
import '@uncut/gyro/css/gyro.css';
import '../components/emote-editor/EmoteEditor.js';
import '../components/chat/TwitchChat.js';
import './actions.js';
import { Action } from '@uncut/gyro/src/core/Actions';

window.addEventListener('DOMContentLoaded', init());

function enableFileDragAndDrop() {
    
    window.addEventListener('dragover', e => {
        e.preventDefault();
    });
    
    window.addEventListener('drop', e => {
        if(e.dataTransfer.items) {
            for(let item of e.dataTransfer.items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    Action.execute('import.image', [file]);
                }
            }
        }
    })
}

async function init() {
    enableFileDragAndDrop();

    const editor = document.querySelector('gyro-emote-editor');
    const chat = document.querySelector('twitch-chat');

    window.addEventListener('preview.update', e => {
        chat.updateEmotes(editor.renderOutput());
    });

    editor.addEventListener('contextmenu', e => {
        e.preventDefault();
    });

    editor.addEventListener('change', e => {
        chat.updateEmotes(editor.renderOutput());
    })

    hideLoading();
}

function showLoading() {
    document.body.setAttribute('loading', '');
}

function hideLoading() {
    document.body.removeAttribute('loading');
}
