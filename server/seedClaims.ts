import { db } from './db';
import { claims, shipmentCertificates, policies } from '@shared/schema';
import { sql } from 'drizzle-orm';

const lossTypes = [
  'Cargo Damage',
  'Total Loss',
  'Theft',
  'Fire',
  'Weather Damage',
  'Collision',
  'Piracy',
  'Contamination',
  'Water Damage',
  'Delay',
];

const claimStatuses = [
  'Reported',
  'Under Review',
  'Investigation',
  'Approved',
  'Rejected',
  'Settled',
  'Withdrawn',
];

const reporters = [
  { name: 'Captain James Morrison', role: 'Ship Master' },
  { name: 'Sarah Chen', role: 'Cargo Officer' },
  { name: 'Michael Santos', role: 'Third Mate' },
  { name: 'Emma Rodriguez', role: 'Chief Officer' },
  { name: 'David Kim', role: 'Ship Master' },
  { name: 'Jennifer Williams', role: 'Cargo Superintendent' },
  { name: 'Robert Johnson', role: 'Shore Manager' },
  { name: 'Maria Garcia', role: 'Port Agent' },
];

const adjusters = [
  { name: 'Lloyd Thompson', company: 'Marine Claims International' },
  { name: 'Patricia Anderson', company: 'Global Marine Adjusters' },
  { name: 'Thomas Wright', company: 'International Survey Group' },
  { name: 'Lisa Martinez', company: 'Maritime Claims Solutions' },
  { name: 'John Davis', company: 'Oceanic Loss Adjusters' },
  { name: 'Sarah Brown', company: 'Pacific Survey Associates' },
];

const weatherConditions = [
  'Typhoon force winds, 15m waves',
  'Heavy monsoon rains, poor visibility',
  'Severe thunderstorm with hail',
  'Hurricane conditions, sustained 120 knot winds',
  'Dense fog, visibility < 100m',
  'Gale force winds, rough seas',
  'Clear weather, calm seas',
  'Moderate rain, choppy seas',
];

const rootCauses = [
  'Inadequate securing of cargo',
  'Container stack collapse during heavy weather',
  'Failure of refrigeration system',
  'Breach of hull integrity',
  'Unauthorized access to cargo hold',
  'Improper stowage leading to cargo shift',
  'Equipment malfunction',
  'Third-party negligence',
  'Force majeure event',
  'Container damage prior to loading',
];

