const mammoth = require("mammoth");
const path = require("path");

const files = process.argv.slice(2);

async function main() {
  for (const file of files) {
    const { value } = await mammoth.extractRawText({ path: file });
    console.log(`===== ${path.basename(file)} =====`);
    console.log(value.slice(0, 12000));
    console.log();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
