const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建 photoResize 目录（如果不存在）
if (!fs.existsSync('photoResize')) {
    fs.mkdirSync('photoResize');
}

// 读取 photo 目录中的所有文件
fs.readdir('photo', (err, files) => {
    if (err) {
        console.error('读取目录出错:', err);
        return;
    }

    // 处理每个图片文件
    files.forEach(file => {
        const inputPath = path.join('photo', file);
        const outputPath = path.join('photoResize', file);

        // 使用 sharp 调整图片大小
        sharp(inputPath)
            .resize(120, 160, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFile(outputPath)
            .then(() => {
                console.log(`已处理: ${file}`);
            })
            .catch(err => {
                console.error(`处理 ${file} 时出错:`, err);
            });
    });
});

// 生成包含图片列表的 JS 文件
fs.readdir('photo', (err, files) => {
    if (err) {
        console.error('读取目录出错:', err);
        return;
    }

    const photoList = files.map(file => ({
        name: file
    }));

    const jsContent = `
// 这个文件是自动生成的，请勿手动修改
var demoPhotos = ${JSON.stringify(photoList, null, 2)};
`;

    fs.writeFileSync('photo-list.js', jsContent);
    console.log('已生成 photo-list.js');
}); 