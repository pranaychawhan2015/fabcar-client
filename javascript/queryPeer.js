/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets, HsmX509Provider, Transaction } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
const { networkInterfaces } = require('os');
const crypto = require('crypto');
const { query } = require('express');
const { channel } = require('diagnostics_channel');
//const ClientIdentity = require('fabric-shim').ClientIdentity;

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('admin');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        //await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        //const network = await gateway.getNetwork('mychannel');
        
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);
        
        const provider = wallet.getProviderRegistry().getProvider('X.509');

        const adminIdentity = await wallet.get('admin');

        const adminUser = await provider.getUserContext(adminIdentity, 'admin');
        
        const appUserIdentity = await wallet.get('peer0');

        const newAppUser = await provider.getUserContext(appUserIdentity, 'peer0');
        
        const identityService = ca.newIdentityService();
        
        var theIdentityRequest = { enrollmentID: 'peer0', affiliation: 'org1.department1', attrs: [{name:"Doctor", value:"Pranay@456", ecert:true},{name:"Doctor", value:"Abc@789", ecert:true}] };
        //let response = await identityService.getAll(adminUser);
        let response = await identityService.update('peer0', theIdentityRequest, adminUser);

        console.log("userIdenity attributes: ", response);

        // // 4. reenroll testUser
        const newEnrollment = await ca.reenroll(newAppUser);

        const newX509Identity = {
                credentials: {
                        certificate: newEnrollment.certificate,
                        privateKey: newEnrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
        };

        console.log(newX509Identity.credentials);

        //await wallet.remove('admin');
        await wallet.put('peer0', newX509Identity);

        //await gateway.disconnect();
        const gateway = new Gateway();

        await gateway.connect(ccp, { wallet, identity: 'peer0', discovery: { enabled: true, asLocalhost: true }});
        
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');
        contract
        //let cid = new ClientIdentity()
        const result = await contract.evaluateTransaction('queryAllCars');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        
        // Disconnect from the gateway.
        await gateway.disconnect();
        
        const keyPath = "/home/cps16/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/keystore/7f3673e0c16328fc6e1da91382ac31332e43f94a48de30433112aa9b4bc02244_sk";

        fs.writeFileSync("/home/cps16/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/signcerts/cert.pem", newEnrollment.certificate);
        fs.writeFileSync(keyPath, newEnrollment.key.toBytes());
        

        //return result2.toString();
        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();

//module.exports.main = main;
