const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'logo.svg');
const outputPath = path.join(__dirname, '..', 'public', 'jawda_steel_logo.png');

try {
    const svg = fs.readFileSync(inputPath);
    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: 1200 }, // Scale up for a high-res PNG
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    fs.writeFileSync(outputPath, pngBuffer);
    console.log('Logo converted successfully to', outputPath);
} catch (error) {
    console.error('Error converting logo:', error);
}