function generateClaimNumber(): string {
  const year = 2024;
  const random = Math.floor(Math.random() * 99999);
  return `CLM-${year}-${random.toString().padStart(5, '0')}`;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getStatusBasedDates(reportedDate: Date, status: string) {
  const dates: any = { reportedDate };
  
  switch (status) {
    case 'Settled':
    case 'Approved':
      dates.closedDate = new Date(reportedDate.getTime() + (30 + Math.random() * 90) * 24 * 60 * 60 * 1000);
      break;
    case 'Rejected':
      dates.closedDate = new Date(reportedDate.getTime() + (14 + Math.random() * 30) * 24 * 60 * 60 * 1000);
      break;
  }
  
  return dates;
}

function calculateFinancials(claimedAmount: number, status: string) {
  const financials: any = {
    claimedAmount: claimedAmount.toFixed(2),
  };
  
  switch (status) {
    case 'Approved':
    case 'Settled':
      // Assessed loss is typically 80-100% of claimed
      const assessedPercent = 0.8 + Math.random() * 0.2;
      financials.assessedLoss = (claimedAmount * assessedPercent).toFixed(2);
      financials.settledAmount = financials.assessedLoss;
      financials.deductibleApplied = (claimedAmount * 0.05).toFixed(2); // 5% deductible
      break;
    case 'Under Review':
    case 'Investigation':
      // Only assessed loss available
      const prelimAssessed = 0.7 + Math.random() * 0.3;
      financials.assessedLoss = (claimedAmount * prelimAssessed).toFixed(2);
      break;
    case 'Rejected':
      financials.assessedLoss = '0.00';
      financials.settledAmount = '0.00';
      break;
  }
  
  return financials;
}

function getIncidentLocation(lossType: string) {
  const locations: Record<string, string[]> = {
    'Piracy': [
      'Gulf of Aden, 45nm off Somalia coast',
      'Strait of Malacca, near Horsburgh Light',
      'Gulf of Guinea, 120nm SW of Lagos',
    ],
    'Weather Damage': [
      'North Pacific, 800nm E of Japan',
      'South China Sea during monsoon season',
      'North Atlantic, 400nm W of Ireland',
    ],
    'Fire': [
      'Container bay #3, mid-ocean',
      'Engine room, Port of Singapore anchorage',
      'Cargo hold #2, en route to Rotterdam',
    ],
    'Collision': [
      'Singapore Strait, traffic separation scheme',
      'English Channel, Dover Strait',
      'Panama Canal approach',
    ],
  };
  
  return locations[lossType]?.[Math.floor(Math.random() * locations[lossType].length)] ||
         'Mid-ocean, en route';
}

export async function seedClaims() {
  try {
    console.log('🔧 Seeding claims data...');
    
    // Get all shipments with their policies
    const shipments = await db
      .select({
        id: shipmentCertificates.id,
        certificateNumber: shipmentCertificates.certificateNumber,
        policyId: shipmentCertificates.policyId,
        commodity: shipmentCertificates.commodity,
        vesselName: shipmentCertificates.vesselName,
        vesselImo: shipmentCertificates.vesselImo,
        voyageNumber: shipmentCertificates.voyageNumber,
        departureDate: shipmentCertificates.departureDate,
        actualArrival: shipmentCertificates.actualArrival,
        sourcePort: shipmentCertificates.sourcePort,
        destinationPort: shipmentCertificates.destinationPort,
        currency: shipmentCertificates.currency,
        insuredAmount: shipmentCertificates.insuredAmount,
        containerNumbers: shipmentCertificates.containerNumbers,
      })
      .from(shipmentCertificates)
      .leftJoin(policies, sql`${shipmentCertificates.policyId} = ${policies.id}`)
      .execute();
    
    console.log(`Found ${shipments.length} shipments to potentially claim against`);
    
    // Create claims for ~20% of shipments (realistic claim rate)
    const claimCount = Math.floor(shipments.length * 0.2);
    const selectedShipments = shipments
      .sort(() => Math.random() - 0.5)
      .slice(0, claimCount);
    
    const claimsData = [];
    
    for (const shipment of selectedShipments) {
      const lossType = lossTypes[Math.floor(Math.random() * lossTypes.length)];
      const status = claimStatuses[Math.floor(Math.random() * claimStatuses.length)];
      const reporter = reporters[Math.floor(Math.random() * reporters.length)];
      const adjuster = adjusters[Math.floor(Math.random() * adjusters.length)];
      
      // Incident date should be during voyage
      const departureTime = shipment.departureDate ? new Date(shipment.departureDate).getTime() : Date.now();
      const arrivalTime = shipment.actualArrival ? new Date(shipment.actualArrival).getTime() : Date.now();
      const incidentDate = new Date(departureTime + Math.random() * (arrivalTime - departureTime));
      
      // Reported 1-5 days after incident
      const reportedDate = new Date(incidentDate.getTime() + (1 + Math.random() * 4) * 24 * 60 * 60 * 1000);
      const dates = getStatusBasedDates(reportedDate, status);
      
      // Claimed amount is 20-80% of insured amount
      const claimedPercent = 0.2 + Math.random() * 0.6;
      const claimedAmount = parseFloat(shipment.insuredAmount as string) * claimedPercent;
      const financials = calculateFinancials(claimedAmount, status);
      
      const incidentDescriptions: Record<string, string> = {
        'Cargo Damage': `During heavy weather conditions, cargo securing failed causing ${shipment.commodity} containers to shift. Multiple containers sustained structural damage with visible denting and potential cargo compromise.`,
        'Total Loss': `Complete loss of ${shipment.commodity} due to ${lossType === 'Fire' ? 'fire outbreak in cargo hold' : 'vessel grounding'}. All cargo declared total constructive loss.`,
        'Theft': `Unauthorized access to sealed containers during port operations. ${Math.floor(Math.random() * 5 + 1)} containers of ${shipment.commodity} found with broken seals and partial cargo theft.`,
        'Fire': `Fire outbreak in container bay affecting ${Math.floor(Math.random() * 10 + 1)} containers. ${shipment.commodity} sustained heat, smoke, and water damage from firefighting operations.`,
        'Weather Damage': `Severe weather conditions with waves exceeding 12 meters caused extensive cargo shift and container damage. ${shipment.commodity} exposed to water ingress.`,
        'Collision': `Vessel collision with another ship in congested waters resulted in hull breach affecting cargo hold. ${shipment.commodity} contaminated by seawater ingress.`,
        'Piracy': `Piracy attempt resulted in crew lockdown and cargo hold breach. ${shipment.commodity} containers ransacked and partial cargo stolen.`,
        'Contamination': `Cargo contamination discovered upon discharge. ${shipment.commodity} found to be contaminated, rendering it unsuitable for intended use.`,
        'Water Damage': `Water ingress through hatch cover defect during voyage. ${shipment.commodity} sustained significant water damage affecting commercial value.`,
        'Delay': `Significant voyage delay due to mechanical breakdown and port congestion. Perishable ${shipment.commodity} deteriorated beyond acceptable quality standards.`,
      };
      
      const claim = {
        policyId: shipment.policyId,
        shipmentId: shipment.id,
        claimNumber: generateClaimNumber(),
        status,
        incidentDate,
        ...dates,
        
        lossType,
        incidentLocation: getIncidentLocation(lossType),
        incidentLatitude: (Math.random() * 60 - 30).toFixed(8),
        incidentLongitude: (Math.random() * 180 - 90).toFixed(8),
        incidentDescription: incidentDescriptions[lossType] || `Incident involving ${shipment.commodity} during maritime transport.`,
        rootCause: rootCauses[Math.floor(Math.random() * rootCauses.length)],
        
        claimant: `${shipment.sourcePort} Trading Co.`,
        claimantContact: `claims@${shipment.sourcePort.toLowerCase().replace(/\s/g, '')}-trading.com`,
        reporter: reporter.name,
        reporterRole: reporter.role,
        adjuster: adjuster.name,
        adjusterCompany: adjuster.company,
        carrier: shipment.vesselName,
        
        affectedCommodity: shipment.commodity,
        affectedQuantity: (Math.random() * 100 + 10).toFixed(2),
        quantityUnit: 'MT',
        containerNumbers: shipment.containerNumbers,
        
        vesselName: shipment.vesselName,
        vesselImo: shipment.vesselImo,
        voyageNumber: shipment.voyageNumber,
        
        weatherConditions: lossType === 'Weather Damage' || lossType === 'Collision' 
          ? weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
          : null,
        seaState: lossType === 'Weather Damage' ? 'Very rough to high' : null,
        
        currency: shipment.currency,
        ...financials,
        
        surveyReportRef: `SRV-${Math.floor(Math.random() * 99999)}`,
        policeReportRef: lossType === 'Theft' || lossType === 'Piracy' ? `POL-${Math.floor(Math.random() * 99999)}` : null,
        documentationLinks: JSON.stringify([
          `survey_report_${generateClaimNumber()}.pdf`,
          `photos_damage_assessment.zip`,
        ]),
        
        additionalNotes: status === 'Settled' 
          ? `Claim settled in full accordance with policy terms. All documentation reviewed and approved.`
          : status === 'Rejected'
          ? `Claim rejected due to policy exclusions. Damage occurred outside coverage period.`
          : `Claim under active review. Awaiting additional documentation from claimant.`,
        internalNotes: `Adjuster ${adjuster.name} assigned. Initial assessment completed. ${status === 'Investigation' ? 'Further investigation required.' : 'Standard processing.'}`,
      };
      
      claimsData.push(claim);
    }
    
    // Insert claims in batches
    const batchSize = 10;
    for (let i = 0; i < claimsData.length; i += batchSize) {
      const batch = claimsData.slice(i, i + batchSize);
      await db.insert(claims).values(batch);
      console.log(`Inserted claims ${i + 1} to ${Math.min(i + batchSize, claimsData.length)}`);
    }
    
    console.log(`✅ Successfully seeded ${claimsData.length} claims`);
    console.log(`Status breakdown:`);
    const statusCounts: Record<string, number> = {};
    claimsData.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error seeding claims:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedClaims()
    .then(() => {
      console.log('Claims seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed claims:', error);
      process.exit(1);
    });
}
