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
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);
        
        const provider = wallet.getProviderRegistry().getProvider('X.509');
        const adminIdentity = await wallet.get('admin');

        const adminUser = await provider.getUserContext(adminIdentity, 'admin');
        const appUserIdentity = await wallet.get('appUser');

        const newAppUser = await provider.getUserContext(appUserIdentity, 'appUser');
        const identityService = ca.newIdentityService();
        
        var theIdentityRequest = { enrollmentID: 'appUser', affiliation: 'org1.department1', attrs: [{name:"Doctor", value:"Pranay@456", ecert:true},{name:"Doctor", value:"Abc@789", ecert:true}] };
        let response = await identityService.update('appUser', theIdentityRequest, adminUser);
        console.log("userIdenity attributes: ", response.result.attrs);

        // 4. reenroll testUser
        const newEnrollment = await ca.reenroll(newAppUser);

        const newX509Identity = {
                credentials: {
                        certificate: newEnrollment.certificate,
                        privateKey: newEnrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
        };

        console.log(newX509Identity.credentials.privateKey);

        //await wallet.remove('admin');
        await wallet.put('appUser', newX509Identity);

        await gateway.disconnect();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
        
        const network2 = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract2 = network2.getContract('fabcar');
        
        //let cid = new ClientIdentity()
        const result2 = await contract2.evaluateTransaction('queryAllCars');
        console.log(`Transaction has been evaluated, result is: ${result2.toString()}`);

        

        // Disconnect from the gateway.
        await gateway.disconnect();
        
        return result2.toString();
        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();

//module.exports.main = main;
