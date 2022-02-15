
/*
* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Gateway, Wallets, HsmX509Provider } = require('fabric-network');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const e = require('express');
let roles = [];
//import UserConfig from 'fabric-common';
//import { X509Provider } from 'fabric-network/lib/impl/wallet/x509identity';
//const fabric_shim = require('fabric-shim');
//const { FabricCAServices = require('fabric-ca-client');

// class CustomConfig extends UserConfig
// {
// constructor()
// {
// super();
// this.enrollmentID = 'admin';
// this.name = 'ca-org1'
// }
// }

async function main() {
try {
// load the network configuration
const ccpPath = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'org1.example.com','connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = await Wallets.newFileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

// Check to see if we've already enrolled the user.
const identity = await wallet.get('appUser');
if (!identity) {
console.log('An identity for the user "appUser" does not exist in the wallet');
console.log('Run the registerUser.js application before retrying');
return;
}

// Create a new gateway for connecting to our peer node.
const gateway = new Gateway();
await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: {
enabled: true, asLocalhost: true } });

// Get the network (channel) our contract is deployed to.
const network = await gateway.getNetwork('mychannel');

// Get the contract from the network.
const contract = network.getContract('fabcar');

const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
const caTLSCACerts = caInfo.tlsCACerts.pem;
const ca1 = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts,verify: false }, caInfo.caName);

const ccpPath2 = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'org2.example.com','connection-org2.json');
const ccp2 = JSON.parse(fs.readFileSync(ccpPath2, 'utf8'));
const caInfo2 = ccp2.certificateAuthorities['ca.org2.example.com'];
const mspId2 = ccp2.organizations['Org2'].mspid;
const ca2 = new FabricCAServices(caInfo2.url, { trustedRoots: caInfo2.tlsCACerts.pem, verify: false }, caInfo2.caName);

const ccpPath3 = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'org3.example.com','connection-org3.json');
const ccp3 = JSON.parse(fs.readFileSync(ccpPath3, 'utf8'));
const caInfo3 = ccp3.certificateAuthorities['ca.org3.example.com'];
const mspId3 = ccp3.organizations['Org3'].mspid;
const ca3 = new FabricCAServices(caInfo3.url, { trustedRoots: caInfo3.tlsCACerts.pem, verify: false }, caInfo3.caName);

const ccpPath4 = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'org4.example.com','connection-org4.json');
const ccp4 = JSON.parse(fs.readFileSync(ccpPath4, 'utf8'));
const caInfo4 = ccp4.certificateAuthorities['ca.org4.example.com'];
const mspId4 = ccp4.organizations['Org4'].mspid;
const ca4 = new FabricCAServices(caInfo4.url, { trustedRoots: caInfo4.tlsCACerts.pem, verify: false }, caInfo4.caName);

const peers = network.getChannel().getEndorsers();
let endorsers = [];
roles = [];
await GetNames(wallet, ca1, null);
await GetNames(wallet, ca2, mspId2);
await GetNames(wallet, ca3, mspId3);
await GetNames(wallet, ca4, mspId4);

roles.forEach(name => {
peers.filter(element => {
if(element.name.startsWith(name))
{
endorsers.push(element);
}
});
});
//console.log(peers);
//console.log(roles);
console.log(endorsers);

// Submit the specified transaction.
// createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12',
// changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner',
//const newTransaction = transaction.setEndorsingPeers(endorsers);
//const transaction = await
const transaction = contract.createTransaction('createCar').setEndorsingPeers(endorsers);
await transaction.submit('CAR15', 'Honda', 'Accord', 'Black', 'Tom');

//console.log(result.toLocaleString());
console.log('Transaction has been submitted');

// Disconnect from the gateway.
await gateway.disconnect();

} catch (error) {
console.error(`Failed to submit transaction: ${error}`);
process.exit(1);
}
}

async function GetNames(wallet, ca, mspId)
{
const provider = wallet.getProviderRegistry().getProvider('X.509');
let adminIdentity = await wallet.get('admin');
if(ca.getCaName() !='ca-org1')
{
const enrollment = await ca.enroll({ enrollmentID:'admin',enrollmentSecret:
'adminpw', ecert:true});
const x509Identity = {
credentials: {
certificate: enrollment.certificate,
privateKey: enrollment.key.toBytes(),
},
mspId: mspId,
type: 'X.509',
};
await wallet.put(ca.getCaName(), x509Identity);
adminIdentity = await wallet.get(ca.getCaName());
}

const adminUser = await provider.getUserContext(adminIdentity, 'admin');
const identityService = ca.newIdentityService();
const identities = await (await identityService.getAll(adminUser)).result.
identities;

//console.log(identities);
identities.forEach(function(e){

const result = e.attrs.filter(function(d)
{
// var pushValue = false;
// if(d.name == "Role" && d.value == "Student")
// {
// pushValue = true;
// }
// if(pushValue)
// {
// if(d.name == "Email")
// {
// roles.push(d.value);
// }
// }
return (d.value == "Student" || d.value == "Doctor" || d.value == "Engineer")
})

let value = null;

result.forEach(function(d){
value = d.value;
})

//console.log(value);

if(value == "Student" || value == "Doctor" || value == "Engineer")
{
e.attrs.filter(function(d)
{
if(d.name == "Email")
{
roles.push(d.value);
}
}
)
}
//console.log(e.attrs);

});
//console.log(roles);
}

main();
