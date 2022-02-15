/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        const identityLabel = 'peer0';
        const adminLabel = 'admin';


        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const keyPath = "/home/cps16/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/keystore/5dfcd38274c67299b965cb471fcf6cc0c6bfd3def16b138fbfd86d2992f039ba_sk";

        const cert = fs.readFileSync("/home/cps16/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/signcerts/cert.pem").toString();
        const key = fs.readFileSync(keyPath).toString();
        
        const identity = {
            credentials: {
                certificate: cert,
                privateKey: key,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        
        await wallet.put(identityLabel, identity);

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get(adminLabel);
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        
        const adminUser = await provider.getUserContext(adminIdentity, adminLabel);

        const newAppUser = await provider.getUserContext(identity, identityLabel);

        const identityService = ca.newIdentityService();
        
        var theIdentityRequest = { enrollmentID: identityLabel, attrs: [{name:"Contractor", value:"Pranay@447", ecert:true},{name:"Doctor", value:"Abc@789", ecert:true}] };
        let response = await identityService.update(identityLabel, theIdentityRequest, adminUser);
        console.log(response.result.attrs);

        const enrollment = await ca.reenroll(newAppUser);
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put(identityLabel, x509Identity);
        console.log(x509Identity);
        //Write the newly updated identity in the folder
        fs.writeFileSync("/home/cps16/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/signcerts/cert.pem",enrollment.certificate);
        fs.writeFileSync(keyPath, enrollment.key.toBytes());
        
        console.log('Successfully registered and enrolled admin user "appUser" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "appUser": ${error}`);
        process.exit(1);
    }
}

main();
