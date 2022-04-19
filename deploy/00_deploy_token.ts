import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployer } = await hre.getNamedAccounts();

    await hre.deployments.deploy("Token", {
        from: deployer,
        args: [],
        log: true,
        autoMine: true,
        waitConfirmations: 1,
    });
};

export default func;
func.tags = ["Token"];
