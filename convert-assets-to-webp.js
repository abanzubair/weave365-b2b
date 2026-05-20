import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure sharp is installed
try {
  await import('sharp');
  console.log('sharp is already installed.');
} catch (e) {
  console.log('sharp is not installed. Installing sharp...');
  execSync('npm install --no-save sharp', { stdio: 'inherit' });
}

const { default: sharp } = await import('sharp');

const directories = [
  path.join(__dirname, 'assets'),
  path.join(__dirname, 'public')
];

for (const dir of directories) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    continue;
  }
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (path.extname(file).toLowerCase() === '.png') {
      const inputPath = path.join(dir, file);
      const outputName = path.basename(file, '.png') + '.webp';
      const outputPath = path.join(dir, outputName);
      
      console.log(`Converting ${file} to ${outputName}...`);
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        console.log(`Successfully converted to WebP: ${outputName}`);
        
        // Delete original PNG to save space
        fs.unlinkSync(inputPath);
        console.log(`Removed original PNG: ${file}`);
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err);
      }
    }
  }
}
console.log('All image conversions completed.');
