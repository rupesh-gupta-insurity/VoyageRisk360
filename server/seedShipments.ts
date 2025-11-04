import { db } from "./db";
import { policies, shipmentCertificates } from "@shared/schema";

// Global ports and countries for realistic voyage data
const ports = [
  { port: 'Shanghai', country: 'China' },
  { port: 'Singapore', country: 'Singapore' },
  { port: 'Rotterdam', country: 'Netherlands' },
  { port: 'Los Angeles', country: 'USA' },
  { port: 'Hamburg', country: 'Germany' },
  { port: 'Dubai', country: 'UAE' },
  { port: 'Hong Kong', country: 'Hong Kong' },
  { port: 'Busan', country: 'South Korea' },
  { port: 'New York', country: 'USA' },
  { port: 'Antwerp', country: 'Belgium' },
  { port: 'Tokyo', country: 'Japan' },
  { port: 'London Gateway', country: 'UK' },
  { port: 'Jebel Ali', country: 'UAE' },
  { port: 'Santos', country: 'Brazil' },
  { port: 'Mumbai', country: 'India' },
  { port: 'Sydney', country: 'Australia' },
];

const commodities = [
  { name: 'Electronics', description: 'Consumer electronics and components', hsCode: '8517' },
  { name: 'Textiles', description: 'Garments and fabric materials', hsCode: '6204' },
  { name: 'Machinery Parts', description: 'Industrial machinery components', hsCode: '8483' },
  { name: 'Agricultural Products', description: 'Grain and agricultural commodities', hsCode: '1001' },
  { name: 'Chemicals', description: 'Industrial chemicals and materials', hsCode: '2901' },
  { name: 'Pharmaceuticals', description: 'Medical supplies and medicines', hsCode: '3004' },
  { name: 'Automotive Parts', description: 'Vehicle components and accessories', hsCode: '8708' },
  { name: 'Steel Products', description: 'Steel bars, sheets, and structures', hsCode: '7208' },
  { name: 'Plastic Goods', description: 'Plastic products and materials', hsCode: '3920' },
  { name: 'Wood Products', description: 'Lumber and wood materials', hsCode: '4407' },
];

const vessels = [
  { name: 'MSC Aurora', type: 'Container Ship', imo: 'IMO9876543' },
  { name: 'Maersk Endeavor', type: 'Container Ship', imo: 'IMO9765432' },
  { name: 'CMA CGM Excellence', type: 'Container Ship', imo: 'IMO9654321' },
  { name: 'Pacific Voyager', type: 'Bulk Carrier', imo: 'IMO9543210' },
  { name: 'Ocean Fortune', type: 'Bulk Carrier', imo: 'IMO9432109' },
  { name: 'Atlantic Star', type: 'Tanker', imo: 'IMO9321098' },
  { name: 'Mediterranean Express', type: 'Container Ship', imo: 'IMO9210987' },
  { name: 'Baltic Trader', type: 'General Cargo', imo: 'IMO9109876' },
];

