import { expect } from "chai";
import { ethers, getNamedAccounts } from "hardhat";

import type { DEX, DEX__factory, Token, Token__factory } from "../typechain";
import { BigNumber } from "ethers";

describe("Unit tests", function () {
    let token: Token;
    let dex: DEX;

    this.beforeEach(async () => {
        const { deployer } = await getNamedAccounts();
        console.log(deployer);

        const tokenFactory: Token__factory = await ethers.getContractFactory("Token");
        token = (await tokenFactory.deploy()) as Token;
        await token.deployed();
        console.log("token deployed to: " + token.address);

        const dexFactory: DEX__factory = await ethers.getContractFactory("DEX");
        dex = (await dexFactory.deploy(token.address)) as DEX;
        await dex.deployed();
        console.log("dex deployed to: " + token.address);

        const balance = await token.balanceOf(dex.address);
        console.log(`DEX has ${balance}TOK`);
        const amount = ethers.utils.parseEther("10");
        const tokenTx = await token.approve(dex.address, amount);
        await tokenTx.wait();
        console.log(`approved ${amount}TOK to: ` + dex.address);

        const balance2 = await token.balanceOf(dex.address);
        console.log(`DEX has ${balance2}TOK`);

        await dex.initialize(amount, {
            value: amount,
        });
    });

    describe("DEX", () => {
        it("is funded", async () => {
            const balance = await token.balanceOf(dex.address);
            const etherBalance = await ethers.provider.getBalance(dex.address);
            expect(balance).not.to.equal(ethers.utils.parseEther("0"));
            expect(etherBalance).not.to.equal(ethers.utils.parseEther("0"));
        });

        it("has the same amount of TOK and ETH", async () => {
            const balance = await token.balanceOf(dex.address);
            const etherBalance = await ethers.provider.getBalance(dex.address);
            expect(balance).to.equal(etherBalance);
        });
    });
});
