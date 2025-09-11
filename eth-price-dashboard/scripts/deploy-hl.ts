// scripts/deploy-hl.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

function updateEnvVar(filePath: string, key: string, value: string) {
  let text = "";
  if (fs.existsSync(filePath)) {
    text = fs.readFileSync(filePath, "utf-8");
    if (text.match(new RegExp(`^${key}=.*`, "m"))) {
      text = text.replace(new RegExp(`^${key}=.*`, "m"), `${key}=${value}`);
    } else {
      if (!text.endsWith("\n")) text += "\n";
      text += `${key}=${value}\n`;
    }
  } else {
    text = `${key}=${value}\n`;
  }
  fs.writeFileSync(filePath, text);
  console.log(`.env updated: ${key}=${value}`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const HLBuyer = await ethers.getContractFactory("HLBuyer");
  const unsigned = await HLBuyer.getDeployTransaction();

  // === 사전 가스 추정(원하면 ESTIMATE_ONLY=1 환경변수로 켜기) ===
  if (process.env.ESTIMATE_ONLY) {
    const gas = await ethers.provider.estimateGas({ ...unsigned, from: deployer.address });
    const fee = await ethers.provider.getFeeData(); // EIP-1559
    const maxFee = fee.maxFeePerGas ?? fee.gasPrice;
    if (!maxFee) throw new Error("Cannot fetch gas price data");
    const costWei = gas * maxFee;
    const cost = Number(ethers.formatEther(costWei));
    console.log(`Estimated gas: ${gas.toString()} units`);
    console.log(`Max fee per gas: ${ethers.formatUnits(maxFee, "gwei")} gwei`);
    console.log(`Estimated max cost: ~${cost} (native)`);
    console.log("Set ESTIMATE_ONLY='' (unset) to actually deploy.");
    return;
  }

  console.log("Deploying HLBuyer...");
  const hlBuyer = await HLBuyer.deploy();
  const receipt = await hlBuyer.deploymentTransaction()?.wait();
  const address = await hlBuyer.getAddress();

  console.log("HLBuyer deployed to:", address);
  console.log("Deployment tx:", receipt?.hash);

  // === .env 업데이트 ===
  const envPath = path.join(__dirname, "..", ".env");
  updateEnvVar(envPath, "NEXT_PUBLIC_HL_BUYER_CONTRACT", address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
