import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import type { CoolDEX, Token } from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployer } = await hre.getNamedAccounts();
    const token: Token = await hre.ethers.getContract("Token", deployer);
    const uniToken: Token = await hre.ethers.getContract("UniToken", deployer);
    const amount = hre.ethers.utils.parseEther("10");
    console.log("amount: " + hre.ethers.utils.formatEther(amount));
    console.log("deployer balance: " + hre.ethers.utils.formatEther(await token.balanceOf(deployer)));

    await hre.deployments.deploy("CoolDEX", {
        from: deployer,
        args: [token.address, uniToken.address],
        log: true,
        autoMine: true,
        waitConfirmations: 1,
    });
    const dex: CoolDEX = await hre.ethers.getContract("CoolDEX", deployer);

    const approveTx = await token.approve(dex.address, amount);
    console.log(`approved ${amount}TOK to ${dex.address}`);
    await approveTx.wait();

    const approveUniTx = await uniToken.approve(dex.address, amount);
    console.log(`approved ${amount}UNI to ${dex.address}`);
    await approveUniTx.wait();

    const transferTx = await token.transfer(dex.address, amount);
    console.log(`transferred ${amount}TOK to ${dex.address}`);
    await transferTx.wait();

    const transferUniTx = await uniToken.transfer(dex.address, amount);
    console.log(`transferred ${amount}UNI to ${dex.address}`);
    await transferUniTx.wait();

    await dex.initialize(amount);
};

export default func;
func.tags = ["DEX"];
