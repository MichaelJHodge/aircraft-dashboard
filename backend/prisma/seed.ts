import {
  AircraftModel,
  AircraftPhase,
  MilestoneStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PHASE_SEQUENCE: AircraftPhase[] = [
  AircraftPhase.MANUFACTURING,
  AircraftPhase.GROUND_TESTING,
  AircraftPhase.FLIGHT_TESTING,
  AircraftPhase.CERTIFICATION,
  AircraftPhase.READY,
  AircraftPhase.DELIVERED,
];

function getStandardCertificationMilestones(currentPhase: AircraftPhase) {
  const isAtLeast = (phase: AircraftPhase) =>
    PHASE_SEQUENCE.indexOf(currentPhase) >= PHASE_SEQUENCE.indexOf(phase);

  return [
    {
      id: 'cert-001',
      name: 'Type Certification Application',
      description: 'Initial application submitted to FAA for type certification',
      completed: true,
      completedDate: new Date('2024-01-15'),
      requiredFor: AircraftPhase.MANUFACTURING,
    },
    {
      id: 'cert-002',
      name: 'Certification Basis Established',
      description: 'Agreement on applicable regulations and special conditions',
      completed: true,
      completedDate: new Date('2024-02-28'),
      requiredFor: AircraftPhase.MANUFACTURING,
    },
    {
      id: 'cert-003',
      name: 'Compliance Plan Approved',
      description: 'Detailed plan for demonstrating compliance with regulations',
      completed: true,
      completedDate: new Date('2024-04-10'),
      requiredFor: AircraftPhase.GROUND_TESTING,
    },
    {
      id: 'cert-004',
      name: 'Ground Test Protocol Approval',
      description: 'Test procedures approved for static, electrical, and systems testing',
      completed: isAtLeast(AircraftPhase.FLIGHT_TESTING),
      completedDate: isAtLeast(AircraftPhase.FLIGHT_TESTING)
        ? new Date('2024-05-20')
        : null,
      requiredFor: AircraftPhase.GROUND_TESTING,
    },
    {
      id: 'cert-005',
      name: 'Flight Test Authorization',
      description: 'Special Flight Authorization or Experimental Certificate issued',
      completed: isAtLeast(AircraftPhase.FLIGHT_TESTING),
      completedDate: isAtLeast(AircraftPhase.FLIGHT_TESTING)
        ? new Date('2024-07-01')
        : null,
      requiredFor: AircraftPhase.FLIGHT_TESTING,
    },
    {
      id: 'cert-006',
      name: 'Flight Test Program Completion',
      description: 'All required flight test points completed and data submitted',
      completed: isAtLeast(AircraftPhase.CERTIFICATION),
      completedDate: isAtLeast(AircraftPhase.CERTIFICATION)
        ? new Date('2024-09-15')
        : null,
      requiredFor: AircraftPhase.CERTIFICATION,
    },
    {
      id: 'cert-007',
      name: 'Production Certificate Application',
      description: 'Application for production approval submitted',
      completed: isAtLeast(AircraftPhase.CERTIFICATION),
      completedDate: isAtLeast(AircraftPhase.CERTIFICATION)
        ? new Date('2024-10-01')
        : null,
      requiredFor: AircraftPhase.CERTIFICATION,
    },
    {
      id: 'cert-008',
      name: 'Type Certificate Issued',
      description: 'FAA Type Certificate granted for aircraft design',
      completed: isAtLeast(AircraftPhase.READY),
      completedDate: isAtLeast(AircraftPhase.READY) ? new Date('2024-11-20') : null,
      requiredFor: AircraftPhase.READY,
    },
    {
      id: 'cert-009',
      name: 'Production Certificate Issued',
      description: 'Production Certificate granted for manufacturing',
      completed: isAtLeast(AircraftPhase.READY),
      completedDate: isAtLeast(AircraftPhase.READY) ? new Date('2024-11-25') : null,
      requiredFor: AircraftPhase.READY,
    },
    {
      id: 'cert-010',
      name: 'Standard Airworthiness Certificate',
      description: 'Individual aircraft airworthiness certificate issued',
      completed: isAtLeast(AircraftPhase.DELIVERED),
      completedDate: isAtLeast(AircraftPhase.DELIVERED)
        ? new Date('2024-12-10')
        : null,
      requiredFor: AircraftPhase.DELIVERED,
    },
  ];
}

function getProgressForPhase(phase: AircraftPhase): number {
  const map: Record<AircraftPhase, number> = {
    MANUFACTURING: 65,
    GROUND_TESTING: 45,
    FLIGHT_TESTING: 72,
    CERTIFICATION: 88,
    READY: 95,
    DELIVERED: 100,
  };
  return map[phase] ?? 0;
}

function getLifecycleStages(currentPhase: AircraftPhase) {
  const currentIndex = PHASE_SEQUENCE.indexOf(currentPhase);

  return PHASE_SEQUENCE.map((phase, index) => {
    if (index < currentIndex) {
      return {
        phase,
        status: MilestoneStatus.COMPLETED,
        startDate: getStartDate(index),
        completionDate: getCompletionDate(index),
        progressPercentage: 100,
        order: index,
      };
    }

    if (index === currentIndex) {
      return {
        phase,
        status: MilestoneStatus.IN_PROGRESS,
        startDate: getStartDate(index),
        completionDate: null,
        progressPercentage: getProgressForPhase(phase),
        order: index,
      };
    }

    return {
      phase,
      status: MilestoneStatus.UPCOMING,
      startDate: null,
      completionDate: null,
      progressPercentage: null,
      order: index,
    };
  });
}

function getStartDate(index: number): Date {
  const d = new Date('2024-01-01');
  d.setMonth(d.getMonth() + index * 3);
  return d;
}

function getCompletionDate(index: number): Date {
  const d = new Date('2024-01-01');
  d.setMonth(d.getMonth() + index * 3 + 2);
  return d;
}

function getSustainabilityMetrics(model: AircraftModel) {
  if (model === AircraftModel.ALIA_250C) {
    return {
      estimatedCO2AvoidedKg: 125000,
      equivalentTreesPlanted: 5700,
      conventionalFuelSavedGallons: 32000,
    };
  }

  return {
    estimatedCO2AvoidedKg: 95000,
    equivalentTreesPlanted: 4300,
    conventionalFuelSavedGallons: 24000,
  };
}

const aircraftSeed = [
  {
    id: 'ac-001',
    tailNumber: 'N250BA',
    model: AircraftModel.ALIA_250,
    currentPhase: AircraftPhase.DELIVERED,
    certificationProgress: 100,
    estimatedDeliveryDate: new Date('2024-12-15'),
    customerName: 'United Therapeutics',
  },
  {
    id: 'ac-002',
    tailNumber: 'N251BA',
    model: AircraftModel.ALIA_250C,
    currentPhase: AircraftPhase.READY,
    certificationProgress: 98,
    estimatedDeliveryDate: new Date('2025-01-20'),
    customerName: 'Air Methods',
  },
  {
    id: 'ac-003',
    tailNumber: 'N252BA',
    model: AircraftModel.ALIA_250,
    currentPhase: AircraftPhase.READY,
    certificationProgress: 95,
    estimatedDeliveryDate: new Date('2025-02-10'),
    customerName: 'UPS Flight Forward',
  },
  {
    id: 'ac-004',
    tailNumber: 'N253BA',
    model: AircraftModel.ALIA_250C,
    currentPhase: AircraftPhase.CERTIFICATION,
    certificationProgress: 88,
    estimatedDeliveryDate: new Date('2025-03-15'),
    customerName: null,
  },
  {
    id: 'ac-005',
    tailNumber: 'N254BA',
    model: AircraftModel.ALIA_250,
    currentPhase: AircraftPhase.CERTIFICATION,
    certificationProgress: 82,
    estimatedDeliveryDate: new Date('2025-04-01'),
    customerName: null,
  },
  {
    id: 'ac-006',
    tailNumber: 'N255BA',
    model: AircraftModel.ALIA_250,
    currentPhase: AircraftPhase.FLIGHT_TESTING,
    certificationProgress: 72,
    estimatedDeliveryDate: new Date('2025-05-20'),
    customerName: null,
  },
  {
    id: 'ac-007',
    tailNumber: 'N256BA',
    model: AircraftModel.ALIA_250C,
    currentPhase: AircraftPhase.FLIGHT_TESTING,
    certificationProgress: 68,
    estimatedDeliveryDate: new Date('2025-06-10'),
    customerName: null,
  },
  {
    id: 'ac-008',
    tailNumber: 'N257BA',
    model: AircraftModel.ALIA_250,
    currentPhase: AircraftPhase.GROUND_TESTING,
    certificationProgress: 45,
    estimatedDeliveryDate: new Date('2025-07-25'),
    customerName: null,
  },
  {
    id: 'ac-009',
    tailNumber: 'N258BA',
    model: AircraftModel.ALIA_250C,
    currentPhase: AircraftPhase.GROUND_TESTING,
    certificationProgress: 38,
    estimatedDeliveryDate: new Date('2025-08-15'),
    customerName: null,
  },
  {
    id: 'ac-010',
    tailNumber: 'N259BA',
    model: AircraftModel.ALIA_250,
    currentPhase: AircraftPhase.MANUFACTURING,
    certificationProgress: 65,
    estimatedDeliveryDate: new Date('2025-09-30'),
    customerName: null,
  },
  {
    id: 'ac-011',
    tailNumber: 'N260BA',
    model: AircraftModel.ALIA_250C,
    currentPhase: AircraftPhase.MANUFACTURING,
    certificationProgress: 58,
    estimatedDeliveryDate: new Date('2025-10-20'),
    customerName: null,
  },
  {
    id: 'ac-012',
    tailNumber: 'N261BA',
    model: AircraftModel.ALIA_250,
    currentPhase: AircraftPhase.MANUFACTURING,
    certificationProgress: 52,
    estimatedDeliveryDate: new Date('2025-11-15'),
    customerName: null,
  },
];

async function main() {
  await prisma.lifecycleStage.deleteMany();
  await prisma.certificationMilestone.deleteMany();
  await prisma.sustainabilityMetrics.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.user.deleteMany();

  for (const aircraft of aircraftSeed) {
    const milestones = getStandardCertificationMilestones(aircraft.currentPhase).map((m) => ({
      ...m,
      id: `${aircraft.id}-${m.id}`,
    }));

    await prisma.aircraft.create({
      data: {
        ...aircraft,
        lastUpdatedByEmail: 'seed@system.local',
        lifecycleStages: {
          create: getLifecycleStages(aircraft.currentPhase),
        },
        certificationMilestones: {
          create: milestones,
        },
        sustainabilityMetrics: {
          create: getSustainabilityMetrics(aircraft.model),
        },
      },
    });
  }

  const internalPasswordHash = await bcrypt.hash('internal123', 10);
  const customerPasswordHash = await bcrypt.hash('customer123', 10);

  await prisma.user.createMany({
    data: [
      {
        email: 'internal@beta.example',
        passwordHash: internalPasswordHash,
        role: UserRole.INTERNAL,
      },
      {
        email: 'customer@beta.example',
        passwordHash: customerPasswordHash,
        role: UserRole.CUSTOMER,
        customerName: 'Air Methods',
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
