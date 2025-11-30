const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');
const { PinataSDK } = require('pinata-web3');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Aptos client
const config = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: "https://api.testnet.aptoslabs.com/v1"
});
const aptos = new Aptos(config);

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: 'gateway.pinata.cloud'
});

// Contract address from environment
const MODULE_ADDRESS = process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;

/**
 * Upload photo to IPFS via Pinata
 */
app.post('/api/upload-proof', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Pinata IPFS
    const file = new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype });
    const uploadResult = await pinata.upload.file(file);
    
    console.log(`File uploaded to IPFS: ${req.file.originalname}, CID: ${uploadResult.IpfsHash}`);
    
    res.json({ 
      ipfsHash: uploadResult.IpfsHash,
      fileName: req.file.originalname,
      size: req.file.size,
      timestamp: uploadResult.Timestamp
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

/**
 * Query blockchain events for funds
 */
app.get('/api/events/funds', async (req, res) => {
  try {
    const events = await aptos.getAccountEventsByEventType({
      accountAddress: MODULE_ADDRESS,
      eventType: `${MODULE_ADDRESS}::dapptrack::FundAllocated`,
    });

    res.json({ events: events || [] });
  } catch (error) {
    console.error('Query funds error:', error);
    res.status(500).json({ error: 'Failed to query funds', details: error.message });
  }
});

/**
 * Query blockchain events for deliveries
 */
app.get('/api/events/deliveries', async (req, res) => {
  try {
    const events = await aptos.getAccountEventsByEventType({
      accountAddress: MODULE_ADDRESS,
      eventType: `${MODULE_ADDRESS}::dapptrack::DeliveryRecorded`,
    });

    res.json({ events: events || [] });
  } catch (error) {
    console.error('Query deliveries error:', error);
    res.status(500).json({ error: 'Failed to query deliveries', details: error.message });
  }
});

/**
 * Query blockchain events for donations
 */
app.get('/api/events/donations', async (req, res) => {
  try {
    const events = await aptos.getAccountEventsByEventType({
      accountAddress: MODULE_ADDRESS,
      eventType: `${MODULE_ADDRESS}::dapptrack::DonationReceived`,
    });

    res.json({ events: events || [] });
  } catch (error) {
    console.error('Query donations error:', error);
    res.status(500).json({ error: 'Failed to query donations', details: error.message });
  }
});

/**
 * Query blockchain events for verifications
 */
app.get('/api/events/verifications', async (req, res) => {
  try {
    const events = await aptos.getAccountEventsByEventType({
      accountAddress: MODULE_ADDRESS,
      eventType: `${MODULE_ADDRESS}::dapptrack::DeliveryVerified`,
    });

    res.json({ events: events || [] });
  } catch (error) {
    console.error('Query verifications error:', error);
    res.status(500).json({ error: 'Failed to query verifications', details: error.message });
  }
});

// In-memory storage for organizations (for hackathon speed)
// In production: use a proper database or maintain a master IPFS file
let organizationsCache = [];
let organizationsCID = null;

/**
 * Initialize organizations from Pinata if exists
 */
async function initializeOrganizations() {
  try {
    // Try to fetch existing organizations file from Pinata
    const files = await pinata.files.list();
    const orgFile = files.files.find(f => f.name === 'dapptrack-organizations.json');
    
    if (orgFile) {
      const data = await pinata.gateways.get(orgFile.cid);
      organizationsCache = data.data || [];
      organizationsCID = orgFile.cid;
      console.log(`📋 Loaded ${organizationsCache.length} organizations from IPFS`);
    }
  } catch (error) {
    console.log('📋 Starting with empty organizations list');
  }
}

/**
 * Save organizations to Pinata
 */
async function saveOrganizations() {
  try {
    const uploadResult = await pinata.upload.json(organizationsCache).addMetadata({
      name: 'dapptrack-organizations.json'
    });
    organizationsCID = uploadResult.IpfsHash;
    console.log(`💾 Organizations saved to IPFS: ${organizationsCID}`);
    return uploadResult;
  } catch (error) {
    console.error('Failed to save organizations:', error);
    throw error;
  }
}

/**
 * Register a new organization - Store on Pinata IPFS
 */
app.post('/api/organizations', async (req, res) => {
  try {
    const orgData = {
      ...req.body,
      id: Date.now().toString(),
      registeredAt: new Date().toISOString(),
      trustScore: 50,
      totalDonations: 0,
      activeFunds: 0,
      completedProjects: 0,
      beneficiaries: 0,
      verified: false,
      reviews: []
    };

    // Add to cache and save to Pinata
    organizationsCache.push(orgData);
    await saveOrganizations();
    
    console.log(`✅ Organization registered: ${orgData.name} (Total: ${organizationsCache.length})`);
    
    res.json({ 
      success: true,
      organization: orgData,
      ipfsHash: organizationsCID
    });
  } catch (error) {
    console.error('Organization registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

/**
 * Get all organizations
 */
app.get('/api/organizations', async (req, res) => {
  try {
    res.json({ 
      organizations: organizationsCache,
      ipfsHash: organizationsCID,
      count: organizationsCache.length
    });
  } catch (error) {
    console.error('Fetch organizations error:', error);
    res.status(500).json({ error: 'Failed to fetch organizations', details: error.message });
  }
});

/**
 * Get single organization by ID
 */
app.get('/api/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organization = organizationsCache.find(org => org.id === id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({ organization });
  } catch (error) {
    console.error('Fetch organization error:', error);
    res.status(404).json({ error: 'Organization not found', details: error.message });
  }
});

/**
 * Add review to organization
 */
app.post('/api/organizations/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const review = {
      id: Date.now().toString(),
      ...req.body,
      date: new Date().toISOString()
    };

    // Find and update organization
    const orgIndex = organizationsCache.findIndex(org => org.id === id);
    if (orgIndex === -1) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    organizationsCache[orgIndex].reviews.push(review);
    await saveOrganizations();
    
    res.json({ 
      success: true,
      review,
      organization: organizationsCache[orgIndex]
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Failed to add review', details: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    network: 'testnet',
    moduleAddress: MODULE_ADDRESS,
    pinataConfigured: !!process.env.PINATA_JWT,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 DappTrack Backend Server`);
  console.log(`📡 Running on http://localhost:${PORT}`);
  console.log(`🌐 Network: Aptos Testnet`);
  console.log(`📦 Module: ${MODULE_ADDRESS}`);
  console.log(`📌 Pinata IPFS: ${process.env.PINATA_JWT ? 'Configured ✓' : 'Not configured ✗'}`);
  
  // Initialize organizations from Pinata
  await initializeOrganizations();
  console.log(`\n✅ Server ready!\n`);
});
