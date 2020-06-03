import { SettingsComponent } from '@uncut/gyro/components/settings/Settings.js';
import { html } from 'lit-html';
import '@uncut/gyro/components/Switch.js';

const index = SettingsComponent.createTab({
    title: "Appearance",
    icon: "Author",
    content: () => {
        const chat = document.querySelector('twitch-chat');

        return html`
            <style>

                .row {
                    font-size: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 360px;
                    margin-bottom: 15px;
                }

                input-switch {
                    margin-left: 15px;
                }

            </style>

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
        `;
    },
});
