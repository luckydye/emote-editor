import { Action } from '@uncut/gyro/src/core/Actions';
import { html, render } from 'lit-html';
import Notification from '@uncut/gyro/components/Notification.js';
import Config from '@uncut/gyro/src/core/Config.js';

// config
Config.global.define('rendering.smooth', true, true);
Config.global.load();

// app functions
function resizeImage(imageObject, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    document.body.appendChild(canvas);

    const context = canvas.getContext("2d");

    if(!Config.global.getValue('rendering.smooth')) {
        canvas.style.imageRendering = 'pixelated';
        context.mozImageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
        context.imageSmoothingEnabled = false;
    } else {
        canvas.style.imageRendering = 'optimizequality';
        context.mozImageSmoothingEnabled = true;
        context.webkitImageSmoothingEnabled = true;
        context.msImageSmoothingEnabled = true;
        context.imageSmoothingEnabled = true;
    }

    context.drawImage(imageObject, 0, 0, canvas.width, canvas.height);
    
    return canvas;
}

function saveImage(canvas, name) {
    canvas.toBlob(blob => {
        const link = createHTMLElement('a', {
            href: URL.createObjectURL(blob),
            download: name + ".png",
        });
        link.click();
    });
}

function exportImages(sizes) {
    const editor = document.querySelector('gyro-emote-editor');
    const fileName = editor.getFileName();

    const imageOutput = editor.renderOutput();

    for(let size of sizes) {
        const image = resizeImage(imageOutput, size);
        saveImage(image, `${fileName}_${size}x${size}`);
    }
}

function importImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = e => {
        const file = input.files[0];
        readFile(file);
    }
    input.click();
}

function readFile(file) {
    const reader  = new FileReader();
    reader.onload = function(e)  {
        const img = new Image();
        img.src = e.target.result;

        img.onload = () => {
            const editor = document.querySelector('gyro-emote-editor');
            editor.loadImage(img, file.name.split(".")[0]);

            window.dispatchEvent(new Event('preview.update'));
        }
    }
    reader.readAsDataURL(file);
}

// export
Action.register({
    name: 'export.maxres',
    description: 'Export image with full resolution',
    onAction() {
        const editor = document.querySelector('gyro-emote-editor');
        exportImages([editor.width]);
    }
});

Action.register({
    name: 'export.emotes',
    description: 'Export emote images',
    shortcut: 'Ctrl+E',
    onAction() {
        exportImages([28, 56, 112]);
    }
});

Action.register({
    name: 'export.badges',
    description: 'Export badge images',
    shortcut: 'Ctrl+Shift+E',
    onAction() {
        exportImages([18, 36, 72]);
    }
});

// import
Action.register({
    name: 'import.image',
    description: 'Import image',
    shortcut: 'Ctrl+I',
    onAction([ file ]) {
        if(file) {
            readFile(file);
        } else {
            importImage();
        }
    }
});

Action.register({
    name: 'paste.image',
    description: 'Paste image',
    shortcut: 'Ctrl+V',
    onKeyDown: true,
    async onAction() {
        const items = await navigator.clipboard.read();

        const firstItem = items[0];
        const blob = await firstItem.getType("image/png").catch(err => {
            new Notification({ text: 'Nothing to paste' }).show()
        });

        if(blob) {
            blob.lastModifiedDate = new Date();
            blob.name = "Untitled";
    
            Action.execute('import.image', [blob]);
        }
    }
});

// editor
Action.register({
    name: 'editor.reset.rotation',
    description: 'Reset canvas rotation',
    shortcut: 'Ctrl+R',
    onAction() {
        const editor = document.querySelector('gyro-emote-editor');
        editor.setRotation(0);
    }
});

Action.register({
    name: 'editor.reset.scale',
    description: 'Reset editor scale',
    shortcut: 'Ctrl+1',
    onAction() {
        const editor = document.querySelector('gyro-emote-editor');
        editor.setScale(1);
    }
});

Action.register({
    name: 'editor.reset.crop',
    description: 'Reset canvas crop',
    shortcut: 'Ctrl+0',
    onAction() {
        const editor = document.querySelector('gyro-emote-editor');
        editor.setCrop(0, 0, editor.width, editor.height);
    }
});

Action.register({
    name: 'editor.canvas.flip',
    description: 'Flip canvas',
    shortcut: 'Ctrl+F',
    onAction(action) {
        const editor = document.querySelector('gyro-emote-editor');
        editor.flipCanvas();
    }
});

Action.register({
    name: 'showcase.open',
    description: 'Open Emote Showcase',
    onAction() {
        const editor = document.querySelector('gyro-emote-editor');
        const imageOutput = editor.renderOutput();

        const image28 = resizeImage(imageOutput, 28);
        const image56 = resizeImage(imageOutput, 56);
        const image112 = resizeImage(imageOutput, 112);

        const template = html`
            <div class="showcase-container">
                <div class="showcase">
                    <div class="emote-name">
                        ${editor.getFileName()}
                    </div>
                    <div class="emotes">
                        ${image28}
                        ${image56}
                        ${image112}
                    </div>
                </div>
            </div>
        `;

        render(template, document.querySelector('#emoteShowcase'));
    }
});

Action.register({
    name: 'undo',
    description: 'Undo',
    shortcut: 'Ctrl+Z',
    onAction: () => {
        const editor = document.querySelector('gyro-emote-editor');
        editor.undo()
    }
});

Action.register({
    name: 'redo',
    description: 'Redo',
    shortcut: 'Ctrl+Y',
    onAction: () => {
        const editor = document.querySelector('gyro-emote-editor');
        editor.redo()
    }
});
