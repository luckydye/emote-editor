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
import '../components/SettingsTab.js';
import './actions.js';
import { Action } from '@uncut/gyro/src/core/Actions';
import Notification from '@uncut/gyro/components/Notification';

window.addEventListener('load', () => {
    init().catch(err => {
        document.body.setAttribute('error', 'Error: ' + err.message + ' | Please reload and try again.');
        console.error(err);
    })
});

async function init() {
    // drag and drop
    window.addEventListener('dragover', e => {
        e.preventDefault();
    });
    
    window.addEventListener('drop', e => {
        if(e.dataTransfer.items) {
            for(let item of e.dataTransfer.items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    Action.execute('import.image', [file]);

                } else if(item.type === 'text/uri-list') {
                    item.getAsString(async string => {
                        const blob = await fetch(string).then(r => r.blob()).catch(err => {
                            console.error(err);
                        });
                        
                        if(blob && blob.size > 0) {
                            blob.name = "untitled";
                            Action.execute('import.image', [blob]);
                        } else {
                            new Notification({ text: 'Failed loading image.' }).show();
                        }
                    });

                }
            }
        }
    })

    const editor = document.querySelector('gyro-emote-editor');
    const chat = document.querySelector('twitch-chat');

    chat.updateEmotes(editor.renderOutput());

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
