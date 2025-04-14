const fs = require('fs');
const CryptoJS = require("crypto-js");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

// 配置项
const encryptedFile = 'index.html'; // 加密后的 HTML 文件路径
const decryptedFile = 'original.html'; // 解密后的 HTML 文件路径

readline.question('请输入解密密码: ', (password) => {
    try {
        // 读取加密后的 HTML 文件内容
        const encryptedHtml = fs.readFileSync(encryptedFile, 'utf8');

        // 提取加密内容
        const match = encryptedHtml.match(/const encryptedContent = `([^`]+)`;/);
        if (!match || !match[1]) {
            throw new Error('无法找到加密内容。请确保输入的是正确的加密 HTML 文件。');
        }

        const encryptedContent = match[1];

        // 使用密码解密内容
        const bytes = CryptoJS.AES.decrypt(encryptedContent, password);
        const decryptedHtml = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedHtml || decryptedHtml.trim() === '') {
            throw new Error('密码错误或解密失败。');
        }

        // 确保文件可写
        if (!fs.existsSync(decryptedFile)) {
            fs.writeFileSync(decryptedFile, ''); // 创建一个空文件
        }

        // 写入解密后的内容
        fs.writeFileSync(decryptedFile, decryptedHtml, 'utf8');
        console.log(`解密成功！已将内容保存到 ${decryptedFile}`);
    } catch (error) {
        console.error('解密失败:', error.message);
    } finally {
        readline.close();
    }
});