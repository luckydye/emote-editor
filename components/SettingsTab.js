import { SettingsComponent } from '@uncut/gyro/components/settings/Settings.js';
import { html } from 'lit-html';
import '@uncut/gyro/components/Switch.js';
import Config from '@uncut/gyro/src/core/Config.js';

const index = SettingsComponent.createTab({
    title: "System",
    icon: "Preset",
    content: () => {
        const chat = document.querySelector('twitch-chat');

        return html`
            <style>

                .row {
                    font-size: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 500px;
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .row.header {
                    padding: 8px 0;
                    margin: 0 0 20px 0;
                    border-radius: 4px;
                    border: none;
                    opacity: 0.5;
                }

                input-switch {
                    margin-left: 15px;
                }

            </style>

            <div class="row header">Appearance</div>

            <div class="row">
                <label>Show emote preview</label>
                <input-switch ?checked="${chat.showPreview}" @change="${function(e) {
                    chat.showPreview = this.checked;
                }}"></input-switch>
            </div>
            <div class="row">
                <label>Show rewards preview</label>
                <input-switch ?checked="${chat.showRewards}" @change="${function(e) {
                    chat.showRewards = this.checked;
                }}"></input-switch>
            </div>

            <div class="row header">Rendering</div>

            <div class="row">
                <label>Smooth rendering</label>
                <input-switch ?checked="${Config.global.getValue('rendering.smooth')}" @change="${function(e) {
                    Config.global.setValue('rendering.smooth', this.checked);
                    Config.global.save();
                    const editor = document.querySelector('gyro-emote-editor');
                    editor.dispatchEvent(new Event('change'));
                }}"></input-switch>
            </div>
        `;
    },
});
