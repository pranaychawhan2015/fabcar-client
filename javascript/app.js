const express = require('express')
const app = express()
const fs = require('fs')

const { FileSystemWallet, Gateway, Wallets } = require('fabric-network');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');


//const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
const ccpPath = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'org1.example.com','connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
const mspId = ccp.organizations['Org1'].mspid;
const ca = new FabricCAServices(caInfo.url, { trustedRoots: caInfo.tlsCACerts.pem, verify: false }, caInfo.caName);

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

// CORS Origin
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(express.json());

app.get('/cars', async (req, res) => {
  try {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const userExists = await wallet.get('appUser');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }   
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    console.log(2);
    const result = await contract.evaluateTransaction('queryAllCars');
    console.log(result.toString());
    res.json({status: true, cars: JSON.parse(result.toString())});
  } catch (err) {
    res.json({status: false, error: err});
  }
});

app.get('/cars/:key', async (req, res) => {
  try {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const userExists = await wallet.get('appUser');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    const result = await contract.evaluateTransaction('queryCar', req.params.key);
    res.json({status: true, car: JSON.parse(result.toString())});
  } catch (err) {
    res.json({status: false, error: err});
  }
});

app.post('/cars', async (req, res) => {
  if ((typeof req.body.key === 'undefined' || req.body.key === '') ||
      (typeof req.body.make === 'undefined' || req.body.make === '') ||
      (typeof req.body.model === 'undefined' || req.body.model === '') ||
      (typeof req.body.color === 'undefined' || req.body.color === '') ||
      (typeof req.body.owner === 'undefined' || req.body.owner === '') 
   ) {
    res.json({status: false, error: {message: 'Missing body.'}});
    return;
  }

  try {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const userExists = await wallet.get('appUser');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    
    // let endorsers = [];
    // //console.log(req.body.policies);
    // endorsers = await GetNames(wallet, req.body.policies, ca, mspId, endorsers, network.getChannel().getEndorsers());
    // endorsers = await GetNames(wallet, req.body.policies, ca2, mspId2, endorsers, network.getChannel().getEndorsers());
    // endorsers = await GetNames(wallet, req.body.policies, ca3,mspId3, endorsers, network.getChannel().getEndorsers());
    // endorsers = await GetNames(wallet, req.body.policies, ca4,mspId4, endorsers, network.getChannel().getEndorsers());
    // console.log(endorsers);
    // console.log(req.body.policies);

    //const transaction = contract.createTransaction('createCar').setEndorsingPeers(endorsers);
    await contract.submitTransaction('createCar',req.body.key, req.body.make, req.body.model, req.body.color, req.body.owner);
    res.json({status: true, message: 'Transaction (create car) has been submitted.'})
  } catch (err) {
    res.json({status: false, error: err});
  }
});

app.put('/cars', async (req, res) => {
  if ((typeof req.body.key === 'undefined' || req.body.key === '') ||
      (typeof req.body.owner === 'undefined' || req.body.owner === '')) {
    res.json({status: false, error: {message: 'Missing body.'}});
    return;
  }

  try {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const userExists = await wallet.get('appUser');
    if (!userExists) {
      res.json({status: false, error: {message: 'User not exist in the wallet'}});
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');
    
    // let endorsers = [];
    // //console.log(req.body.policies);
    // endorsers = await GetNames(wallet, req.body.policies, ca, mspId, endorsers, network.getChannel().getEndorsers());
    // endorsers = await GetNames(wallet, req.body.policies, ca2, mspId2, endorsers, network.getChannel().getEndorsers());
    // endorsers = await GetNames(wallet, req.body.policies, ca3,mspId3, endorsers, network.getChannel().getEndorsers());
    // endorsers = await GetNames(wallet, req.body.policies, ca4,mspId4, endorsers, network.getChannel().getEndorsers());
    //console.log(endorsers);

    //const transaction = contract.createTransaction('changeCarOwner').setEndorsingPeers(endorsers);
    await contract.submitTransaction('changeCarOwner',req.body.key, req.body.owner);

    res.json({status: true, message: 'Transaction (change car owner) has been submitted.'})
  } catch (err) {
    res.json({status: false, error: err});
  }
});



async function GetNames(wallet, policy, ca, mspId, endorsers, peers)
{
  const newPolicy = policy[0].split(',')

const provider = wallet.getProviderRegistry().getProvider('X.509');
let adminIdentity = await wallet.get('admin');
if(ca.getCaName() !='ca-org1')
{
  adminIdentity = await wallet.get(ca.getCaName());
  if(adminIdentity == null)
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
}

let roles = [];
const adminUser = await provider.getUserContext(adminIdentity, 'admin');
const identityService = ca.newIdentityService();
const identities = await (await identityService.getAll(adminUser)).result.identities;

identities.forEach(function(e){

//console.log(e.attrs);
const attrs = [];
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
//return (d.value == "Student" || d.value == "Doctor" || d.value == "Engineer")
  newPolicy.filter(element=>{
      if (d.value == element)
      {
        attrs.push(d.value)
      }
  })
});

console.log(attrs);

if(attrs.length != 0)
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

})

console.log(roles);

roles.forEach(name => {
  peers.filter(element => {
  if(element.name.startsWith(name))
  {
  endorsers.push(element);
  }
  });
  });

return endorsers;
}

app.listen(3000, () => {
  console.log('REST Server listening on port 3000');
});
