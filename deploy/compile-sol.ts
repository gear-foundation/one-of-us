/**
 * Compile OneOfUs.sol and generate TypeScript ABI file
 * 
 * Usage: npx ts-node compile-sol.ts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const solPath = join(__dirname, '..', 'OneOfUs.sol');
const outDir = join(__dirname, 'compiled');

// Create output directory
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

console.log('Compiling OneOfUs.sol...');

try {
  // Compile with solc
  execSync(
    `npx solc --abi --bin -o ${outDir} ${solPath}`,
    { stdio: 'inherit' }
  );

  // Find compiled files (solc uses full path in filename)
  const { readdirSync } = await import('fs');
  const files = readdirSync(outDir);
  
  const abiFile = files.find(f => f.includes('OneOfUsAbi') && f.endsWith('.abi'));
  const binFile = files.find(f => f.includes('OneOfUsAbi') && f.endsWith('.bin'));

  if (!abiFile || !binFile) {
    console.error('Compilation failed: OneOfUsAbi files not found');
    console.error('Files found:', files);
    process.exit(1);
  }

  const abi = readFileSync(join(outDir, abiFile), 'utf-8');
  const bytecode = readFileSync(join(outDir, binFile), 'utf-8');

  // Generate TypeScript file
  const tsContent = `/**
 * Auto-generated from OneOfUs.sol
 * Generated: ${new Date().toISOString()}
 * 
 * To regenerate: npx ts-node compile-sol.ts
 */

export const oneOfUsAbi = ${abi} as const;

export const oneOfUsBytecode = '0x${bytecode}' as \`0x\${string}\`;
`;

  const outputPath = join(__dirname, 'OneOfUsAbi.ts');
  writeFileSync(outputPath, tsContent);

  console.log('✅ Generated OneOfUsAbi.ts');
  console.log(`   ABI: ${JSON.parse(abi).length} functions`);
  console.log(`   Bytecode: ${bytecode.length / 2} bytes`);

} catch (error) {
  console.error('Error compiling Solidity:', error);
  process.exit(1);
}

