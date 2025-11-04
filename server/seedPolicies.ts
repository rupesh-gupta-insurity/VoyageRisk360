import { db } from './db';
import { policies } from '@shared/schema';

const policyTypes = [
  'Marine Cargo - ICC(A)',
  'Marine Cargo - ICC(B)',
  'Marine Cargo - ICC(C)',
  'Hull & Machinery',
  'Protection & Indemnity',
  'War Risk',
  'Freight Insurance',
];

const insurers = [
  "Lloyd's of London",
  'Allianz Global Corporate & Specialty',
  'Zurich Insurance Group',
  'AXA XL',
  'Swiss Re Corporate Solutions',
];

const brokers = [
  'Marsh',
  'Aon',
  'Willis Towers Watson',
  'Gallagher',
  'Hub International',
];

const territories = [
  'Asia-Pacific',
  'Europe',
  'Americas',
  'Middle East & Africa',
  'Worldwide',
  'Far East',
  'Mediterranean',
  'North Atlantic',
  'Indian Ocean',
  'Caribbean',
];

const assureds = [
  'Maersk Line',
  'Mediterranean Shipping Company',
  'CMA CGM Group',
  'Hapag-Lloyd',
  'ONE (Ocean Network Express)',
  'Evergreen Marine',
  'COSCO Shipping',
  'Yang Ming Marine',
  'PIL (Pacific International Lines)',
  'HMM (Hyundai Merchant Marine)',
  'Zim Integrated Shipping',
  'Wan Hai Lines',
  'Orient Overseas Container Line',
  'APL (American President Lines)',
  'Hamburg Süd',
];

const currencies = ['USD', 'EUR', 'GBP', 'SGD', 'JPY'];

const statuses = ['Active', 'Expired', 'Cancelled'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePolicyNumber(year: number, index: number): string {
  const prefix = ['MC', 'HM', 'PI', 'WR', 'FR'][randomNumber(0, 4)];
  return `${prefix}${year}${String(index).padStart(4, '0')}`;
}

function getDateForYear(year: number, monthStart: number, monthEnd: number): Date {
  const month = randomNumber(monthStart, monthEnd);
  const day = randomNumber(1, 28);
  return new Date(year, month - 1, day);
}

function getPolicyStatus(endDate: Date): string {
  const now = new Date();
  if (endDate < now) return 'Expired';
  return randomNumber(1, 100) > 90 ? 'Cancelled' : 'Active';
}

function getCoverageDetails(policyType: string) {
  const basePerils = ['Fire', 'Collision', 'Stranding', 'Heavy Weather'];
  
  if (policyType.includes('ICC(A)')) {
    return {
      coverage: 'All Risks',
      perils: ['All risks of physical loss or damage'],
      exclusions: ['War', 'Strikes', 'Unseaworthiness', 'Delay'],
    };
  } else if (policyType.includes('ICC(B)')) {
    return {
      coverage: 'Named Perils',
      perils: [...basePerils, 'Earthquake', 'Volcanic Eruption', 'Lightning'],
      exclusions: ['War', 'Strikes', 'Delay', 'Inherent Vice'],
    };
  } else if (policyType.includes('Hull')) {
    return {
      coverage: 'Hull & Machinery',
      perils: ['Collision', 'Fire', 'Explosion', 'Piracy', 'General Average'],
      exclusions: ['War', 'Nuclear', 'Pollution', 'Wear and Tear'],
    };
  } else if (policyType.includes('P&I')) {
    return {
      coverage: 'Protection & Indemnity',
      perils: ['Third Party Liability', 'Crew Claims', 'Pollution', 'Wreck Removal'],
      exclusions: ['War', 'Nuclear', 'Sanctions', 'Trading Warranties'],
    };
  } else if (policyType.includes('War')) {
    return {
      coverage: 'War & Strikes',
      perils: ['War', 'Civil War', 'Piracy', 'Terrorism', 'Strikes', 'Riots'],
      exclusions: ['Nuclear', 'Biological Weapons', 'Chemical Weapons'],
    };
  }
  
  return {
    coverage: 'Standard',
    perils: basePerils,
    exclusions: ['War', 'Strikes'],
  };
}

export async function seedPolicies() {
  console.log('🌊 Starting to seed 50 maritime insurance policies...');
  
  const policiesData = [];
  let policyIndex = 1;
  
  // Generate 10 policies per year from 2020 to 2024
  for (let year = 2020; year <= 2024; year++) {
    for (let i = 0; i < 10; i++) {
      const policyType = randomElement(policyTypes);
      const effectiveDate = getDateForYear(year, 1, 12);
      const endDate = new Date(effectiveDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year policy
      
      const currency = randomElement(currencies);
      const sumInsured = randomNumber(500000, 50000000);
      const premium = Math.floor(sumInsured * (randomNumber(10, 50) / 1000)); // 1-5% premium
      const deductible = Math.floor(sumInsured * (randomNumber(1, 10) / 1000)); // 0.1-1% deductible
      
      const policy = {
        policyNo: generatePolicyNumber(year, policyIndex++),
        policyType,
        policyName: `${policyType} - ${randomElement(territories)} ${year}`,
        underwritingYear: year,
        
        insurer: randomElement(insurers),
        assured: randomElement(assureds),
        broker: randomElement(brokers),
        
        effectiveDate,
        endDate,
        status: getPolicyStatus(endDate),
        
        currency,
        sumInsured: sumInsured.toString(),
        premium: premium.toString(),
        deductible: deductible.toString(),
        
        coverageTerritory: randomElement(territories),
        coverageDetails: getCoverageDetails(policyType),
      };
      
      policiesData.push(policy);
    }
  }
  
  // Insert all policies
  await db.insert(policies).values(policiesData);
  
  console.log(`✅ Successfully seeded ${policiesData.length} maritime insurance policies!`);
  console.log(`   - Years: 2020-2024`);
  console.log(`   - Policy Types: ${new Set(policiesData.map(p => p.policyType)).size} types`);
  console.log(`   - Insurers: ${new Set(policiesData.map(p => p.insurer)).size} insurers`);
  console.log(`   - Territories: ${new Set(policiesData.map(p => p.coverageTerritory)).size} territories`);
}

// Run if called directly
seedPolicies()
  .then(() => {
    console.log('✓ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding policies:', error);
    process.exit(1);
  });
