import { Action } from '@uncut/gyro/src/core/Actions';

function resizeImage(imageObject, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
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
    name: 'editor.canvas.flip',
    description: 'Flip canvas',
    shortcut: 'Ctrl+F',
    onAction() {
        const editor = document.querySelector('gyro-emote-editor');
        editor.flipCanvas();
    }
});