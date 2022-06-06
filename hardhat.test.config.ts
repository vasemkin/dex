import { lensPath, set } from "ramda";
import { HardhatUserConfig } from "hardhat/config";
import { MultiSolcUserConfig, SolcUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import mainConfig from "./hardhat.config";

const config: HardhatUserConfig = {
    ...mainConfig,
    networks: {
        ...mainConfig.networks,
        hardhat: {
            ...(mainConfig.networks?.hardhat || {}),
            initialBaseFeePerGas: 0,
            allowUnlimitedContractSize: true,
        },
    }
};

export default config;