const packagingTypes = ['20ft Container', '40ft Container', '40ft HC Container', 'Pallets', 'Bulk', 'Drums'];
const statuses = ['Booked', 'Loading', 'In Transit', 'Arrived', 'Delivered', 'Completed'];
const incoterms = ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP'];
const conveyanceTypes = ['Sea Freight', 'Multimodal', 'Ocean Freight'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateCertificateNumber(policyNo: string, index: number): string {
  const year = new Date().getFullYear().toString().slice(-2);
  return `${policyNo}-${year}-${String(index).padStart(4, '0')}`;
}

async function seedShipments() {
  console.log('🚢 Starting shipment certificates seed...');

  // Get all policies
  const allPolicies = await db.select().from(policies);
  console.log(`Found ${allPolicies.length} policies`);

  let totalShipments = 0;

  for (const policy of allPolicies) {
    // Generate 3-5 shipments per policy
    const numShipments = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numShipments; i++) {
      const source = randomElement(ports);
      let destination = randomElement(ports);
      // Ensure destination is different from source
      while (destination.port === source.port) {
        destination = randomElement(ports);
      }

      const commodity = randomElement(commodities);
      const vessel = randomElement(vessels);
      const packagingType = randomElement(packagingTypes);
      const status = randomElement(statuses);

      // Generate realistic dates based on policy period
      const policyStart = new Date(policy.effectiveDate);
      const policyEnd = new Date(policy.endDate);
      const bookingDate = randomDate(policyStart, policyEnd);
      const shipmentDate = new Date(bookingDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // 0-7 days after booking
      const departureDate = new Date(shipmentDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000); // 0-14 days after shipment
      const estimatedArrival = new Date(departureDate.getTime() + (20 + Math.random() * 20) * 24 * 60 * 60 * 1000); // 20-40 days voyage
      
      let actualArrival = null;
      if (status === 'Arrived' || status === 'Delivered' || status === 'Completed') {
        actualArrival = new Date(estimatedArrival.getTime() + (Math.random() - 0.5) * 5 * 24 * 60 * 60 * 1000); // +/- 5 days
      }

      // Calculate insured amount (portion of policy sum insured)
      const policySum = parseFloat(policy.sumInsured);
      const insuredAmount = (policySum * (0.1 + Math.random() * 0.3)).toFixed(2); // 10-40% of policy sum
      const declaredValue = (parseFloat(insuredAmount) * (1.05 + Math.random() * 0.1)).toFixed(2); // 5-15% more than insured

      const numberOfPackages = packagingType.includes('Container') 
        ? Math.floor(Math.random() * 5) + 1 
        : Math.floor(Math.random() * 100) + 10;

      const containerNumbers = packagingType.includes('Container')
        ? Array.from({ length: numberOfPackages }, (_, idx) => `${randomElement(['MAEU', 'MSCU', 'CMAU', 'COSCO'])}${Math.floor(Math.random() * 9000000) + 1000000}${idx}`)
        : [];

      const assuredParties = [policy.assured];
      
      // Add additional assured parties sometimes
      if (Math.random() > 0.7) {
        assuredParties.push(`${policy.assured} Subsidiaries`);
      }

      const isHazardous = Math.random() > 0.85;
      const isTempControlled = commodity.name === 'Pharmaceuticals' || commodity.name === 'Agricultural Products';

      await db.insert(shipmentCertificates).values({
        policyId: policy.id,
        certificateNumber: generateCertificateNumber(policy.policyNo, totalShipments + i + 1),
        
        sourcePort: source.port,
        sourceCountry: source.country,
        destinationPort: destination.port,
        destinationCountry: destination.country,
        voyageNumber: `V${Math.floor(Math.random() * 9000) + 1000}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        
        bookingDate,
        shipmentDate,
        departureDate,
        estimatedArrival,
        actualArrival,
        
        vesselName: vessel.name,
        vesselType: vessel.type,
        vesselImo: vessel.imo,
        conveyanceType: randomElement(conveyanceTypes),
        
        commodity: commodity.name,
        commodityDescription: commodity.description,
        hsCode: commodity.hsCode,
        packagingType,
        numberOfPackages,
        grossWeight: (Math.random() * 50000 + 1000).toFixed(2),
        weightUnit: 'KG',
        containerNumbers: containerNumbers.length > 0 ? containerNumbers : null,
        
        insuredAmount,
        declaredValue,
        currency: policy.currency,
        coverageClause: policy.policyType.includes('ICC(A)') ? 'ICC(A) All Risks' : 
                       policy.policyType.includes('ICC(B)') ? 'ICC(B) Limited Coverage' :
                       policy.policyType.includes('ICC(C)') ? 'ICC(C) Minimum Coverage' : 'Institute Cargo Clauses',
        deductible: policy.deductible,
        
        assuredParties,
        consignee: `${destination.port} Trading Co.`,
        notifyParty: `${destination.port} Freight Forwarders`,
        
        billOfLadingNo: `BL${Math.floor(Math.random() * 900000) + 100000}`,
        incoterm: randomElement(incoterms),
        hazardousMaterial: isHazardous,
        hazardClass: isHazardous ? randomElement(['Class 3', 'Class 8', 'Class 9']) : null,
        temperatureControlled: isTempControlled,
        storageTemperature: isTempControlled ? randomElement(['-20°C', '2-8°C', '15-25°C']) : null,
        
        status,
        trackingUrl: Math.random() > 0.5 ? `https://track.example.com/${Math.random().toString(36).substring(7)}` : null,
        remarks: Math.random() > 0.7 ? 'Expedited handling required' : null,
      });
    }

    totalShipments += numShipments;
  }

  console.log(`✅ Successfully created ${totalShipments} shipment certificates across ${allPolicies.length} policies`);
}

export { seedShipments };

// Run if called directly
seedShipments()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
