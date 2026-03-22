import { execSync } from 'child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const solPath = join(repoRoot, 'OneOfUs.sol');
const sourcesSolPath = join(repoRoot, 'sources', 'OneOfUs.sol');

function patchGeneratedSolidity(content: string): string {
  return content
    .replace(
      'function replyOn_oneOfUsList(bytes32 messageId, bytes32[] reply) external;',
      'function replyOn_oneOfUsList(bytes32 messageId, bytes32[] calldata reply) external;'
    )
    .replace(
      'function replyOn_oneOfUsList(bytes32 messageId, bytes32[] reply) external onlyGearExeProgram {',
      'function replyOn_oneOfUsList(bytes32 messageId, bytes32[] calldata reply) external onlyGearExeProgram {'
    );
}

function main() {
  console.log('Generating Solidity ABI from IDL...');
  execSync(
    'cargo sails sol --idl-path ./target/wasm32-gear/release/one_of_us.idl',
    { cwd: repoRoot, stdio: 'inherit' }
  );

  const generated = readFileSync(solPath, 'utf-8');
  const patched = patchGeneratedSolidity(generated);

  if (patched !== generated) {
    writeFileSync(solPath, patched, 'utf-8');
    console.log('Patched generated Solidity for calldata compatibility.');
  }

  copyFileSync(solPath, sourcesSolPath);
  console.log('Synced ABI to sources/OneOfUs.sol');
}

main();
