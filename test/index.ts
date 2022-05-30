import { expect } from "chai";
import { ethers, getNamedAccounts } from "hardhat";

import type { DEX, DEX__factory, Token, Token__factory } from "../typechain";
import { BigNumber } from "ethers";

describe("Unit tests", function () {
    let token: Token;
    let dex: DEX;

    this.beforeEach(async () => {
        const tokenFactory: Token__factory = await ethers.getContractFactory("Token");
        token = (await tokenFactory.deploy()) as Token;
        await token.deployed();
        // console.log("token deployed to: " + token.address);

        const dexFactory: DEX__factory = await ethers.getContractFactory("DEX");
        dex = (await dexFactory.deploy(token.address)) as DEX;
        await dex.deployed();
        // console.log("dex deployed to: " + token.address);

        const balance = await token.balanceOf(dex.address);
        // console.log(`DEX has ${balance}TOK`);
        const amount = ethers.utils.parseEther("10");
        const tokenTx = await token.approve(dex.address, amount);
        await tokenTx.wait();
        // console.log(`approved ${amount}TOK to: ` + dex.address);

        await dex.initialize(amount, {
            value: amount,
        });

        const balance2 = await token.balanceOf(dex.address);
        // console.log(`DEX has ${balance2}TOK`);
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

    describe("Swaps", () => {
        const value = ethers.utils.parseEther("0.5");

        describe(`After swapping ${value}ETH for TOK`, async () => {
            it("Balances", async () => {
                const { deployer } = await getNamedAccounts();

                const initialUserEthBalance = await ethers.provider.getBalance(deployer);
                const initialDexEthBalance = await ethers.provider.getBalance(dex.address);
                const initialUserTokenBalance = await token.balanceOf(deployer);
                const initialDexTokenBalance = await token.balanceOf(dex.address);

                const gasEstimate = await dex.estimateGas.ethToToken({ value });
                const tokenAmt = await dex.estimateTokenAmount(value, gasEstimate);
                const tx = await dex.ethToToken({ value });
                await tx.wait();

                describe("User's ETH balance", () => {
                    it("is changed", async () => {
                        const etherBalance = await ethers.provider.getBalance(deployer);
                        expect(etherBalance).not.to.equal(initialUserEthBalance);
                    });
                    it("is approx equal to initialBalance - deposit - gasPrice", async () => {
                        const etherBalance = await ethers.provider.getBalance(deployer);
                        const gas = BigNumber.from(tx.gasPrice);
                        expect(initialUserEthBalance.sub(value).sub(gas).lt(etherBalance)).to.be.false;
                    });
                });

                describe("DEX's ETH balance", () => {
                    it("is changed", async () => {
                        const etherBalance = await ethers.provider.getBalance(dex.address);
                        expect(etherBalance).not.to.equal(initialDexEthBalance);
                    });
                    it("is equal to initialBalance + deposit", async () => {
                        const etherBalance = await ethers.provider.getBalance(dex.address);
                        expect(initialDexEthBalance.add(value)).to.equal(etherBalance);
                    });
                });

                describe("User's TOK balance", () => {
                    it("is changed", async () => {
                        const tokenBalance = await token.balanceOf(deployer);
                        expect(tokenBalance).not.to.equal(initialUserTokenBalance);
                    });
                    it("is approx equal to initialBalance + deposit", async () => {
                        const tokenBalance = await token.balanceOf(deployer);
                        console.log(tokenBalance.sub(initialUserTokenBalance).toString());
                        console.log(tokenAmt.toString());
                        expect(initialUserTokenBalance.add(tokenAmt)).to.equal(tokenBalance);
                    });
                });

                describe("DEX's TOK balance", () => {
                    it("is changed", async () => {
                        const tokenBalance = await token.balanceOf(dex.address);
                        expect(tokenBalance).not.to.equal(initialDexTokenBalance);
                    });
                });
            });
        });
    });
});
