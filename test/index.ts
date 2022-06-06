import { expect } from "chai";
import { ethers, getNamedAccounts } from "hardhat";

import type { DEX, DEX__factory, Token, Token__factory, UniToken, UniToken__factory } from "../typechain";

describe("DEX Tests", function () {
    let token: Token;
    let uniToken: UniToken;
    let dex: DEX;

    this.beforeAll(async () => {
        const tokenFactory: Token__factory = await ethers.getContractFactory("Token");
        token = (await tokenFactory.deploy()) as Token;
        await token.deployed();

        const uniTokenFactory: UniToken__factory = await ethers.getContractFactory("UniToken");
        uniToken = (await uniTokenFactory.deploy()) as UniToken;
        await uniToken.deployed();

        const dexFactory: DEX__factory = await ethers.getContractFactory("DEX");
        dex = (await dexFactory.deploy(token.address, uniToken.address)) as DEX;
        await dex.deployed();

        const amount = ethers.utils.parseEther("10");
        const tokenTx = await token.approve(dex.address, amount);
        await tokenTx.wait();
        const uniTokenTx = await uniToken.approve(dex.address, amount);
        await uniTokenTx.wait();

        await dex.initialize(amount);
    });

    describe("DEX", () => {
        it("is funded", async () => {
            const balance = await token.balanceOf(dex.address);
            const uniBalance = await uniToken.balanceOf(dex.address);
            expect(balance).not.to.equal(ethers.utils.parseEther("0"));
            expect(uniBalance).not.to.equal(ethers.utils.parseEther("0"));
        });

        it("has the same amount of TOK and UNI", async () => {
            const balance = await token.balanceOf(dex.address);
            const uniBalance = await uniToken.balanceOf(dex.address);
            expect(balance).to.equal(uniBalance);
        });
    });

    describe("UNI->TOK Swaps", () => {
        const value = ethers.utils.parseEther("0.5");

        it("UNI = initialBalance - tokenAmount, TOK = initialBalance + value - slippage", async () => {
            const { deployer } = await getNamedAccounts();

            const allowTx = await uniToken.approve(dex.address, value);
            await allowTx.wait();

            const initUni = await uniToken.balanceOf(deployer);
            const initTok = await token.balanceOf(deployer);

            const estimateTok = await dex.estimateTokenAmount(value, uniToken.address, token.address);
            const tx = await dex.swap(value, uniToken.address, token.address);
            await tx.wait();

            const newUni = await uniToken.balanceOf(deployer);
            expect(newUni).not.to.eq(initUni);
            expect(newUni).to.eq(initUni.sub(value));

            const newTok = await token.balanceOf(deployer);
            expect(newTok).not.to.eq(initTok);
            expect(newTok.sub(initTok)).to.eq(estimateTok);
        });
    });

    describe("TOK-UNI Swaps", () => {
        const value = ethers.utils.parseEther("0.5");

        it("TOK = initialBalance - tokenAmount, UNI = initialBalance + value - slippage", async () => {
            const { deployer } = await getNamedAccounts();

            const allowTx = await token.approve(dex.address, value);
            await allowTx.wait();

            const initUni = await uniToken.balanceOf(deployer);
            const initTok = await token.balanceOf(deployer);

            const estimateUni = await dex.estimateTokenAmount(value, token.address, uniToken.address);
            const tx = await dex.swap(value, token.address, uniToken.address);
            await tx.wait();

            const newTok = await token.balanceOf(deployer);
            expect(newTok).not.to.eq(initTok);
            expect(newTok).to.eq(initTok.sub(value));

            const newUni = await uniToken.balanceOf(deployer);
            expect(newUni).not.to.eq(initUni);
            expect(newUni.sub(initUni)).to.eq(estimateUni);
        });
    });

    describe("Deposit liquidity", () => {
        const value = ethers.utils.parseEther("0.5");

        it("DEX balances increase", async () => {
            const initUni = await uniToken.balanceOf(dex.address);
            const initTok = await token.balanceOf(dex.address);

            const estimate = await dex.estimateDeposit(value, uniToken.address, token.address);

            const approveUni = await uniToken.approve(dex.address, value);
            await approveUni.wait();

            const approveTok = await token.approve(dex.address, estimate[0]);
            await approveTok.wait();

            const tx = await dex.deposit(value, uniToken.address, token.address);
            await tx.wait();

            const newUni = await uniToken.balanceOf(dex.address);
            expect(newUni).not.to.eq(initUni);
            expect(newUni).to.eq(initUni.add(value));

            const newTok = await token.balanceOf(dex.address);
            expect(newTok).not.to.eq(initTok);
            expect(newTok.gt(initTok)).to.be.true;
        });
    });

    describe("Withdraw liquidity", () => {
        const value = ethers.utils.parseEther("0.5");

        it("DEX balances decrease", async () => {
            const initUni = await uniToken.balanceOf(dex.address);
            const initTok = await token.balanceOf(dex.address);

            const tx = await dex.withdraw(value, uniToken.address, token.address);
            await tx.wait();

            const newUni = await uniToken.balanceOf(dex.address);
            expect(newUni).not.to.eq(initUni);
            expect(newUni.lt(initUni)).to.be.true;

            const newTok = await token.balanceOf(dex.address);
            expect(newTok).not.to.eq(initTok);
            expect(newTok.lt(initTok)).to.be.true;
        });
    });
});
